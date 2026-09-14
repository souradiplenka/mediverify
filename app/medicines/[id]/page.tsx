'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, Hash, Calendar, Pill, FlaskConical,
  Globe, FileText, Activity, AlertTriangle, CheckCircle, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';
import { Medicine } from '@/types';

export default function MedicineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyCount, setVerifyCount] = useState(0);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('medicines').select('*').eq('id', id).single();
      if (!data) { router.push('/medicines'); return; }
      setMedicine(data);

      // Fetch verification count
      const { count } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .eq('medicine_id', id);
      setVerifyCount(count ?? 0);

      // Log this view as a verification
      await supabase.from('verifications').insert({
        medicine_id: id,
        search_term: data.name,
        result: data.status,
      });

      setLoading(false);
    }
    load();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!medicine) return null;

  const isExpired = medicine.expiry_date ? new Date(medicine.expiry_date) < new Date() : false;

  const details = [
    { icon: <Building2 className="w-4 h-4" />, label: 'Manufacturer', value: medicine.manufacturer },
    { icon: <Hash className="w-4 h-4" />, label: 'Batch Number', value: medicine.batch_number },
    { icon: <Calendar className="w-4 h-4" />, label: 'Manufacturing Date', value: medicine.manufacturing_date ? new Date(medicine.manufacturing_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A' },
    { icon: <Calendar className="w-4 h-4" />, label: 'Expiry Date', value: medicine.expiry_date ? new Date(medicine.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A', warn: isExpired },
    { icon: <FlaskConical className="w-4 h-4" />, label: 'Active Ingredient', value: medicine.active_ingredient },
    { icon: <Pill className="w-4 h-4" />, label: 'Category', value: medicine.category },
    { icon: <Pill className="w-4 h-4" />, label: 'Dosage', value: medicine.dosage },
    { icon: <FileText className="w-4 h-4" />, label: 'License Number', value: medicine.license_number },
    { icon: <Globe className="w-4 h-4" />, label: 'Country', value: medicine.country },
  ];

  const safetyColors: Record<string, string> = {
    verified: 'bg-green-50 border-green-200',
    suspicious: 'bg-red-50 border-red-200',
    recalled: 'bg-orange-50 border-orange-200',
    unknown: 'bg-gray-50 border-gray-200',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <Link href="/medicines" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Medicines
      </Link>

      {/* Title */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">{medicine.name}</h1>
          <p className="text-gray-500 text-lg mt-1">{medicine.brand}</p>
        </div>
        <StatusBadge status={medicine.status} size="lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Medicine Details
            </h2>
            <dl className="divide-y divide-gray-50">
              {details.map((d) => (
                <div key={d.label} className="py-3 flex items-center gap-3">
                  <span className="text-gray-400">{d.icon}</span>
                  <dt className="text-sm text-gray-500 w-40 shrink-0">{d.label}</dt>
                  <dd className={`text-sm font-medium text-gray-800 ${d.warn ? 'text-red-600' : ''}`}>
                    {d.value || '—'} {d.warn && '⚠️ Expired'}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Description */}
          {medicine.description && (
            <div className="card">
              <h2 className="font-bold text-gray-800 mb-3">About This Medicine</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{medicine.description}</p>
            </div>
          )}

          {/* Verification count */}
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <Activity className="w-5 h-5 text-blue-500" />
            <p className="text-sm text-blue-700">
              This medicine has been verified <strong>{verifyCount + 1}</strong> time{verifyCount !== 0 ? 's' : ''} on MediVerify.
            </p>
          </div>
        </div>

        {/* Right: Safety card */}
        <div className="space-y-4">
          <div className={`rounded-xl border-2 p-5 ${safetyColors[medicine.status] ?? 'bg-gray-50 border-gray-200'}`}>
            <h2 className="font-bold text-gray-800 mb-3">Safety Status</h2>
            <div className="mb-4">
              <StatusBadge status={medicine.status} size="lg" />
            </div>
            {medicine.status === 'verified' && (
              <div className="flex items-start gap-2 text-green-700 text-sm">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>This medicine is registered and verified by our database. It is safe for use as prescribed.</p>
              </div>
            )}
            {(medicine.status === 'suspicious' || medicine.status === 'recalled') && (
              <div className="flex items-start gap-2 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{medicine.description}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card space-y-3">
            <h2 className="font-bold text-gray-800">Actions</h2>
            <Link
              href={`/verify?q=${encodeURIComponent(medicine.batch_number)}`}
              className="btn-primary w-full justify-center"
            >
              <CheckCircle className="w-4 h-4" /> Re-verify This Medicine
            </Link>
            {medicine.status !== 'verified' && (
              <Link
                href={`/report?medicine=${encodeURIComponent(medicine.name)}&batch=${encodeURIComponent(medicine.batch_number)}`}
                className="btn-danger w-full justify-center"
              >
                <AlertTriangle className="w-4 h-4" /> Report This Medicine
              </Link>
            )}
            <Link href="/medicines" className="btn-secondary w-full justify-center">
              <ArrowLeft className="w-4 h-4" /> Browse All Medicines
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
