'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Menu, X, AlertTriangle } from 'lucide-react';

const NAV_LINKS = [
  { href: '/',           label: 'Home' },
  { href: '/verify',     label: 'Verify Medicine' },
  { href: '/health-risk',label: 'Health Risk' },
  { href: '/medicines',  label: 'Medicine Database' },
  { href: '/dashboard',  label: 'Dashboard' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-emerald-800 transition-colors">
              <Shield className="w-4.5 h-4.5 text-white w-5 h-5" />
            </div>
            <span className="font-bold text-emerald-900 text-lg tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
              MediVerify
            </span>
          </Link>

          {/* Desktop Nav + CTA — all on the right */}
          <div className="hidden md:flex items-center gap-1 ml-auto">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                  pathname === href
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-gray-600 hover:text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                {label}
              </Link>
            ))}

            {/* CTA */}
            <Link
              href="/report"
              className="ml-3 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-md"
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
  );
}
