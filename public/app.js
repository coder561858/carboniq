// =====================================================
// carboniq — Carbon Footprint Analyzer
// Landing page interactivity + Analysis tool
// =====================================================

// ---- Loading Tips ----
const LOADING_TIPS = [
  'Loading the page in a headless browser to capture all resources…',
  'Measuring images, scripts, fonts, and stylesheets…',
  'Resolving server IP address and geolocation…',
  'Checking green hosting status with the Green Web Foundation…',
  'Calculating CO₂ emissions using the SWDM v4 model…',
  'Generating personalized reduction recommendations…',
  'The average web page produces about 0.5g of CO₂ per visit…',
  'The internet accounts for roughly 3.7% of global carbon emissions…',
];

// ---- DOM Ready ----
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initEarthCanvas();
  initNavbar();
  initMobileMenu();
  initExpandableCards();
  initFAQAccordion();
  initAnalyzeFeatures();
  initImpactCalculator();
  initScrollReveal();
  initLightbox();
  initAnalyzerForm();

});

// ===================================================
// ROTATING EARTH CANVAS ANIMATION
// ===================================================
function initEarthCanvas() {
  const canvas = document.getElementById('earth-canvas');
  if (!canvas) return;

  const DPR = window.devicePixelRatio || 1;
  const SIZE = 100;
  canvas.width = SIZE * DPR;
  canvas.height = SIZE * DPR;
  canvas.style.width = SIZE + 'px';
  canvas.style.height = SIZE + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);

  const cx = SIZE / 2, cy = SIZE / 2, R = SIZE / 2 - 2;
  let angle = 0;

  // Simplified continent shapes as lat/lon polygons [lon, lat] in degrees
  // These are stylized blobs that "look like" continents when projected
  const continents = [
    // Eurasia
    [[-10, 70], [40, 72], [80, 75], [140, 68], [145, 50], [140, 30], [110, 20], [80, 10], [60, 22], [40, 36], [20, 38], [10, 52], [0, 58], [-10, 64], [-10, 70]],
    // Africa
    [[-18, 14], [0, 5], [15, 0], [40, -5], [50, 10], [45, 28], [36, 22], [28, 5], [20, -18], [14, -35], [18, -34], [36, -20], [50, -10], [44, 12], [26, 22], [14, 36], [-2, 34], [-10, 22], [-18, 14]],
    // North America
    [[-165, 68], [-140, 72], [-90, 72], [-80, 50], [-65, 44], [-80, 26], [-90, 20], [-80, 10], [-90, 14], [-110, 22], [-120, 32], [-125, 48], [-140, 58], [-165, 68]],
    // South America
    [[-80, 10], [-70, 12], [-50, 5], [-36, -5], [-36, -18], [-56, -38], [-68, -54], [-75, -50], [-72, -40], [-56, -28], [-46, -24], [-42, -4], [-60, 5], [-72, 10], [-80, 10]],
    // Australia
    [[114, -22], [126, -14], [137, -12], [148, -18], [150, -30], [140, -38], [130, -36], [118, -34], [114, -30], [114, -22]],
    // Greenland
    [[-46, 84], [-20, 84], [-18, 74], [-28, 68], [-44, 64], [-58, 70], [-60, 78], [-46, 84]],
    // Antarctica (hint)
    [[-180, -70], [0, -72], [180, -70], [180, -80], [-180, -80], [-180, -70]],
  ];

  // Convert lon/lat to sphere XYZ, then project via globe rotation
  function lonLatToXY(lon, lat, rotAngle) {
    const phi = (lat * Math.PI) / 180;
    const lam = ((lon + rotAngle * 57.2958) * Math.PI) / 180;
    const x3 = Math.cos(phi) * Math.sin(lam);
    const y3 = Math.sin(phi);
    const z3 = Math.cos(phi) * Math.cos(lam);
    if (z3 < 0) return null; // behind the globe
    const px = cx + x3 * R;
    const py = cy - y3 * R;
    return { x: px, y: py, z: z3 };
  }

  function drawFrame() {
    ctx.clearRect(0, 0, SIZE, SIZE);

    // ---- Ocean (sphere base) ----
    const ocean = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.05, cx, cy, R);
    ocean.addColorStop(0, '#5bc8f5');
    ocean.addColorStop(0.5, '#1a8fc1');
    ocean.addColorStop(1, '#0a3d62');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = ocean;
    ctx.fill();

    // ---- Continents ----
    ctx.fillStyle = '#4caf6e';
    ctx.strokeStyle = 'rgba(34,120,60,0.5)';
    ctx.lineWidth = 0.4;

    for (const poly of continents) {
      const pts = poly.map(([lo, la]) => lonLatToXY(lo, la, angle)).filter(Boolean);
      if (pts.length < 3) continue;

      // Check if majority of points visible
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();

      // Shade by avg Z for depth illusion
      const avgZ = pts.reduce((s, p) => s + p.z, 0) / pts.length;
      const shade = Math.floor(40 + avgZ * 80);
      ctx.fillStyle = `rgb(${shade + 30}, ${shade + 100}, ${shade + 50})`;
      ctx.fill();
      ctx.stroke();
    }

    // ---- Atmosphere glow (outer ring) ----
    const atmo = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.08);
    atmo.addColorStop(0, 'rgba(100,210,255,0.0)');
    atmo.addColorStop(0.5, 'rgba(80,180,255,0.18)');
    atmo.addColorStop(1, 'rgba(60,140,255,0.0)');
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
    ctx.fillStyle = atmo;
    ctx.fill();

    // ---- Specular highlight ----
    const spec = ctx.createRadialGradient(cx - R * 0.38, cy - R * 0.38, 0, cx - R * 0.38, cy - R * 0.38, R * 0.65);
    spec.addColorStop(0, 'rgba(255,255,255,0.45)');
    spec.addColorStop(0.5, 'rgba(255,255,255,0.1)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = spec;
    ctx.fill();

    // ---- Dark terminator edge ----
    const term = ctx.createRadialGradient(cx + R * 0.6, cy + R * 0.6, 0, cx, cy, R);
    term.addColorStop(0.6, 'rgba(0,0,0,0)');
    term.addColorStop(1, 'rgba(0,0,30,0.45)');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = term;
    ctx.fill();

    angle += 0.004; // rotation speed
    requestAnimationFrame(drawFrame);
  }

  requestAnimationFrame(drawFrame);
}


// ===================================================
// HERO SCROLL EXPANSION — Parallax scale effect
// ===================================================
function initHeroScrollExpansion() {
  const media = document.getElementById('hero-bg-media');
  if (!media) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY <= 1200) {
      const scale = 1 + (scrollY * 0.0005);
      media.style.transform = `scale(${scale})`;
    }
  }, { passive: true });
}



// ===================================================
// NAVBAR — scroll shadow + active link
// ===================================================
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Smooth scroll for nav links
  document.querySelectorAll('.navbar-links a').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          // Close mobile menu
          document.getElementById('navbar-links').classList.remove('open');
        }
      }
    });
  });
}

// ===================================================
// MOBILE MENU
// ===================================================
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const links = document.getElementById('navbar-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.textContent = links.classList.contains('open') ? '✕' : '☰';
  });
}

// ===================================================
// EXPANDABLE CARDS — click to expand/collapse
// ===================================================
function initExpandableCards() {
  document.querySelectorAll('[data-expandable].expandable-card').forEach(card => {
    const header = card.querySelector('.expandable-card-header');
    header.addEventListener('click', () => {
      // Toggle this card
      const wasExpanded = card.classList.contains('expanded');

      // Optionally close siblings (accordion behavior)
      const parent = card.parentElement;
      parent.querySelectorAll('.expandable-card.expanded').forEach(other => {
        if (other !== card) other.classList.remove('expanded');
      });

      card.classList.toggle('expanded', !wasExpanded);
    });
  });
}

// ===================================================
// FAQ ACCORDION
// ===================================================
function initFAQAccordion() {
  document.querySelectorAll('[data-faq]').forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');

      // Close all others
      document.querySelectorAll('[data-faq].open').forEach(other => {
        if (other !== item) other.classList.remove('open');
      });

      item.classList.toggle('open', !wasOpen);
    });
  });
}

// ===================================================
// ANALYZE FEATURES — click to expand with detail
// ===================================================
function initAnalyzeFeatures() {
  const grid = document.getElementById('analyze-grid');
  if (!grid) return;

  grid.querySelectorAll('[data-expand-feature]').forEach(card => {
    card.addEventListener('click', () => {
      const wasExpanded = card.classList.contains('expanded');

      // Close all others
      grid.querySelectorAll('.expanded').forEach(other => {
        other.classList.remove('expanded');
      });

      card.classList.toggle('expanded', !wasExpanded);
    });
  });
}

// ===================================================
// IMPACT CALCULATOR — live updating stats
// ===================================================
function initImpactCalculator() {
  const input = document.getElementById('traffic-input');
  const statsContainer = document.querySelector('.impact-stats');
  if (!input || !statsContainer) return;

  let hasAnimated = false;

  const animateValue = (el, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOut cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * easeOut);
      el.textContent = current.toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = end.toLocaleString();
      }
    };
    window.requestAnimationFrame(step);
  };

  const calculateTargets = () => {
    const views = parseInt(input.value) || 10000;
    const annualViews = views * 12;

    const pageSizeGB = 2.3 / 1024;
    const energyPerView = pageSizeGB * 0.194;
    const co2PerView = energyPerView * 494;
    const annualCO2Kg = (co2PerView * annualViews) / 1000;
    const annualKwh = energyPerView * annualViews;

    return {
      co2: Math.round(annualCO2Kg),
      trees: Math.ceil(annualCO2Kg / 21),
      km: Math.round((annualCO2Kg * 1000) / 120),
      kwh: Math.round(annualKwh)
    };
  };

  const updateUI = (animate = false) => {
    const targets = calculateTargets();

    if (animate) {
      animateValue(document.getElementById('impact-co2'), 0, targets.co2, 2000);
      animateValue(document.getElementById('impact-trees'), 0, targets.trees, 2000);
      animateValue(document.getElementById('impact-km'), 0, targets.km, 2000);
      animateValue(document.getElementById('impact-kwh'), 0, targets.kwh, 2000);
    } else {
      document.getElementById('impact-co2').textContent = targets.co2.toLocaleString();
      document.getElementById('impact-trees').textContent = targets.trees.toLocaleString();
      document.getElementById('impact-km').textContent = targets.km.toLocaleString();
      document.getElementById('impact-kwh').textContent = targets.kwh.toLocaleString();
    }
  };

  // Set initial text to 0 before animation
  document.getElementById('impact-co2').textContent = "0";
  document.getElementById('impact-trees').textContent = "0";
  document.getElementById('impact-km').textContent = "0";
  document.getElementById('impact-kwh').textContent = "0";

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        updateUI(true);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  observer.observe(statsContainer);

  input.addEventListener('input', () => {
    if (hasAnimated) updateUI(false);
  });
}

// ===================================================
// SCROLL REVEAL — animate elements into view
// ===================================================
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ===================================================
// LIGHTBOX — for expandable content display
// ===================================================
function initLightbox() {
  const overlay = document.getElementById('lightbox-overlay');
  const content = document.getElementById('lightbox-content');
  const closeBtn = document.getElementById('lightbox-close');

  // Close lightbox
  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // Make matter cards open lightbox on click
  document.querySelectorAll('.matter-card').forEach(card => {
    card.addEventListener('click', () => {
      const icon = card.querySelector('.matter-card-icon').textContent;
      const title = card.querySelector('h4').textContent;
      const desc = card.querySelector('p').textContent;

      content.innerHTML = `
        <div style="text-align: center; padding: 1rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">${icon}</div>
          <h3 style="font-size: 1.5rem; font-weight: 700; color: #111827; margin-bottom: 1rem;">${title}</h3>
          <p style="font-size: 1rem; color: #6b7280; line-height: 1.8; max-width: 500px; margin: 0 auto;">${desc}</p>
          <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 0.85rem; color: #9ca3af;">Click outside or press Escape to close</p>
          </div>
        </div>
      `;
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });
}

function closeLightbox() {
  document.getElementById('lightbox-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

// ===================================================
// ANALYZER FORM + RESULTS
// ===================================================
let loadingTipInterval = null;

function initAnalyzerForm() {
  const form = document.getElementById('analyze-form');
  const errorRetry = document.getElementById('error-retry-btn');
  if (!form || !errorRetry) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('url-input').value.trim();
    if (!url) return;
    await analyzeWebsite(url);
  });

  errorRetry.addEventListener('click', () => {
    hideError();
    document.getElementById('url-input').focus();
  });
}

async function analyzeWebsite(url) {
  showLoading();
  hideError();
  hideResults();

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      const errMsg = data.details ? `${data.error || 'Analysis failed'} (${data.details})` : (data.error || 'Analysis failed');
      throw new Error(errMsg);
    }

    hideLoading();
    renderResults(data);
  } catch (error) {
    hideLoading();
    showError(error.message);
  }
}

// ---- State Helpers ----
function showLoading() {
  document.getElementById('loading-section').classList.add('active');
  const btn = document.getElementById('analyze-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing…';

  let tipIndex = 0;
  const tipEl = document.getElementById('loading-tip');
  tipEl.textContent = LOADING_TIPS[0];
  loadingTipInterval = setInterval(() => {
    tipIndex = (tipIndex + 1) % LOADING_TIPS.length;
    tipEl.style.opacity = '0';
    setTimeout(() => {
      tipEl.textContent = LOADING_TIPS[tipIndex];
      tipEl.style.opacity = '1';
    }, 300);
  }, 4000);
}

function hideLoading() {
  document.getElementById('loading-section').classList.remove('active');
  const btn = document.getElementById('analyze-btn');
  btn.disabled = false;
  btn.innerHTML = '<span class="btn-icon">🔍</span> Analyze';
  if (loadingTipInterval) { clearInterval(loadingTipInterval); loadingTipInterval = null; }
}

function showError(msg) {
  document.getElementById('error-message').textContent = msg;
  document.getElementById('error-section').classList.add('active');
}
function hideError() { document.getElementById('error-section').classList.remove('active'); }
function hideResults() { document.getElementById('results-section').classList.remove('active'); }

// ---- Render Results ----
function renderResults(data) {
  document.getElementById('results-section').classList.add('active');
  renderHeader(data);
  renderScoreCard(data);
  renderStats(data);
  renderDonutChart(data);
  renderServerInfo(data);
  renderSuggestions(data);
  setTimeout(() => {
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

function renderHeader(data) {
  document.getElementById('result-site-title').textContent = data.pageTitle || data.hostname;
  document.getElementById('result-timestamp').textContent =
    `Analyzed on ${new Date(data.timestamp).toLocaleString()} • ${data.hostname}`;
}

function renderScoreCard(data) {
  const { emissions } = data;
  const grade = emissions.grade;

  const gradeLetter = document.getElementById('score-grade-letter');
  const gradeLabel = document.getElementById('score-grade-label');
  gradeLetter.textContent = grade.letter;
  gradeLetter.style.color = grade.color;
  gradeLabel.textContent = grade.label;

  const ring = document.getElementById('ring-progress');
  ring.style.stroke = grade.color;
  const circumference = 2 * Math.PI * 80;
  const gradePercent = { 'A+': 100, A: 85, B: 70, C: 50, D: 30, F: 10 };
  const percent = gradePercent[grade.letter] || 50;
  const offset = circumference - (percent / 100) * circumference;
  setTimeout(() => { ring.style.strokeDashoffset = offset; }, 300);

  const co2Display = document.getElementById('score-co2-value');
  animateCounter(co2Display, emissions.perPageView.total, 1500);
  co2Display.style.color = grade.color;

  document.getElementById('annual-kg').textContent = emissions.annual.totalKg.toLocaleString();
  document.getElementById('annual-kwh').textContent = emissions.energy.annualKwh.toFixed(2);
  document.getElementById('annual-views').textContent = emissions.annual.monthlyPageViews.toLocaleString();
}

function animateCounter(el, target, duration) {
  const startTime = performance.now();
  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = target * eased;
    el.textContent = target < 0.01 ? current.toFixed(4) : target < 1 ? current.toFixed(3) : current.toFixed(2);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function renderStats(data) {
  document.getElementById('stat-size').textContent = `${data.totalSizeMB} MB`;
  const imgCount = data.resources.images?.count || 0;
  document.getElementById('stat-images').textContent = `${imgCount} file${imgCount !== 1 ? 's' : ''}`;
  const scriptCount = (data.resources.scripts?.count || 0) + (data.resources.stylesheets?.count || 0);
  document.getElementById('stat-scripts').textContent = `${scriptCount} file${scriptCount !== 1 ? 's' : ''}`;
  document.getElementById('stat-blocking').textContent = `${data.renderBlocking.count} resource${data.renderBlocking.count !== 1 ? 's' : ''}`;
}

function renderDonutChart(data) {
  const canvas = document.getElementById('donut-canvas');
  const ctx = canvas.getContext('2d');
  const legendContainer = document.getElementById('chart-legend');

  const categories = [
    { key: 'images', label: 'Images', color: '#a855f7' },
    { key: 'scripts', label: 'Scripts', color: '#f59e0b' },
    { key: 'stylesheets', label: 'Stylesheets', color: '#3b82f6' },
    { key: 'fonts', label: 'Fonts', color: '#ec4899' },
    { key: 'documents', label: 'Documents', color: '#22c55e' },
    { key: 'media', label: 'Media', color: '#f97316' },
    { key: 'other', label: 'Other', color: '#6b7280' },
  ];

  const segments = categories
    .map(cat => ({ ...cat, size: data.resources[cat.key]?.size || 0, count: data.resources[cat.key]?.count || 0 }))
    .filter(s => s.size > 0);

  const total = segments.reduce((sum, s) => sum + s.size, 0);
  document.getElementById('donut-total').textContent = formatBytes(total);

  const cx = 150, cy = 150, outerR = 130, innerR = 88;
  let animationProgress = 0;

  function drawFrame() {
    animationProgress += 0.03;
    if (animationProgress > 1) animationProgress = 1;
    ctx.clearRect(0, 0, 300, 300);

    let currentAngle = -Math.PI / 2;
    let drawnAngle = 0;
    const totalAngle = 2 * Math.PI * animationProgress;

    segments.forEach(segment => {
      const segAngle = (segment.size / total) * 2 * Math.PI;
      const drawAngle = Math.min(segAngle, totalAngle - drawnAngle);
      if (drawAngle <= 0) return;

      ctx.beginPath();
      ctx.arc(cx, cy, outerR, currentAngle, currentAngle + drawAngle);
      ctx.arc(cx, cy, innerR, currentAngle + drawAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();

      if (segments.length > 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, currentAngle + drawAngle - 0.02, currentAngle + drawAngle + 0.02);
        ctx.arc(cx, cy, innerR, currentAngle + drawAngle + 0.02, currentAngle + drawAngle - 0.02, true);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      currentAngle += segAngle;
      drawnAngle += segAngle;
    });

    if (animationProgress < 1) requestAnimationFrame(drawFrame);
  }

  setTimeout(() => requestAnimationFrame(drawFrame), 500);

  legendContainer.innerHTML = segments.sort((a, b) => b.size - a.size).map(s => `
    <div class="legend-item">
      <span class="legend-color" style="background: ${s.color}"></span>
      <span class="legend-label">${s.label} (${s.count})</span>
      <span class="legend-value">${formatBytes(s.size)}</span>
    </div>
  `).join('');
}

function renderServerInfo(data) {
  const container = document.getElementById('server-details');
  const { server } = data;
  const rows = [];

  if (server.ip) rows.push({ label: 'IP Address', value: server.ip });
  if (server.geo) {
    if (server.geo.city && server.geo.country) rows.push({ label: 'Location', value: `${server.geo.city}, ${server.geo.region}, ${server.geo.country}` });
    if (server.geo.countryCode) rows.push({ label: 'Country', value: `${getFlagEmoji(server.geo.countryCode)} ${server.geo.country}` });
    if (server.geo.isp) rows.push({ label: 'ISP', value: server.geo.isp });
    if (server.geo.org) rows.push({ label: 'Organization', value: server.geo.org });
  }

  const gh = server.greenHosting;
  rows.push({
    label: 'Green Hosting', value: gh.green
      ? `<span class="green-badge is-green">🌿 Green Hosted</span>`
      : `<span class="green-badge not-green">⚫ Not Green Hosted</span>`, isHTML: true
  });
  if (gh.green && gh.hostedBy) rows.push({ label: 'Green Provider', value: gh.hostedBy });

  container.innerHTML = rows.map(row => `
    <div class="server-row">
      <span class="server-row-label">${row.label}</span>
      <span class="server-row-value">${row.isHTML ? row.value : escapeHTML(row.value)}</span>
    </div>
  `).join('');
}

function renderSuggestions(data) {
  document.getElementById('suggestions-grid').innerHTML = data.suggestions.map((s, i) => `
    <div class="suggestion-card" style="animation-delay: ${0.4 + i * 0.08}s;">
      <span class="suggestion-icon">${s.icon}</span>
      <div class="suggestion-content">
        <div class="suggestion-header">
          <span class="suggestion-title">${escapeHTML(s.title)}</span>
          <span class="impact-badge ${s.impact}">${s.impact} impact</span>
        </div>
        <p class="suggestion-desc">${escapeHTML(s.description)}</p>
        <span class="suggestion-savings">↳ ${escapeHTML(s.savings)}</span>
      </div>
    </div>
  `).join('');
}

// ===================================================
// THEME TOGGLE
// ===================================================
const SUN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" style="display: block;">
  <circle cx="12" cy="12" r="5.5" fill="#facc15"/>
  <g stroke="#cbd5e1" stroke-width="2.2" stroke-linecap="round">
    <line x1="12" y1="1.5" x2="12" y2="4"/>
    <line x1="12" y1="20" x2="12" y2="22.5"/>
    <line x1="1.5" y1="12" x2="4" y2="12"/>
    <line x1="20" y1="12" x2="22.5" y2="12"/>
    <line x1="4.57" y1="4.57" x2="6.34" y2="6.34"/>
    <line x1="17.66" y1="17.66" x2="19.43" y2="19.43"/>
    <line x1="4.57" y1="19.43" x2="6.34" y2="17.66"/>
    <line x1="17.66" y1="6.34" x2="19.43" y2="4.57"/>
  </g>
</svg>`;

const MOON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="#818cf8" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
</svg>`;

function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', currentTheme);
  toggle.innerHTML = currentTheme === 'dark' ? SUN_SVG : MOON_SVG;

  toggle.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    toggle.innerHTML = theme === 'dark' ? SUN_SVG : MOON_SVG;
  });
}

// ---- Utilities ----
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFlagEmoji(code) {
  if (!code || code.length !== 2) return '🌍';
  return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));
}

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}



