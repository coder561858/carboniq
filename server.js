const express = require('express');
const cors = require('cors');
const dns = require('dns');
const path = require('path');
const { calculateEmissions, generateSuggestions } = require('./carbonCalculator');
const connectDB = require('./config/db');
const Analysis = require('./models/Analysis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// DNS resolve helper (promisified) — tries resolve4 first, then falls back to lookup
function resolveDNS(hostname) {
  return new Promise((resolve, reject) => {
    dns.resolve4(hostname, (err, addresses) => {
      if (!err && addresses && addresses.length > 0) {
        return resolve(addresses[0]);
      }
      // Fallback: dns.lookup uses OS resolver (handles CNAMEs, /etc/hosts, etc.)
      dns.lookup(hostname, { family: 4 }, (err2, address) => {
        if (err2) reject(err2);
        else resolve(address);
      });
    });
  });
}

// Fetch IP geolocation from ip-api.com
async function getGeoLocation(ip) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,isp,org,as`);
    const data = await response.json();
    if (data.status === 'success') {
      return {
        country: data.country,
        countryCode: data.countryCode,
        region: data.regionName,
        city: data.city,
        isp: data.isp,
        org: data.org,
        as: data.as,
      };
    }
    return null;
  } catch (error) {
    console.error('Geolocation lookup failed:', error.message);
    return null;
  }
}

// Check green hosting via Green Web Foundation API
async function checkGreenHosting(hostname) {
  try {
    const response = await fetch(`https://api.thegreenwebfoundation.org/api/v3/greencheck/${hostname}`);
    const data = await response.json();
    return {
      green: data.green || false,
      hostedBy: data.hosted_by || null,
      hostedByWebsite: data.hosted_by_website || null,
      partner: data.partner || null,
    };
  } catch (error) {
    console.error('Green hosting check failed:', error.message);
    return { green: false, hostedBy: null, hostedByWebsite: null, partner: null };
  }
}

// Main analysis endpoint
app.post('/api/analyze', async (req, res) => {
  await connectDB();
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Normalize URL
  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  let hostname;
  try {
    hostname = new URL(targetUrl).hostname;
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  let browser;
  try {
    // 1. DNS Resolution
    let ipAddress = null;
    try {
      ipAddress = await resolveDNS(hostname);
    } catch (err) {
      console.warn('DNS resolution failed, continuing:', err.message);
    }

    // 2. Geolocation & green hosting checks (run in parallel)
    const [geoData, greenData] = await Promise.all([
      ipAddress ? getGeoLocation(ipAddress) : Promise.resolve(null),
      checkGreenHosting(hostname),
    ]);

    // 3. Puppeteer — load page and capture resource data (supports Vercel serverless & local dev)
    const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION);
    if (isVercel) {
      const puppeteerCore = require('puppeteer-core');
      const chromium = require('@sparticuz/chromium');
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } else {
      const puppeteer = require('puppeteer');
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    }

    const page = await browser.newPage();

    // Set a realistic viewport and user agent
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Track all network responses
    const resourceData = {
      images: { count: 0, size: 0, items: [] },
      scripts: { count: 0, size: 0, items: [] },
      stylesheets: { count: 0, size: 0, items: [] },
      fonts: { count: 0, size: 0, items: [] },
      documents: { count: 0, size: 0, items: [] },
      media: { count: 0, size: 0, items: [] },
      other: { count: 0, size: 0, items: [] },
    };

    let totalTransferSize = 0;
    let totalRequests = 0;

    // Enable request interception to measure sizes
    const client = await page.createCDPSession();
    await client.send('Network.enable');

    const requestSizes = new Map();

    client.on('Network.responseReceived', (params) => {
      const { response, type } = params;
      const contentLength = parseInt(response.headers['content-length'] || '0', 10);
      requestSizes.set(params.requestId, { type, url: response.url, contentLength });
    });

    client.on('Network.loadingFinished', (params) => {
      const info = requestSizes.get(params.requestId);
      if (!info) return;

      const size = params.encodedDataLength || info.contentLength || 0;
      totalTransferSize += size;
      totalRequests++;

      const category = mapResourceType(info.type);
      if (resourceData[category]) {
        resourceData[category].count++;
        resourceData[category].size += size;
        // Keep only top items for display (limit to 5 per category)
        if (resourceData[category].items.length < 5) {
          resourceData[category].items.push({
            url: truncateUrl(info.url),
            size,
          });
        }
      }
    });

    // Navigate to the target URL (with graceful timeout fallback for heavy SPAs or continuous analytics)
    try {
      const navTimeout = isVercel ? 8000 : 25000;
      const extraWait = isVercel ? 1000 : 2500;
      await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: navTimeout,
      });
      // Allow extra wait for dynamic scripts/images to load and trigger network events
      await new Promise(r => setTimeout(r, extraWait));
    } catch (navErr) {
      console.warn(`Navigation warning for ${targetUrl}: ${navErr.message}. Proceeding with captured resources.`);
    }

    // 4. Detect render-blocking resources
    let renderBlocking = { scripts: 0, stylesheets: 0, count: 0, items: [] };
    try {
      renderBlocking = await page.evaluate(() => {
        const blocking = { scripts: 0, stylesheets: 0, count: 0, items: [] };

        // Check scripts in head without async/defer
        document.querySelectorAll('head script[src]').forEach((script) => {
          if (!script.async && !script.defer) {
            blocking.scripts++;
            blocking.count++;
            if (blocking.items.length < 5) {
              blocking.items.push({ type: 'script', url: script.src });
            }
          }
        });

        // Check stylesheets (all linked stylesheets are render-blocking by default)
        document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
          if (!link.media || link.media === 'all' || link.media === 'screen') {
            blocking.stylesheets++;
            blocking.count++;
            if (blocking.items.length < 5) {
              blocking.items.push({ type: 'stylesheet', url: link.href });
            }
          }
        });

        return blocking;
      });
    } catch (evalErr) {
      console.warn(`Evaluation warning for ${targetUrl}: ${evalErr.message}`);
    }

    // Get page title for display
    let pageTitle = hostname;
    try {
      const title = await page.title();
      if (title) pageTitle = title;
    } catch (titleErr) {
      console.warn(`Title evaluation warning for ${targetUrl}: ${titleErr.message}`);
    }

    await browser.close();
    browser = null;

    // 5. Calculate carbon emissions
    const emissions = calculateEmissions(totalTransferSize, greenData.green);

    // 6. Generate suggestions
    const suggestions = generateSuggestions({
      resources: resourceData,
      totalSize: totalTransferSize,
      renderBlocking,
      emissions,
    });

    // 7. Build response
    const response = {
      success: true,
      url: targetUrl,
      hostname,
      pageTitle: pageTitle || hostname,
      timestamp: new Date().toISOString(),

      // Page metrics
      totalSize: totalTransferSize,
      totalSizeMB: roundTo(totalTransferSize / (1024 * 1024), 2),
      totalRequests,

      // Resource breakdown
      resources: resourceData,

      // Render-blocking
      renderBlocking,

      // Server info
      server: {
        ip: ipAddress,
        geo: geoData,
        greenHosting: greenData,
      },

      // Carbon emissions
      emissions,

      // Reduction suggestions
      suggestions,
    };

    // Save to MongoDB (Non-blocking)
    Analysis.create({
      url: targetUrl,
      hostname,
      pageTitle: pageTitle || hostname,
      totalSize: totalTransferSize,
      totalSizeMB: roundTo(totalTransferSize / (1024 * 1024), 2),
      totalRequests,
      co2Grams: emissions.perPageView.total,
      grade: emissions.grade.letter,
      isGreenHosted: greenData.green,
      resources: resourceData,
      serverGeo: {
        country: geoData?.country,
        region: geoData?.region,
        timezone: geoData?.timezone
      }
    }).catch(err => console.error('Failed to save to MongoDB:', err.message));

    res.json(response);
  } catch (error) {
    console.error('Analysis failed:', error);
    if (browser) await browser.close();

    // Provide user-friendly error messages
    let message = 'Failed to analyze the website.';
    if (error.message?.includes('net::ERR_NAME_NOT_RESOLVED')) {
      message = 'Could not resolve the domain name. Please check the URL and try again.';
    } else if (error.message?.includes('Navigation timeout')) {
      message = 'The website took too long to load. It may be down or very slow.';
    } else if (error.message?.includes('net::ERR_CONNECTION_REFUSED')) {
      message = 'Connection was refused by the server. The website may be down.';
    }

    res.status(500).json({ error: message, details: error.message });
  }
});

// Leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
  try {
    await connectDB();
    const cleanest = await Analysis.aggregate([
      { $group: { _id: "$hostname", avgCo2: { $avg: "$co2Grams" }, count: { $sum: 1 }, grade: { $first: "$grade" } } },
      { $sort: { avgCo2: 1 } },
      { $limit: 10 }
    ]);
    const dirtiest = await Analysis.aggregate([
      { $group: { _id: "$hostname", avgCo2: { $avg: "$co2Grams" }, count: { $sum: 1 }, grade: { $first: "$grade" } } },
      { $sort: { avgCo2: -1 } },
      { $limit: 10 }
    ]);
    res.json({ cleanest, dirtiest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// History endpoint — fetch all scans for a domain (for trend chart)
app.get('/api/history', async (req, res) => {
  try {
    await connectDB();
    const { domain } = req.query;
    if (!domain) {
      return res.status(400).json({ error: 'Domain query parameter is required' });
    }
    const history = await Analysis.find({ hostname: domain })
      .select('co2Grams grade totalSizeMB totalRequests isGreenHosted createdAt')
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();
    res.json({ domain, history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Recent scans endpoint
app.get('/api/recent', async (req, res) => {
  try {
    await connectDB();
    const recent = await Analysis.find()
      .select('url hostname co2Grams grade totalSizeMB isGreenHosted createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ recent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recent scans' });
  }
});

// Map CDP resource types to our categories
function mapResourceType(type) {
  const mapping = {
    Image: 'images',
    Script: 'scripts',
    Stylesheet: 'stylesheets',
    Font: 'fonts',
    Document: 'documents',
    Media: 'media',
    XHR: 'other',
    Fetch: 'other',
    WebSocket: 'other',
    Other: 'other',
  };
  return mapping[type] || 'other';
}

// Truncate long URLs for display
function truncateUrl(url, maxLen = 80) {
  if (!url || url.length <= maxLen) return url;
  return url.substring(0, maxLen - 3) + '...';
}

function roundTo(num, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

// Fallback route to ensure Vercel always serves the frontend properly
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const filePath = path.join(__dirname, 'public', req.path === '/' ? 'index.html' : req.path);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
  });
});

// Start server locally if not running on Vercel
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  connectDB();
  app.listen(PORT, () => {
    console.log(`\n🌱 Carbon Footprint Analyzer running at http://localhost:${PORT}\n`);
  });
}

// Export for Vercel Serverless Functions
module.exports = app;
