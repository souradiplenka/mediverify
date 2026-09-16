'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, QrCode, CheckCircle, AlertTriangle, XCircle,
  HelpCircle, Camera, ArrowRight, Loader2, Globe, ShieldCheck,
  ShieldAlert, ExternalLink, Info, Upload, ImageIcon
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

/* ══════════════════════════════════════════════
   INDIAN BRAND → GENERIC NAME MAPPING
   Allows RxNorm to verify Indian brands by their active ingredient
══════════════════════════════════════════════ */
const INDIAN_BRANDS: Record<string, string> = {
  // Antacids / PPI
  'peptard': 'rabeprazole', 'pan': 'pantoprazole', 'pantocid': 'pantoprazole',
  'pantodac': 'pantoprazole', 'omez': 'omeprazole', 'prilosec': 'omeprazole',
  'razo': 'rabeprazole', 'nexpro': 'esomeprazole', 'nexium': 'esomeprazole',
  'rablet': 'rabeprazole', 'aciloc': 'ranitidine', 'rantac': 'ranitidine',
  // Pain / Fever
  'dolo': 'paracetamol', 'crocin': 'paracetamol', 'calpol': 'paracetamol',
  'tylenol': 'paracetamol', 'combiflam': 'ibuprofen', 'brufen': 'ibuprofen',
  'voveran': 'diclofenac', 'zerodol': 'aceclofenac', 'disprin': 'aspirin',
  'ecosprin': 'aspirin', 'contramal': 'tramadol', 'ultracet': 'tramadol',
  // Antibiotics & Ointments
  'mox': 'amoxicillin', 'augmentin': 'amoxicillin', 'amoxil': 'amoxicillin',
  'azithral': 'azithromycin', 'zithromax': 'azithromycin', 'azee': 'azithromycin',
  'ciprobid': 'ciprofloxacin', 'ciplox': 'ciprofloxacin', 'taxim': 'cefixime',
  'cepodem': 'cefpodoxime', 'doxt': 'doxycycline', 'clavam': 'amoxicillin',
  't-bact': 'mupirocin', 'bactroban': 'mupirocin', 'supirocin': 'mupirocin',
  'candiderma': 'clotrimazole', 'candid': 'clotrimazole', 'betnovate': 'betamethasone',
  // Diabetes
  'glycomet': 'metformin', 'glucophage': 'metformin', 'gluconorm': 'metformin',
  'amaryl': 'glimepiride', 'glimpid': 'glimepiride', 'januvia': 'sitagliptin',
  'vildaglip': 'vildagliptin', 'galvus': 'vildagliptin',
  // BP / Heart
  'telma': 'telmisartan', 'telmikind': 'telmisartan', 'rosuvas': 'rosuvastatin',
  'rozavel': 'rosuvastatin', 'atorva': 'atorvastatin', 'lipitor': 'atorvastatin',
  'amlodac': 'amlodipine', 'amlong': 'amlodipine', 'clopilet': 'clopidogrel',
  'plavix': 'clopidogrel', 'met xl': 'metoprolol', 'metolar': 'metoprolol',
  'listril': 'lisinopril', 'tenormin': 'atenolol', 'lasix': 'furosemide',
  // Allergy
  'cetzine': 'cetirizine', 'alerid': 'cetirizine', 'montair': 'montelukast',
  'singulair': 'montelukast', 'levocet': 'levocetirizine', 'allegra': 'fexofenadine',
  // Vitamins / Supplements
  'shelcal': 'calcium', 'becosules': 'vitamin b', 'limcee': 'ascorbic acid',
  'zincovit': 'zinc', 'thyronorm': 'levothyroxine', 'eltroxin': 'levothyroxine',
  // Antimalarial
  'hcqs': 'hydroxychloroquine', 'lariago': 'chloroquine', 'coartem': 'artemether',
  // Neuro
  'gabantin': 'gabapentin', 'pregabalin': 'pregabalin', 'lyrica': 'pregabalin',
  'nexito': 'escitalopram', 'daxid': 'sertraline', 'alprax': 'alprazolam',
};

function resolveGenericName(query: string): string | null {
  const q = query.toLowerCase().trim();
  // Direct match
  if (INDIAN_BRANDS[q]) return INDIAN_BRANDS[q];
  // Partial match — check if any brand name is contained in the query
  for (const [brand, generic] of Object.entries(INDIAN_BRANDS)) {
    if (q.includes(brand) || brand.includes(q.split(' ')[0])) return generic;
  }
  return null;
}

/* ══════════════════════════════════════════════
   RXNORM API (NIH) — Free, no key needed
   Validates generic drug names globally incl. Indian active ingredients
   e.g. "Rabeprazole" → confirms it's a real registered drug
══════════════════════════════════════════════ */
interface RxNormMatch {
  name: string;
  rxcui: string;
  synonym: string;
  usedFor: string;
}

async function checkRxNorm(query: string): Promise<RxNormMatch | null> {
  try {
    // Search RxNorm for the drug name
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encoded}`
    );
    const data = await res.json();
    const groups = data.drugGroup?.conceptGroup;
    if (!groups) return null;

    // Find first valid concept
    for (const group of groups) {
      if (group.conceptProperties?.length > 0) {
        const concept = group.conceptProperties[0];
        // Get drug info
        const infoRes = await fetch(
          `https://rxnav.nlm.nih.gov/REST/rxcui/${concept.rxcui}/related.json?tty=IN`
        );
        const infoData = await infoRes.json();
        const ingredient = infoData.relatedGroup?.conceptGroup?.[0]?.conceptProperties?.[0]?.name ?? '';

        return {
          name: concept.name,
          rxcui: concept.rxcui,
          synonym: ingredient || concept.synonym || '',
          usedFor: group.ttyType ?? 'Drug',
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/* ── QR & Barcode Scanner (Camera + Photo Upload) ── */
function QRScanner({ onScan }: { onScan: (text: string) => void }) {
  const divRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<unknown>(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [uploading, setUploading] = useState(false);

  const startScanner = async () => {
    try {
      setError('');
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5Qrcode = new Html5Qrcode('qr-reader-file-hidden');
      const decodedText = await html5Qrcode.scanFile(file, true);
      onScan(decodedText);
    } catch {
      setError('Could not detect a clear QR code or barcode in this photo. Please try a clearer or higher-contrast photo.');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      const s = scannerRef.current as { stop?: () => Promise<void> } | null;
      if (s?.stop) s.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="text-center max-w-md mx-auto">
      <div id="qr-reader-file-hidden" className="hidden" />
      <div id="qr-reader" ref={divRef} className="mx-auto rounded-xl overflow-hidden border-2 border-emerald-200" />
      
      {!started && (
        <div className="mt-4 space-y-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
            <Camera className="w-12 h-12 text-emerald-600 mx-auto mb-3 opacity-80" />
            <h3 className="font-bold text-gray-800 text-base mb-1">Live Camera Scan</h3>
            <p className="text-xs text-gray-500 mb-4">Point your camera at the barcode or QR code on the packaging.</p>
            <button onClick={startScanner} className="btn-primary mx-auto">
              <Camera className="w-4 h-4" /> Start Camera Scan
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-200" />
            <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">OR</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <ImageIcon className="w-12 h-12 text-blue-600 mx-auto mb-3 opacity-80" />
            <h3 className="font-bold text-gray-800 text-base mb-1">Upload Barcode / QR Photo</h3>
            <p className="text-xs text-gray-500 mb-4">Upload a photo of the barcode or QR code from your gallery/files.</p>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all text-sm flex items-center justify-center gap-2 mx-auto"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Scanning Image…</>
              ) : (
                <><Upload className="w-4 h-4" /> Choose Photo from Device</>
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">
          {error}
        </div>
      )}
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

/* ── Drug purpose lookup by generic/brand name ── */
const PURPOSE_MAP: Record<string, { uses: string[]; howItWorks: string; sideEffects: string[]; takeWith: string }> = {
  // Topical Antibiotics & Ointments
  mupirocin:         { uses: ['Impetigo (skin infection)', 'Bacterial skin infections', 'Staph & Strep skin infections', 'Infected cuts & wounds'], howItWorks: 'Topical antibiotic — blocks bacterial isoleucyl-tRNA synthetase enzyme, stopping bacterial growth.', sideEffects: ['Burning or stinging at application site', 'Itching', 'Rash', 'Dry skin'], takeWith: 'Apply a thin layer to the affected skin area 2 to 3 times daily for 5 to 10 days.' },
  clotrimazole:      { uses: ['Fungal skin infections', 'Ringworm (Tinea)', 'Athlete\'s foot', 'Jock itch', 'Thrush'], howItWorks: 'Antifungal — damages fungal cell membranes causing cell contents to leak out.', sideEffects: ['Mild burning', 'Redness', 'Skin irritation'], takeWith: 'Apply to clean, dry affected skin twice daily.' },
  betamethasone:     { uses: ['Eczema', 'Psoriasis', 'Severe skin inflammation', 'Allergic dermatitis'], howItWorks: 'Topical corticosteroid — reduces swelling, redness, and itching in skin cells.', sideEffects: ['Skin thinning with long use', 'Burning', 'Stretch marks'], takeWith: 'Apply sparingly to affected areas as prescribed. Avoid face/eyes.' },

  // Antacids / PPI
  rabeprazole:       { uses: ['Acid reflux (GERD)', 'Stomach ulcers', 'Heartburn', 'H. pylori infection'], howItWorks: 'Blocks the proton pump in the stomach lining to reduce acid production.', sideEffects: ['Headache', 'Diarrhoea', 'Nausea', 'Stomach pain'], takeWith: 'Take 30 min before meals. Swallow whole — do not crush.' },
  pantoprazole:      { uses: ['Acid reflux (GERD)', 'Gastric ulcers', 'Heartburn', 'Esophagitis'], howItWorks: 'Proton pump inhibitor — reduces stomach acid by blocking the acid-secreting enzyme.', sideEffects: ['Headache', 'Diarrhoea', 'Nausea', 'Dizziness'], takeWith: 'Take before breakfast with or without food.' },
  omeprazole:        { uses: ['Acid reflux', 'Peptic ulcers', 'Heartburn', 'Stomach protection'], howItWorks: 'Irreversibly blocks the H+/K+ ATPase enzyme in gastric cells to reduce acid.', sideEffects: ['Headache', 'Nausea', 'Diarrhoea', 'Constipation'], takeWith: 'Take 30–60 minutes before a meal.' },
  esomeprazole:      { uses: ['GERD', 'Erosive esophagitis', 'H. pylori eradication', 'Zollinger-Ellison syndrome'], howItWorks: 'S-isomer of omeprazole — potent proton pump inhibitor reducing gastric acid.', sideEffects: ['Headache', 'Nausea', 'Diarrhoea', 'Flatulence'], takeWith: 'Take 1 hour before meals.' },

  // Pain / Fever
  paracetamol:       { uses: ['Fever', 'Headache', 'Mild to moderate pain', 'Cold & flu', 'Toothache', 'Body ache'], howItWorks: 'Blocks pain signals in brain and lowers body temperature via hypothalamus.', sideEffects: ['Generally well tolerated', 'Liver damage if overdosed'], takeWith: 'Can be taken with or without food. Max 4g/day for adults.' },
  ibuprofen:         { uses: ['Pain relief', 'Fever', 'Inflammation', 'Arthritis', 'Menstrual cramps'], howItWorks: 'NSAID — blocks COX-1 and COX-2 enzymes that produce pain-causing prostaglandins.', sideEffects: ['Stomach upset', 'Heartburn', 'Nausea', 'Risk of stomach bleeding'], takeWith: 'Always take after food or milk to protect the stomach.' },
  diclofenac:        { uses: ['Joint pain', 'Rheumatoid arthritis', 'Osteoarthritis', 'Post-surgery pain'], howItWorks: 'Potent NSAID — inhibits prostaglandin synthesis to reduce joint pain and swelling.', sideEffects: ['Stomach pain', 'Indigestion', 'Dizziness', 'Headache'], takeWith: 'Take with or after food with a glass of water.' },
  aceclofenac:       { uses: ['Rheumatoid arthritis', 'Osteoarthritis', 'Ankylosing spondylitis', 'Dental pain'], howItWorks: 'NSAID — inhibits COX enzyme involved in joint inflammation and pain.', sideEffects: ['Nausea', 'Stomach pain', 'Diarrhoea', 'Dizziness'], takeWith: 'Take after meals to protect the stomach.' },

  // Antibiotics
  amoxicillin:       { uses: ['Throat infections', 'Ear infections', 'Pneumonia', 'UTI', 'Skin infections'], howItWorks: 'Beta-lactam antibiotic — kills bacteria by destroying their cell wall.', sideEffects: ['Nausea', 'Diarrhoea', 'Skin rash', 'Allergic reaction'], takeWith: 'Complete the full course even if feeling better.' },
  azithromycin:      { uses: ['Respiratory infections', 'Pneumonia', 'Sinusitis', 'Skin infections', 'STIs'], howItWorks: 'Macrolide antibiotic — prevents bacteria from making essential proteins.', sideEffects: ['Nausea', 'Diarrhoea', 'Stomach pain', 'Headache'], takeWith: 'Take once daily on empty stomach or with food.' },
  ciprofloxacin:     { uses: ['UTI', 'Respiratory infections', 'Typhoid fever', 'Traveller\'s diarrhoea'], howItWorks: 'Fluoroquinolone — damages bacterial DNA gyrase preventing bacteria from replicating.', sideEffects: ['Nausea', 'Diarrhoea', 'Headache', 'Dizziness'], takeWith: 'Take with plenty of water. Avoid antacids within 2 hours.' },
  doxycycline:       { uses: ['Acne', 'Respiratory infections', 'Lyme disease', 'Chlamydia', 'Malaria prophylaxis'], howItWorks: 'Tetracycline antibiotic — inhibits bacterial protein synthesis.', sideEffects: ['Nausea', 'Vomiting', 'Sun sensitivity', 'Esophageal irritation'], takeWith: 'Take with a full glass of water. Stay upright for 30 minutes.' },

  // Diabetes & BP
  metformin:         { uses: ['Type 2 Diabetes', 'Prediabetes', 'PCOS', 'Insulin resistance'], howItWorks: 'Reduces glucose production in liver, improves insulin sensitivity, slows sugar absorption.', sideEffects: ['Nausea', 'Diarrhoea', 'Stomach upset', 'Metallic taste'], takeWith: 'Always take with or just after meals.' },
  atorvastatin:      { uses: ['High cholesterol', 'High triglycerides', 'Heart attack prevention', 'Stroke prevention'], howItWorks: 'Statin — blocks HMG-CoA reductase enzyme in liver that produces cholesterol.', sideEffects: ['Muscle pain', 'Headache', 'Nausea', 'Joint pain'], takeWith: 'Take at night. Can take with or without food.' },
  rosuvastatin:      { uses: ['High LDL cholesterol', 'Low HDL', 'High triglycerides', 'Heart disease prevention'], howItWorks: 'Most potent statin — strongly inhibits cholesterol synthesis in the liver.', sideEffects: ['Muscle pain', 'Headache', 'Constipation', 'Nausea'], takeWith: 'Can be taken at any time of day.' },
  telmisartan:       { uses: ['Hypertension', 'Heart failure', 'Stroke prevention', 'Kidney protection in diabetes'], howItWorks: 'ARB — blocks angiotensin II from narrowing blood vessels, lowering blood pressure.', sideEffects: ['Dizziness', 'Low blood pressure', 'Headache', 'Back pain'], takeWith: 'Take at the same time daily with or without food.' },
  amlodipine:        { uses: ['High blood pressure', 'Angina (chest pain)', 'Coronary artery disease'], howItWorks: 'Calcium channel blocker — relaxes blood vessels and reduces heart workload.', sideEffects: ['Ankle swelling', 'Flushing', 'Headache', 'Dizziness'], takeWith: 'Take once daily. Can be taken with or without food.' },

  // Allergy & Respiratory
  cetirizine:        { uses: ['Seasonal allergies', 'Hay fever', 'Hives', 'Skin itching', 'Runny nose', 'Watery eyes'], howItWorks: 'Antihistamine — blocks H1 receptors preventing histamine from causing allergic symptoms.', sideEffects: ['Drowsiness', 'Dry mouth', 'Headache', 'Fatigue'], takeWith: 'Take at night — may cause drowsiness.' },
  montelukast:       { uses: ['Asthma prevention', 'Seasonal allergies', 'Allergic rhinitis', 'Exercise-induced asthma'], howItWorks: 'Blocks leukotriene receptors, reducing swelling and tightening in airways.', sideEffects: ['Headache', 'Stomach pain', 'Mood changes (rare)'], takeWith: 'Take in the evening for asthma.' },

  // Blood & Thyroid
  aspirin:           { uses: ['Heart attack prevention', 'Stroke prevention', 'Pain relief', 'Fever', 'Anti-inflammatory'], howItWorks: 'Irreversibly blocks COX enzymes — reduces platelet aggregation and prostaglandins.', sideEffects: ['Stomach irritation', 'Bleeding risk', 'Heartburn', 'Nausea'], takeWith: 'Take with food or milk. Low dose for heart — do not crush.' },
  clopidogrel:       { uses: ['Heart attack prevention', 'Stroke prevention', 'After stent placement', 'Peripheral artery disease'], howItWorks: 'Antiplatelet — blocks P2Y12 receptor on platelets preventing dangerous blood clots.', sideEffects: ['Bleeding', 'Bruising', 'Stomach pain', 'Headache'], takeWith: 'Take daily at the same time. Never stop without doctor advice.' },
  levothyroxine:     { uses: ['Hypothyroidism (underactive thyroid)', 'Goitre', 'Thyroid cancer (post-surgery)'], howItWorks: 'Synthetic thyroid hormone replacing T4 the thyroid cannot produce.', sideEffects: ['Palpitations', 'Weight loss', 'Tremors', 'Insomnia (if overdosed)'], takeWith: 'Take on empty stomach 30–60 min before breakfast.' },
  hydroxychloroquine:{ uses: ['Malaria treatment & prevention', 'Rheumatoid arthritis', 'Lupus (SLE)'], howItWorks: 'Interferes with malaria parasite digestion and modulates immune response.', sideEffects: ['Nausea', 'Stomach pain', 'Headache', 'Eye changes (long-term)'], takeWith: 'Take with food or milk to reduce stomach upset.' },
};

function getPurpose(match: FDAMatch): { uses: string[]; howItWorks: string; sideEffects: string[]; takeWith: string } {
  const searchKey = [match.generic_name, match.brand_name, match.active_ingredient]
    .join(' ').toLowerCase();

  // 1. Direct dictionary match
  for (const [key, info] of Object.entries(PURPOSE_MAP)) {
    if (searchKey.includes(key)) return info;
  }

  // 2. Smart dynamic fallback so EVERY medicine displays Purpose
  const isTopical = (match.route || '').toLowerCase().includes('topical') || 
                    searchKey.includes('cream') || searchKey.includes('ointment') || searchKey.includes('gel');

  if (isTopical) {
    return {
      uses: [`Topical treatment of ${match.generic_name || match.brand_name}`, 'Skin condition / infection management', 'Local application therapy'],
      howItWorks: `Topical formulation (${match.product_type || 'Medicine'}) containing ${match.active_ingredient || match.generic_name || match.brand_name} for direct skin application.`,
      sideEffects: ['Local skin irritation', 'Mild burning, itching, or redness'],
      takeWith: 'Apply a thin layer to clean, dry affected skin area as directed by package or physician.'
    };
  }

  return {
    uses: [`Treatment of conditions indicated for ${match.generic_name || match.brand_name}`, match.product_type || 'Prescription medication', 'Targeted medical therapy'],
    howItWorks: `Pharmaceutical formulation (${match.generic_name || match.brand_name}) administered via ${match.route || 'prescribed'} route for systemic therapeutic action.`,
    sideEffects: ['Refer to official prescription insert for complete side effect profile', 'Consult your prescribing doctor or pharmacist'],
    takeWith: 'Use strictly as directed by your healthcare provider or package instructions.'
  };
}

/* ── OpenFDA result card ────────────────────── */
function FDAResultCard({ match, query }: { match: FDAMatch; query: string }) {
  const purpose = getPurpose(match);

  if (match.has_recall) {
    return (
      <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-5 mb-4 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-7 h-7 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-orange-800 text-lg">⚠️ Medicine Found — BUT RECALLED</h3>
            <p className="text-orange-700 text-sm mt-0.5">This medicine exists in the FDA database but has an active recall. Do not use.</p>
          </div>
        </div>
        {match.recall_reason && (
          <div className="bg-orange-100 rounded-xl p-3 text-sm text-orange-800">
            <strong>Recall reason:</strong> {match.recall_reason}
          </div>
        )}
        {/* Purpose even for recalled medicine */}
        {purpose && <PurposeSection purpose={purpose} />}
        <FDADetails match={match} />
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 mb-4 space-y-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-7 h-7 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-blue-800 text-lg">✅ Found in Global Medicine Database</h3>
          <p className="text-blue-600 text-sm mt-0.5">
            Recognised by the <strong>FDA global database</strong> as a legitimate pharmaceutical product.
          </p>
        </div>
      </div>
      {/* ── Purpose / Diagnosis Section ── */}
      {purpose && <PurposeSection purpose={purpose} />}
      <FDADetails match={match} />
      <div className="flex flex-wrap gap-2">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add to our database
        </Link>
        <a href="https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
          <ExternalLink className="w-3.5 h-3.5" /> View on FDA website
        </a>
      </div>
    </div>
  );
}

/* ── Reusable Purpose/Diagnosis block ── */
function PurposeSection({ purpose }: { purpose: { uses: string[]; howItWorks: string; sideEffects: string[]; takeWith: string } }) {
  return (
    <div className="space-y-3">
      {/* Why taken */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Purpose — Why This Medicine is Taken</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {purpose.uses.map((use, i) => (
            <span key={i} className="inline-block bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-1 rounded-full">{use}</span>
          ))}
        </div>
        <p className="text-xs text-emerald-700 leading-relaxed">
          <span className="font-semibold">How it works: </span>{purpose.howItWorks}
        </p>
      </div>
      {/* Side effects + How to take */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">⚠️ Common Side Effects</p>
          <ul className="space-y-0.5">
            {purpose.sideEffects.map((s, i) => (
              <li key={i} className="text-xs text-red-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0" />{s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">💊 How to Take</p>
          <p className="text-xs text-blue-700 leading-relaxed">{purpose.takeWith}</p>
        </div>
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

  // RxNorm results (NIH free API — validates generic drug names for Indian medicines)
  const [rxNormMatch, setRxNormMatch] = useState<RxNormMatch | null>(null);
  const [rxNormChecked, setRxNormChecked] = useState(false);

  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fdaLoading, setFdaLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setQuery(q); handleSearch(q); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Score how closely a medicine matches the search term (higher = better match)
  const scoreMatch = (med: Medicine, term: string): number => {
    const t = term.toLowerCase();
    const brand = (med.brand ?? '').toLowerCase();
    const name = (med.name ?? '').toLowerCase();
    const active = (med.active_ingredient ?? '').toLowerCase();
    let score = 0;
    if (brand === t || name === t) score += 100;          // exact match
    if (brand.startsWith(t) || name.startsWith(t)) score += 60; // starts with
    if (brand.includes(t) || name.includes(t)) score += 40;     // contains in name
    if (active.includes(t)) score += 20;                        // active ingredient
    // Bonus for each query word found in brand/name
    t.split(/\s+/).forEach(w => {
      if (w.length > 3 && !(/^\d+$/.test(w))) { // skip pure numbers like "20"
        if (brand.includes(w) || name.includes(w)) score += 15;
      }
    });
    return score;
  };

  const handleSearch = async (searchTerm?: string) => {
    const term = (searchTerm ?? query).trim();
    if (!term) return;

    setLoading(true);
    setSearched(false);
    setFdaMatch(null);
    setFdaChecked(false);
    setRxNormMatch(null);
    setRxNormChecked(false);

    let found: Medicine[] = [];

    // Step 1: Primary — search name & brand first (most accurate)
    const { data: nameFirst } = await supabase
      .from('medicines')
      .select('*')
      .or(`name.ilike.%${term}%,brand.ilike.%${term}%`);
    if (nameFirst && nameFirst.length > 0) found = nameFirst;

    // Step 1b: Broaden to other fields if no name/brand match
    if (found.length === 0) {
      const { data: broad } = await supabase
        .from('medicines')
        .select('*')
        .or(`batch_number.ilike.%${term}%,active_ingredient.ilike.%${term}%,description.ilike.%${term}%`);
      found = broad ?? [];
    }

    // Step 1c: Keyword fallback — only use words longer than 3 chars, skip pure numbers
    if (found.length === 0) {
      const words = term.split(/\s+/).filter(w => w.length >= 4 && !(/^\d+$/.test(w)));
      for (const word of words) {
        const { data: wordData } = await supabase
          .from('medicines')
          .select('*')
          .or(`name.ilike.%${word}%,brand.ilike.%${word}%,active_ingredient.ilike.%${word}%`);
        if (wordData && wordData.length > 0) { found = wordData; break; }
      }
    }

    // Step 1d: Prefix fuzzy fallback — first 4 chars of first meaningful word
    if (found.length === 0) {
      const firstWord = term.split(/\s+/).find(w => w.length >= 4 && !(/^\d+$/.test(w)));
      if (firstWord) {
        const prefix = firstWord.slice(0, 4);
        const { data: prefixData } = await supabase
          .from('medicines')
          .select('*')
          .or(`name.ilike.${prefix}%,brand.ilike.${prefix}%`);
        if (prefixData && prefixData.length > 0) found = prefixData;
      }
    }

    // Sort by relevance score — best match first
    const sorted = [...found].sort((a, b) => scoreMatch(b, term) - scoreMatch(a, term));

    setDbResults(sorted);
    setSearched(true);
    setLoading(false);

    // Log verification
    await supabase.from('verifications').insert({
      medicine_id: sorted[0]?.id ?? null,
      search_term: term,
      result: sorted.length > 0 ? sorted[0].status : 'not_found_local',
    });

    if (sorted.length === 0) {
      setFdaLoading(true);

      // Step 2: Check OpenFDA (US global database)
      const fdaResult = await checkOpenFDA(term);
      setFdaMatch(fdaResult);
      setFdaChecked(true);

      // Step 3: If OpenFDA also fails → try RxNorm (NIH free API)
      // First resolve Indian brand → generic name, then validate via RxNorm
      if (!fdaResult) {
        const genericName = resolveGenericName(term);
        const words = term.split(/\s+/).filter(w => w.length >= 4 && !(/^\d+$/.test(w)));
        // Search: resolved generic first, then original words
        const searchTerms = genericName
          ? [genericName, term, ...words]
          : [term, ...words];
        let rxResult: RxNormMatch | null = null;
        for (const t of searchTerms) {
          rxResult = await checkRxNorm(t);
          if (rxResult) break;
        }
        setRxNormMatch(rxResult);
        setRxNormChecked(true);
      }

      setFdaLoading(false);
    }
  };

  const handleQRScan = (text: string) => {
    setQuery(text);
    setTab('search');
    handleSearch(text);
    router.push(`/verify?q=${encodeURIComponent(text)}`);
  };

  // Detect if query looks like a batch number (mostly digits or alphanumeric code)
  const looksLikeBatchNumber = (q: string) => /^[A-Z0-9\-\/]{4,}$/i.test(q.trim()) && /\d{4,}/.test(q);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800">Verify Medicine Authenticity</h1>
        <p className="text-gray-500 mt-1">Search by medicine name or brand name to verify authenticity.</p>

        {/* How it works badge */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-medium">
            <Info className="w-3 h-3" /> Checks our local database first, then OpenFDA global database automatically
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium">
            <Globe className="w-3 h-3" /> Powered by OpenFDA + NIH RxNorm
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
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Dolo 650, Paracetamol, Augmentin, Pan 40…"
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

          {/* ── Batch Number Info Box — shown when query looks like a batch number ── */}
          {query && looksLikeBatchNumber(query) && !searched && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Batch numbers cannot be verified online</p>
                <p className="text-xs text-amber-700 leading-relaxed mb-2">
                  Indian medicine batch numbers (like <strong>{query}</strong>) are not indexed in any public database — not in OpenFDA, not in RxNorm, and not in CDSCO online. This does NOT mean the medicine is fake.
                </p>
                <p className="text-xs font-semibold text-amber-800 mb-1">✅ To verify this batch number:</p>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• Search by <strong>medicine name</strong> instead (e.g. "Peptard 20", "Rabeprazole")</li>
                  <li>• Contact the manufacturer directly with the batch number</li>
                  <li>• Visit <a href="https://cdsco.gov.in" target="_blank" rel="noopener noreferrer" className="underline font-medium">cdsco.gov.in</a> — India&apos;s drug regulator</li>
                  <li>• Call your state Drug Control department</li>
                </ul>
              </div>
            </div>
          )}

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

                  {/* Best Match — first result */}
                  <div className="mt-4 mb-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wide">
                      ✅ Best Match — This is the medicine you searched for
                    </span>
                  </div>
                  <MedicineCard medicine={dbResults[0]} expanded={true} />

                  {/* Other possible matches */}
                  {dbResults.length > 1 && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full uppercase tracking-wide">
                          ⚠️ Other Possible Matches — May not be what you searched
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {dbResults.slice(1).map(med => <MedicineCard key={med.id} medicine={med} expanded={false} />)}
                      </div>
                    </div>
                  )}
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
                  ) : rxNormChecked && rxNormMatch ? (
                    /* Found in RxNorm (NIH) — active ingredient is real, just Indian brand */
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="inline-flex items-center gap-1.5 text-xs bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1 rounded-full font-semibold">
                          <Globe className="w-3.5 h-3.5" /> Active Ingredient Verified via NIH RxNorm
                        </span>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
                          <CheckCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                            ✅ This appears to be a real medicine
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            The active ingredient <strong className="text-orange-700">&quot;{rxNormMatch.name}&quot;</strong> is a registered drug in the NIH global database. 
                            This is likely an <strong>Indian brand name</strong> not yet in our local database.
                          </p>
                          <div className="bg-white rounded-xl border border-orange-100 p-4 mb-4 space-y-2 text-sm">
                            <div className="flex gap-2"><span className="text-gray-500 w-32 shrink-0">Drug Name:</span><span className="font-semibold text-gray-800">{rxNormMatch.name}</span></div>
                            {rxNormMatch.synonym && <div className="flex gap-2"><span className="text-gray-500 w-32 shrink-0">Ingredient:</span><span className="font-medium text-gray-700">{rxNormMatch.synonym}</span></div>}
                            <div className="flex gap-2"><span className="text-gray-500 w-32 shrink-0">RxNorm ID:</span><span className="font-mono text-xs text-gray-500">{rxNormMatch.rxcui}</span></div>
                            <div className="flex gap-2"><span className="text-gray-500 w-32 shrink-0">Source:</span><span className="text-gray-600">NIH National Library of Medicine</span></div>
                          </div>
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 mb-4">
                            <strong>ℹ️ Note:</strong> This is an Indian brand medicine. The active ingredient is globally registered, but the brand &quot;{query}&quot; is not in OpenFDA (US database). 
                            To confirm it&apos;s in our system, ask your admin to add it via the Admin Panel.
                          </div>
                          <Link href={`/report?medicine=${encodeURIComponent(query)}`}
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-4 py-2 rounded-full transition-colors">
                            <AlertTriangle className="w-3.5 h-3.5" /> Still suspicious? Report it
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* NOT found in ANY database */
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                      <ShieldAlert className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                      <h3 className="font-bold text-gray-800 mb-2 text-lg">⚠️ Not Found Anywhere</h3>
                      <p className="text-gray-600 text-sm mb-1">
                        &quot;<strong>{query}</strong>&quot; was not found in:
                      </p>
                      <ul className="text-sm text-gray-500 mb-4 space-y-1">
                        <li>❌ Our local medicine database</li>
                        <li>❌ OpenFDA global medicine database</li>
                        <li>❌ NIH RxNorm drug registry</li>
                      </ul>
                      <p className="text-red-600 text-sm font-semibold mb-4">
                        This medicine may be unregistered, counterfeit, or simply not yet recorded anywhere.
                        Do NOT consume if in doubt.
                      </p>
                      <Link href={`/report?medicine=${encodeURIComponent(query)}`} className="btn-danger inline-flex">
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
