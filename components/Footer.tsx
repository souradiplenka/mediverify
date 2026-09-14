import Link from 'next/link';
import { Shield, Mail, Phone, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-emerald-950 text-emerald-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                MediVerify
              </span>
            </div>
            <p className="text-emerald-300/70 text-sm leading-relaxed max-w-xs">
              Protecting lives through precision medicine verification. Powered by global FDA data and real-time detection.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-widest">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/', label: 'Home' },
                { href: '/verify', label: 'Verify Medicine' },
                { href: '/medicines', label: 'Medicine Database' },
                { href: '/report', label: 'Report Fake' },
                { href: '/dashboard', label: 'Dashboard' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-emerald-300/70 hover:text-emerald-200 text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-widest">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-emerald-300/70 text-sm">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                support@mediverify.in
              </li>
              <li className="flex items-center gap-2 text-emerald-300/70 text-sm">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                1800-XXX-XXXX (Toll Free)
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-emerald-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-emerald-400/60 text-xs">
            © 2024 MediVerify. All rights reserved.
          </p>
          <p className="text-emerald-400/60 text-xs flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400" /> to protect India
          </p>
        </div>
      </div>
    </footer>
  );
}
