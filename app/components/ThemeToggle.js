'use client';

import { useTheme } from '../../contexts/ThemeContext';

const SUN_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" style={{ display: 'block' }}>
    <circle cx="12" cy="12" r="5.5" fill="#facc15"/>
    <g stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round">
      <line x1="12" y1="1.5" x2="12" y2="4"/>
      <line x1="12" y1="20" x2="12" y2="22.5"/>
      <line x1="1.5" y1="12" x2="4" y2="12"/>
      <line x1="20" y1="12" x2="22.5" y2="12"/>
      <line x1="4.57" y1="4.57" x2="6.34" y2="6.34"/>
      <line x1="17.66" y1="17.66" x2="19.43" y2="19.43"/>
      <line x1="4.57" y1="19.43" x2="6.34" y2="17.66"/>
      <line x1="17.66" y1="6.34" x2="19.43" y2="4.57"/>
    </g>
  </svg>
);

const MOON_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="#818cf8" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle" aria-label="Toggle dark mode" onClick={toggleTheme}>
      {theme === 'dark' ? SUN_SVG : MOON_SVG}
    </button>
  );
}
