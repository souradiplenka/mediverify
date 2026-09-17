'use client';

import { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen';

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSplashDone = () => {
    setShowSplash(false);
  };

  if (!mounted) return null;

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <div
        className={`transition-all duration-700 ${
          showSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {children}
      </div>
    </>
  );
}
