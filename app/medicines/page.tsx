'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, Database, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MedicineCard from '@/components/MedicineCard';
import { Medicine } from '@/types';

const CATEGORIES = ['All', 'Analgesic', 'Antibiotic', 'Antidiabetic', 'Antacid', 'Statin', 'Antihistamine', 'NSAID', 'Antiplatelet', 'Leukotriene inhibitor', 'Supplement', 'Vitamin', 'Antimalarial', 'ACE Inhibitor'];
const STATUSES = ['All', 'verified', 'suspicious', 'recalled', 'unknown'];

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');

  useEffect(() => {
    fetchMedicines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status]);

  const fetchMedicines = async () => {
    setLoading(true);
    let query = supabase.from('medicines').select('*').order('created_at', { ascending: false });
    if (category !== 'All') query = query.eq('category', category);
    if (status !== 'All') query = query.eq('status', status);
    const { data } = await query;
    setMedicines(data ?? []);
    setLoading(false);
  };

  const filtered = medicines.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.brand.toLowerCase().includes(q) ||
      m.manufacturer.toLowerCase().includes(q) ||
      m.batch_number.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-7 h-7 text-blue-600" />
          <h1 className="text-3xl font-extrabold text-gray-800">Medicine Database</h1>
        </div>
        <p className="text-gray-500">Browse our registry of verified and flagged medicines.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, brand, batch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 py-2 text-sm"
          />
        </div>
        {/* Category */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-field py-2 text-sm w-auto min-w-[160px]"
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        {/* Status */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input-field py-2 text-sm w-auto min-w-[130px]"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-sm text-gray-500 mb-4">
          Showing <strong>{filtered.length}</strong> medicine{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((med) => <MedicineCard key={med.id} medicine={med} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <Database className="w-16 h-16 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No medicines match your filters.</p>
          <p className="text-sm">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
