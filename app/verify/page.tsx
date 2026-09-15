'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, QrCode, CheckCircle, AlertTriangle, XCircle,
  HelpCircle, Camera, ArrowRight, Loader2, Globe, ShieldCheck,
  ShieldAlert, ExternalLink, Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MedicineCard from '@/components/MedicineCard';
import StatusBadge from '@/components/StatusBadge';
import { Medicine } from '@/types';

/* ══════════════════════════════════════════════
   OPENFDA API — check if medicine is globally known
══════════════════════════════════════════════ */
interface FDAMatch {
  brand_name: string;
  generic_name: string;
  manufacturer: string;
  active_ingredient: string;
  product_type: string;
  route: string;
  has_recall: boolean;
  recall_reason?: string;
}

async function checkOpenFDA(query: string): Promise<FDAMatch | null> {
  try {
    const encoded = encodeURIComponent(query);

    // Check drug labels database
    const labelRes = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encoded}"+OR+openfda.generic_name:"${encoded}"+OR+openfda.substance_name:"${encoded}"&limit=1`
    );
    const labelData = await labelRes.json();
    const r = labelData.results?.[0];

    if (!r) {
      // Try broader search if exact match fails
      const broadRes = await fetch(
        `https://api.fda.gov/drug/label.json?search="${encoded}"&limit=1`
      );
      const broadData = await broadRes.json();
      if (!broadData.results?.[0]) return null;
      const br = broadData.results[0];
      return {
        brand_name: br.openfda?.brand_name?.[0] ?? query,
        generic_name: br.openfda?.generic_name?.[0] ?? '',
        manufacturer: br.openfda?.manufacturer_name?.[0] ?? '',
        active_ingredient: br.active_ingredient?.[0]?.split('\n')[0] ?? '',
        product_type: br.openfda?.product_type?.[0] ?? 'Drug',
        route: br.openfda?.route?.[0] ?? '',
        has_recall: false,
      };
    }

    // Check for recalls
    let has_recall = false;
    let recall_reason = '';
    try {
      const recallRes = await fetch(
        `https://api.fda.gov/drug/enforcement.json?search=product_description:"${encoded}"&limit=1`
      );
      const recallData = await recallRes.json();
      if (recallData.results?.length > 0) {
        has_recall = true;
        recall_reason = recallData.results[0].reason_for_recall ?? '';
      }
    } catch { /* no recall data */ }

    return {
      brand_name: r.openfda?.brand_name?.[0] ?? query,
      generic_name: r.openfda?.generic_name?.[0] ?? '',
      manufacturer: r.openfda?.manufacturer_name?.[0] ?? '',
      active_ingredient: r.active_ingredient?.[0]?.split('\n')[0]?.replace(/^active\s+ingredient[^:]*:\s*/i, '').trim() ?? '',
      product_type: r.openfda?.product_type?.[0] ?? 'Drug',
      route: r.openfda?.route?.[0] ?? '',
      has_recall,
      recall_reason,
    };
  } catch {
    return null;
  }
}

/* ── QR Scanner ─────────────────────────────── */
function QRScanner({ onScan }: { onScan: (text: string) => void }) {
  const divRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<unknown>(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (!divRef.current) return;
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text: string) => { scanner.stop().catch(() => {}); onScan(text); },
        () => {}
      );
      setStarted(true);
    } catch {
      setError('Camera access denied or not available.');
    }
  };

  useEffect(() => {
    return () => {
      const s = scannerRef.current as { stop?: () => Promise<void> } | null;
      if (s?.stop) s.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="text-center">
      <div id="qr-reader" ref={divRef} className="mx-auto max-w-sm rounded-xl overflow-hidden border-2 border-blue-200" />
      {!started && (
        <div className="mt-6">
          <Camera className="w-16 h-16 text-blue-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Click below to start your camera and scan a medicine QR code or barcode.</p>
          <button onClick={startScanner} className="btn-primary mx-auto">
            <Camera className="w-4 h-4" /> Start Camera
          </button>
        </div>
      )}
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
    </div>
  );
}

/* ── Our DB result banner ───────────────────── */
function ResultBanner({ medicine }: { medicine: Medicine }) {
  const banners: Record<string, { bg: string; icon: React.ReactNode; msg: string }> = {
    verified: {
      bg: 'bg-green-50 border-green-300',
      icon: <CheckCircle className="w-7 h-7 text-green-600 shrink-0" />,
      msg: '✅ This medicine is VERIFIED in our database and safe to use.',
    },
    suspicious: {
      bg: 'bg-red-50 border-red-300',
      icon: <AlertTriangle className="w-7 h-7 text-red-600 shrink-0" />,
      msg: '⚠️ WARNING: This medicine is flagged as SUSPICIOUS. Do not consume.',
    },
    recalled: {
      bg: 'bg-orange-50 border-orange-300',
      icon: <XCircle className="w-7 h-7 text-orange-600 shrink-0" />,
      msg: '🚨 ALERT: This medicine has been RECALLED. Dispose immediately.',
    },
    unknown: {
      bg: 'bg-gray-50 border-gray-300',
      icon: <HelpCircle className="w-7 h-7 text-gray-500 shrink-0" />,
      msg: 'Status unknown — verify with your pharmacist.',
    },
  };
  const b = banners[medicine.status] ?? banners.unknown;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border-2 ${b.bg} mb-4`}>
      {b.icon}
      <p className="font-semibold text-gray-800">{b.msg}</p>
    </div>
  );
}

/* ── OpenFDA result card ────────────────────── */
function FDAResultCard({ match, query }: { match: FDAMatch; query: string }) {
  if (match.has_recall) {
    return (
      <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-5 mb-4">
        <div className="flex items-start gap-3 mb-3">
          <ShieldAlert className="w-7 h-7 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-orange-800 text-lg">⚠️ Medicine Found — BUT RECALLED</h3>
            <p className="text-orange-700 text-sm mt-0.5">This medicine exists in the FDA database but has an active recall. Do not use.</p>
          </div>
        </div>
        {match.recall_reason && (
          <div className="bg-orange-100 rounded-lg p-3 text-sm text-orange-800 mb-3">
            <strong>Recall reason:</strong> {match.recall_reason}
          </div>
        )}
        <FDADetails match={match} />
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-4">
      <div className="flex items-start gap-3 mb-3">
        <ShieldCheck className="w-7 h-7 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-blue-800 text-lg">✅ Found in Global Medicine Database</h3>
          <p className="text-blue-600 text-sm mt-0.5">
            This medicine is <strong>recognised by the FDA global database</strong> as a legitimate pharmaceutical product.
            It is <strong>not in our local database</strong> yet — consider adding it.
          </p>
        </div>
      </div>
      <FDADetails match={match} />
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/admin`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add to our database
        </Link>
        <a
          href={`https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" /> View on FDA website
        </a>
      </div>
    </div>
  );
}

function FDADetails({ match }: { match: FDAMatch }) {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      {[
        { label: 'Brand Name', value: match.brand_name },
        { label: 'Generic Name', value: match.generic_name },
        { label: 'Manufacturer', value: match.manufacturer },
        { label: 'Product Type', value: match.product_type },
        { label: 'Route', value: match.route },
        { label: 'Active Ingredient', value: match.active_ingredient },
      ].filter(f => f.value).map(f => (
        <div key={f.label} className="bg-white/70 rounded-lg p-2">
          <div className="text-xs text-gray-500 font-medium">{f.label}</div>
          <div className="font-semibold text-gray-800 text-sm truncate">{f.value}</div>
        </div>
      ))}
    </div>
  );
}

// Add Plus icon locally
function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

/* ══════════════════════════════════════════════
   MAIN VERIFY CONTENT
══════════════════════════════════════════════ */
function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<'search' | 'qr'>('search');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');

  // Our DB results
  const [dbResults, setDbResults] = useState<Medicine[]>([]);

  // OpenFDA results
  const [fdaMatch, setFdaMatch] = useState<FDAMatch | null>(null);
  const [fdaChecked, setFdaChecked] = useState(false);

  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fdaLoading, setFdaLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setQuery(q); handleSearch(q); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (searchTerm?: string) => {
    const term = (searchTerm ?? query).trim();
    if (!term) return;

    setLoading(true);
    setSearched(false);
    setFdaMatch(null);
    setFdaChecked(false);

    // Step 1: Primary search — full term across all fields
    let found: Medicine[] = [];
    const { data: primary } = await supabase
      .from('medicines')
      .select('*')
      .or(`name.ilike.%${term}%,brand.ilike.%${term}%,batch_number.ilike.%${term}%,active_ingredient.ilike.%${term}%,category.ilike.%${term}%,description.ilike.%${term}%`);
    found = primary ?? [];

    // Step 1b: Keyword fallback — split "peptard 20" → search "peptard" then "20"
    // Catches partial matches when full phrase doesn't match
    if (found.length === 0) {
      const words = term.split(/\s+/).filter(w => w.length >= 2);
      for (const word of words) {
        const { data: wordData } = await supabase
          .from('medicines')
          .select('*')
          .or(`name.ilike.%${word}%,brand.ilike.%${word}%,active_ingredient.ilike.%${word}%,description.ilike.%${word}%`);
        if (wordData && wordData.length > 0) { found = wordData; break; }
      }
    }

    // Step 1c: Prefix fuzzy fallback — "pept" matches "pan" brands (first 4 chars)
    if (found.length === 0 && term.length >= 4) {
      const prefix = term.slice(0, 4);
      const { data: prefixData } = await supabase
        .from('medicines')
        .select('*')
        .or(`name.ilike.${prefix}%,brand.ilike.${prefix}%`);
      if (prefixData && prefixData.length > 0) found = prefixData;
    }

    setDbResults(found);
    setSearched(true);
    setLoading(false);

    // Log verification
    await supabase.from('verifications').insert({
      medicine_id: found[0]?.id ?? null,
      search_term: term,
      result: found.length > 0 ? found[0].status : 'not_found_local',
    });

    // Step 2: If NOT in our DB → check OpenFDA automatically
    if (found.length === 0) {
      setFdaLoading(true);
      const fdaResult = await checkOpenFDA(term);
      setFdaMatch(fdaResult);
      setFdaChecked(true);
      setFdaLoading(false);
    }
  };

  const handleQRScan = (text: string) => {
    setQuery(text);
    setTab('search');
    handleSearch(text);
    router.push(`/verify?q=${encodeURIComponent(text)}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800">Verify Medicine Authenticity</h1>
        <p className="text-gray-500 mt-1">Search by name, brand, batch number, or scan QR/barcode on the packaging.</p>

        {/* How it works badge */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-medium">
            <Info className="w-3 h-3" /> Checks our local database first, then OpenFDA global database automatically
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium">
            <Globe className="w-3 h-3" /> Powered by OpenFDA — millions of medicines
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 max-w-sm">
        <button
          onClick={() => setTab('search')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${tab === 'search' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Search className="w-4 h-4" /> Text Search
        </button>
        <button
          onClick={() => setTab('qr')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${tab === 'qr' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <QrCode className="w-4 h-4" /> Scan QR
        </button>
      </div>

      {/* Search Tab */}
      {tab === 'search' && (
        <div>
          <div className="flex gap-2 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Paracetamol, Calpol, antacid antigas liquid…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="input-field pl-11 py-3 text-base"
              />
            </div>
            <button onClick={() => handleSearch()} disabled={loading || fdaLoading} className="btn-primary">
              {(loading || fdaLoading)
                ? <><Loader2 className="w-4 h-4 animate-spin" />Checking…</>
                : <><Search className="w-4 h-4" />Search</>}
            </button>
          </div>

          {/* Loading states */}
          {loading && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl mb-4 text-blue-700">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium text-sm">Checking our local medicine database…</span>
            </div>
          )}

          {fdaLoading && (
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl mb-4 text-purple-700">
              <Loader2 className="w-5 h-5 animate-spin" />
              <Globe className="w-5 h-5" />
              <span className="font-medium text-sm">Not in local DB — now checking OpenFDA global database…</span>
            </div>
          )}

          {/* ── RESULTS ── */}
          {searched && (
            <>
              {/* Case 1: Found in our database */}
              {dbResults.length > 0 && (
                <div>
                  {/* Source badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified in Our Local Database
                    </span>
                  </div>
                  <ResultBanner medicine={dbResults[0]} />
                  <p className="text-sm text-gray-500 mb-4">Found {dbResults.length} match{dbResults.length > 1 ? 'es' : ''}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {dbResults.map(med => <MedicineCard key={med.id} medicine={med} />)}
                  </div>
                </div>
              )}

              {/* Case 2: NOT in our DB — show OpenFDA result */}
              {dbResults.length === 0 && fdaChecked && (
                <>
                  {fdaMatch ? (
                    /* Found in OpenFDA */
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 text-xs bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-semibold">
                          <Globe className="w-3.5 h-3.5" /> Not in Local DB — Found in OpenFDA Global Database
                        </span>
                      </div>
                      <FDAResultCard match={fdaMatch} query={query} />
                    </div>
                  ) : (
                    /* NOT found anywhere */
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                      <ShieldAlert className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                      <h3 className="font-bold text-gray-800 mb-2 text-lg">⚠️ Not Found Anywhere</h3>
                      <p className="text-gray-600 text-sm mb-1">
                        &quot;<strong>{query}</strong>&quot; was not found in:
                      </p>
                      <ul className="text-sm text-gray-500 mb-4 space-y-1">
                        <li>❌ Our local medicine database</li>
                        <li>❌ OpenFDA global medicine database</li>
                      </ul>
                      <p className="text-red-600 text-sm font-semibold mb-4">
                        This medicine may be unregistered, counterfeit, or simply not yet recorded anywhere.
                        Do NOT consume if in doubt.
                      </p>
                      <Link
                        href={`/report?medicine=${encodeURIComponent(query)}`}
                        className="btn-danger inline-flex"
                      >
                        <AlertTriangle className="w-4 h-4" /> Report as Suspicious
                      </Link>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Empty state */}
          {!searched && !loading && (
            <div className="text-center py-16 text-gray-400">
              <Search className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Enter a medicine name or batch number to verify</p>
              <p className="text-xs mt-1 text-gray-300">Searches both our database + OpenFDA global database</p>
            </div>
          )}
        </div>
      )}

      {/* QR Tab */}
      {tab === 'qr' && (
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" /> QR Code / Barcode Scanner
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Point your camera at the QR code or barcode on the medicine packaging. The result will automatically be searched.
          </p>
          <QRScanner onScan={handleQRScan} />
          <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
            <ArrowRight className="w-3 h-3" />
            Alternatively, switch to Text Search and type the batch number manually.
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}
