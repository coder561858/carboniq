import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Col 1: Brand & Mission */}
          <div className="footer-col">
            <Link href="/#home" className="footer-brand-title">
              <span className="logo-icon">🌱</span>
              <span className="brand-name">
                <span className="brand-carbon">carbon</span>
                <span className="brand-iq">iq</span>
              </span>
            </Link>
            <p className="footer-desc">
              Empowering developers, designers, and organizations to measure, optimize, and decarbonize their digital web footprint with high-precision headless automation.
            </p>
            <div className="footer-status-badge">
              <span className="footer-status-dot"></span>
              Live Status: Online &amp; Zero-Tracking
            </div>
          </div>

          {/* Col 2: Platform & Features */}
          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><Link href="/analyze">Analyze Website</Link></li>
              <li><Link href="/#features">Core Features</Link></li>
              <li><Link href="/#how-it-works">How It Works</Link></li>
              <li><Link href="/#faq">FAQ &amp; Help</Link></li>
            </ul>
          </div>

          {/* Col 3: Find Us */}
          <div className="footer-col">
            <h4>Find Us</h4>
            <ul>
              <li><a href="tel:+15550198273">Tel: +1 (555) 019-8273</a></li>
              <li><a href="mailto:carboniq@gmail.com">Gmail: carboniq@gmail.com</a></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          © 2026 carboniq. Built for a greener, more sustainable internet.
        </div>
      </div>
    </footer>
  );
}
