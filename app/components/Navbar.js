'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.nav-avatar-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleNavClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        setMenuOpen(false);
      }
    } else {
      setMenuOpen(false);
    }
  };

  // Determine if we're on the homepage for hash links
  const isHome = pathname === '/';
  const homePrefix = isHome ? '' : '/';

  // Get user initial for avatar
  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : '?';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
      <div className="container navbar-inner">
        <Link href="/" className="navbar-logo">
          <span className="logo-icon">🌱</span>
          <span className="brand-name">
            <span className="brand-carbon">carbon</span>
            <span className="brand-iq">iq</span>
          </span>
        </Link>

        <button
          className="menu-toggle"
          id="menu-toggle"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`} id="navbar-links">
          <li>
            <Link href={`${homePrefix}#home`} onClick={(e) => handleNavClick(e, '#home')}>
              Home
            </Link>
          </li>
          <li>
            <Link href={`${homePrefix}#features`} onClick={(e) => handleNavClick(e, '#features')}>
              Features
            </Link>
          </li>
          <li>
            <Link href={`${homePrefix}#how-it-works`} onClick={(e) => handleNavClick(e, '#how-it-works')}>
              How It Works
            </Link>
          </li>
          <li>
            <Link href={`${homePrefix}#faq`} onClick={(e) => handleNavClick(e, '#faq')}>
              FAQ
            </Link>
          </li>
          <li>
            <Link href="/leaderboard">Leaderboard</Link>
          </li>

          {isAuthenticated ? (
            <>
              <li>
                <Link href="/analyze" className="navbar-cta">Analyze Now →</Link>
              </li>
              <li>
                <div
                  className="nav-avatar-container"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(!dropdownOpen);
                  }}
                >
                  <div className="nav-avatar">{userInitial}</div>
                  <div className={`nav-dropdown ${dropdownOpen ? 'show' : ''}`}>
                    <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>
                      Logout
                    </a>
                  </div>
                </div>
              </li>
            </>
          ) : (
            <li>
              <Link href="/auth" className="navbar-cta">Login / Sign Up →</Link>
            </li>
          )}

          <li>
            <ThemeToggle />
          </li>
        </ul>
      </div>
    </nav>
  );
}
