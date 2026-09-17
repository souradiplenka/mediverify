'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [counter, setCounter] = useState(0);
  const [contentVisible, setContentVisible] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(1);

  useEffect(() => {
    const totalMs = 2400;
    const interval = totalMs / 100;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      setCounter(current);
      if (current >= 100) {
        clearInterval(timer);

        // Step 1: fade out content (logo, text, bar) quickly
        setTimeout(() => setContentVisible(false), 200);

        // Step 2: after content fades, fade the dark overlay itself to 0
        // This reveals the website smoothly underneath
        setTimeout(() => setOverlayOpacity(0), 500);

        // Step 3: unmount
        setTimeout(() => onDone(), 1300);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: overlayOpacity,
        transition: overlayOpacity < 1
          ? 'opacity 0.8s cubic-bezier(0.76, 0, 0.24, 1)'
          : 'none',
        pointerEvents: overlayOpacity === 0 ? 'none' : 'all',
      }}
    >
      {/* Grain texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
          pointerEvents: 'none',
        }}
      />

      {/* Faint green core glow */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(16,185,129,0.055) 0%, transparent 68%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* Centre content — fades out first */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          userSelect: 'none',
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? 'scale(1) translateY(0)' : 'scale(1.04) translateY(-6px)',
          transition: 'opacity 0.4s cubic-bezier(0.76, 0, 0.24, 1), transform 0.4s cubic-bezier(0.76, 0, 0.24, 1)',
        }}
      >
        {/* Icon */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 36px rgba(16,185,129,0.22)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 34, height: 34 }}>
              <path
                d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z"
                fill="white"
                fillOpacity="0.95"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="#064e3b"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Brand */}
        <h1
          style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            margin: 0,
          }}
        >
          Medi<span style={{ color: '#10b981' }}>Verify</span>
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.65rem',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.22)',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginTop: 10,
          }}
        >
          Healthcare Protection
        </p>

        {/* Progress bar */}
        <div
          style={{
            marginTop: 48,
            width: 150,
            height: 1,
            background: 'rgba(255,255,255,0.07)',
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${counter}%`,
              background: 'linear-gradient(90deg, #10b981, #34d399)',
              borderRadius: 999,
              boxShadow: '0 0 8px rgba(16,185,129,0.7)',
              transition: 'width 0.04s linear',
            }}
          />
        </div>

        {/* Counter */}
        <p
          style={{
            fontFamily: 'Inter, monospace',
            fontSize: '0.6rem',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.15)',
            letterSpacing: '0.12em',
            marginTop: 12,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {String(counter).padStart(2, '0')} / 100
        </p>
      </div>

      {/* Bottom corners */}
      <span
        style={{
          position: 'absolute',
          bottom: 24,
          left: 28,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.58rem',
          color: 'rgba(255,255,255,0.1)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          opacity: contentVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        v1.0
      </span>
      <span
        style={{
          position: 'absolute',
          bottom: 24,
          right: 28,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.58rem',
          color: 'rgba(255,255,255,0.1)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          opacity: contentVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        Protecting Lives
      </span>
    </div>
  );
}
