'use client';

import { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen';

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Show splash only once per browser session (not on every page nav)
    const seen = sessionStorage.getItem('medi_splash_done');
    if (!seen) {
      setShowSplash(true);
    }
  }, []);

  const handleSplashDone = () => {
    sessionStorage.setItem('medi_splash_done', '1');
    setShowSplash(false);
  };

  // Prevent flash: render nothing until mounted
  if (!mounted) return null;

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      {/* Main app — hidden behind splash until it exits */}
      <div
        className={`transition-opacity duration-700 ${showSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        {children}
      </div>
    </>
  );
}
