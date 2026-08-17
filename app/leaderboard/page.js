'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Footer from '../components/Footer';

// Dynamic import for Chart.js (avoid SSR issues)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ---- Helpers ----
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

function animateNumber(el, target) {
  if (!el) return;
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

export default function LeaderboardPage() {
  const { fetchWithAuth, isAuthenticated, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';

  const [cleanest, setCleanest] = useState(null);
  const [dirtiest, setDirtiest] = useState(null);
  const [recentScans, setRecentScans] = useState(null);
  const [leaderboardError, setLeaderboardError] = useState(null);

  const [historyDomain, setHistoryDomain] = useState('');
  const [historyData, setHistoryData] = useState(null);
  const [historyError, setHistoryError] = useState(null);

  const totalScansRef = useRef(null);
  const uniqueDomainsRef = useRef(null);

  // Protect page
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load leaderboard data
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function loadData() {
      try {
        const res = await fetchWithAuth('/api/leaderboard');
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || data.details || 'Failed to load leaderboard');
        }
        setCleanest(data.cleanest);
        setDirtiest(data.dirtiest);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        setLeaderboardError(err.message);
      }

      try {
        const res = await fetchWithAuth('/api/recent');
        const data = await res.json();
        const scans = data.recent || [];
        setRecentScans(scans);

        // Animate stats
        setTimeout(() => {
          animateNumber(totalScansRef.current, scans.length);
          const domains = new Set(scans.map(s => s.hostname));
          animateNumber(uniqueDomainsRef.current, domains.size);
        }, 300);

        // Set static stats
        const avgCo2El = document.getElementById('stat-avg-co2');
        const greenPctEl = document.getElementById('stat-green-pct');
        if (avgCo2El) {
          avgCo2El.textContent = scans.length > 0
            ? (scans.reduce((sum, s) => sum + (s.co2Grams || 0), 0) / scans.length).toFixed(4)
            : '—';
        }
        if (greenPctEl) {
          const greenCount = scans.filter(s => s.isGreenHosted).length;
          greenPctEl.textContent = scans.length > 0 ? Math.round((greenCount / scans.length) * 100) + '%' : '—';
        }
      } catch (err) {
        console.error('Failed to load recent scans:', err);
      }
    }

    loadData();
  }, [authLoading, isAuthenticated, fetchWithAuth]);

  const loadHistory = useCallback(async (domain) => {
    setHistoryData(null);
    setHistoryError(null);

    try {
      const res = await fetchWithAuth(`/api/history?domain=${encodeURIComponent(domain)}`);
      const data = await res.json();

      if (!data.history || data.history.length === 0) {
        setHistoryError(`No scan history found for "${domain}". Try analyzing it first!`);
        return;
      }

      setHistoryData({ history: data.history, domain });
    } catch (err) {
      console.error('Failed to load history:', err);
      setHistoryError('Failed to fetch history. Please try again.');
    }
  }, [fetchWithAuth]);

  const handleHistorySubmit = (e) => {
    e.preventDefault();
    if (historyDomain.trim()) loadHistory(historyDomain.trim());
  };

  const handleRowClick = (domain) => {
    setHistoryDomain(domain);
    loadHistory(domain);
    document.getElementById('history-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (authLoading) return null;

  // Chart data
  const chartData = historyData ? {
    labels: historyData.history.map(h => {
      const d = new Date(h.createdAt);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    }),
    datasets: [
      {
        label: 'CO₂ per View (g)',
        data: historyData.history.map(h => h.co2Grams),
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
        data: historyData.history.map(h => h.totalSizeMB),
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
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { family: 'Inter', size: 13 },
          color: isDark ? '#e5e7eb' : '#374151',
        },
      },
      title: {
        display: true,
        text: `Carbon Footprint Trend — ${historyData?.domain || ''}`,
        font: { family: 'Inter', size: 16, weight: '600' },
        color: isDark ? '#f9fafb' : '#111827',
        padding: { bottom: 20 },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(17, 24, 39, 0.95)',
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        padding: 14,
        cornerRadius: 10,
        callbacks: {
          label: (context) => {
            if (context.datasetIndex === 0) return ` CO₂: ${context.parsed.y.toFixed(4)}g`;
            return ` Size: ${context.parsed.y.toFixed(2)} MB`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: isDark ? '#9ca3af' : '#6b7280' },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'CO₂ (grams)', font: { family: 'Inter', size: 12 }, color: isDark ? '#9ca3af' : '#6b7280' },
        grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
        ticks: { font: { family: 'JetBrains Mono', size: 11 }, color: isDark ? '#9ca3af' : '#6b7280' },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Page Size (MB)', font: { family: 'Inter', size: 12 } },
        grid: { drawOnChartArea: false },
        ticks: { font: { family: 'JetBrains Mono', size: 11 } },
      },
    },
  };

  const renderTable = (items, type) => {
    if (leaderboardError) {
      return (
        <div className="lb-empty">
          <div className="lb-empty-big">📭</div>
          <p>{leaderboardError}</p>
        </div>
      );
    }
    if (!items) {
      return (
        <div className="lb-loading">
          <div className="lb-spinner"></div>
          <span>Loading leaderboard…</span>
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className="lb-empty">
          <div className="lb-empty-big">📭</div>
          <p>No data yet. <a href="/analyze">Analyze a website</a> to populate the leaderboard!</p>
        </div>
      );
    }

    return items.map((item, i) => {
      const rank = i + 1;
      let rankClass = '';
      if (rank === 1) rankClass = 'gold';
      else if (rank === 2) rankClass = 'silver';
      else if (rank === 3) rankClass = 'bronze';

      return (
        <div className="lb-row" key={item._id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(item._id)}>
          <div className={`lb-rank ${rankClass}`}>{rank}</div>
          <div>
            <div className="lb-domain">{item._id}</div>
            <div className="lb-domain-sub">{item.count} scan{item.count !== 1 ? 's' : ''}</div>
          </div>
          <div className="lb-co2">{item.avgCo2 !== undefined ? item.avgCo2.toFixed(4) : '—'}g</div>
          <div className={`lb-grade ${getGradeClass(item.grade)}`}>{item.grade || 'N/A'}</div>
        </div>
      );
    });
  };

  return (
    <>
      {/* Hero Header */}
      <section className="lb-hero">
        <div className="container">
          <span className="section-badge">🏆 Global Rankings</span>
          <h1 className="lb-title">Global Carbon Leaderboard</h1>
          <p className="lb-subtitle">See how websites rank based on their carbon emissions. Track trends over time and discover the greenest corners of the internet.</p>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="lb-stats-section">
        <div className="container">
          <div className="lb-stats-grid">
            <div className="lb-stat-card">
              <div className="lb-stat-number" ref={totalScansRef}>—</div>
              <div className="lb-stat-label">Total Scans</div>
            </div>
            <div className="lb-stat-card">
              <div className="lb-stat-number" ref={uniqueDomainsRef}>—</div>
              <div className="lb-stat-label">Unique Domains</div>
            </div>
            <div className="lb-stat-card">
              <div className="lb-stat-number" id="stat-avg-co2">—</div>
              <div className="lb-stat-label">Avg CO₂ (g/view)</div>
            </div>
            <div className="lb-stat-card">
              <div className="lb-stat-number" id="stat-green-pct">—</div>
              <div className="lb-stat-label">Green Hosted</div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Tables */}
      <section className="lb-tables-section">
        <div className="container">
          <div className="lb-tables-grid">
            <div className="lb-table-card">
              <div className="lb-table-header cleanest">
                <span className="lb-table-icon">🌿</span>
                <h2>Top 10 Cleanest</h2>
                <p>Lowest carbon emissions per page view</p>
              </div>
              <div className="lb-table-body">{renderTable(cleanest, 'cleanest')}</div>
            </div>
            <div className="lb-table-card">
              <div className="lb-table-header dirtiest">
                <span className="lb-table-icon">🏭</span>
                <h2>Top 10 Most Intensive</h2>
                <p>Highest carbon emissions per page view</p>
              </div>
              <div className="lb-table-body">{renderTable(dirtiest, 'dirtiest')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Historical Tracking */}
      <section className="lb-history-section">
        <div className="container">
          <div className="lb-history-card">
            <div className="lb-history-header">
              <div>
                <span className="section-badge">📈 Historical Tracking</span>
                <h2>Carbon Footprint Over Time</h2>
                <p>Search for any domain to see how its carbon emissions have changed across scans.</p>
              </div>
            </div>

            <div className="lb-history-search">
              <form id="history-form" autoComplete="off" onSubmit={handleHistorySubmit}>
                <input
                  type="text"
                  placeholder="Enter domain, e.g. github.com"
                  required
                  value={historyDomain}
                  onChange={(e) => setHistoryDomain(e.target.value)}
                />
                <button type="submit">Track History</button>
              </form>
            </div>

            {chartData && (
              <div className="lb-chart-container" style={{ display: 'block' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            )}

            {!chartData && !historyError && (
              <div className="lb-history-empty">
                <div className="lb-empty-icon">📊</div>
                <p>Search for a domain above to view its carbon emission history and trend analysis.</p>
              </div>
            )}

            {historyError && (
              <div className="lb-history-error" style={{ display: 'block' }}>
                <p>{historyError}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recent Scans */}
      <section className="lb-recent-section">
        <div className="container">
          <span className="section-badge">🕐 Recent Activity</span>
          <h2 className="lb-section-title">Recent Scans</h2>
          <p className="lb-section-subtitle">The latest websites analyzed on carboniq.</p>

          <div className="lb-recent-grid">
            {!recentScans ? (
              <div className="lb-loading">
                <div className="lb-spinner"></div>
                <span>Loading recent scans…</span>
              </div>
            ) : recentScans.length === 0 ? (
              <div className="lb-empty">
                <div className="lb-empty-big">📭</div>
                <p>No scans yet. <a href="/analyze">Analyze a website</a> to get started!</p>
              </div>
            ) : (
              recentScans.map((scan, i) => {
                const grade = scan.grade || 'N/A';
                const gradeColor = getGradeColor(grade);
                const co2 = scan.co2Grams ? scan.co2Grams.toFixed(4) : '—';
                const size = scan.totalSizeMB ? scan.totalSizeMB.toFixed(2) : '—';
                const green = scan.isGreenHosted ? '🟢 Green' : '⚪ Standard';
                const ago = timeAgo(scan.createdAt);

                return (
                  <div className="lb-recent-card" key={i}>
                    <div className="lb-recent-grade" style={{ background: gradeColor }}>{grade}</div>
                    <div className="lb-recent-info">
                      <div className="lb-recent-domain">{scan.hostname || scan.url}</div>
                      <div className="lb-recent-meta">
                        <span>🧪 {co2}g CO₂</span>
                        <span>📦 {size} MB</span>
                        <span>{green}</span>
                        <span>🕐 {ago}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
