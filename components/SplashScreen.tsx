'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [counter, setCounter] = useState(0);
  const [exit, setExit] = useState(false);

  useEffect(() => {
    // Tick counter 0 → 100 over ~2.4 seconds
    const totalMs = 2400;
    const interval = totalMs / 100;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      setCounter(current);
      if (current >= 100) {
        clearInterval(timer);
        // Small hold, then trigger curtain wipe-up exit
        setTimeout(() => setExit(true), 300);
        // After wipe animation (~900ms), call done
        setTimeout(() => onDone(), 1200);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onDone]);

  return (
    <>
      {/* ── Curtain panel — slides up to reveal site ── */}
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{
          background: '#030303',
          transition: exit ? 'transform 0.9s cubic-bezier(0.76, 0, 0.24, 1)' : 'none',
          transform: exit ? 'translateY(-100%)' : 'translateY(0%)',
        }}
      >
        {/* Subtle noise grain texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px',
          }}
        />

        {/* Very faint green radial glow behind logo */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '480px',
            height: '480px',
            background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* ── Centre content ── */}
        <div className="relative z-10 flex flex-col items-center select-none">

          {/* Logo icon */}
          <div
            className="mb-8"
            style={{
              opacity: exit ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 72,
                height: 72,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
                boxShadow: '0 0 40px rgba(16,185,129,0.25)',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 36, height: 36 }}>
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

          {/* Brand name */}
          <h1
            style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '2.6rem',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              margin: 0,
              opacity: exit ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            Medi<span style={{ color: '#10b981' }}>Verify</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.7rem',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              marginTop: '10px',
              opacity: exit ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            Healthcare Protection
          </p>

          {/* Thin progress line */}
          <div
            style={{
              marginTop: '52px',
              width: '160px',
              height: '1px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '999px',
              overflow: 'hidden',
              opacity: exit ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${counter}%`,
                background: 'linear-gradient(90deg, #10b981, #34d399)',
                borderRadius: '999px',
                boxShadow: '0 0 10px rgba(16,185,129,0.6)',
                transition: 'width 0.04s linear',
              }}
            />
          </div>

          {/* Counter */}
          <p
            style={{
              fontFamily: '"Inter", monospace',
              fontSize: '0.65rem',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.18)',
              letterSpacing: '0.12em',
              marginTop: '14px',
              opacity: exit ? 0 : 1,
              transition: 'opacity 0.3s ease',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {String(counter).padStart(2, '0')} / 100
          </p>

        </div>

        {/* Bottom-left: tiny version tag */}
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            left: '32px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.6rem',
            color: 'rgba(255,255,255,0.12)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          v1.0
        </div>

        {/* Bottom-right: tagline */}
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            right: '32px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.6rem',
            color: 'rgba(255,255,255,0.12)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Protecting Lives
        </div>

      </div>
    </>
  );
}
