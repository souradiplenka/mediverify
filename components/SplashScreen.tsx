'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0F172A] text-white transition-all duration-700 ease-in-out overflow-hidden ${
        isExiting ? 'opacity-0 scale-105 blur-sm pointer-events-none' : 'opacity-100 scale-100 blur-none'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#2563EB_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-[300px] h-[300px] bg-blue-400/10 rounded-full blur-2xl top-1/4 right-1/4 pointer-events-none" />

      {/* ── TO AND FRO MOVING BACKGROUND LINES ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Line 1: Moving left to right and back */}
        <motion.div
          animate={{ x: ['-80%', '180%', '-80%'] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 h-[2px] w-[70%] bg-gradient-to-r from-transparent via-blue-400 to-transparent blur-[1px] shadow-[0_0_20px_#2563EB]"
        />
        {/* Line 2: Moving right to left and back */}
        <motion.div
          animate={{ x: ['180%', '-80%', '180%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-2/3 h-[1.5px] w-[60%] bg-gradient-to-r from-transparent via-blue-300 to-transparent blur-[1px] shadow-[0_0_18px_#3B82F6]"
        />
        {/* Line 3: Subtle center pulse laser */}
        <motion.div
          animate={{ opacity: [0.2, 0.8, 0.2], width: ['40%', '80%', '40%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-blue-300 to-transparent shadow-[0_0_15px_#2563EB]"
        />
      </div>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 select-none max-w-md w-full">
        
        {/* Animated Shield Logo */}
        <div className="relative mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#1D4ED8] via-[#2563EB] to-[#60A5FA] flex items-center justify-center shadow-2xl shadow-blue-500/30 border border-blue-300/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 sm:w-12 sm:h-12 text-white">
              <path
                d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z"
                fill="currentColor"
                fillOpacity="0.9"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="#1E3A8A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-blue-400/30 animate-ping opacity-40 pointer-events-none" />
        </div>

        {/* Title */}
        <h1
          className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-2"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Medi<span className="text-[#60A5FA]">Verify</span>
        </h1>

        {/* Subtitle */}
        <p className="text-blue-200/70 text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase mb-10">
          Fake Medicine Detection System
        </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-[#0F172A]/80 border border-blue-800/50 rounded-full h-3 p-0.5 overflow-hidden shadow-inner mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#60A5FA] rounded-full transition-all duration-75 ease-out shadow-md shadow-blue-500/50"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Percentage Counter */}
        <div className="flex items-center justify-between w-full text-xs font-mono font-bold text-blue-200/90 px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            Loading System Data…
          </span>
          <span className="text-sm text-blue-200 font-extrabold">{progress}%</span>
        </div>

      </div>

      {/* Footer Badges */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6 text-[11px] font-medium text-blue-200/50 uppercase tracking-widest">
        <span>WHO Standards</span>
        <span>•</span>
        <span>CDSCO Registered</span>
        <span>•</span>
        <span>OpenFDA AI</span>
      </div>
    </div>
  );
}
