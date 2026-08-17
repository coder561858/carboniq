'use client';

import { useState, useEffect, useCallback } from 'react';

export default function Lightbox({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(null);

  const open = useCallback((contentJsx) => {
    setContent(contentJsx);
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setContent(null);
    document.body.style.overflow = '';
  }, []);

  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [close]);

  return (
    <>
      {children({ open, close })}
      <div
        className={`lightbox-overlay ${isOpen ? 'active' : ''}`}
        id="lightbox-overlay"
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      >
        <button className="lightbox-close" onClick={close}>✕</button>
        <div className="lightbox-content" id="lightbox-content">
          {content}
        </div>
      </div>
    </>
  );
}
