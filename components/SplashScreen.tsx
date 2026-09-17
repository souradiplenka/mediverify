'use client';

import { useState, useEffect } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = 2000; // 2 seconds to reach 100%
    const intervalTime = 20;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(Math.round((currentStep / steps) * 100), 100);
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(timer);
        setIsFinished(true);

        // Hold briefly at 100% then start exit animation
        setTimeout(() => {
          setIsExiting(true);
        }, 200);

        // Remove splash from DOM after exit animation completes
        setTimeout(() => {
          onDone();
        }, 900);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#022c22] text-white transition-all duration-700 ease-in-out ${
        isExiting ? 'opacity-0 scale-105 blur-sm pointer-events-none' : 'opacity-100 scale-100 blur-none'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-[300px] h-[300px] bg-teal-400/10 rounded-full blur-2xl top-1/4 right-1/4 pointer-events-none" />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 select-none max-w-md w-full">
        
        {/* Animated Shield Logo */}
        <div className="relative mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-2xl shadow-emerald-500/30 border border-emerald-300/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 sm:w-12 sm:h-12 text-white">
              <path
                d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z"
                fill="currentColor"
                fillOpacity="0.9"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="#064e3b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-emerald-400/30 animate-ping opacity-40 pointer-events-none" />
        </div>

        {/* Title */}
        <h1
          className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-2"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Medi<span className="text-emerald-400">Verify</span>
        </h1>

        {/* Subtitle */}
        <p className="text-emerald-200/70 text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase mb-10">
          Fake Medicine Detection System
        </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-emerald-950/60 border border-emerald-700/50 rounded-full h-3 p-0.5 overflow-hidden shadow-inner mb-3">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full transition-all duration-75 ease-out shadow-md shadow-emerald-400/50"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Percentage Counter */}
        <div className="flex items-center justify-between w-full text-xs font-mono font-bold text-emerald-300/90 px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Loading System Data…
          </span>
          <span className="text-sm text-emerald-300 font-extrabold">{progress}%</span>
        </div>

      </div>

      {/* Footer Badges */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6 text-[11px] font-medium text-emerald-300/50 uppercase tracking-widest">
        <span>WHO Standards</span>
        <span>•</span>
        <span>CDSCO Registered</span>
        <span>•</span>
        <span>OpenFDA AI</span>
      </div>
    </div>
  );
}
