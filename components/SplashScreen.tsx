'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'exit'>('loading');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar from 0 → 100 over ~2.2 seconds
    let start: number | null = null;
    const duration = 2200;

    const tick = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        // Small pause then transition to reveal phase
        setTimeout(() => setPhase('reveal'), 300);
        setTimeout(() => setPhase('exit'), 900);
        setTimeout(() => onDone(), 1500);
      }
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-700 ease-in-out overflow-hidden ${
        phase === 'exit' ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
      style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 40%, #065f46 70%, #047857 100%)' }}
    >
      {/* Animated dot grid background */}
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:22px_22px]" />

      {/* Floating glow orbs */}
      <div className="absolute w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl top-[-80px] right-[-80px] animate-pulse" />
      <div className="absolute w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl bottom-[-60px] left-[-60px] animate-pulse" style={{ animationDelay: '0.8s' }} />
      <div className="absolute w-56 h-56 bg-teal-400/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">

        {/* Shield / Logo icon */}
        <div
          className={`transition-all duration-700 ${
            phase === 'loading' ? 'opacity-0 translate-y-8 scale-90' : 'opacity-100 translate-y-0 scale-100'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          <div className="relative w-24 h-24 mb-8">
            {/* Outer pulsing ring */}
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping" />
            {/* Inner ring */}
            <div className="absolute inset-1 rounded-full border border-emerald-300/20" />
            {/* Icon container */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-900/60">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
                <path
                  d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z"
                  fill="white"
                  fillOpacity="0.95"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="#064e3b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Brand name */}
        <div
          className={`transition-all duration-700 ${
            phase === 'loading' ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
          }`}
          style={{ transitionDelay: '250ms' }}
        >
          <h1
            className="text-5xl sm:text-6xl font-black text-white tracking-tight mb-1"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Medi<span className="text-emerald-400">Verify</span>
          </h1>
          <p className="text-emerald-300/70 text-sm font-medium tracking-[0.3em] uppercase mb-1">
            Healthcare Protection System
          </p>
        </div>

        {/* Tagline */}
        <div
          className={`transition-all duration-700 ${
            phase === 'loading' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
          style={{ transitionDelay: '450ms' }}
        >
          <p className="text-emerald-100/50 text-xs mt-4 max-w-xs leading-relaxed">
            Protecting lives through authentic medicine verification
          </p>
        </div>

        {/* Progress bar area */}
        <div className="mt-14 w-64 sm:w-80">
          {/* Progress track */}
          <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 rounded-full transition-none"
              style={{
                width: `${progress}%`,
                boxShadow: '0 0 12px rgba(52,211,153,0.8)',
              }}
            />
          </div>

          {/* Loading dots + percentage */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[11px] text-emerald-300/60 font-mono tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Bottom trust badges */}
        <div
          className={`mt-16 flex items-center gap-6 transition-all duration-700 ${
            phase === 'loading' ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ transitionDelay: '600ms' }}
        >
          {['WHO Standards', 'CDSCO Verified', '24/7 Active'].map((badge) => (
            <div key={badge} className="flex items-center gap-1.5 text-emerald-400/50">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] font-medium tracking-wide">{badge}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
