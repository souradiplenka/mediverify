'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HeartPulse, User, Calendar as CalendarIcon, CheckCircle2, Clock, CheckSquare,
  AlertTriangle, AlertOctagon, Sparkles, Plus, Trash2, Check, RefreshCw,
  Stethoscope, Activity, Pill, Info, ArrowRight, ShieldCheck, ShieldAlert, RotateCcw, Cloud, CloudOff, LogIn
} from 'lucide-react';
import {
  UserProfile, MedicationTrack, SAMPLE_PATIENT_PROFILE, SAMPLE_MEDICATION_TRACKS,
  predictMedicationRiskAndEffects, fetchUserPatientData, saveUserPatientData
} from '@/lib/healthRiskEngine';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import AuthModal from '@/components/AuthModal';

export default function HealthRiskDashboard() {
  const [profile, setProfile] = useState<UserProfile>(SAMPLE_PATIENT_PROFILE);
  const [tracks, setTracks] = useState<MedicationTrack[]>(SAMPLE_MEDICATION_TRACKS);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddMedModal, setShowAddMedModal] = useState(false);

  // Form state: Profile
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState<number>(26);
  const [editGender, setEditGender] = useState('Male');
  const [editAllergies, setEditAllergies] = useState('');
  const [editConditions, setEditConditions] = useState('');

  // Form state: Add Medication Track
  const [newBrand, setNewBrand] = useState('');
  const [newName, setNewName] = useState('');
  const [newIngredient, setNewIngredient] = useState('');
  const [newCategory, setNewCategory] = useState('Antacid');
  const [newDosage, setNewDosage] = useState('');
  const [newDuration, setNewDuration] = useState<number>(7);

  useEffect(() => {
    async function loadData() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const cloudData = await fetchUserPatientData(currentUser.id);
        if (cloudData) {
          setProfile(cloudData.profile);
          setTracks(cloudData.tracks);
        } else {
          loadLocalData();
        }
      } else {
        loadLocalData();
      }
      setLoading(false);
    }

    function loadLocalData() {
      try {
        const savedProf = localStorage.getItem('mediverify_patient_profile');
        const savedTracks = localStorage.getItem('mediverify_patient_tracks');
        if (savedProf) setProfile(JSON.parse(savedProf));
        if (savedTracks) setTracks(JSON.parse(savedTracks));
      } catch { /* fallback */ }
    }

    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setSyncing(true);
        const cloudData = await fetchUserPatientData(currentUser.id);
        if (cloudData) {
          setProfile(cloudData.profile);
          setTracks(cloudData.tracks);
        } else {
          await saveUserPatientData(currentUser.id, profile, tracks);
        }
        setSyncing(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const persistData = async (newProfile: UserProfile, newTracks: MedicationTrack[]) => {
    setProfile(newProfile);
    setTracks(newTracks);

    try {
      localStorage.setItem('mediverify_patient_profile', JSON.stringify(newProfile));
      localStorage.setItem('mediverify_patient_tracks', JSON.stringify(newTracks));
    } catch { /* storage full */ }

    if (user) {
      setSyncing(true);
      await saveUserPatientData(user.id, newProfile, newTracks);
      setSyncing(false);
    }
  };

  // Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      name: editName.trim() || 'Patient',
      age: Number(editAge) || 26,
      gender: editGender,
      allergies: editAllergies.split(',').map(s => s.trim()).filter(Boolean),
      conditions: editConditions.split(',').map(s => s.trim()).filter(Boolean),
    };
    persistData(updated, tracks);
    setShowProfileModal(false);
  };

  const openProfileModal = () => {
    setEditName(profile.name);
    setEditAge(profile.age || 26);
    setEditGender(profile.gender || 'Male');
    setEditAllergies((profile.allergies || []).join(', '));
    setEditConditions((profile.conditions || []).join(', '));
    setShowProfileModal(true);
  };

  // Add Medication Track
  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.trim() && !newName.trim()) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newTrack: MedicationTrack = {
      id: `track-${Date.now()}`,
      brand: newBrand.trim() || newName.trim(),
      name: newName.trim() || newBrand.trim(),
      active_ingredient: newIngredient.trim() || newBrand.trim(),
      category: newCategory,
      dosage: newDosage.trim() || 'Once Daily',
      startDate: todayStr,
      durationDays: Number(newDuration) || 7,
      completedDates: [todayStr], // Auto check first day
      isRecovered: false,
      status: 'verified',
    };

    persistData(profile, [newTrack, ...tracks]);
    setNewBrand('');
    setNewName('');
    setNewIngredient('');
    setNewDosage('');
    setShowAddMedModal(false);
  };

  // Toggle Date Taken Checkbox
  const handleToggleDateTaken = (trackId: string, dateStr: string) => {
    const updated = tracks.map(t => {
      if (t.id !== trackId) return t;
      const exists = t.completedDates.includes(dateStr);
      const newDates = exists
        ? t.completedDates.filter(d => d !== dateStr)
        : [...t.completedDates, dateStr];
      return { ...t, completedDates: newDates };
    });
    persistData(profile, updated);
  };

  // Step 4: Mark Recovered & Archive
  const handleMarkRecovered = (trackId: string) => {
    const updated = tracks.map(t => {
      if (t.id !== trackId) return t;
      return {
        ...t,
        isRecovered: true,
        recoveredAt: new Date().toISOString(),
      };
    });
    persistData(profile, updated);
  };

  // Remove track completely
  const handleRemoveTrack = (trackId: string) => {
    persistData(profile, tracks.filter(t => t.id !== trackId));
  };

  const handleResetSampleData = () => {
    persistData(SAMPLE_PATIENT_PROFILE, SAMPLE_MEDICATION_TRACKS);
  };

  const activeTracks = tracks.filter(t => !t.isRecovered);
  const recoveredTracks = tracks.filter(t => t.isRecovered);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-emerald-800">
          <HeartPulse className="w-6 h-6 animate-pulse text-emerald-600" />
          <span className="font-semibold text-sm">Loading health profile & treatment calendar…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      
      {/* ── Top Header ── */}
      <section className="bg-emerald-950 text-white pt-10 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 bg-emerald-900/80 border border-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300">
                  <HeartPulse className="w-3.5 h-3.5 text-emerald-400" /> Patient Health & Risk Predictor
                </span>
                {user ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-800/90 border border-emerald-600/80 px-3 py-1 rounded-full text-xs font-semibold text-emerald-100">
                    <Cloud className="w-3 h-3 text-emerald-400" /> Cloud Synced ({user.email})
                  </span>
                ) : (
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-semibold text-amber-200 transition-colors"
                  >
                    <CloudOff className="w-3 h-3 text-amber-300" /> Guest Mode (Click to Sign In)
                  </button>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                Health Risk Dashboard
              </h1>
              <p className="text-emerald-200/80 text-sm mt-2 max-w-xl leading-relaxed">
                Track your active medications, tick off daily doses on your treatment calendar, and view live predicted side-effect windows.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => setShowAddMedModal(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm px-4 py-2.5 rounded-full transition-all shadow-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Active Medicine
              </button>
              <button
                onClick={handleResetSampleData}
                className="bg-white/10 hover:bg-white/20 text-emerald-100 text-sm font-medium px-4 py-2.5 rounded-full transition-all flex items-center gap-2 border border-white/10"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sample Data
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ── Main Container ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 space-y-8">
        
        {/* ── STEP 1: PATIENT PROFILE CARD ── */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center shadow-inner">
                <User className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Step 1 · Patient Profile</span>
                <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {profile.name}
                </h2>
              </div>
            </div>

            <button
              onClick={openProfileModal}
              className="btn-secondary py-2 text-xs"
            >
              Edit Health Profile
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">Age & Gender</span>
              <span className="font-semibold text-gray-800 text-sm">{profile.age || 26} Yrs · {profile.gender || 'Male'}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Active Medications</span>
              <span className="font-semibold text-emerald-700 text-sm">{activeTracks.length} Active Intake</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Known Allergies</span>
              <span className="font-semibold text-red-600 text-sm truncate block">
                {profile.allergies?.length ? profile.allergies.join(', ') : 'None listed'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Health Conditions</span>
              <span className="font-semibold text-blue-700 text-sm truncate block">
                {profile.conditions?.length ? profile.conditions.join(', ') : 'None listed'}
              </span>
            </div>
          </div>
        </div>

        {/* ── STEP 2 & 3: ACTIVE MEDICATIONS & TREATMENT CALENDAR TRACKER ── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Step 2 & 3 · Daily Treatment Calendar</span>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                Active Medication Intake & Progress
              </h2>
            </div>
            
            <button
              onClick={() => setShowAddMedModal(true)}
              className="btn-primary py-2 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Medicine Course
            </button>
          </div>

          {activeTracks.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-dashed border-gray-200 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
              <h3 className="font-bold text-gray-800 text-base">No Active Medications Currently</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">You have completed all active treatment courses or marked them recovered.</p>
              <button onClick={handleResetSampleData} className="btn-secondary text-xs mx-auto">
                <RefreshCw className="w-3.5 h-3.5" /> Load Sample Treatments
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTracks.map(track => {
                const prediction = predictMedicationRiskAndEffects(track, profile);
                const startDateObj = new Date(track.startDate);

                // Generate array of YYYY-MM-DD dates for course
                const courseDates: Array<{ dateStr: string; dayNum: number; dayName: string }> = [];
                for (let i = 0; i < track.durationDays; i++) {
                  const d = new Date(startDateObj);
                  d.setDate(d.getDate() + i);
                  const dateStr = d.toISOString().split('T')[0];
                  courseDates.push({
                    dateStr,
                    dayNum: i + 1,
                    dayName: d.toLocaleDateString('en-IN', { weekday: 'narrow', day: 'numeric' })
                  });
                }

                return (
                  <div key={track.id} className="bg-white rounded-3xl shadow-sm border border-gray-200/80 p-6 sm:p-8 hover:shadow-md transition-all">
                    
                    {/* Header: Medicine Info + Recovery Button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Day {prediction.currentDayNum} of {track.durationDays}
                          </span>
                          <span className="text-xs text-gray-400">Dosage: {track.dosage}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                          {track.brand || track.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Active Ingredient: <strong className="text-gray-700">{track.active_ingredient}</strong>
                        </p>
                      </div>

                      {/* STEP 4: Mark Recovered Button */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMarkRecovered(track.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-full transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Recovered
                        </button>
                        <button
                          onClick={() => handleRemoveTrack(track.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete Track"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* STEP 3: DAILY CALENDAR TRACKER GRID */}
                    <div className="py-6 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                          <CalendarIcon className="w-4 h-4 text-emerald-600" /> Daily Treatment Calendar (Click to Tick Doses Taken)
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                          {track.completedDates.length} of {track.durationDays} Days Completed
                        </span>
                      </div>

                      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
                        {courseDates.map(({ dateStr, dayNum, dayName }) => {
                          const isCompleted = track.completedDates.includes(dateStr);
                          return (
                            <button
                              key={dateStr}
                              onClick={() => handleToggleDateTaken(track.id, dateStr)}
                              className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                                isCompleted
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-bold scale-105'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50/50'
                              }`}
                            >
                              <span className="text-[10px] opacity-80 uppercase">{dayName}</span>
                              <span className="text-xs font-extrabold mt-0.5">Day {dayNum}</span>
                              <div className="mt-1">
                                {isCompleted ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* STEP 5: DYNAMIC RISK & SIDE EFFECT PREDICTOR */}
                    <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Expected Benefits & Effect Predictor */}
                      <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4">
                        <div className="flex items-center gap-1.5 mb-2 text-emerald-800 font-bold text-xs">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          <span>Predicted Therapeutic Effect (Day {prediction.currentDayNum}):</span>
                        </div>
                        <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                          {prediction.expectedBenefits}
                        </p>
                      </div>

                      {/* Predicted Side Effect Exposure Window */}
                      <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4">
                        <div className="flex items-center gap-1.5 mb-2 text-amber-900 font-bold text-xs">
                          <Activity className="w-4 h-4 text-amber-600" />
                          <span>Predicted Side Effect Exposure Window:</span>
                        </div>
                        <ul className="space-y-1 text-xs text-amber-900">
                          {prediction.activeSideEffects.map((effect, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1 shrink-0" />
                              <span>{effect}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>

                    {/* Duration Risk Warnings (Over-use or Early Stop) */}
                    {prediction.durationWarnings.length > 0 && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-1">
                        {prediction.durationWarnings.map((warning, wIdx) => (
                          <div key={wIdx} className="flex items-start gap-2 font-semibold">
                            <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── STEP 4: RECOVERED & COMPLETED HISTORY LOG ── */}
        {recoveredTracks.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Completed & Recovered History
                </h3>
              </div>
              <span className="text-xs text-gray-400 font-medium">{recoveredTracks.length} Courses Completed</span>
            </div>

            <div className="space-y-3">
              {recoveredTracks.map(rec => (
                <div key={rec.id} className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ✅ RECOVERED
                      </span>
                      <h4 className="font-bold text-gray-800 text-sm">{rec.brand || rec.name}</h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Completed {rec.completedDates.length} days course · Archived on {rec.recoveredAt ? new Date(rec.recoveredAt).toLocaleDateString() : 'Today'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRemoveTrack(rec.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── PROFILE MODAL ── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                Edit Patient Profile
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={editAge}
                    onChange={e => setEditAge(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                  <select
                    value={editGender}
                    onChange={e => setEditGender(e.target.value)}
                    className="input-field"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Known Drug Allergies (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa, Aspirin"
                  value={editAllergies}
                  onChange={e => setEditAllergies(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Health Conditions (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Acid Reflux, Diabetes, Hypertension"
                  value={editConditions}
                  onChange={e => setEditConditions(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowProfileModal(false)} className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="btn-primary py-2 text-xs">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD MEDICATION COURSE MODAL ── */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                Add Active Medication Intake
              </h3>
              <button onClick={() => setShowAddMedModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleAddTrack} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Peptard 20, Augmentin 625"
                  value={newBrand}
                  onChange={e => setNewBrand(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Active Ingredient</label>
                <input
                  type="text"
                  placeholder="e.g. Rabeprazole 20mg, Amoxicillin"
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
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Analgesic">Pain / Fever</option>
                    <option value="NSAID">NSAID Painkiller</option>
                    <option value="Antidiabetic">Antidiabetic</option>
                    <option value="Statin">Cholesterol Statin</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Treatment Duration (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={newDuration}
                    onChange={e => setNewDuration(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Dosage Frequency</label>
                <input
                  type="text"
                  placeholder="e.g. Once Daily before breakfast"
                  value={newDosage}
                  onChange={e => setNewDosage(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddMedModal(false)} className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="btn-primary py-2 text-xs">Start Treatment Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

    </div>
  );
}
