'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Menu, X, AlertTriangle, User, LogIn, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import AuthModal from './AuthModal';

const NAV_LINKS = [
  { href: '/',           label: 'Home' },
  { href: '/verify',     label: 'Verify Medicine' },
  { href: '/health-risk',label: 'Health Risk' },
  { href: '/profile',    label: 'My Profile' },
  { href: '/medicines',  label: 'Medicine Database' },
  { href: '/dashboard',  label: 'Dashboard' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'My Account';

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-emerald-800 transition-colors">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-emerald-900 text-lg tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                MediVerify
              </span>
            </Link>

            {/* Desktop Nav + Auth + CTA */}
            <div className="hidden md:flex items-center gap-1.5 ml-auto">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    pathname === href
                      ? 'bg-emerald-50 text-emerald-800 font-bold'
                      : 'text-gray-600 hover:text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  {label}
                </Link>
              ))}

              {/* User Profile / Auth State */}
              {user ? (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="max-w-[100px] truncate">{displayName}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openAuth('signin')}
                  className="ml-2 flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-full border border-emerald-200 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </button>
              )}

              {/* CTA */}
              <Link
                href="/report"
                className="ml-2 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-sm hover:shadow-md"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Report Fake
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {open && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {user && (
              <div className="px-4 py-2 mb-2 bg-emerald-50 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between">
                <span className="truncate">Signed in as: {displayName}</span>
                <button onClick={handleSignOut} className="text-red-600 font-bold ml-2">Sign Out</button>
              </div>
            )}
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                {label}
              </Link>
            ))}
            {!user && (
              <button
                onClick={() => { setOpen(false); openAuth('signin'); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50"
              >
                <LogIn className="w-4 h-4" /> Sign In / Create Account
              </button>
            )}
            <Link
              href="/report"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" /> Report Fake Medicine
            </Link>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
