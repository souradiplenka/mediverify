'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Search, Shield, CheckCircle, AlertTriangle, Database,
  ClipboardList, Activity, ArrowRight, Pill, QrCode, Globe
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MedicineCard from '@/components/MedicineCard';
import { Medicine } from '@/types';

interface Stats {
  total: number; verified: number; reports: number; verifications: number;
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ total: 0, verified: 0, reports: 0, verifications: 0 });
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      const [
        { count: total }, { count: verified },
        { count: reports }, { count: verifications },
        { data: recentMeds },
      ] = await Promise.all([
        supabase.from('medicines').select('*', { count: 'exact', head: true }),
        supabase.from('medicines').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('verifications').select('*', { count: 'exact', head: true }),
        supabase.from('medicines').select('*').eq('status', 'verified').order('created_at', { ascending: false }).limit(6),
      ]);
      setStats({ total: total ?? 0, verified: verified ?? 0, reports: reports ?? 0, verifications: verifications ?? 0 });
      setMedicines(recentMeds ?? []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/verify?q=${encodeURIComponent(query.trim())}`);
    else router.push('/verify');
  };

  return (
    <div className="bg-white">

      {/* ════ SECTION 1 — HERO ════ */}
      <section className="relative min-h-[92vh] bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 overflow-hidden flex flex-col justify-center">
        {/* BloomSense Ambient Shader Glow */}
        <div className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 35%, rgba(16,185,129,0.22) 0%, rgba(6,78,59,0.1) 50%, transparent 75%), radial-gradient(circle at 80% 20%, rgba(52,211,153,0.15) 0%, transparent 40%)' }} />
        <div className="noise-overlay absolute inset-0 opacity-[0.35] mix-blend-overlay pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
          
          {/* Badge — Shader Fade-in Down */}
          <div className="shader-fade-in-down mb-6 inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-md border border-emerald-400/30 rounded-full text-xs md:text-sm text-emerald-200 font-semibold shadow-lg shadow-emerald-950/40">
            <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
            Fake Medicine Detection System — Powered by OpenFDA & WHO
          </div>

          {/* Headline — Shader Fade-in Up (Delay 200) */}
          <h1
            className="shader-fade-in-up shader-delay-200 text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight max-w-4xl mb-6 tracking-tight"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            Decode Medicine
            <span className="block italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400"> Authenticity</span>
            with Precision
          </h1>

          {/* Paragraph — Shader Fade-in Up (Delay 400) */}
          <p className="shader-fade-in-up shader-delay-400 text-emerald-100/85 text-base md:text-lg lg:text-xl max-w-2xl mb-10 leading-relaxed font-light">
            Instantly verify if your medicine is genuine. Detect counterfeits, report fake drugs, and protect lives across India — backed by global FDA data.
          </p>

          {/* Search bar — Shader Fade-in Up (Delay 600) */}
          <form onSubmit={handleSearch}
            className="shader-fade-in-up shader-delay-600 w-full max-w-xl flex flex-col sm:flex-row gap-2.5 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="e.g. Dolo 650, Peptard 20, Augmentin, Pan 40…"
                value={query} onChange={e => setQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-full bg-white text-gray-800 placeholder:text-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-xl" />
            </div>
            <button type="submit" className="px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-full text-sm transition-all shadow-lg hover:shadow-emerald-500/30 hover:scale-105 shrink-0">
              Verify Now
            </button>
          </form>

          {/* CTA buttons — Shader Fade-in Up (Delay 800) */}
          <div className="shader-fade-in-up shader-delay-800 flex flex-wrap gap-3 justify-center">
            <Link href="/verify" className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-900 font-bold rounded-full text-sm hover:bg-emerald-50 transition-all shadow-md hover:shadow-lg">
              <QrCode className="w-4 h-4 text-emerald-700" /> Scan QR Code
            </Link>
            <Link href="/report" className="flex items-center gap-2 px-6 py-3 bg-emerald-900/80 border border-emerald-400/40 text-emerald-100 font-semibold rounded-full text-sm hover:bg-emerald-800 transition-all backdrop-blur-md">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Report Fake Medicine
            </Link>
          </div>
        </div>

        {/* Bottom scroll hint */}
        <div className="relative z-10 pb-6 flex justify-center">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
            className="w-6 h-10 border-2 border-emerald-400/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-emerald-400/60 rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* ════ SECTION 2 — STATS ════ */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Medicines in Database', value: stats.total,         icon: <Database className="w-5 h-5" />,     color: 'text-emerald-700', bg: 'bg-emerald-50', delay: 0 },
              { label: 'Verified Medicines',    value: stats.verified,      icon: <CheckCircle className="w-5 h-5" />,  color: 'text-emerald-700', bg: 'bg-emerald-50', delay: 0.08 },
              { label: 'Fake Reports Filed',    value: stats.reports,       icon: <ClipboardList className="w-5 h-5" />,color: 'text-red-600',     bg: 'bg-red-50',     delay: 0.16 },
              { label: 'Total Verifications',   value: stats.verifications, icon: <Activity className="w-5 h-5" />,    color: 'text-blue-600',    bg: 'bg-blue-50',     delay: 0.24 },
            ].map(s => (
              <FadeIn key={s.label} delay={s.delay}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-4`}>{s.icon}</div>
                  {loading
                    ? <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-16 mb-2" />
                    : <p className={`text-3xl font-bold ${s.color} mb-1`}>{s.value.toLocaleString()}</p>}
                  <p className="text-sm text-gray-500 font-medium">{s.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════ SECTION 3 — HOW IT WORKS ════ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-14">
            <p className="text-emerald-600 font-semibold text-sm uppercase tracking-widest mb-3">The Process</p>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle mx-auto">Three simple steps to verify any medicine in seconds</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-14 left-1/4 right-1/4 h-0.5 bg-emerald-100 z-0" />

            {[
              { step: '01', icon: <Search className="w-6 h-6 text-emerald-700" />, title: 'Search or Scan', desc: 'Enter the medicine name, brand, batch number, or scan the QR/barcode on the packaging.', delay: 0 },
              { step: '02', icon: <Globe className="w-6 h-6 text-emerald-700" />, title: 'Global Verification', desc: 'We check against our local database AND the FDA global medicine registry automatically.', delay: 0.12 },
              { step: '03', icon: <CheckCircle className="w-6 h-6 text-emerald-700" />, title: 'Instant Result', desc: 'Get a clear ✅ Verified, ⚠️ Suspicious, or 🚨 Recalled result with full medicine details.', delay: 0.24 },
            ].map(item => (
              <FadeIn key={item.step} delay={item.delay}>
                <div className="relative z-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">{item.icon}</div>
                  <span className="text-xs font-bold text-emerald-500 tracking-widest uppercase mb-2 block">Step {item.step}</span>
                  <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ════ SECTION 4 — RECENT MEDICINES ════ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="flex items-end justify-between mb-12">
            <div>
              <p className="text-emerald-600 font-semibold text-sm uppercase tracking-widest mb-2">Medicine Registry</p>
              <h2 className="section-title mb-0">Recently Verified Medicines</h2>
            </div>
            <Link href="/medicines" className="hidden sm:flex items-center gap-1.5 text-emerald-700 font-semibold text-sm hover:text-emerald-900 transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-48 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
                  <div className="h-3 bg-gray-50 rounded w-1/2 mb-6" />
                  <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : medicines.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {medicines.map((med, i) => (
                <FadeIn key={med.id} delay={i * 0.06}>
                  <MedicineCard medicine={med} />
                </FadeIn>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <Database className="w-14 h-14 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-gray-500">No medicines yet.</p>
              <p className="text-sm mt-1">Run the Supabase setup SQL to load 20 demo medicines.</p>
            </div>
          )}
        </div>
      </section>

      {/* ════ SECTION 5 — WARNING BANNER ════ */}
      <FadeIn>
        <section className="py-5 px-4 bg-amber-50 border-y border-amber-200">
          <div className="max-w-4xl mx-auto flex items-center gap-3 justify-center text-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-amber-800 text-sm font-medium">
              <strong>Always buy medicines from licensed pharmacies.</strong>{' '}
              If in doubt, verify here before consuming. Fake medicines can be life-threatening.
            </p>
          </div>
        </section>
      </FadeIn>

      {/* ════ SECTION 6 — CTA ════ */}
      <section className="py-24 bg-emerald-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #10b981 0%, transparent 60%)' }} />
        <div className="noise-overlay absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" />
        <FadeIn className="relative z-10 text-center px-4">
          <Pill className="w-12 h-12 text-emerald-300 mx-auto mb-5" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Spotted a Fake Medicine?
          </h2>
          <p className="text-emerald-200 mb-8 max-w-xl mx-auto text-lg font-light">
            Your report helps regulators take action and protects thousands of other patients across India.
          </p>
          <Link href="/report"
            className="inline-flex items-center gap-2 bg-white text-emerald-800 font-bold px-8 py-4 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-emerald-50">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Report It Now
          </Link>
        </FadeIn>
      </section>
    </div>
  );
}
