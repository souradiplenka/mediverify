'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Shield, Lock, Plus, ClipboardList, Database, Loader2,
  Trash2, CheckCircle, RefreshCw, Search, Upload, Download,
  AlertTriangle, X, Zap, FileText
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';
import { Medicine, Report, MedicineStatus, ReportStatus } from '@/types';

const ADMIN_PASSWORD = 'admin123';

const emptyMedicine = {
  name: '', brand: '', manufacturer: '', batch_number: '',
  manufacturing_date: '', expiry_date: '', active_ingredient: '',
  category: 'Analgesic', dosage: '', license_number: '',
  status: 'verified' as MedicineStatus, description: '', country: 'India',
};

const CATEGORIES = [
  'Analgesic','Antibiotic','Antidiabetic','Antacid','Statin',
  'Antihistamine','NSAID','Antiplatelet','Supplement','Vitamin',
  'Antimalarial','ACE Inhibitor','Other'
];

/* ── OpenFDA fetch ─────────────────────────────────── */
interface FDADrug {
  brand_name: string;
  generic_name: string;
  manufacturer: string;
  active_ingredient: string;
}

async function fetchFromOpenFDA(query: string): Promise<FDADrug[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encoded}"+OR+openfda.generic_name:"${encoded}"&limit=6`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('FDA fetch failed');
    const data = await res.json();
    return (data.results ?? []).map((r: Record<string, unknown>) => {
      const o = r.openfda as Record<string, string[]> | undefined;
      const ai = (r.active_ingredient as string[] | undefined)?.[0] ?? '';
      return {
        brand_name: o?.brand_name?.[0] ?? '',
        generic_name: o?.generic_name?.[0] ?? '',
        manufacturer: o?.manufacturer_name?.[0] ?? '',
        active_ingredient: ai.split('\n')[0].replace(/^active\s+ingredient[^:]*:\s*/i, '').trim(),
      };
    });
  } catch {
    return [];
  }
}

/* ── Simple CSV parser ─────────────────────────────── */
function parseCSV(text: string): Record<string, string>[] {
  const rows = text.trim().split(/\r?\n/);
  if (rows.length < 2) return [];
  const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return rows.slice(1).map(row => {
    const vals = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    return headers.reduce((obj, h, i) => ({ ...obj, [h]: vals[i] ?? '' }), {} as Record<string, string>);
  });
}

/* ── CSV template content ──────────────────────────── */
const CSV_TEMPLATE = `name,brand,manufacturer,batch_number,manufacturing_date,expiry_date,active_ingredient,category,dosage,license_number,status,description,country
Paracetamol,Calpol,GlaxoSmithKline,GSK-DEMO-001,2024-01-01,2026-01-01,Paracetamol 500mg,Analgesic,500mg,LIC-001,verified,Pain relief and fever reduction,India
Amoxicillin,Mox 250,Ranbaxy,RAN-DEMO-002,2024-02-01,2026-02-01,Amoxicillin 250mg,Antibiotic,250mg,LIC-002,verified,Broad-spectrum antibiotic,India`;

/* ════════════════════════════════════════════════════
   ADMIN PAGE
════════════════════════════════════════════════════ */
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [wrongPw, setWrongPw] = useState(false);
  const [tab, setTab] = useState<'reports' | 'medicines' | 'add' | 'bulk'>('reports');

  /* data */
  const [reports, setReports] = useState<Report[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);

  /* add form */
  const [newMed, setNewMed] = useState(emptyMedicine);
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  /* OpenFDA */
  const [fdaQuery, setFdaQuery] = useState('');
  const [fdaResults, setFdaResults] = useState<FDADrug[]>([]);
  const [fdaLoading, setFdaLoading] = useState(false);
  const [fdaError, setFdaError] = useState('');

  /* CSV bulk upload */
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkDone, setBulkDone] = useState<{ success: number; failed: number } | null>(null);

  const adminSupabase = createAdminClient();

  const login = () => {
    if (password === ADMIN_PASSWORD) { setAuthed(true); }
    else { setWrongPw(true); setTimeout(() => setWrongPw(false), 2000); }
  };

  const loadData = async () => {
    setLoading(true);
    const [{ data: r }, { data: m }] = await Promise.all([
      adminSupabase.from('reports').select('*').order('created_at', { ascending: false }),
      adminSupabase.from('medicines').select('*').order('created_at', { ascending: false }),
    ]);
    setReports((r ?? []) as Report[]);
    setMedicines((m ?? []) as Medicine[]);
    setLoading(false);
  };

  useEffect(() => { if (authed) loadData(); }, [authed]);

  /* ── Update report status ── */
  const updateReportStatus = async (id: string, status: ReportStatus) => {
    await adminSupabase.from('reports').update({ status }).eq('id', id);
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  /* ── Update medicine status ── */
  const updateMedStatus = async (id: string, status: MedicineStatus) => {
    await adminSupabase.from('medicines').update({ status }).eq('id', id);
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  };

  /* ── Delete medicine ── */
  const deleteMedicine = async (id: string) => {
    if (!confirm('Delete this medicine? This cannot be undone.')) return;
    await adminSupabase.from('medicines').delete().eq('id', id);
    setMedicines(prev => prev.filter(m => m.id !== id));
  };

  /* ── Add one medicine ── */
  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    const { error } = await adminSupabase.from('medicines').insert(newMed);
    setAdding(false);
    if (!error) {
      setAddSuccess(true);
      setNewMed(emptyMedicine);
      setFdaResults([]);
      setFdaQuery('');
      loadData();
      setTimeout(() => setAddSuccess(false), 3000);
    }
  };

  /* ── OpenFDA search ── */
  const handleFDASearch = async () => {
    if (!fdaQuery.trim()) return;
    setFdaLoading(true);
    setFdaError('');
    setFdaResults([]);
    const results = await fetchFromOpenFDA(fdaQuery.trim());
    setFdaLoading(false);
    if (results.length === 0) setFdaError('No results from OpenFDA. Try a different name (e.g. "ibuprofen", "metformin").');
    else setFdaResults(results);
  };

  /* ── Apply FDA result to form ── */
  const applyFDA = (drug: FDADrug) => {
    setNewMed(prev => ({
      ...prev,
      name: drug.generic_name || prev.name,
      brand: drug.brand_name || prev.brand,
      manufacturer: drug.manufacturer || prev.manufacturer,
      active_ingredient: drug.active_ingredient || prev.active_ingredient,
    }));
    setFdaResults([]);
    setFdaQuery('');
  };

  /* ── Parse CSV file ── */
  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setBulkDone(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setCsvRows(rows);
    };
    reader.readAsText(file);
  };

  /* ── Bulk insert ── */
  const handleBulkUpload = async () => {
    if (csvRows.length === 0) return;
    setBulkLoading(true);
    setBulkProgress(0);
    let success = 0; let failed = 0;
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const { error } = await adminSupabase.from('medicines').insert({
        name: row.name || '',
        brand: row.brand || '',
        manufacturer: row.manufacturer || '',
        batch_number: row.batch_number || `BATCH-${Date.now()}-${i}`,
        manufacturing_date: row.manufacturing_date || null,
        expiry_date: row.expiry_date || null,
        active_ingredient: row.active_ingredient || '',
        category: row.category || 'Other',
        dosage: row.dosage || '',
        license_number: row.license_number || '',
        status: (row.status as MedicineStatus) || 'verified',
        description: row.description || '',
        country: row.country || 'India',
      });
      if (error) failed++; else success++;
      setBulkProgress(Math.round(((i + 1) / csvRows.length) * 100));
    }
    setBulkLoading(false);
    setBulkDone({ success, failed });
    loadData();
    setCsvRows([]);
    setCsvFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  /* ── Download CSV template ── */
  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'medicines_template.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  const reportBadge: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    action_taken: 'bg-green-100 text-green-700',
    dismissed: 'bg-gray-100 text-gray-600',
  };

  /* ── Login Screen ── */
  if (!authed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="card max-w-sm w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <Lock className="w-8 h-8 text-blue-700" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800 mb-1">Admin Panel</h1>
          <p className="text-sm text-gray-500 mb-6">Enter your admin password to continue.</p>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            className={`input-field mb-3 text-center ${wrongPw ? 'border-red-400 ring-2 ring-red-300' : ''}`}
          />
          {wrongPw && <p className="text-red-500 text-xs mb-3">Incorrect password.</p>}
          <button onClick={login} className="btn-primary w-full justify-center">
            <Shield className="w-4 h-4" /> Login
          </button>
        </div>
      </div>
    );
  }

  /* ── Admin Panel ── */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" /> Admin Panel
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage medicines, reports and bulk uploads</p>
        </div>
        <button onClick={loadData} className="btn-secondary text-sm py-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {([
          { key: 'reports',  label: 'Reports',       icon: <ClipboardList className="w-4 h-4" /> },
          { key: 'medicines',label: 'Medicines',      icon: <Database className="w-4 h-4" /> },
          { key: 'add',      label: 'Add Medicine',   icon: <Plus className="w-4 h-4" /> },
          { key: 'bulk',     label: 'Bulk CSV Upload',icon: <Upload className="w-4 h-4" /> },
        ] as const).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : (
        <>
          {/* ════ REPORTS TAB ════ */}
          {tab === 'reports' && (
            <div className="card overflow-x-auto">
              <h2 className="font-bold text-gray-800 mb-4">All Reports ({reports.length})</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 font-semibold">
                    <th className="text-left py-2">Report ID</th>
                    <th className="text-left py-2">Medicine</th>
                    <th className="text-left py-2">Location</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reports.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No reports yet.</td></tr>}
                  {reports.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="py-3 font-mono text-xs font-bold text-blue-700">{r.report_id}</td>
                      <td className="py-3 font-medium text-gray-800 max-w-[130px] truncate">{r.medicine_name}</td>
                      <td className="py-3 text-gray-500 max-w-[120px] truncate">{r.location}</td>
                      <td className="py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${reportBadge[r.status] ?? ''}`}>{r.status.replace('_', ' ')}</span></td>
                      <td className="py-3 text-gray-500">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="py-3">
                        <select value={r.status} onChange={e => updateReportStatus(r.id, e.target.value as ReportStatus)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                          {(['submitted','under_review','action_taken','dismissed'] as ReportStatus[]).map(s =>
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ════ MEDICINES TAB ════ */}
          {tab === 'medicines' && (
            <div className="card overflow-x-auto">
              <h2 className="font-bold text-gray-800 mb-4">All Medicines ({medicines.length})</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 font-semibold">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Brand</th>
                    <th className="text-left py-2">Batch</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Expiry</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {medicines.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-800">{m.name}</td>
                      <td className="py-3 text-gray-600">{m.brand}</td>
                      <td className="py-3 font-mono text-xs text-gray-500">{m.batch_number}</td>
                      <td className="py-3"><StatusBadge status={m.status} size="sm" /></td>
                      <td className="py-3 text-gray-500">{m.expiry_date ? new Date(m.expiry_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="py-3 flex items-center gap-2">
                        <select value={m.status} onChange={e => updateMedStatus(m.id, e.target.value as MedicineStatus)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                          {(['verified','suspicious','recalled','unknown'] as MedicineStatus[]).map(s =>
                            <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => deleteMedicine(m.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ════ ADD MEDICINE TAB ════ */}
          {tab === 'add' && (
            <div className="max-w-2xl space-y-4">

              {/* OpenFDA Auto-fill */}
              <div className="card border-2 border-blue-100 bg-blue-50/40">
                <h2 className="font-bold text-blue-800 mb-1 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" /> Auto-fill from OpenFDA
                </h2>
                <p className="text-xs text-blue-600 mb-3">Search OpenFDA database to auto-fill medicine details. Works best with generic names (e.g. "metformin", "ibuprofen").</p>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="e.g. metformin, ibuprofen, amoxicillin…"
                    value={fdaQuery}
                    onChange={e => setFdaQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleFDASearch()}
                    className="input-field text-sm"
                  />
                  <button onClick={handleFDASearch} disabled={fdaLoading} className="btn-primary shrink-0 py-2 px-4">
                    {fdaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {fdaLoading ? 'Searching…' : 'Search'}
                  </button>
                </div>

                {fdaError && <p className="text-red-500 text-xs">{fdaError}</p>}

                {/* FDA Results dropdown */}
                {fdaResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600">Click a result to auto-fill the form:</p>
                    {fdaResults.map((drug, i) => (
                      <button
                        key={i}
                        onClick={() => applyFDA(drug)}
                        className="w-full text-left p-3 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-all text-sm"
                      >
                        <div className="font-semibold text-gray-800">{drug.generic_name} {drug.brand_name && <span className="text-gray-500 font-normal">({drug.brand_name})</span>}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{drug.manufacturer}</div>
                        {drug.active_ingredient && <div className="text-xs text-blue-600 mt-0.5 truncate">Active: {drug.active_ingredient}</div>}
                      </button>
                    ))}
                    <button onClick={() => setFdaResults([])} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mt-1">
                      <X className="w-3 h-3" /> Clear results
                    </button>
                  </div>
                )}
              </div>

              {/* Add Medicine Form */}
              <div className="card">
                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" /> Add New Medicine
                </h2>
                {addSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-green-700">
                    <CheckCircle className="w-4 h-4" /> Medicine added successfully!
                  </div>
                )}
                <form onSubmit={handleAddMedicine} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Medicine Name *', key: 'name', placeholder: 'e.g. Paracetamol' },
                      { label: 'Brand *', key: 'brand', placeholder: 'e.g. Calpol' },
                      { label: 'Manufacturer *', key: 'manufacturer', placeholder: 'e.g. GlaxoSmithKline' },
                      { label: 'Batch Number *', key: 'batch_number', placeholder: 'e.g. GSK-PCM-2024-001' },
                      { label: 'Active Ingredient', key: 'active_ingredient', placeholder: 'e.g. Paracetamol 500mg' },
                      { label: 'Dosage', key: 'dosage', placeholder: 'e.g. 500mg' },
                      { label: 'License Number', key: 'license_number', placeholder: 'e.g. LIC-GSK-IN-001' },
                      { label: 'Country', key: 'country', placeholder: 'India' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">{f.label}</label>
                        <input required={f.label.endsWith('*')} value={(newMed as Record<string,string>)[f.key]} placeholder={f.placeholder}
                          onChange={e => setNewMed({ ...newMed, [f.key]: e.target.value })} className="input-field text-sm" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Manufacturing Date</label>
                      <input type="date" value={newMed.manufacturing_date} onChange={e => setNewMed({ ...newMed, manufacturing_date: e.target.value })} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry Date</label>
                      <input type="date" value={newMed.expiry_date} onChange={e => setNewMed({ ...newMed, expiry_date: e.target.value })} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                      <select value={newMed.category} onChange={e => setNewMed({ ...newMed, category: e.target.value })} className="input-field text-sm">
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                      <select value={newMed.status} onChange={e => setNewMed({ ...newMed, status: e.target.value as MedicineStatus })} className="input-field text-sm">
                        {['verified','suspicious','recalled','unknown'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                    <textarea rows={2} value={newMed.description} onChange={e => setNewMed({ ...newMed, description: e.target.value })} placeholder="Brief description…" className="input-field text-sm resize-none" />
                  </div>
                  <button type="submit" disabled={adding} className="btn-primary">
                    {adding ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</> : <><Plus className="w-4 h-4" />Add Medicine</>}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ════ BULK CSV UPLOAD TAB ════ */}
          {tab === 'bulk' && (
            <div className="max-w-4xl space-y-5">

              {/* Step 1: Download template */}
              <div className="card border-2 border-dashed border-gray-200">
                <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Step 1 — Download CSV Template
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Download the template, fill it in Excel or Google Sheets with all your medicines, then upload below.
                </p>
                <button onClick={downloadTemplate} className="btn-secondary">
                  <Download className="w-4 h-4" /> Download Template (medicines_template.csv)
                </button>

                {/* Column guide */}
                <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                  <p className="font-semibold mb-2">Required CSV Columns:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {['name','brand','manufacturer','batch_number','manufacturing_date (YYYY-MM-DD)','expiry_date (YYYY-MM-DD)',
                      'active_ingredient','category','dosage','license_number',
                      'status (verified/suspicious/recalled/unknown)','description','country'].map(col => (
                      <span key={col} className="font-mono bg-white border border-gray-200 px-2 py-0.5 rounded">{col}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2: Upload */}
              <div className="card">
                <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" /> Step 2 — Upload Your CSV File
                </h2>
                <p className="text-sm text-gray-500 mb-4">Select your filled CSV file. We'll preview the data before uploading.</p>

                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-blue-200 rounded-xl cursor-pointer bg-blue-50/30 hover:bg-blue-50 transition-colors">
                  <Upload className="w-8 h-8 text-blue-400 mb-2" />
                  <span className="text-sm font-semibold text-blue-600">{csvFileName || 'Click to select CSV file'}</span>
                  <span className="text-xs text-gray-400 mt-1">.csv files only</span>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVFile} />
                </label>
              </div>

              {/* Step 3: Preview */}
              {csvRows.length > 0 && (
                <div className="card">
                  <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" /> Step 3 — Preview & Upload
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Found <strong>{csvRows.length} medicines</strong> in your file. Preview (first 5 rows):
                  </p>

                  <div className="overflow-x-auto mb-5">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {['name','brand','manufacturer','batch_number','status','category','dosage'].map(h => (
                            <th key={h} className="text-left py-2 px-2 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {csvRows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            {['name','brand','manufacturer','batch_number','status','category','dosage'].map(k => (
                              <td key={k} className="py-2 px-2 text-gray-700 max-w-[120px] truncate">{row[k] || '—'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvRows.length > 5 && <p className="text-xs text-gray-400 mt-2">…and {csvRows.length - 5} more rows</p>}
                  </div>

                  {/* Progress bar */}
                  {bulkLoading && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Uploading…</span><span>{bulkProgress}%</span>
                      </div>
                      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${bulkProgress}%` }} />
                      </div>
                    </div>
                  )}

                  <button onClick={handleBulkUpload} disabled={bulkLoading} className="btn-primary">
                    {bulkLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading {bulkProgress}%…</>
                      : <><Upload className="w-4 h-4" />Upload All {csvRows.length} Medicines</>}
                  </button>
                </div>
              )}

              {/* Done summary */}
              {bulkDone && (
                <div className={`card border-2 ${bulkDone.failed === 0 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" /> Upload Complete
                  </h3>
                  <div className="flex gap-6 text-sm">
                    <span className="text-green-700 font-semibold">✅ {bulkDone.success} uploaded successfully</span>
                    {bulkDone.failed > 0 && <span className="text-red-600 font-semibold">❌ {bulkDone.failed} failed (duplicate batch numbers?)</span>}
                  </div>
                  <button onClick={() => setBulkDone(null)} className="mt-3 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    <X className="w-3 h-3" /> Dismiss
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
