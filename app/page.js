'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ScrollReveal from './components/ScrollReveal';
import EarthCanvas from './components/EarthCanvas';
import Lightbox from './components/Lightbox';
import Footer from './components/Footer';

// ===================================================
// IMPACT CALCULATOR COMPONENT
// ===================================================
function ImpactCalculator() {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [values, setValues] = useState({ co2: 0, trees: 0, km: 0, kwh: 0 });
  const statsRef = useRef(null);

  const calculateTargets = () => {
    const views = 10000;
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
      kwh: Math.round(annualKwh),
    };
  };

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            const targets = calculateTargets();
            // Animate values
            const duration = 2000;
            const startTime = performance.now();

            function animate(now) {
              const progress = Math.min((now - startTime) / duration, 1);
              const easeOut = 1 - Math.pow(1 - progress, 3);
              setValues({
                co2: Math.floor(targets.co2 * easeOut),
                trees: Math.floor(targets.trees * easeOut),
                km: Math.floor(targets.km * easeOut),
                kwh: Math.floor(targets.kwh * easeOut),
              });
              if (progress < 1) requestAnimationFrame(animate);
              else setValues(targets);
            }
            requestAnimationFrame(animate);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <div className="impact-card reveal visible">
      <div className="impact-top">
        <div className="impact-left">
          <h3>Estimate your footprint</h3>
          <p>Based on the average page weight of 2.3 MB and a global grid intensity of 494 gCO₂e/kWh.</p>
          <div className="impact-input-group">
            <label className="impact-input-label" htmlFor="traffic-input">Monthly page views</label>
            <div className="impact-input-wrapper">
              <input type="number" id="traffic-input" className="impact-input" value="10000" readOnly />
              <span className="impact-input-unit">views / month</span>
            </div>
          </div>
        </div>
        <div className="impact-stats" ref={statsRef}>
          <div className="impact-stat-card">
            <div className="impact-stat-value">{values.co2.toLocaleString()}</div>
            <div className="impact-stat-unit">kg CO₂</div>
            <div className="impact-stat-label">per year</div>
          </div>
          <div className="impact-stat-card">
            <div className="impact-stat-value">{values.trees.toLocaleString()}</div>
            <div className="impact-stat-unit">trees</div>
            <div className="impact-stat-label">needed to offset</div>
          </div>
          <div className="impact-stat-card">
            <div className="impact-stat-value">{values.km.toLocaleString()}</div>
            <div className="impact-stat-unit">km</div>
            <div className="impact-stat-label">car driving equivalent</div>
          </div>
          <div className="impact-stat-card">
            <div className="impact-stat-value">{values.kwh.toLocaleString()}</div>
            <div className="impact-stat-unit">kWh</div>
            <div className="impact-stat-label">energy consumed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================================================
// EXPANDABLE CARD COMPONENT
// ===================================================
function ExpandableCard({ icon, iconColor, title, children }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <ScrollReveal>
      <div className={`expandable-card ${expanded ? 'expanded' : ''}`} data-expandable="">
        <div className="expandable-card-header" onClick={() => setExpanded(!expanded)}>
          <div className={`expandable-card-icon ${iconColor}`}>{icon}</div>
          <span className="expandable-card-title">{title}</span>
          <span className="expandable-card-toggle">▼</span>
        </div>
        <div className="expandable-card-body">
          <div className="expandable-card-content">{children}</div>
        </div>
      </div>
    </ScrollReveal>
  );
}

// ===================================================
// FAQ ITEM COMPONENT
// ===================================================
function FAQItem({ question, children }) {
  const [open, setOpen] = useState(false);

  return (
    <ScrollReveal>
      <div className={`faq-item ${open ? 'open' : ''}`} data-faq="">
        <button className="faq-question" onClick={() => setOpen(!open)}>
          <span>{question}</span>
          <span className="faq-toggle">▼</span>
        </button>
        <div className="faq-answer">
          <div className="faq-answer-inner">{children}</div>
        </div>
      </div>
    </ScrollReveal>
  );
}

// ===================================================
// ANALYZE FEATURES DATA
// ===================================================
const analyzeFeatures = [
  { icon: '📦', color: 'green', title: 'Total page size', desc: 'Complete transfer size including all resources.', extra: "We load your page in a real Chromium browser and measure the actual encoded data length of every network request — giving you the true transfer size, including compression." },
  { icon: '🖼️', color: 'purple', title: 'Resource count', desc: 'Images, scripts, stylesheets, fonts, and media.', extra: "Every network request is categorized: images (PNG, JPG, WebP, SVG), JavaScript files, CSS stylesheets, fonts (WOFF2, TTF), media, and other resources. Bloated resource counts slow your page and increase energy use." },
  { icon: '⚡', color: 'red', title: 'Render-blocking resources', desc: 'JS and CSS that delay page rendering.', extra: 'We detect scripts in the <head> without async or defer attributes, and stylesheets that block rendering. These make users wait longer, keeping devices powered on and consuming more energy.' },
  { icon: '🌐', color: 'blue', title: 'Server location', desc: 'IP address mapped to country and region.', extra: "We resolve your domain's IP address and geolocate it to a city, region, and country. Server location affects carbon intensity since different electrical grids vary in how much CO₂ they produce per kWh." },
  { icon: '🌿', color: 'green', title: 'Green hosting check', desc: 'Is your server powered by renewable energy?', extra: "We check the Green Web Foundation's database to verify if your hosting provider uses renewable energy. Green hosting can reduce data center emissions by up to 95%, making it the single most impactful change." },
  { icon: '🏆', color: 'orange', title: 'Carbon score & grade', desc: 'A+ to F rating based on emissions per visit.', extra: "Using the Sustainable Web Design Model v4, we calculate grams of CO₂ per page view and assign a letter grade from A+ (exceptional, under 0.1g) to F (very poor, over 2g), with energy breakdowns across data centers, networks, and user devices." },
];

const colorMap = {
  green: '#22c55e',
  purple: '#a855f7',
  red: '#ef4444',
  blue: '#3b82f6',
  orange: '#f97316',
};

// ===================================================
// MAIN HOMEPAGE COMPONENT
// ===================================================
export default function HomePage() {
  const wrapperRef = useRef(null);
  const panelRef = useRef(null);

  // Scroll-driven panel slide-up animation
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const panel = panelRef.current;
    if (!wrapper || !panel) return;

    const TRAVEL = window.innerHeight;
    wrapper.style.height = (window.innerHeight + TRAVEL) + 'px';
    panel.style.marginTop = (-TRAVEL) + 'px';

    let settled = false;

    function onScroll() {
      const scrollY = window.scrollY;
      const start = wrapper.offsetTop;
      const raw = (scrollY - start) / TRAVEL;
      const progress = Math.max(0, Math.min(1, raw));

      if (!settled) {
        const eased = 1 - Math.pow(1 - progress, 3);
        const translateY = (1 - eased) * 100;
        panel.style.transform = `translateY(${translateY}vh)`;

        const heroEl = document.querySelector('.hero');
        if (heroEl) {
          const heroScale = 1 - progress * 0.04;
          const heroOpacity = 1 - progress * 0.5;
          heroEl.style.transform = `scale(${heroScale})`;
          heroEl.style.opacity = heroOpacity;
        }

        if (progress >= 1 && !settled) {
          settled = true;
          panel.classList.add('panel-settled');
        }
      }

      if (progress < 1 && settled) {
        settled = false;
        panel.classList.remove('panel-settled');
      }
    }

    const handleResize = () => {
      wrapper.style.height = (window.innerHeight + TRAVEL) + 'px';
      onScroll();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <Lightbox>
      {({ open }) => (
        <>
          {/* ========== HERO SCROLL WRAPPER ========== */}
          <div id="hero-scroll-wrapper" ref={wrapperRef}>
            <section className="hero" id="home">
              <div className="hero-bg">
                <div className="hero-bg-media" id="hero-bg-media">
                  <div className="hero-bg-overlay"></div>
                </div>
                <div className="container hero-content hero-split">
                  {/* Left: Text Content */}
                  <div className="hero-text">
                    <div className="hero-problem-badge">
                      <span className="badge-dot"></span>
                      The internet has a carbon problem
                    </div>
                    <h1>Build a <span className="green">greener</span> web,<br />one site at a time</h1>
                    <p className="hero-desc">
                      Every page view produces CO₂. Your website&apos;s size, hosting, and resources all contribute to carbon emissions.
                      Let&apos;s measure it — and fix it.
                    </p>
                    <div className="hero-actions">
                      <Link href="/analyze" className="btn btn-primary">Analyze website</Link>
                      <a href="#what-is" className="btn btn-outline">Learn more ↓</a>
                    </div>
                  </div>

                  {/* Right: Orbital Ring Animation */}
                  <div className="hero-orbit-container" aria-hidden="true">
                    <div className="orbit-ring orbit-ring--outer">
                      <div className="orbit-icon" style={{ '--i': 0 }}><span>🌱</span></div>
                      <div className="orbit-icon" style={{ '--i': 1 }}><span>⚡</span></div>
                      <div className="orbit-icon" style={{ '--i': 2 }}><span>🏭</span></div>
                      <div className="orbit-icon" style={{ '--i': 3 }}><span>🍃</span></div>
                      <div className="orbit-icon" style={{ '--i': 4 }}><span>♻️</span></div>
                      <div className="orbit-icon" style={{ '--i': 5 }}><span title="Moon">🌙</span></div>
                    </div>
                    <div className="orbit-ring orbit-ring--inner">
                      <div className="orbit-icon" style={{ '--i': 0 }}><span>💧</span></div>
                      <div className="orbit-icon" style={{ '--i': 1 }}><span>☀️</span></div>
                      <div className="orbit-icon" style={{ '--i': 2 }}><span>🌿</span></div>
                      <div className="orbit-icon" style={{ '--i': 3 }}><span>💨</span></div>
                    </div>
                    <div className="orbit-center">
                      <span className="orbit-center-icon">🌎</span>
                      <div className="orbit-center-pulse"></div>
                      <div className="orbit-center-pulse orbit-center-pulse--delay"></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ========== CONTENT PANEL ========== */}
          <div id="content-panel" ref={panelRef}>

            {/* ========== WHAT IS DIGITAL CARBON FOOTPRINT ========== */}
            <section className="section what-is-section" id="what-is">
              <div className="container">
                <ScrollReveal className="text-center">
                  <span className="section-badge">📚 Basics</span>
                  <h2 className="section-title">What is a digital carbon footprint?</h2>
                  <p className="section-subtitle mx-auto">
                    A website&apos;s carbon footprint is the total CO₂ emitted when someone loads a page — from data centers
                    to networks to the device in your hand.
                  </p>
                </ScrollReveal>

                <div className="what-is-grid">
                  <ExpandableCard icon="⚡" iconColor="green" title="Every interaction uses energy">
                    <p>Every time someone visits a website, data is transferred across the internet. This data travels through networks, is processed by servers in data centers, and rendered on the user&apos;s device.</p>
                    <p>Each step in this chain consumes electricity. The carbon intensity of that electricity depends on the energy grid powering the infrastructure — coal-heavy grids produce significantly more CO₂ than renewable ones.</p>
                  </ExpandableCard>

                  <ExpandableCard icon="📊" iconColor="blue" title="Page weight is the biggest factor">
                    <p>The total size of a web page — images, scripts, stylesheets, fonts, and videos — is the primary driver of its carbon footprint. Larger pages require more data transfer, more processing power, and therefore more energy.</p>
                    <p>The median web page in 2024 is about 2.3 MB. Reducing this by even 30% can significantly lower emissions, especially for high-traffic sites.</p>
                  </ExpandableCard>

                  <ExpandableCard icon="🌿" iconColor="purple" title="Green hosting makes a massive difference">
                    <p>If your hosting provider runs on renewable energy (solar, wind, hydro), the data center portion of your website&apos;s emissions drops by up to 95%. This is verified through the Green Web Foundation&apos;s database.</p>
                    <p>Many major providers like Google Cloud, AWS (some regions), and Cloudflare are already verified green hosts. Check if yours is too!</p>
                  </ExpandableCard>
                </div>
              </div>
            </section>

            {/* ========== IMPACT CALCULATOR ========== */}
            <section className="section impact-section" id="features">
              <div className="container">
                <ScrollReveal className="text-center">
                  <span className="section-badge">📈 Estimate</span>
                  <h2 className="section-title">See the impact of your traffic</h2>
                  <p className="section-subtitle mx-auto">Estimation of different emissions based on monthly views.</p>
                </ScrollReveal>
                <ScrollReveal>
                  <ImpactCalculator />
                </ScrollReveal>
              </div>
            </section>

            {/* ========== WHY IT MATTERS ========== */}
            <section className="section matters-section">
              <div className="container">
                <ScrollReveal className="text-center">
                  <span className="section-badge">🌍 Impact</span>
                  <h2 className="section-title">Why reducing emissions matters</h2>
                  <p className="section-subtitle mx-auto">A greener web isn&apos;t just good ethics — it improves user experience, reduces costs, and builds trust.</p>
                </ScrollReveal>

                <div className="matters-grid">
                  {[
                    { icon: '🌊', title: 'Protect Oceans', desc: 'Rising CO₂ levels cause ocean acidification, threatening marine ecosystems, coral reefs, and the fishing communities that depend on them.' },
                    { icon: '🌡️', title: 'Reduce Temperatures', desc: 'Digital infrastructure contributes to global warming. Optimizing websites reduces overall energy demand and emissions from the tech sector.' },
                    { icon: '🌲', title: 'Forest Health', desc: 'Every kg of CO₂ saved helps protect forests and ecosystems that serve as vital carbon sinks for the planet.' },
                    { icon: '🔋', title: 'Reduce Energy Use', desc: 'Lighter pages and efficient code mean less electricity consumed by data centers, networks, and user devices worldwide.' },
                    { icon: '🚀', title: 'Better SEO', desc: 'Google rewards fast, lightweight sites. Reducing page weight improves Core Web Vitals and search engine rankings.' },
                    { icon: '🤝', title: 'Build Trust', desc: 'Demonstrating environmental responsibility strengthens your brand, attracting eco-conscious customers and partners.' },
                  ].map((card) => (
                    <ScrollReveal key={card.title}>
                      <div
                        className="matter-card"
                        data-expandable=""
                        onClick={() =>
                          open(
                            <div style={{ textAlign: 'center', padding: '1rem' }}>
                              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{card.icon}</div>
                              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem' }}>{card.title}</h3>
                              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 500, margin: '0 auto' }}>{card.desc}</p>
                              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Click outside or press Escape to close</p>
                              </div>
                            </div>
                          )
                        }
                      >
                        <div className="matter-card-icon">{card.icon}</div>
                        <h4>{card.title}</h4>
                        <p>{card.desc}</p>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </section>

            {/* ========== HOW IT WORKS ========== */}
            <section className="section how-section" id="how-it-works">
              <div className="container">
                <ScrollReveal className="text-center">
                  <span className="section-badge">⚙️ Workflow</span>
                  <h2 className="section-title">From URL to action plan in seconds</h2>
                  <p className="section-subtitle mx-auto">Three simple steps to understand and reduce your website&apos;s environmental impact.</p>
                </ScrollReveal>

                <div className="steps-row">
                  {[
                    { num: 1, title: 'Enter your URL', desc: "Just paste any website URL. We'll load it in a real headless browser to capture everything." },
                    { num: 2, title: 'Get instant analysis', desc: 'We measure page weight, resources, server location, green hosting status, and calculate CO₂ emissions.' },
                    { num: 3, title: 'Get actionable tips', desc: "Receive personalized recommendations with estimated impact to reduce your site's carbon footprint." },
                  ].map((step) => (
                    <ScrollReveal key={step.num}>
                      <div className="step-card">
                        <div className="step-number">{step.num}</div>
                        <h4>{step.title}</h4>
                        <p>{step.desc}</p>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </section>

            {/* ========== WHAT WE ANALYZE ========== */}
            <section className="section analyze-section" id="analyze-features">
              <div className="container">
                <ScrollReveal className="text-center">
                  <span className="section-badge">🔬 Analysis</span>
                  <h2 className="section-title">What carboniq analyzes</h2>
                  <p className="section-subtitle mx-auto">A comprehensive breakdown of your website&apos;s environmental impact.</p>
                </ScrollReveal>

                <div className="analyze-grid" id="analyze-grid">
                  {analyzeFeatures.map((feat) => (
                    <ScrollReveal key={feat.title}>
                      <div
                        className="analyze-feature"
                        data-expand-feature=""
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          const accent = colorMap[feat.color] || '#22c55e';
                          open(
                            <div className="feature-modal">
                              <div className="feature-modal-icon" style={{ background: `${accent}22`, color: accent }}>{feat.icon}</div>
                              <h3 className="feature-modal-title">{feat.title}</h3>
                              <p className="feature-modal-desc">{feat.desc}</p>
                              <div className="feature-modal-divider"></div>
                              <p className="feature-modal-extra">{feat.extra}</p>
                            </div>
                          );
                        }}
                      >
                        <div className={`analyze-feature-icon ${feat.color}`}>{feat.icon}</div>
                        <div className="analyze-feature-text">
                          <h4>{feat.title}</h4>
                          <p>{feat.desc}</p>
                        </div>
                        <div className="analyze-feature-extra">{feat.extra}</div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </section>

            {/* ========== FAQ ========== */}
            <section className="section faq-section" id="faq">
              <div className="container">
                <ScrollReveal className="text-center">
                  <span className="section-badge">❓ FAQ</span>
                  <h2 className="section-title">Frequently asked questions</h2>
                </ScrollReveal>

                <div className="faq-list">
                  <FAQItem question="What is a website's carbon footprint?">
                    It&apos;s the total CO₂ emissions produced when someone loads a web page. This includes energy used by data centers to serve the content, networks to transfer the data, and the end user&apos;s device to render it. Larger, heavier pages produce more emissions.
                  </FAQItem>
                  <FAQItem question="How accurate is the carbon estimate?">
                    We use the Sustainable Web Design Model v4, the industry-standard methodology used by the Green Web Foundation. While no estimate is perfectly accurate due to variations in grids, devices, and caching, our calculations provide a reliable and comparable measurement.
                  </FAQItem>
                  <FAQItem question='What does "green hosting" mean?'>
                    Green hosting means the server hosting your website runs on renewable energy — solar, wind, or hydro. We verify this through the Green Web Foundation&apos;s public database of verified green hosting providers. Switching to green hosting reduces data center emissions by up to 95%.
                  </FAQItem>
                  <FAQItem question="How can I reduce my website's carbon footprint?">
                    Key strategies include: compressing and using modern image formats (WebP/AVIF), reducing JavaScript and CSS, deferring non-critical scripts, switching to a green hosting provider, using a CDN, enabling caching, subsetting fonts, and lazy-loading below-the-fold content.
                  </FAQItem>
                  <FAQItem question="Is my data stored or tracked?">
                    No. carboniq is completely stateless. We don&apos;t store any analysis results, and we don&apos;t track your usage. Each analysis is performed in real-time and discarded after the response is sent.
                  </FAQItem>
                </div>
              </div>
            </section>

            {/* ========== CTA ========== */}
            <section className="section cta-section">
              <div className="container">
                <ScrollReveal>
                  <div className="cta-card">
                    <EarthCanvas />
                    <h2>Ready to measure your impact?</h2>
                    <p>Scan your website in seconds and get a detailed carbon analysis with actionable reduction tips.</p>
                    <Link href="/analyze" className="btn btn-primary">Analyze website now</Link>
                  </div>
                </ScrollReveal>
              </div>
            </section>

            <Footer />
          </div>
        </>
      )}
    </Lightbox>
  );
}
