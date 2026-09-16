'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User, ShieldCheck, HeartPulse, AlertTriangle, Phone, Mail, Edit3,
  CheckCircle2, Save, Sparkles, Activity, Calendar, FileText, Lock, LogIn, Cloud, CloudOff
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import AuthModal from '@/components/AuthModal';

export interface FullUserProfile {
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone: string;
  email: string;
  allergies: string[];
  conditions: string[];
  emergencyContact: string;
  emergencyPhone: string;
  primaryDoctor: string;
  doctorPhone: string;
}

const DEFAULT_PROFILE: FullUserProfile = {
  name: 'Guest Patient',
  age: 25,
  gender: 'Not Specified',
  bloodGroup: 'O+',
  phone: 'Not provided',
  email: 'guest@mediverify.app',
  allergies: [],
  conditions: [],
  emergencyContact: 'Not provided',
  emergencyPhone: 'Not provided',
  primaryDoctor: 'Not provided',
  doctorPhone: 'Not provided',
};

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<FullUserProfile>(DEFAULT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [formData, setFormData] = useState<FullUserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      try {
        const saved = localStorage.getItem('mediverify_full_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          setProfile(parsed);
          setFormData(parsed);
        } else {
          if (currentUser) {
            const userProf = {
              ...DEFAULT_PROFILE,
              name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Patient',
              email: currentUser.email || DEFAULT_PROFILE.email,
            };
            setProfile(userProf);
            setFormData(userProf);
          }
        }
      } catch { /* use default */ }
    }

    loadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          name: prev.name || currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Patient',
          email: currentUser.email || prev.email,
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(formData);
    try {
      localStorage.setItem('mediverify_full_profile', JSON.stringify(formData));
      // Also sync patient profile to health risk dashboard key
      localStorage.setItem('mediverify_patient_profile', JSON.stringify({
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        allergies: formData.allergies,
        conditions: formData.conditions,
      }));
    } catch { /* storage full */ }

    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      
      {/* ── Top Header ── */}
      <section className="bg-emerald-950 text-white pt-10 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 bg-emerald-900/80 border border-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300">
                  <User className="w-3.5 h-3.5 text-emerald-400" /> Patient Medical Profile
                </span>
                {user ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-800/90 border border-emerald-600/80 px-3 py-1 rounded-full text-xs font-semibold text-emerald-100">
                    <Cloud className="w-3 h-3 text-emerald-400" /> Account Synced
                  </span>
                ) : (
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-semibold text-amber-200 transition-colors"
                  >
                    <CloudOff className="w-3 h-3 text-amber-300" /> Guest Profile (Click to Sign In)
                  </button>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                My Health Profile
              </h1>
              <p className="text-emerald-200/80 text-sm mt-2 max-w-xl leading-relaxed">
                Manage your personal details, emergency contacts, medical history, and drug allergy records.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-all shadow-lg flex items-center gap-2"
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </button>
              <Link
                href="/health-risk"
                className="bg-white/10 hover:bg-white/20 text-emerald-100 text-sm font-medium px-5 py-2.5 rounded-full transition-all flex items-center gap-2 border border-white/10"
              >
                <HeartPulse className="w-4 h-4 text-emerald-400" /> Risk Dashboard
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Main Profile Body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 space-y-6">
        
        {savedSuccess && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Profile details saved successfully! Your preferences are active across MediVerify.</span>
          </div>
        )}

        {/* ── CARD 1: PERSONAL INFORMATION ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center shadow-inner">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Personal Information
                </h2>
                <p className="text-xs text-gray-500">Basic demographic and identity details</p>
              </div>
            </div>
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm bg-slate-50 border border-slate-200/60 rounded-2xl p-5">
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Full Name</span>
                <p className="font-bold text-gray-900 text-base mt-0.5">{profile.name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Age & Gender</span>
                <p className="font-semibold text-gray-800 text-base mt-0.5">{profile.age} Yrs · {profile.gender}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Blood Group</span>
                <p className="font-bold text-red-600 text-base mt-0.5">{profile.bloodGroup}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Email Address</span>
                <p className="font-medium text-gray-700 text-sm mt-0.5">{profile.email}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Phone Number</span>
                <p className="font-medium text-gray-700 text-sm mt-0.5">{profile.phone}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="input-field"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="input-field"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* ── CARD 2: MEDICAL HISTORY & ALLERGIES ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                Medical History & Allergies
              </h2>
              <p className="text-xs text-gray-500">Cross-referenced against drug ingredients for safety warnings</p>
            </div>
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50/70 border border-red-100 rounded-2xl p-4">
                <span className="text-xs font-bold text-red-700 uppercase tracking-wide block mb-2">Known Drug Allergies</span>
                <div className="flex flex-wrap gap-2">
                  {profile.allergies.length > 0 ? (
                    profile.allergies.map((alg, i) => (
                      <span key={i} className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">
                        ⚠️ {alg}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No drug allergies recorded</span>
                  )}
                </div>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide block mb-2">Health Conditions</span>
                <div className="flex flex-wrap gap-2">
                  {profile.conditions.length > 0 ? (
                    profile.conditions.map((cond, i) => (
                      <span key={i} className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                        🩺 {cond}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No medical conditions recorded</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Drug Allergies (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa, Aspirin"
                  value={formData.allergies.join(', ')}
                  onChange={e => setFormData({ ...formData, allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Medical Conditions (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Acid Reflux, Diabetes, Hypertension"
                  value={formData.conditions.join(', ')}
                  onChange={e => setFormData({ ...formData, conditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="input-field"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── CARD 3: EMERGENCY CONTACT & DOCTOR ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center shadow-inner">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                Emergency Contact & Doctor
              </h2>
              <p className="text-xs text-gray-500">Quick contacts for medical emergencies</p>
            </div>
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 border border-slate-200/60 rounded-2xl p-5">
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Primary Physician</span>
                <p className="font-bold text-gray-900 text-base mt-0.5">{profile.primaryDoctor}</p>
                <p className="text-xs text-emerald-700 font-medium mt-1">{profile.doctorPhone}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Emergency Contact</span>
                <p className="font-bold text-gray-900 text-base mt-0.5">{profile.emergencyContact}</p>
                <p className="text-xs text-emerald-700 font-medium mt-1">{profile.emergencyPhone}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Doctor Name</label>
                <input
                  type="text"
                  value={formData.primaryDoctor}
                  onChange={e => setFormData({ ...formData, primaryDoctor: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Doctor Phone</label>
                <input
                  type="text"
                  value={formData.doctorPhone}
                  onChange={e => setFormData({ ...formData, doctorPhone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Contact Person</label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Phone</label>
                <input
                  type="text"
                  value={formData.emergencyPhone}
                  onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          )}

          {isEditing && (
            <div className="mt-6 flex justify-end">
              <button onClick={handleSave} className="btn-primary py-2.5 px-6">
                <Save className="w-4 h-4" /> Save Profile Details
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

    </div>
  );
}
