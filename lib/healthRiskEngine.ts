import { supabase } from '@/lib/supabase';

export interface UserProfile {
  name: string;
  age?: number;
  gender?: string;
  allergies?: string[];
  conditions?: string[];
}

export interface MedicationTrack {
  id: string;
  brand: string;
  name: string;
  active_ingredient: string;
  category: string;
  dosage?: string;
  startDate: string;         // YYYY-MM-DD
  durationDays: number;       // Target days e.g. 5, 7, 14, 30
  expiryDate?: string;        // YYYY-MM-DD Batch Expiry Date
  completedDates: string[];   // Array of YYYY-MM-DD dates ticked off by user
  isRecovered: boolean;       // Marked true when user recovers
  recoveredAt?: string;       // Date user marked recovered
  status: 'verified' | 'suspicious' | 'recalled' | 'unknown';
}

export interface RiskPrediction {
  currentDayNum: number;
  expectedBenefits: string;
  activeSideEffects: string[];
  durationWarnings: string[];
  overallRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  expiryInfo?: ReturnType<typeof checkMedicationExpiryStatus>;
}

/* ── Check Medication Expiry Status & Generate Alerts ── */
export function checkMedicationExpiryStatus(expiryDate?: string): {
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number | null;
  formattedDate: string;
  alertMessage: string | null;
  severity: 'none' | 'warning' | 'danger';
} {
  if (!expiryDate) {
    return { isExpired: false, isExpiringSoon: false, daysRemaining: null, formattedDate: '', alertMessage: null, severity: 'none' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);

  const diffMs = exp.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const formattedDate = exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (daysRemaining < 0) {
    return {
      isExpired: true,
      isExpiringSoon: false,
      daysRemaining,
      formattedDate,
      alertMessage: `🚨 CRITICAL ALERT: Medicine expired on ${formattedDate} (${Math.abs(daysRemaining)} days ago)! Consuming expired medicine can cause toxic degradation or lack of efficacy. Discard immediately.`,
      severity: 'danger',
    };
  }

  if (daysRemaining <= 30) {
    return {
      isExpired: false,
      isExpiringSoon: true,
      daysRemaining,
      formattedDate,
      alertMessage: `⚠️ EXPIRING SOON: Medicine expires on ${formattedDate} (only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining). Please replace your stock soon!`,
      severity: 'warning',
    };
  }

  return {
    isExpired: false,
    isExpiringSoon: false,
    daysRemaining,
    formattedDate,
    alertMessage: null,
    severity: 'none',
  };
}

/* ── Default Clean Patient Profile for New Visitors ── */
export const SAMPLE_PATIENT_PROFILE: UserProfile = {
  name: 'Guest Patient',
  age: 25,
  gender: 'Not Specified',
  allergies: [],
  conditions: [],
};

/* ── Sample Active Medication Tracks ── */
export const SAMPLE_MEDICATION_TRACKS: MedicationTrack[] = [
  {
    id: 'track-1',
    brand: 'Peptard 20',
    name: 'Rabeprazole Sodium',
    active_ingredient: 'Rabeprazole 20mg',
    category: 'Antacid',
    dosage: '20mg Once Daily',
    startDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], // 3 days ago
    durationDays: 7,
    expiryDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], // Expiring in 15 days!
    completedDates: [
      new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    ],
    isRecovered: false,
    status: 'verified',
  },
  {
    id: 'track-2',
    brand: 'Combiflam',
    name: 'Ibuprofen & Paracetamol',
    active_ingredient: 'Ibuprofen 400mg + Paracetamol 325mg',
    category: 'NSAID',
    dosage: '400mg Twice Daily',
    startDate: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0], // 8 days ago
    durationDays: 5,
    expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0], // Valid 6 months
    completedDates: [
      new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    ],
    isRecovered: false,
    status: 'verified',
  }
];

/* ── Dynamic Risk & Side Effect Predictor Engine ── */
export function predictMedicationRiskAndEffects(track: MedicationTrack, profile?: UserProfile): RiskPrediction {
  const start = new Date(track.startDate);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - start.getTime());
  const currentDayNum = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const activeIngredient = (track.active_ingredient || track.brand || track.name).toLowerCase();
  const category = (track.category || '').toLowerCase();

  let expectedBenefits = 'Symptom management and therapeutic relief expected.';
  const activeSideEffects: string[] = [];
  const durationWarnings: string[] = [];
  let overallRiskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';

  // 1. Evaluate Expiry Date Alerts
  const expiryInfo = checkMedicationExpiryStatus(track.expiryDate);
  if (expiryInfo.isExpired) {
    durationWarnings.push(`🚨 CRITICAL EXPIRED MEDICINE ALERT: Expired on ${expiryInfo.formattedDate} (${Math.abs(expiryInfo.daysRemaining!)} days ago)! Consuming expired medicine is dangerous. Discard immediately.`);
    overallRiskLevel = 'critical';
  } else if (expiryInfo.isExpiringSoon) {
    durationWarnings.push(`⚠️ EXPIRING SOON WARNING: Expiring on ${expiryInfo.formattedDate} (only ${expiryInfo.daysRemaining} days remaining). Replace stock soon.`);
    if (overallRiskLevel === 'low') overallRiskLevel = 'moderate';
  }

  // 2. Evaluate Benefits & Side Effects Timeline
  if (activeIngredient.includes('rabeprazole') || activeIngredient.includes('pantoprazole') || activeIngredient.includes('omeprazole') || category.includes('antacid')) {
    expectedBenefits = currentDayNum <= 2 
      ? 'Initial reduction in stomach acid production (30-60 min post dose).'
      : 'Optimal acid suppression & gastric lining healing underway.';

    if (currentDayNum <= 3) {
      activeSideEffects.push('Mild headache or temporary nausea (common in first 3 days)');
      activeSideEffects.push('Mild flatulence or dry mouth');
    } else {
      activeSideEffects.push('Stomach pain or loose stools (if taking without water)');
    }

    if (currentDayNum > 30) {
      durationWarnings.push('⚠️ Over-use Warning: Taking PPI antacids continuously for >30 days can impair Vitamin B12 and Magnesium absorption.');
      if (overallRiskLevel !== 'critical') overallRiskLevel = 'high';
    }
  } 
  else if (activeIngredient.includes('ibuprofen') || activeIngredient.includes('diclofenac') || category.includes('nsaid')) {
    expectedBenefits = 'Analgesic pain relief and reduction of tissue swelling.';

    if (currentDayNum <= 2) {
      activeSideEffects.push('Mild stomach discomfort or heartburn');
    } else {
      activeSideEffects.push('Increased gastric mucosa irritation risk');
      activeSideEffects.push('Dizziness or mild fluid retention');
    }

    if (currentDayNum >= 7) {
      durationWarnings.push('🚨 OVER-USE WARNING: Taking NSAID painkillers continuously for >7 days significantly increases stomach ulcer and kidney injury risks.');
      overallRiskLevel = 'critical';
    }
  }
  else if (activeIngredient.includes('amoxicillin') || activeIngredient.includes('azithromycin') || category.includes('antibiotic')) {
    expectedBenefits = 'Bacterial inhibition; infection symptom resolution expected by Day 3.';

    activeSideEffects.push('Mild diarrhoea or gut microbiome alteration');
    activeSideEffects.push('Nausea or loss of appetite');

    if (track.completedDates.length < 5 && track.completedDates.length < track.durationDays) {
      durationWarnings.push('⚠️ Early Stop Warning: Stopping antibiotics before completing the 5-7 day course leads to antibiotic resistance.');
      if (overallRiskLevel !== 'critical') overallRiskLevel = 'high';
    }
  }
  else if (activeIngredient.includes('paracetamol') || activeIngredient.includes('acetaminophen')) {
    expectedBenefits = 'Fever reduction and mild pain control.';

    activeSideEffects.push('Generally well tolerated at recommended dosages');

    if (currentDayNum >= 6) {
      durationWarnings.push('⚠️ High Liver Strain: Continuous daily Paracetamol use for >5 days requires doctor review to prevent hepatic stress.');
      if (overallRiskLevel !== 'critical') overallRiskLevel = 'high';
    }
  }
  else {
    expectedBenefits = `Targeted therapeutic response for ${track.category || 'prescribed condition'}.`;
    activeSideEffects.push('Consult prescription leaflet for complete side effect profile');
  }

  // 3. Check Allergy Conflict
  if (profile?.allergies && profile.allergies.length > 0) {
    profile.allergies.forEach(allergy => {
      const alg = allergy.toLowerCase().trim();
      if (alg && (activeIngredient.includes(alg) || (track.brand || '').toLowerCase().includes(alg))) {
        durationWarnings.push(`🚨 ALLERGY CONFLICT WARNING: You are listed as allergic to "${allergy}". STOP medication immediately.`);
        overallRiskLevel = 'critical';
      }
    });
  }

  return {
    currentDayNum,
    expectedBenefits,
    activeSideEffects,
    durationWarnings,
    overallRiskLevel,
    expiryInfo,
  };
}

/* ── Fetch & Save Cloud Patient Data ── */
export async function fetchUserPatientData(userId: string): Promise<{ profile: UserProfile; tracks: MedicationTrack[] } | null> {
  try {
    const { data } = await supabase
      .from('health_profiles')
      .select('profile, tracks')
      .eq('user_id', userId)
      .single();

    if (data) {
      return {
        profile: data.profile as UserProfile,
        tracks: (data.tracks as MedicationTrack[]) ?? [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveUserPatientData(userId: string, profile: UserProfile, tracks: MedicationTrack[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('health_profiles')
      .upsert({
        user_id: userId,
        profile,
        tracks,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    return !error;
  } catch {
    return false;
  }
}
