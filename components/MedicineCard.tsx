import Link from 'next/link';
import { Calendar, Building2, Hash, Pill, ArrowRight, Stethoscope, FlaskConical, Info } from 'lucide-react';
import { Medicine } from '@/types';
import StatusBadge from './StatusBadge';

interface MedicineCardProps {
  medicine: Medicine;
  /** Show expanded "Used For" section — useful on verify results page */
  expanded?: boolean;
}

const borderColor: Record<string, string> = {
  verified:   'border-l-emerald-500',
  suspicious: 'border-l-red-500',
  recalled:   'border-l-orange-500',
  unknown:    'border-l-gray-300',
};

/* Map categories to what they treat */
const CATEGORY_USE: Record<string, string> = {
  'Analgesic':              'Pain relief, Fever, Headache, Body ache',
  'Antibiotic':             'Bacterial infections, Throat infection, UTI, Pneumonia',
  'Antidiabetic':           'Type 2 Diabetes, Blood sugar control',
  'Antacid':                'Acid reflux, GERD, Stomach ulcers, Heartburn, Acidity',
  'Statin':                 'High cholesterol, Heart disease prevention',
  'Antihistamine':          'Allergies, Hay fever, Skin rash, Itching, Sneezing',
  'NSAID':                  'Pain, Inflammation, Arthritis, Muscle pain',
  'Antiplatelet':           'Blood clot prevention, Heart attack, Stroke prevention',
  'ACE Inhibitor':          'High blood pressure, Heart failure, Kidney protection',
  'Antimalarial':           'Malaria prevention and treatment, Lupus, Rheumatoid arthritis',
  'Supplement':             'Nutritional deficiency, General health, Immunity',
  'Vitamin':                'Vitamin deficiency, Immune support, Bone health',
  'Leukotriene inhibitor':  'Asthma, Allergic rhinitis, Breathing difficulty',
  'Other':                  'See description for usage details',
};

export default function MedicineCard({ medicine, expanded = false }: MedicineCardProps) {
  const expiry = medicine.expiry_date
    ? new Date(medicine.expiry_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'N/A';

  const isExpired = medicine.expiry_date
    ? new Date(medicine.expiry_date) < new Date()
    : false;

  const usedFor = CATEGORY_USE[medicine.category] ?? medicine.description ?? '—';

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${
      borderColor[medicine.status] ?? 'border-l-gray-300'
    } p-5 hover:shadow-md transition-all flex flex-col gap-3`}>

      {/* ── Header: Name + Status ── */}
      <div className="flex items-start justify-between gap-2">
        <div>
          {/* Exact Medicine Name — prominent */}
          <h3 className="font-bold text-gray-900 text-lg leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            {medicine.brand || medicine.name}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {medicine.brand !== medicine.name ? medicine.name : ''}{' '}
            {medicine.active_ingredient && (
              <span className="text-gray-400">· {medicine.active_ingredient}</span>
            )}
          </p>
        </div>
        <StatusBadge status={medicine.status} size="sm" />
      </div>

      {/* ── Used For (Diagnosis) ── */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Used For</span>
        </div>
        <p className="text-sm text-emerald-800 font-medium leading-snug">{usedFor}</p>
      </div>

      {/* ── Details ── */}
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

      {/* ── Category + Dosage chips ── */}
      <div className="flex flex-wrap gap-1.5">
        {medicine.category && (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
            <Pill className="w-3 h-3" />
            {medicine.category}
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

      {/* ── Description (expanded mode) ── */}
      {expanded && medicine.description && (
        <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-600 flex gap-2">
          <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <p>{medicine.description}</p>
        </div>
      )}

      {/* ── View Details link ── */}
      <Link
        href={`/medicines/${medicine.id}`}
        className="mt-auto flex items-center justify-between text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors group"
      >
        View Full Details
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
