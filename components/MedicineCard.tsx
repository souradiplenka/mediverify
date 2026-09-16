'use client';
import Link from 'next/link';
import { Calendar, Building2, Hash, Pill, ArrowRight, Stethoscope, FlaskConical, Info, AlertCircle, Activity, BookOpen } from 'lucide-react';
import { Medicine } from '@/types';
import StatusBadge from './StatusBadge';

interface MedicineCardProps {
  medicine: Medicine;
  expanded?: boolean;
}

const borderColor: Record<string, string> = {
  verified:   'border-l-emerald-500',
  suspicious: 'border-l-red-500',
  recalled:   'border-l-orange-500',
  unknown:    'border-l-gray-300',
};

/* ── Detailed drug info by active ingredient ── */
interface DrugInfo {
  uses: string[];          // conditions it treats
  howItWorks: string;      // simple mechanism
  sideEffects: string[];   // common side effects
  takeWith: string;        // food/water instructions
}

const DRUG_INFO: Record<string, DrugInfo> = {
  'rabeprazole': {
    uses: ['Acid reflux (GERD)', 'Stomach ulcers', 'Heartburn & acidity', 'H. pylori infection', 'Zollinger-Ellison syndrome'],
    howItWorks: 'Blocks the proton pump in stomach lining, reducing acid production and giving relief from acidity.',
    sideEffects: ['Headache', 'Diarrhoea', 'Nausea', 'Stomach pain', 'Flatulence'],
    takeWith: 'Take 30 minutes before meals. Swallow whole — do not crush.',
  },
  'pantoprazole': {
    uses: ['Acid reflux (GERD)', 'Gastric ulcers', 'Heartburn', 'Esophagitis', 'H. pylori infection'],
    howItWorks: 'Proton pump inhibitor — reduces stomach acid by blocking the acid-secreting enzyme.',
    sideEffects: ['Headache', 'Diarrhoea', 'Nausea', 'Abdominal pain', 'Dizziness'],
    takeWith: 'Take before breakfast. Can be taken with or without food.',
  },
  'omeprazole': {
    uses: ['Acid reflux', 'Peptic ulcers', 'GERD', 'Heartburn', 'Stomach protection with NSAIDs'],
    howItWorks: 'Reduces stomach acid by irreversibly blocking the H⁺/K⁺ ATPase enzyme in gastric cells.',
    sideEffects: ['Headache', 'Nausea', 'Diarrhoea', 'Constipation', 'Flatulence'],
    takeWith: 'Take 30-60 minutes before a meal for best effect.',
  },
  'paracetamol': {
    uses: ['Fever', 'Mild to moderate pain', 'Headache', 'Toothache', 'Body ache', 'Cold & flu symptoms'],
    howItWorks: 'Blocks pain signals in the brain and lowers body temperature by acting on the hypothalamus.',
    sideEffects: ['Generally well tolerated', 'Liver damage if overdosed', 'Rare skin reactions'],
    takeWith: 'Can be taken with or without food. Max 4g/day for adults.',
  },
  'ibuprofen': {
    uses: ['Pain relief', 'Fever', 'Inflammation', 'Arthritis', 'Menstrual cramps', 'Muscle pain'],
    howItWorks: 'NSAID — blocks COX-1 and COX-2 enzymes that produce prostaglandins causing pain & inflammation.',
    sideEffects: ['Stomach upset', 'Nausea', 'Heartburn', 'Risk of stomach bleeding', 'Dizziness'],
    takeWith: 'Always take after food or milk to protect the stomach.',
  },
  'amoxicillin': {
    uses: ['Throat infections', 'Ear infections', 'Pneumonia', 'Urinary tract infections (UTI)', 'Skin infections', 'H. pylori eradication'],
    howItWorks: 'Beta-lactam antibiotic — kills bacteria by destroying their cell wall, preventing them from surviving.',
    sideEffects: ['Nausea', 'Diarrhoea', 'Skin rash', 'Allergic reaction (rare)', 'Vomiting'],
    takeWith: 'Complete the full course even if you feel better. Can be taken with food.',
  },
  'azithromycin': {
    uses: ['Respiratory infections', 'Pneumonia', 'Sinusitis', 'Skin infections', 'STIs', 'Typhoid (in some cases)'],
    howItWorks: 'Macrolide antibiotic — stops bacteria from making proteins needed to survive and multiply.',
    sideEffects: ['Nausea', 'Diarrhoea', 'Stomach pain', 'Headache', 'Dizziness'],
    takeWith: 'Take once daily on an empty stomach or with food. Do not skip doses.',
  },
  'ciprofloxacin': {
    uses: ['Urinary tract infections (UTI)', 'Respiratory infections', 'Skin infections', 'Typhoid fever', 'Traveller\'s diarrhoea'],
    howItWorks: 'Fluoroquinolone — damages bacterial DNA gyrase enzyme, preventing bacteria from replicating.',
    sideEffects: ['Nausea', 'Diarrhoea', 'Headache', 'Dizziness', 'Tendon problems (rare)'],
    takeWith: 'Take with plenty of water. Avoid antacids within 2 hours.',
  },
  'metformin': {
    uses: ['Type 2 Diabetes', 'Prediabetes', 'PCOS (Polycystic Ovary Syndrome)', 'Insulin resistance'],
    howItWorks: 'Reduces glucose production in liver, improves insulin sensitivity, and slows sugar absorption from gut.',
    sideEffects: ['Nausea', 'Diarrhoea', 'Stomach upset', 'Metallic taste', 'Vitamin B12 deficiency (long term)'],
    takeWith: 'Always take with or just after meals to reduce stomach side effects.',
  },
  'atorvastatin': {
    uses: ['High cholesterol', 'High triglycerides', 'Heart attack prevention', 'Stroke prevention', 'Coronary artery disease'],
    howItWorks: 'Statin — blocks HMG-CoA reductase enzyme in liver that produces cholesterol, lowering LDL levels.',
    sideEffects: ['Muscle pain', 'Headache', 'Nausea', 'Joint pain', 'Liver enzyme elevation (rare)'],
    takeWith: 'Take at night (liver makes more cholesterol at night). Can take with or without food.',
  },
  'rosuvastatin': {
    uses: ['High LDL cholesterol', 'Low HDL cholesterol', 'High triglycerides', 'Cardiovascular disease prevention'],
    howItWorks: 'Most potent statin — strongly inhibits cholesterol synthesis in the liver.',
    sideEffects: ['Muscle pain', 'Headache', 'Constipation', 'Nausea', 'Weakness'],
    takeWith: 'Can be taken at any time of day with or without food.',
  },
  'telmisartan': {
    uses: ['High blood pressure (Hypertension)', 'Heart failure', 'Stroke prevention', 'Kidney protection in diabetes'],
    howItWorks: 'ARB (Angiotensin Receptor Blocker) — blocks angiotensin II from narrowing blood vessels, lowering BP.',
    sideEffects: ['Dizziness', 'Low blood pressure', 'Headache', 'Back pain', 'Diarrhoea'],
    takeWith: 'Take at the same time daily. Can be taken with or without food.',
  },
  'cetirizine': {
    uses: ['Seasonal allergies', 'Hay fever', 'Hives (urticaria)', 'Skin itching', 'Runny nose', 'Watery eyes'],
    howItWorks: 'Antihistamine — blocks H1 receptors preventing histamine from causing allergic symptoms.',
    sideEffects: ['Drowsiness', 'Dry mouth', 'Headache', 'Fatigue', 'Dizziness'],
    takeWith: 'Take at night as it may cause drowsiness. With or without food.',
  },
  'montelukast': {
    uses: ['Asthma prevention', 'Seasonal allergies', 'Allergic rhinitis', 'Exercise-induced asthma', 'Hives'],
    howItWorks: 'Leukotriene receptor antagonist — blocks chemicals that cause swelling and tightening in airways.',
    sideEffects: ['Headache', 'Stomach pain', 'Diarrhoea', 'Mood changes (rare)', 'Fatigue'],
    takeWith: 'Take in the evening. For asthma, take regardless of symptoms.',
  },
  'aspirin': {
    uses: ['Heart attack prevention', 'Stroke prevention', 'Blood clot prevention', 'Fever', 'Pain relief'],
    howItWorks: 'Irreversibly blocks COX enzymes — reduces platelet aggregation (clotting) and prostaglandins.',
    sideEffects: ['Stomach irritation', 'Bleeding risk', 'Heartburn', 'Nausea', 'Ringing in ears (high dose)'],
    takeWith: 'Take with food or milk. Low dose (75mg) for heart — do not crush.',
  },
  'clopidogrel': {
    uses: ['Heart attack prevention', 'Stroke prevention', 'Coronary artery stents', 'Peripheral artery disease'],
    howItWorks: 'Antiplatelet — irreversibly blocks P2Y12 receptor on platelets, preventing dangerous blood clots.',
    sideEffects: ['Bleeding', 'Bruising easily', 'Stomach pain', 'Headache', 'Dizziness'],
    takeWith: 'Take with or without food at the same time daily. Never stop without doctor advice.',
  },
  'levothyroxine': {
    uses: ['Hypothyroidism (underactive thyroid)', 'Goitre', 'Thyroid cancer (post-surgery)', 'Myxoedema'],
    howItWorks: 'Synthetic thyroid hormone that replaces or supplements the T4 hormone the thyroid cannot produce.',
    sideEffects: ['Heart palpitations', 'Weight loss', 'Tremors', 'Sweating', 'Insomnia (if overdosed)'],
    takeWith: 'Take on empty stomach, 30-60 min before breakfast. Avoid calcium/antacids.',
  },
  'hydroxychloroquine': {
    uses: ['Malaria treatment & prevention', 'Rheumatoid arthritis', 'Lupus (SLE)', 'Discoid lupus'],
    howItWorks: 'Interferes with parasite digestion of blood proteins (malaria) and modulates immune response (autoimmune).',
    sideEffects: ['Nausea', 'Stomach pain', 'Headache', 'Eye changes (long-term use)', 'Skin rash'],
    takeWith: 'Take with food or milk to reduce stomach upset.',
  },
};

/* Fallback by category */
const CATEGORY_USE: Record<string, { uses: string[]; howItWorks: string }> = {
  'Analgesic':    { uses: ['Pain relief', 'Fever', 'Headache', 'Body ache'], howItWorks: 'Blocks pain signals and reduces fever.' },
  'Antibiotic':   { uses: ['Bacterial infections', 'Throat infection', 'UTI', 'Pneumonia'], howItWorks: 'Kills or stops the growth of bacteria causing infection.' },
  'Antidiabetic': { uses: ['Type 2 Diabetes', 'Blood sugar control', 'PCOS'], howItWorks: 'Lowers blood sugar levels by various mechanisms.' },
  'Antacid':      { uses: ['Acid reflux', 'GERD', 'Stomach ulcers', 'Heartburn', 'Acidity'], howItWorks: 'Reduces stomach acid production to relieve discomfort.' },
  'Statin':       { uses: ['High cholesterol', 'Heart disease prevention'], howItWorks: 'Reduces cholesterol production in the liver.' },
  'Antihistamine':{ uses: ['Allergies', 'Hay fever', 'Skin rash', 'Itching'], howItWorks: 'Blocks histamine receptors to prevent allergic reactions.' },
  'NSAID':        { uses: ['Pain', 'Inflammation', 'Arthritis', 'Muscle pain'], howItWorks: 'Blocks inflammatory enzymes to reduce pain and swelling.' },
  'Antiplatelet': { uses: ['Blood clot prevention', 'Heart attack', 'Stroke prevention'], howItWorks: 'Prevents blood platelets from clumping and forming dangerous clots.' },
  'ACE Inhibitor':{ uses: ['High blood pressure', 'Heart failure', 'Kidney protection'], howItWorks: 'Relaxes blood vessels to lower blood pressure.' },
  'Antimalarial': { uses: ['Malaria prevention', 'Malaria treatment', 'Autoimmune conditions'], howItWorks: 'Kills malaria parasites and modulates immune response.' },
  'Supplement':   { uses: ['Nutritional deficiency', 'General health', 'Immunity boost'], howItWorks: 'Provides essential nutrients the body needs.' },
  'Vitamin':      { uses: ['Vitamin deficiency', 'Immune support', 'Bone health'], howItWorks: 'Supplements vitamins that the body cannot produce enough of.' },
};

function getDrugInfo(medicine: Medicine): { uses: string[]; howItWorks: string; sideEffects?: string[]; takeWith?: string } {
  // Try to match by active ingredient
  const active = (medicine.active_ingredient ?? '').toLowerCase();
  for (const [key, info] of Object.entries(DRUG_INFO)) {
    if (active.includes(key)) return info;
  }
  // Try brand name
  const brand = (medicine.brand ?? '').toLowerCase();
  for (const [key, info] of Object.entries(DRUG_INFO)) {
    if (brand.includes(key)) return info;
  }
  // Fallback to category
  return CATEGORY_USE[medicine.category] ?? { uses: [medicine.description ?? 'See packaging for details'], howItWorks: '' };
}

export default function MedicineCard({ medicine, expanded = false }: MedicineCardProps) {
  const expiry = medicine.expiry_date
    ? new Date(medicine.expiry_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'N/A';
  const isExpired = medicine.expiry_date ? new Date(medicine.expiry_date) < new Date() : false;
  const drugInfo = getDrugInfo(medicine);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${
      borderColor[medicine.status] ?? 'border-l-gray-300'
    } p-5 hover:shadow-md transition-all flex flex-col gap-4`}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-gray-900 text-lg leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            {medicine.brand || medicine.name}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {medicine.brand !== medicine.name ? medicine.name : ''}
            {medicine.active_ingredient && (
              <span className="text-gray-400"> · {medicine.active_ingredient}</span>
            )}
          </p>
        </div>
        <StatusBadge status={medicine.status} size="sm" />
      </div>

      {/* ── WHY THIS MEDICINE IS TAKEN ── */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Why This Medicine is Taken</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {drugInfo.uses.map((use, i) => (
            <span key={i} className="inline-block bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-1 rounded-full">
              {use}
            </span>
          ))}
        </div>
        {drugInfo.howItWorks && (
          <p className="text-xs text-emerald-700 mt-2 leading-relaxed">
            <span className="font-semibold">How it works: </span>{drugInfo.howItWorks}
          </p>
        )}
      </div>

      {/* ── Side Effects + Take With (expanded only) ── */}
      {expanded && 'sideEffects' in drugInfo && drugInfo.sideEffects && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Side effects */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Common Side Effects</span>
            </div>
            <ul className="space-y-0.5">
              {drugInfo.sideEffects.map((s, i) => (
                <li key={i} className="text-xs text-red-700 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-400 rounded-full shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          {/* How to take */}
          {'takeWith' in drugInfo && drugInfo.takeWith && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">How to Take</span>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">{drugInfo.takeWith}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Medicine Details ── */}
      <div className="space-y-1.5 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{medicine.manufacturer}</span>
        </div>
        <div className="flex items-center gap-2">
          <Hash className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="font-mono text-xs text-gray-500">Batch: {medicine.batch_number}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className={isExpired ? 'text-red-600 font-semibold' : ''}>
            Expires: {expiry} {isExpired && '⚠️ Expired'}
          </span>
        </div>
      </div>

      {/* ── Chips ── */}
      <div className="flex flex-wrap gap-1.5">
        {medicine.category && (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
            <Pill className="w-3 h-3" />{medicine.category}
          </span>
        )}
        {medicine.dosage && (
          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {medicine.dosage}
          </span>
        )}
        {medicine.active_ingredient && (
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
            <FlaskConical className="w-3 h-3" />
            {medicine.active_ingredient.split(' ').slice(0, 3).join(' ')}
          </span>
        )}
      </div>

      {/* ── Description (expanded) ── */}
      {expanded && medicine.description && (
        <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-600 flex gap-2">
          <BookOpen className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <p>{medicine.description}</p>
        </div>
      )}

      {/* ── View Details ── */}
      <Link href={`/medicines/${medicine.id}`}
        className="mt-auto flex items-center justify-between text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors group">
        View Full Details
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
