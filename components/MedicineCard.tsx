import Link from 'next/link';
import { Calendar, Building2, Hash, Pill, ArrowRight } from 'lucide-react';
import { Medicine } from '@/types';
import StatusBadge from './StatusBadge';

interface MedicineCardProps {
  medicine: Medicine;
}

const borderColor: Record<string, string> = {
  verified: 'border-l-green-500',
  suspicious: 'border-l-red-500',
  recalled: 'border-l-orange-500',
  unknown: 'border-l-gray-300',
};

export default function MedicineCard({ medicine }: MedicineCardProps) {
  const expiry = medicine.expiry_date
    ? new Date(medicine.expiry_date).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const isExpired = medicine.expiry_date
    ? new Date(medicine.expiry_date) < new Date()
    : false;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${
        borderColor[medicine.status] ?? 'border-l-gray-300'
      } p-5 hover:shadow-md transition-shadow flex flex-col gap-3`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-gray-800 text-base leading-tight">{medicine.name}</h3>
          <p className="text-sm text-gray-500">{medicine.brand}</p>
        </div>
        <StatusBadge status={medicine.status} size="sm" />
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{medicine.manufacturer}</span>
        </div>
        <div className="flex items-center gap-2">
          <Hash className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="font-mono text-xs">{medicine.batch_number}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className={isExpired ? 'text-red-600 font-medium' : ''}>
            Exp: {expiry} {isExpired && '(Expired)'}
          </span>
        </div>
      </div>

      {/* Chips */}
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
      </div>

      {/* Action */}
      <Link
        href={`/medicines/${medicine.id}`}
        className="mt-auto flex items-center justify-between text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors group"
      >
        View Details
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
