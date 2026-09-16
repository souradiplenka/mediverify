'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Trash2, Plus, RefreshCw,
  Stethoscope, Activity, Calendar, Pill, Info, ArrowRight, HeartPulse,
  Sparkles, CheckCircle2, AlertOctagon, HelpCircle
} from 'lucide-react';
import {
  CabinetMedicine, SAMPLE_CABINET, analyzeCabinetRisk, RiskAnalysisResult
} from '@/lib/healthRiskEngine';

export default function HealthRiskDashboard() {
  const [cabinet, setCabinet] = useState<CabinetMedicine[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state to add new medicine manually
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newName, setNewName] = useState('');
  const [newIngredient, setNewIngredient] = useState('');
  const [newCategory, setNewCategory] = useState('Analgesic');
  const [newDosage, setNewDosage] = useState('');
  const [newExpiry, setNewExpiry] = useState('');

  // Load cabinet from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mediverify_cabinet');
      if (saved) {
        setCabinet(JSON.parse(saved));
      } else {
        // Default to sample cabinet if empty
        setCabinet(SAMPLE_CABINET);
        localStorage.setItem('mediverify_cabinet', JSON.stringify(SAMPLE_CABINET));
      }
    } catch {
      setCabinet(SAMPLE_CABINET);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save to localStorage on change
  const updateCabinet = (newCabinet: CabinetMedicine[]) => {
    setCabinet(newCabinet);
    try {
      localStorage.setItem('mediverify_cabinet', JSON.stringify(newCabinet));
    } catch { /* storage full */ }
  };

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.trim() && !newName.trim()) return;

    const med: CabinetMedicine = {
      id: `custom-${Date.now()}`,
      brand: newBrand.trim() || newName.trim(),
      name: newName.trim() || newBrand.trim(),
      active_ingredient: newIngredient.trim() || newBrand.trim(),
      category: newCategory,
      dosage: newDosage.trim() || undefined,
      expiry_date: newExpiry || undefined,
      status: 'verified',
      addedAt: new Date().toISOString(),
    };

    updateCabinet([med, ...cabinet]);
    setNewBrand('');
    setNewName('');
    setNewIngredient('');
    setNewDosage('');
    setNewExpiry('');
    setShowAddModal(false);
  };

  const handleRemoveMedicine = (id: string) => {
    updateCabinet(cabinet.filter(m => m.id !== id));
  };

  const handleResetDemoCabinet = () => {
    updateCabinet(SAMPLE_CABINET);
  };

  const handleClearCabinet = () => {
    updateCabinet([]);
  };

  const riskResult: RiskAnalysisResult = analyzeCabinetRisk(cabinet);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-emerald-800">
          <HeartPulse className="w-6 h-6 animate-pulse" />
          <span className="font-semibold text-sm">Analyzing health risk parameters…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      
      {/* ── Top Hero Header ── */}
      <section className="bg-emerald-950 text-white pt-10 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-900/80 border border-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 mb-3">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-400" /> Personal Safety Intelligence
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                Personal Health Risk Dashboard
              </h1>
              <p className="text-emerald-200/80 text-sm mt-2 max-w-xl leading-relaxed">
                Monitor your active medicine cabinet for dangerous drug-drug interactions, expired drugs, and counterfeit exposure in real-time.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm px-4 py-2.5 rounded-full transition-all shadow-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Medicine
              </button>
              <button
                onClick={handleResetDemoCabinet}
                className="bg-white/10 hover:bg-white/20 text-emerald-100 text-sm font-medium px-4 py-2.5 rounded-full transition-all flex items-center gap-2 border border-white/10"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sample Cabinet
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ── Main Dashboard Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        
        {/* ── Health Risk Scorecard Gauge ── */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Score Ring / Number */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-emerald-50/30 border border-slate-100">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      riskResult.level === 'critical' ? 'text-red-500' :
                      riskResult.level === 'high' ? 'text-amber-500' :
                      riskResult.level === 'moderate' ? 'text-yellow-500' : 'text-emerald-500'
                    }
                    strokeDasharray={`${riskResult.score}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-extrabold text-gray-900 leading-none">{riskResult.score}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">Risk Score</span>
                </div>
              </div>

              <div className={`mt-4 px-3 py-1 rounded-full text-xs font-bold border ${riskResult.color}`}>
                {riskResult.badgeText}
              </div>
            </div>

            {/* Risk Breakdown Details */}
            <div className="md:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Cabinet Health Breakdown
                </h3>
                <span className="text-xs text-gray-400 font-medium">
                  {cabinet.length} Medicine{cabinet.length === 1 ? '' : 's'} Logged
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Metric 1: Interactions */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500">Drug Interactions</span>
                    <AlertTriangle className={`w-4 h-4 ${riskResult.detectedInteractions.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
                  </div>
                  <span className="text-2xl font-extrabold text-gray-800">{riskResult.detectedInteractions.length}</span>
                  <p className="text-[11px] text-gray-400 mt-1">Cross-drug conflicts</p>
                </div>

                {/* Metric 2: Expired */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500">Expired Medicines</span>
                    <Calendar className={`w-4 h-4 ${riskResult.expiredMedicines.length > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
                  </div>
                  <span className="text-2xl font-extrabold text-gray-800">{riskResult.expiredMedicines.length}</span>
                  <p className="text-[11px] text-gray-400 mt-1">Passed shelf life</p>
                </div>

                {/* Metric 3: Recalled / Suspicious */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500">Recalled / Flagged</span>
                    <ShieldAlert className={`w-4 h-4 ${riskResult.recalledMedicines.length > 0 ? 'text-red-600' : 'text-emerald-500'}`} />
                  </div>
                  <span className="text-2xl font-extrabold text-gray-800">{riskResult.recalledMedicines.length}</span>
                  <p className="text-[11px] text-gray-400 mt-1">Safety alerts</p>
                </div>

              </div>

              {/* Action Recommendations Box */}
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-900 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Recommended Health Actions:
                </div>
                <ul className="space-y-1 text-emerald-800/90 pl-4 list-disc">
                  {riskResult.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>

            </div>

          </div>
        </div>

        {/* ── DRUG INTERACTION ALERTS (If any) ── */}
        {riskResult.detectedInteractions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              <AlertOctagon className="w-5 h-5 text-amber-600" /> Dangerous Drug Interaction Warnings
            </h2>

            <div className="space-y-4">
              {riskResult.detectedInteractions.map(({ rule, medicineA, medicineB }, index) => (
                <div key={index} className={`rounded-2xl border p-5 ${
                  rule.severity === 'critical' ? 'bg-red-50/80 border-red-200' : 'bg-amber-50/80 border-amber-200'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                          rule.severity === 'critical' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                        }`}>
                          {rule.severity} Interaction
                        </span>
                        <h4 className="font-bold text-gray-900 text-base">{rule.title}</h4>
                      </div>

                      <p className="text-sm font-medium text-gray-700 mt-1">
                        Conflict between <strong className="text-emerald-900">{medicineA.brand || medicineA.name}</strong> and <strong className="text-emerald-900">{medicineB.brand || medicineB.name}</strong>.
                      </p>
                      
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                        {rule.description}
                      </p>

                      <div className="mt-3 p-3 bg-white/80 rounded-xl border border-gray-200/60 text-xs text-gray-800">
                        <strong>💡 Medical Guidance:</strong> {rule.recommendation}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CABINET MEDICINE MANAGER ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                My Medicine Cabinet
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Manage medications currently kept in your household.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary py-2 text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Medicine
              </button>
              {cabinet.length > 0 && (
                <button
                  onClick={handleClearCabinet}
                  className="text-xs text-gray-400 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {cabinet.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-700 text-sm">Your Medicine Cabinet is Empty</h3>
              <p className="text-xs text-gray-400 mt-1 mb-4">Add medicines to check interaction risks and expiration dates.</p>
              <button onClick={handleResetDemoCabinet} className="btn-secondary py-2 text-xs mx-auto">
                <RefreshCw className="w-3.5 h-3.5" /> Load Sample Cabinet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cabinet.map(med => {
                const isExpired = med.expiry_date ? new Date(med.expiry_date) < new Date() : false;
                return (
                  <div key={med.id} className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                    isExpired ? 'bg-red-50/40 border-red-200' : 'bg-white border-gray-200/80 hover:border-emerald-300 shadow-sm'
                  }`}>
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-gray-900 text-base" style={{ fontFamily: 'Playfair Display, serif' }}>
                            {med.brand || med.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {med.active_ingredient} {med.dosage ? `· ${med.dosage}` : ''}
                          </p>
                        </div>

                        <button
                          onClick={() => handleRemoveMedicine(med.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove from cabinet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3 text-xs">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                          {med.category}
                        </span>
                        {med.expiry_date && (
                          <span className={`px-2.5 py-0.5 rounded-full font-medium ${
                            isExpired ? 'bg-red-100 text-red-700 font-bold' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {isExpired ? '⚠️ Expired: ' : 'Exp: '}
                            {new Date(med.expiry_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SAFETY DISCLAIMER BANNER ── */}
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Medical Disclaimer:</strong> The Personal Health Risk Dashboard provides educational decision support based on registered pharmaceutical datasets. It does not replace professional diagnosis, treatment, or advice from a certified medical doctor or pharmacist. Always consult your physician before changing or combining medications.
          </p>
        </div>

      </div>

      {/* ── ADD MEDICINE MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                Add Medicine to Cabinet
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Peptard 20, Dolo 650"
                  value={newBrand}
                  onChange={e => setNewBrand(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Active Ingredient</label>
                <input
                  type="text"
                  placeholder="e.g. Rabeprazole 20mg, Paracetamol"
                  value={newIngredient}
                  onChange={e => setNewIngredient(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="input-field"
                  >
                    <option value="Antacid">Antacid / PPI</option>
                    <option value="Analgesic">Analgesic / Pain</option>
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="NSAID">NSAID</option>
                    <option value="Antidiabetic">Antidiabetic</option>
                    <option value="Antiplatelet">Antiplatelet</option>
                    <option value="Statin">Statin</option>
                    <option value="Antihistamine">Antihistamine</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    placeholder="e.g. 20mg, 650mg"
                    value={newDosage}
                    onChange={e => setNewDosage(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={newExpiry}
                  onChange={e => setNewExpiry(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 text-xs"
                >
                  Add to Cabinet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
