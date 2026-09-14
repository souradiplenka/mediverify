'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Search, CheckCircle, Clock, FileText, Loader2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Report } from '@/types';

function generateReportId() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RPT-${year}-${rand}`;
}

const STATUS_STEPS = ['submitted', 'under_review', 'action_taken'];
const STATUS_LABELS: Record<string, string> = {
  submitted: 'Report Submitted',
  under_review: 'Under Review',
  action_taken: 'Action Taken',
  dismissed: 'Dismissed',
};

function ReportContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'submit' | 'track'>('submit');

  // ── Submit form state ──
  const [form, setForm] = useState({
    medicine_name: searchParams.get('medicine') ?? '',
    batch_number: searchParams.get('batch') ?? '',
    location: '',
    reporter_name: '',
    reporter_email: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ── Track state ──
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState<Report | null>(null);
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.medicine_name || !form.location || !form.description) return;
    setSubmitting(true);

    const id = generateReportId();
    const { error } = await supabase.from('reports').insert({
      report_id: id,
      medicine_name: form.medicine_name,
      batch_number: form.batch_number || null,
      location: form.location,
      reporter_name: form.reporter_name || null,
      reporter_email: form.reporter_email || null,
      description: form.description,
      status: 'submitted',
    });

    setSubmitting(false);
    if (!error) {
      setReportId(id);
      setSubmitted(true);
    }
  };

  const handleTrack = async () => {
    if (!trackId.trim()) return;
    setTracking(true);
    setTrackError('');
    setTrackResult(null);

    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('report_id', trackId.trim().toUpperCase())
      .single();

    if (data) setTrackResult(data);
    else setTrackError('Report not found. Please check your Report ID.');
    setTracking(false);
  };

  const stepIndex = (s: string) => STATUS_STEPS.indexOf(s);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-red-100 p-3 rounded-xl">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Report Fake Medicine</h1>
          <p className="text-gray-500 text-sm">Help protect others by reporting suspicious medicines.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8">
        <button
          onClick={() => setTab('submit')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${tab === 'submit' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FileText className="w-4 h-4" /> Submit Report
        </button>
        <button
          onClick={() => setTab('track')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${tab === 'track' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Search className="w-4 h-4" /> Track Report
        </button>
      </div>

      {/* ── Submit Tab ── */}
      {tab === 'submit' && (
        <>
          {submitted ? (
            <div className="card text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Report Submitted!</h2>
              <p className="text-gray-500 mb-4">Thank you for helping protect public health.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-xs text-blue-500 font-semibold uppercase mb-1">Your Report ID</p>
                <p className="text-2xl font-mono font-bold text-blue-700">{reportId}</p>
                <p className="text-xs text-blue-500 mt-1">Save this ID to track your report status.</p>
              </div>
              <button
                onClick={() => { setSubmitted(false); setForm({ medicine_name: '', batch_number: '', location: '', reporter_name: '', reporter_email: '', description: '' }); }}
                className="btn-secondary mx-auto"
              >
                Submit Another Report
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Medicine Name <span className="text-red-500">*</span></label>
                <input type="text" required value={form.medicine_name} onChange={(e) => setForm({ ...form, medicine_name: e.target.value })} placeholder="e.g. Paracetamol 500mg" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Batch Number</label>
                <input type="text" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} placeholder="e.g. BATCH-XYZ-001 (if visible on pack)" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Where Did You Purchase It? <span className="text-red-500">*</span></label>
                <input type="text" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. ABC Pharmacy, MG Road, Bangalore" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
                  <input type="text" value={form.reporter_name} onChange={(e) => setForm({ ...form, reporter_name: e.target.value })} placeholder="Optional" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Your Email</label>
                  <input type="email" value={form.reporter_email} onChange={(e) => setForm({ ...form, reporter_email: e.target.value })} placeholder="For status updates" className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Describe Your Suspicion <span className="text-red-500">*</span></label>
                <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. The packaging looks different from the original, the tablet has a different colour/smell/taste, the hologram is missing…" className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Photo Evidence</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="preview" className="h-full w-full object-contain rounded-xl" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Upload className="w-6 h-6" />
                      <span className="text-xs">Click to upload photo (optional)</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
              <button type="submit" disabled={submitting} className="btn-danger w-full justify-center text-base py-3">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><AlertTriangle className="w-4 h-4" /> Submit Report</>}
              </button>
            </form>
          )}
        </>
      )}

      {/* ── Track Tab ── */}
      {tab === 'track' && (
        <div className="card space-y-4">
          <h2 className="font-bold text-gray-800">Track Your Report Status</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Report ID e.g. RPT-2024-4821"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              className="input-field uppercase"
            />
            <button onClick={handleTrack} disabled={tracking} className="btn-primary shrink-0">
              {tracking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Track
            </button>
          </div>

          {trackError && <p className="text-red-500 text-sm">{trackError}</p>}

          {trackResult && (
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Report ID</span><p className="font-mono font-bold text-blue-700">{trackResult.report_id}</p></div>
                <div><span className="text-gray-500">Medicine</span><p className="font-semibold">{trackResult.medicine_name}</p></div>
                <div><span className="text-gray-500">Location</span><p className="font-semibold">{trackResult.location}</p></div>
                <div><span className="text-gray-500">Submitted</span><p className="font-semibold">{new Date(trackResult.created_at).toLocaleDateString('en-IN')}</p></div>
              </div>

              {/* Status timeline */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Report Progress</p>
                <div className="flex items-center gap-0">
                  {STATUS_STEPS.map((step, i) => {
                    const current = stepIndex(trackResult.status);
                    const isDone = i <= current;
                    const isActive = i === current;
                    return (
                      <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${isDone ? (isActive ? 'bg-blue-600 text-white' : 'bg-green-500 text-white') : 'bg-gray-200 text-gray-400'}`}>
                            {isDone && !isActive ? <CheckCircle className="w-4 h-4" /> : i + 1}
                          </div>
                          <span className={`text-xs font-medium text-center ${isDone ? (isActive ? 'text-blue-600' : 'text-green-600') : 'text-gray-400'}`}>
                            {STATUS_LABELS[step]}
                          </span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`flex-1 h-1 mx-1 rounded ${i < current ? 'bg-green-400' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {trackResult.status === 'dismissed' && (
                <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" /> This report was reviewed and dismissed.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <ReportContent />
    </Suspense>
  );
}
