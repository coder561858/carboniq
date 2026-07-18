// Leaderboard & Historical Tracking — carboniq

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  loadLeaderboard();
  loadRecentScans();

  // History form
  const historyForm = document.getElementById('history-form');
  historyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const domain = document.getElementById('history-domain').value.trim();
    if (domain) loadHistory(domain);
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('navbar-links');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
});

// ===================== THEME TOGGLE =====================
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

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', currentTheme);
  toggle.innerHTML = currentTheme === 'dark' ? SUN_SVG : MOON_SVG;

  toggle.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    toggle.innerHTML = theme === 'dark' ? SUN_SVG : MOON_SVG;

    // Re-render chart with correct colors if one exists
    if (historyChart) {
      const domain = document.getElementById('history-domain').value.trim();
      if (domain) loadHistory(domain);
    }
  });
}

function isDarkMode() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

// Grade styling helpers
function getGradeClass(grade) {
  const g = (grade || 'F').replace('+', '-plus').toLowerCase();
  return `grade-${g}`;
}

function getGradeColor(grade) {
  const colors = {
    'A+': '#10b981', 'A': '#34d399', 'B': '#3b82f6',
    'C': '#f59e0b', 'D': '#f97316', 'E': '#ef4444', 'F': '#ef4444'
  };
  return colors[grade] || '#6b7280';
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ===================== LEADERBOARD =====================
async function loadLeaderboard() {
  try {
    const res = await window.fetchWithAuth('/api/leaderboard');
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || data.details || 'Failed to load leaderboard from database');
    }
    renderTable('cleanest-table', data.cleanest, 'cleanest');
    renderTable('dirtiest-table', data.dirtiest, 'dirtiest');
    loadStats();
  } catch (err) {
    console.error('Failed to load leaderboard:', err);
    const errMsg = `Could not connect to database: ${err.message}. Make sure MONGODB_URI is set on Vercel and IP access (0.0.0.0/0) is allowed on MongoDB Atlas.`;
    document.getElementById('cleanest-table').innerHTML = emptyState(errMsg);
    document.getElementById('dirtiest-table').innerHTML = emptyState(errMsg);
  }
}

function renderTable(containerId, items, type) {
  const container = document.getElementById(containerId);
  if (!items || items.length === 0) {
    container.innerHTML = emptyState('No data yet. <a href="analyze.html">Analyze a website</a> to populate the leaderboard!');
    return;
  }

  let html = '';
  items.forEach((item, i) => {
    const rank = i + 1;
    let rankClass = '';
    if (rank === 1) rankClass = 'gold';
    else if (rank === 2) rankClass = 'silver';
    else if (rank === 3) rankClass = 'bronze';

    const co2 = item.avgCo2 !== undefined ? item.avgCo2.toFixed(4) : '—';
    const grade = item.grade || 'N/A';
    const domain = item._id || 'unknown';
    const scans = item.count || 0;

    html += `
      <div class="lb-row" data-domain="${domain}">
        <div class="lb-rank ${rankClass}">${rank}</div>
        <div>
          <div class="lb-domain">${domain}</div>
          <div class="lb-domain-sub">${scans} scan${scans !== 1 ? 's' : ''}</div>
        </div>
        <div class="lb-co2">${co2}g</div>
        <div class="lb-grade ${getGradeClass(grade)}">${grade}</div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Make rows clickable to show history
  container.querySelectorAll('.lb-row').forEach(row => {
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      const domain = row.getAttribute('data-domain');
      document.getElementById('history-domain').value = domain;
      loadHistory(domain);
      document.getElementById('history-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

function emptyState(message) {
  return `
    <div class="lb-empty">
      <div class="lb-empty-big">📭</div>
      <p>${message}</p>
    </div>
  `;
}

// ===================== STATS =====================
async function loadStats() {
  try {
    const res = await window.fetchWithAuth('/api/recent');
    const data = await res.json();
    const scans = data.recent || [];

    // Total scans (this is last 20, but we show it as "recent")
    const totalScans = scans.length;
    const domains = new Set(scans.map(s => s.hostname));
    const avgCo2 = scans.length > 0
      ? (scans.reduce((sum, s) => sum + (s.co2Grams || 0), 0) / scans.length).toFixed(4)
      : '—';
    const greenCount = scans.filter(s => s.isGreenHosted).length;
    const greenPct = scans.length > 0 ? Math.round((greenCount / scans.length) * 100) + '%' : '—';

    animateNumber('stat-total-scans', totalScans);
    animateNumber('stat-unique-domains', domains.size);
    document.getElementById('stat-avg-co2').textContent = avgCo2;
    document.getElementById('stat-green-pct').textContent = greenPct;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

function animateNumber(elementId, target) {
  const el = document.getElementById(elementId);
  let current = 0;
  const step = Math.max(1, Math.floor(target / 20));
  const interval = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    el.textContent = current;
  }, 40);
}

// ===================== HISTORY =====================
let historyChart = null;

async function loadHistory(domain) {
  const chartContainer = document.getElementById('chart-container');
  const emptyEl = document.getElementById('history-empty');
  const errorEl = document.getElementById('history-error');

  emptyEl.style.display = 'none';
  errorEl.style.display = 'none';
  chartContainer.style.display = 'none';

  try {
    const res = await window.fetchWithAuth(`/api/history?domain=${encodeURIComponent(domain)}`);
    const data = await res.json();

    if (!data.history || data.history.length === 0) {
      errorEl.style.display = 'block';
      document.getElementById('history-error-msg').textContent =
        `No scan history found for "${domain}". Try analyzing it first!`;
      return;
    }

    chartContainer.style.display = 'block';
    renderChart(data.history, domain);
  } catch (err) {
    console.error('Failed to load history:', err);
    errorEl.style.display = 'block';
    document.getElementById('history-error-msg').textContent = 'Failed to fetch history. Please try again.';
  }
}

function renderChart(history, domain) {
  const ctx = document.getElementById('history-chart').getContext('2d');

  // Destroy old chart if exists
  if (historyChart) {
    historyChart.destroy();
  }

  const labels = history.map(h => {
    const d = new Date(h.createdAt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  });

  const co2Data = history.map(h => h.co2Grams);
  const sizeData = history.map(h => h.totalSizeMB);

  historyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'CO₂ per View (g)',
          data: co2Data,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 8,
          yAxisID: 'y',
        },
        {
          label: 'Page Size (MB)',
          data: sizeData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          borderWidth: 2,
          borderDash: [6, 4],
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          yAxisID: 'y1',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { family: 'Inter', size: 13 },
            color: isDarkMode() ? '#e5e7eb' : '#374151'
          }
        },
        title: {
          display: true,
          text: `Carbon Footprint Trend — ${domain}`,
          font: { family: 'Inter', size: 16, weight: '600' },
          color: isDarkMode() ? '#f9fafb' : '#111827',
          padding: { bottom: 20 }
        },
        tooltip: {
          backgroundColor: isDarkMode() ? 'rgba(30, 41, 59, 0.95)' : 'rgba(17, 24, 39, 0.95)',
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          padding: 14,
          cornerRadius: 10,
          callbacks: {
            label: function (context) {
              if (context.datasetIndex === 0) {
                return ` CO₂: ${context.parsed.y.toFixed(4)}g`;
              }
              return ` Size: ${context.parsed.y.toFixed(2)} MB`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter', size: 11 },
            color: isDarkMode() ? '#9ca3af' : '#6b7280'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'CO₂ (grams)',
            font: { family: 'Inter', size: 12 },
            color: isDarkMode() ? '#9ca3af' : '#6b7280'
          },
          grid: { color: isDarkMode() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
          ticks: {
            font: { family: 'JetBrains Mono', size: 11 },
            color: isDarkMode() ? '#9ca3af' : '#6b7280'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Page Size (MB)',
            font: { family: 'Inter', size: 12 }
          },
          grid: { drawOnChartArea: false },
          ticks: { font: { family: 'JetBrains Mono', size: 11 } }
        }
      }
    }
  });
}

// ===================== RECENT SCANS =====================
async function loadRecentScans() {
  try {
    const res = await window.fetchWithAuth('/api/recent');
    const data = await res.json();
    renderRecentScans(data.recent || []);
  } catch (err) {
    console.error('Failed to load recent scans:', err);
    document.getElementById('recent-grid').innerHTML = emptyState('Could not load recent scans.');
  }
}

function renderRecentScans(scans) {
  const container = document.getElementById('recent-grid');
  if (!scans || scans.length === 0) {
    container.innerHTML = emptyState('No scans yet. <a href="analyze.html">Analyze a website</a> to get started!');
    return;
  }

  let html = '';
  scans.forEach(scan => {
    const grade = scan.grade || 'N/A';
    const gradeColor = getGradeColor(grade);
    const co2 = scan.co2Grams ? scan.co2Grams.toFixed(4) : '—';
    const size = scan.totalSizeMB ? scan.totalSizeMB.toFixed(2) : '—';
    const green = scan.isGreenHosted ? '🟢 Green' : '⚪ Standard';
    const ago = timeAgo(scan.createdAt);

    html += `
      <div class="lb-recent-card">
        <div class="lb-recent-grade" style="background: ${gradeColor}">${grade}</div>
        <div class="lb-recent-info">
          <div class="lb-recent-domain">${scan.hostname || scan.url}</div>
          <div class="lb-recent-meta">
            <span>🧪 ${co2}g CO₂</span>
            <span>📦 ${size} MB</span>
            <span>${green}</span>
            <span>🕐 ${ago}</span>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
