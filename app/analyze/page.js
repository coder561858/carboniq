'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Footer from '../components/Footer';

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

export default function AnalyzePage() {
  const { fetchWithAuth, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [loadingTip, setLoadingTip] = useState(LOADING_TIPS[0]);

  const tipIntervalRef = useRef(null);
  const donutCanvasRef = useRef(null);
  const ringRef = useRef(null);
  const resultsRef = useRef(null);

  // Protect page
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [authLoading, isAuthenticated, router]);

  // Loading tip rotation
  useEffect(() => {
    if (isLoading) {
      let tipIndex = 0;
      tipIntervalRef.current = setInterval(() => {
        tipIndex = (tipIndex + 1) % LOADING_TIPS.length;
        setLoadingTip(LOADING_TIPS[tipIndex]);
      }, 4000);
    } else {
      if (tipIntervalRef.current) {
        clearInterval(tipIntervalRef.current);
        tipIntervalRef.current = null;
      }
    }
    return () => {
      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current);
    };
  }, [isLoading]);

  // Animate counter helper
  const animateCounter = useCallback((el, target, duration) => {
    if (!el) return;
    const startTime = performance.now();
    function update(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      el.textContent = target < 0.01 ? current.toFixed(4) : target < 1 ? current.toFixed(3) : current.toFixed(2);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }, []);

  // Draw donut chart
  const drawDonutChart = useCallback((data) => {
    const canvas = donutCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

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

    const cx = 150, cy = 150, outerR = 130, innerR = 88;
    let animationProgress = 0;
    let animId;

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

      if (animationProgress < 1) animId = requestAnimationFrame(drawFrame);
    }

    setTimeout(() => { animId = requestAnimationFrame(drawFrame); }, 500);

    return { segments, total };
  }, []);

  // Render results after data arrives
  useEffect(() => {
    if (!results) return;

    // Score ring animation
    const ring = ringRef.current;
    if (ring) {
      const grade = results.emissions.grade;
      ring.style.stroke = grade.color;
      const circumference = 2 * Math.PI * 80;
      const gradePercent = { 'A+': 100, A: 85, B: 70, C: 50, D: 30, F: 10 };
      const percent = gradePercent[grade.letter] || 50;
      const offset = circumference - (percent / 100) * circumference;
      setTimeout(() => { ring.style.strokeDashoffset = offset; }, 300);
    }

    // Animate CO2 counter
    const co2El = document.getElementById('score-co2-value');
    if (co2El) {
      animateCounter(co2El, results.emissions.perPageView.total, 1500);
      co2El.style.color = results.emissions.grade.color;
    }

    // Donut chart
    drawDonutChart(results);

    // Scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }, [results, animateCounter, drawDonutChart]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults(null);
    setLoadingTip(LOADING_TIPS[0]);

    try {
      const response = await fetchWithAuth('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        const errMsg = data.details ? `${data.error || 'Analysis failed'} (${data.details})` : (data.error || 'Analysis failed');
        throw new Error(errMsg);
      }
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return null;

  // Build server info rows
  const serverRows = [];
  if (results) {
    const { server } = results;
    if (server.ip) serverRows.push({ label: 'IP Address', value: server.ip });
    if (server.geo) {
      if (server.geo.city && server.geo.country) serverRows.push({ label: 'Location', value: `${server.geo.city}, ${server.geo.region}, ${server.geo.country}` });
      if (server.geo.countryCode) serverRows.push({ label: 'Country', value: `${getFlagEmoji(server.geo.countryCode)} ${server.geo.country}` });
      if (server.geo.isp) serverRows.push({ label: 'ISP', value: server.geo.isp });
      if (server.geo.org) serverRows.push({ label: 'Organization', value: server.geo.org });
    }
    const gh = server.greenHosting;
    serverRows.push({
      label: 'Green Hosting',
      value: gh.green ? '🌿 Green Hosted' : '⚫ Not Green Hosted',
      isGreen: gh.green,
    });
    if (gh.green && gh.hostedBy) serverRows.push({ label: 'Green Provider', value: gh.hostedBy });
  }

  // Build donut legend data
  const categories = [
    { key: 'images', label: 'Images', color: '#a855f7' },
    { key: 'scripts', label: 'Scripts', color: '#f59e0b' },
    { key: 'stylesheets', label: 'Stylesheets', color: '#3b82f6' },
    { key: 'fonts', label: 'Fonts', color: '#ec4899' },
    { key: 'documents', label: 'Documents', color: '#22c55e' },
    { key: 'media', label: 'Media', color: '#f97316' },
    { key: 'other', label: 'Other', color: '#6b7280' },
  ];

  const legendSegments = results
    ? categories
        .map(cat => ({ ...cat, size: results.resources[cat.key]?.size || 0, count: results.resources[cat.key]?.count || 0 }))
        .filter(s => s.size > 0)
        .sort((a, b) => b.size - a.size)
    : [];

  return (
    <>
      <section className="section analyzer-section" id="analyzer" style={{ paddingTop: 130, minHeight: 'calc(100vh - 200px)' }}>
        <div className="container">
          <div className="text-center">
            <h1 className="section-title" style={{ fontSize: '2.75rem', marginBottom: 'var(--space-md)' }}>Analyze any website</h1>
            <p className="section-subtitle mx-auto" style={{ marginBottom: 'var(--space-2xl)' }}>
              Enter a URL below to scan it for carbon emissions, resource usage, and green hosting status.
            </p>
          </div>

          <form className="search-form" id="analyze-form" autoComplete="off" onSubmit={handleSubmit}>
            <input
              type="text"
              id="url-input"
              placeholder="Enter a website URL, e.g. google.com"
              aria-label="Website URL"
              required
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button type="submit" id="analyze-btn" disabled={isLoading}>
              <span className="btn-icon">{isLoading ? '⏳' : ''}</span> {isLoading ? 'Analyzing…' : 'Analyze'}
            </button>
          </form>

          {/* Loading */}
          <section className={`loading-section ${isLoading ? 'active' : ''}`} id="loading-section">
            <div className="loading-spinner"></div>
            <p className="loading-text">Analyzing website…</p>
            <p className="loading-tip">{loadingTip}</p>
          </section>

          {/* Error */}
          {error && (
            <section className="error-section active" id="error-section">
              <div className="error-card">
                <span className="error-icon">⚠️</span>
                <p className="error-message">{error}</p>
                <button className="error-retry" onClick={() => setError(null)}>Try Again</button>
              </div>
            </section>
          )}

          {/* Results */}
          {results && (
            <section className="results-section active" id="results-section" ref={resultsRef}>
              <div className="result-header">
                <p className="analyzed-url">Analyzed Website</p>
                <h2 className="site-title">{results.pageTitle || results.hostname}</h2>
                <p className="analyzed-timestamp">
                  Analyzed on {new Date(results.timestamp).toLocaleString()} • {results.hostname}
                </p>
              </div>

              {/* Score */}
              <div className="score-card" id="score-card">
                <div className="score-grade-ring">
                  <svg viewBox="0 0 180 180">
                    <circle className="ring-bg" cx="90" cy="90" r="80" />
                    <circle className="ring-progress" ref={ringRef} cx="90" cy="90" r="80" />
                  </svg>
                  <div className="score-grade-text">
                    <div className="score-grade-letter" style={{ color: results.emissions.grade.color }}>
                      {results.emissions.grade.letter}
                    </div>
                    <div className="score-grade-label">{results.emissions.grade.label}</div>
                  </div>
                </div>
                <div className="score-co2">
                  <span className="score-co2-value" id="score-co2-value">0</span>
                  <span className="score-co2-unit">g CO₂e</span>
                  <p className="score-co2-label">per page view</p>
                </div>
                <div className="score-annual">
                  <div className="score-annual-item">
                    <div className="score-annual-value">{results.emissions.annual.totalKg.toLocaleString()}</div>
                    <div className="score-annual-label">kg CO₂ / year</div>
                  </div>
                  <div className="score-annual-item">
                    <div className="score-annual-value">{results.emissions.energy.annualKwh.toFixed(2)}</div>
                    <div className="score-annual-label">kWh / year</div>
                  </div>
                  <div className="score-annual-item">
                    <div className="score-annual-value">{results.emissions.annual.monthlyPageViews.toLocaleString()}</div>
                    <div className="score-annual-label">page views / month</div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="stats-grid" id="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon size">📦</div>
                  <div className="stat-info">
                    <span className="stat-value">{results.totalSizeMB} MB</span>
                    <span className="stat-label">Page Size</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon images">🖼️</div>
                  <div className="stat-info">
                    <span className="stat-value">{results.resources.images?.count || 0} file{(results.resources.images?.count || 0) !== 1 ? 's' : ''}</span>
                    <span className="stat-label">Images</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon scripts">📜</div>
                  <div className="stat-info">
                    <span className="stat-value">{(results.resources.scripts?.count || 0) + (results.resources.stylesheets?.count || 0)} file{((results.resources.scripts?.count || 0) + (results.resources.stylesheets?.count || 0)) !== 1 ? 's' : ''}</span>
                    <span className="stat-label">Scripts &amp; Styles</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon blocking">⚡</div>
                  <div className="stat-info">
                    <span className="stat-value">{results.renderBlocking.count} resource{results.renderBlocking.count !== 1 ? 's' : ''}</span>
                    <span className="stat-label">Render-Blocking</span>
                  </div>
                </div>
              </div>

              {/* Charts + Server */}
              <div className="two-col">
                <div className="breakdown-card">
                  <h3 className="card-title"><span className="card-icon">📊</span> Resource Breakdown</h3>
                  <div className="chart-container">
                    <div className="donut-chart">
                      <canvas ref={donutCanvasRef} id="donut-canvas" width="300" height="300"></canvas>
                      <div className="donut-center">
                        <div className="donut-center-value">{formatBytes(results.totalSize)}</div>
                        <div className="donut-center-label">Total</div>
                      </div>
                    </div>
                    <div className="chart-legend">
                      {legendSegments.map(s => (
                        <div className="legend-item" key={s.key}>
                          <span className="legend-color" style={{ background: s.color }}></span>
                          <span className="legend-label">{s.label} ({s.count})</span>
                          <span className="legend-value">{formatBytes(s.size)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="server-card">
                  <h3 className="card-title"><span className="card-icon">🌐</span> Server Information</h3>
                  <div className="server-details">
                    {serverRows.map((row, i) => (
                      <div className="server-row" key={i}>
                        <span className="server-row-label">{row.label}</span>
                        <span className="server-row-value">
                          {row.isGreen !== undefined ? (
                            <span className={`green-badge ${row.isGreen ? 'is-green' : 'not-green'}`}>{row.value}</span>
                          ) : row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="suggestions-section">
                <h3 className="card-title" style={{ marginBottom: 'var(--space-lg)' }}>
                  <span className="card-icon">💡</span> Recommendations to Reduce Emissions
                </h3>
                <div className="suggestions-grid">
                  {results.suggestions.map((s, i) => (
                    <div className="suggestion-card" key={i} style={{ animationDelay: `${0.4 + i * 0.08}s` }}>
                      <span className="suggestion-icon">{s.icon}</span>
                      <div className="suggestion-content">
                        <div className="suggestion-header">
                          <span className="suggestion-title">{s.title}</span>
                          <span className={`impact-badge ${s.impact}`}>{s.impact} impact</span>
                        </div>
                        <p className="suggestion-desc">{s.description}</p>
                        <span className="suggestion-savings">↳ {s.savings}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
