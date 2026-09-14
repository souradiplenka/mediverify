'use client';

import { useEffect, useState } from 'react';
import {
  Database, CheckCircle, AlertTriangle, ClipboardList,
  Activity, BarChart2, Loader2, RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';

interface Stats {
  total: number;
  verified: number;
  flagged: number;
  reports: number;
  verificationsToday: number;
}

interface VerifRow {
  id: string;
  search_term: string;
  result: string;
  verified_at: string;
  medicines: { name: string; status: string } | null;
}

interface ReportRow {
  id: string;
  report_id: string;
  medicine_name: string;
  location: string;
  status: string;
  created_at: string;
}

interface CatCount { category: string; count: number }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, verified: 0, flagged: 0, reports: 0, verificationsToday: 0 });
  const [verifications, setVerifications] = useState<VerifRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [categories, setCategories] = useState<CatCount[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const [
      { count: total }, { count: verified }, { count: flagged }, { count: reports }, { count: todayV },
      { data: recentV }, { data: recentR }, { data: meds }
    ] = await Promise.all([
      supabase.from('medicines').select('*', { count: 'exact', head: true }),
      supabase.from('medicines').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
      supabase.from('medicines').select('*', { count: 'exact', head: true }).in('status', ['suspicious', 'recalled']),
      supabase.from('reports').select('*', { count: 'exact', head: true }),
      supabase.from('verifications').select('*', { count: 'exact', head: true }).gte('verified_at', todayStart.toISOString()),
      supabase.from('verifications').select('id, search_term, result, verified_at, medicines(name, status)').order('verified_at', { ascending: false }).limit(10),
      supabase.from('reports').select('id, report_id, medicine_name, location, status, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('medicines').select('category'),
    ]);

    setStats({ total: total ?? 0, verified: verified ?? 0, flagged: flagged ?? 0, reports: reports ?? 0, verificationsToday: todayV ?? 0 });
    setVerifications((recentV ?? []) as VerifRow[]);
    setReports((recentR ?? []) as ReportRow[]);

    // Group by category
    const catMap: Record<string, number> = {};
    (meds ?? []).forEach((m: { category: string }) => {
      if (m.category) catMap[m.category] = (catMap[m.category] ?? 0) + 1;
    });
    setCategories(Object.entries(catMap).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const maxCat = Math.max(...categories.map((c) => c.count), 1);

  const statusColor: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    action_taken: 'bg-green-100 text-green-700',
    dismissed: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">Platform Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Overview of medicine verification activity</p>
        </div>
        <button onClick={load} className="btn-secondary text-sm py-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Medicines', value: stats.total, icon: <Database className="w-5 h-5 text-blue-500" />, color: 'text-blue-700' },
          { label: 'Verified', value: stats.verified, icon: <CheckCircle className="w-5 h-5 text-green-500" />, color: 'text-green-700' },
          { label: 'Flagged', value: stats.flagged, icon: <AlertTriangle className="w-5 h-5 text-red-500" />, color: 'text-red-700' },
          { label: 'Reports Filed', value: stats.reports, icon: <ClipboardList className="w-5 h-5 text-orange-500" />, color: 'text-orange-700' },
          { label: "Today's Verifications", value: stats.verificationsToday, icon: <Activity className="w-5 h-5 text-purple-500" />, color: 'text-purple-700' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-2">{s.icon}<span className="text-xs text-gray-500">{s.label}</span></div>
            {loading ? <div className="h-8 bg-gray-100 rounded animate-pulse w-12 mt-1" /> : <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Verifications */}
        <div className="lg:col-span-2 card">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" /> Recent Verifications
          </h2>
          {loading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-semibold">Search Term</th>
                    <th className="text-left py-2 text-gray-500 font-semibold">Result</th>
                    <th className="text-left py-2 text-gray-500 font-semibold">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {verifications.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-gray-400">No verifications yet.</td></tr>}
                  {verifications.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="py-2.5 font-medium text-gray-800 truncate max-w-[180px]">{v.search_term || '—'}</td>
                      <td className="py-2.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v.result === 'verified' ? 'bg-green-100 text-green-700' : v.result === 'suspicious' ? 'bg-red-100 text-red-700' : v.result === 'recalled' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                          {v.result}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-500">{new Date(v.verified_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" /> By Category
          </h2>
          {loading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : (
            <div className="space-y-3">
              {categories.map(({ category, count }) => (
                <div key={category}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="font-medium truncate">{category}</span>
                    <span className="text-gray-400">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / maxCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card mt-6">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-red-600" /> Recent Fake Medicine Reports
        </h2>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-semibold">Report ID</th>
                  <th className="text-left py-2 text-gray-500 font-semibold">Medicine</th>
                  <th className="text-left py-2 text-gray-500 font-semibold">Location</th>
                  <th className="text-left py-2 text-gray-500 font-semibold">Status</th>
                  <th className="text-left py-2 text-gray-500 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-gray-400">No reports yet.</td></tr>}
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-2.5 font-mono text-xs font-bold text-blue-700">{r.report_id}</td>
                    <td className="py-2.5 font-medium text-gray-800">{r.medicine_name}</td>
                    <td className="py-2.5 text-gray-500 truncate max-w-[150px]">{r.location}</td>
                    <td className="py-2.5">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColor[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-500">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
