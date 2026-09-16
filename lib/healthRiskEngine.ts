export interface CabinetMedicine {
  id: string;
  name: string;
  brand: string;
  active_ingredient: string;
  category: string;
  dosage?: string;
  expiry_date?: string;
  status: 'verified' | 'suspicious' | 'recalled' | 'unknown';
  addedAt: string;
}

export interface InteractionRule {
  drugA: string;
  drugB: string;
  severity: 'critical' | 'moderate' | 'low';
  title: string;
  description: string;
  recommendation: string;
}

/* ── Drug Interaction Rules Matrix ── */
export const INTERACTION_RULES: InteractionRule[] = [
  {
    drugA: 'aspirin',
    drugB: 'ibuprofen',
    severity: 'critical',
    title: 'High Gastrointestinal Bleeding Risk',
    description: 'Combining Aspirin with Ibuprofen significantly increases the risk of stomach ulcers and internal bleeding.',
    recommendation: 'Avoid taking Aspirin and Ibuprofen together. Consult a physician for an alternative pain reliever.'
  },
  {
    drugA: 'aspirin',
    drugB: 'clopidogrel',
    severity: 'critical',
    title: 'Severe Bleeding Risk',
    description: 'Dual antiplatelet therapy (Aspirin + Clopidogrel) doubles the risk of major hemorrhages.',
    recommendation: 'Must be taken only under strict cardiologist supervision with regular blood monitoring.'
  },
  {
    drugA: 'rabeprazole',
    drugB: 'clopidogrel',
    severity: 'moderate',
    title: 'Reduced Clopidogrel Efficacy',
    description: 'Proton pump inhibitors like Rabeprazole can reduce the conversion of Clopidogrel into its active form.',
    recommendation: 'Consider spacing doses or discussing an alternative antacid with your physician.'
  },
  {
    drugA: 'pantoprazole',
    drugB: 'methotrexate',
    severity: 'moderate',
    title: 'Increased Methotrexate Toxicity',
    description: 'Pantoprazole may inhibit renal excretion of Methotrexate, leading to elevated blood levels.',
    recommendation: 'Monitor blood counts closely if co-administered.'
  },
  {
    drugA: 'ciprofloxacin',
    drugB: 'tizanidine',
    severity: 'critical',
    title: 'Severe Hypotension Risk',
    description: 'Ciprofloxacin inhibits CYP1A2, dramatically increasing Tizanidine levels and causing severe sedation and low BP.',
    recommendation: 'Combination is contraindicated. Use an alternative antibiotic.'
  },
  {
    drugA: 'ciprofloxacin',
    drugB: 'antacid',
    severity: 'moderate',
    title: 'Reduced Antibiotic Absorption',
    description: 'Antacids containing Aluminum or Magnesium bind to Ciprofloxacin in the stomach, preventing absorption.',
    recommendation: 'Take Ciprofloxacin at least 2 hours before or 6 hours after taking antacids.'
  },
  {
    drugA: 'metformin',
    drugB: 'contrast',
    severity: 'critical',
    title: 'Lactic Acidosis Risk',
    description: 'Iodinated contrast dyes used in CT scans can impair kidney function and cause Metformin accumulation.',
    recommendation: 'Temporarily stop Metformin 48 hours prior to contrast imaging procedure.'
  },
  {
    drugA: 'atorvastatin',
    drugB: 'azithromycin',
    severity: 'moderate',
    title: 'Increased Muscle Toxicity Risk',
    description: 'Azithromycin can modestly elevate Atorvastatin plasma concentrations, raising rhabdomyolysis risk.',
    recommendation: 'Report any unexplained muscle pain or weakness immediately.'
  },
  {
    drugA: 'telmisartan',
    drugB: 'ibuprofen',
    severity: 'moderate',
    title: 'Reduced Blood Pressure Control & Kidney Damage',
    description: 'NSAIDs like Ibuprofen decrease the antihypertensive effect of Telmisartan and increase renal risk.',
    recommendation: 'Avoid frequent NSAID use while taking blood pressure medications.'
  },
  {
    drugA: 'paracetamol',
    drugB: 'alcohol',
    severity: 'critical',
    title: 'Severe Liver Toxicity Risk',
    description: 'Alcohol induces CYP2E1 enzyme, leading to toxic NAPQI metabolite accumulation from Paracetamol.',
    recommendation: 'Do not consume alcohol while taking Paracetamol or pain relievers.'
  },
  {
    drugA: 'cetirizine',
    drugB: 'alprazolam',
    severity: 'moderate',
    title: 'Enhanced Central Nervous System Depression',
    description: 'Combining sedating antihistamines with benzodiazepines causes excessive drowsiness and slowed motor response.',
    recommendation: 'Do not drive or operate machinery when taking these medications together.'
  },
];

/* ── Sample Demo Cabinet ── */
export const SAMPLE_CABINET: CabinetMedicine[] = [
  {
    id: 'sample-1',
    name: 'Rabeprazole Sodium',
    brand: 'Peptard 20',
    active_ingredient: 'Rabeprazole Sodium 20mg',
    category: 'Antacid',
    dosage: '20mg',
    expiry_date: '2026-12-31',
    status: 'verified',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    name: 'Ibuprofen',
    brand: 'Combiflam',
    active_ingredient: 'Ibuprofen 400mg',
    category: 'NSAID',
    dosage: '400mg',
    expiry_date: '2024-01-15', // Expired!
    status: 'verified',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    name: 'Aspirin',
    brand: 'Ecosprin 75',
    active_ingredient: 'Aspirin 75mg',
    category: 'Antiplatelet',
    dosage: '75mg',
    expiry_date: '2027-05-20',
    status: 'verified',
    addedAt: new Date().toISOString(),
  }
];

/* ── Risk Calculation Engine ── */
export interface RiskAnalysisResult {
  score: number; // 0 to 100
  level: 'low' | 'moderate' | 'high' | 'critical';
  color: string;
  badgeText: string;
  detectedInteractions: Array<{
    rule: InteractionRule;
    medicineA: CabinetMedicine;
    medicineB: CabinetMedicine;
  }>;
  expiredMedicines: CabinetMedicine[];
  recalledMedicines: CabinetMedicine[];
  unverifiedMedicines: CabinetMedicine[];
  recommendations: string[];
}

export function analyzeCabinetRisk(cabinet: CabinetMedicine[]): RiskAnalysisResult {
  let score = 0;
  const detectedInteractions: Array<{ rule: InteractionRule; medicineA: CabinetMedicine; medicineB: CabinetMedicine }> = [];
  const expiredMedicines: CabinetMedicine[] = [];
  const recalledMedicines: CabinetMedicine[] = [];
  const unverifiedMedicines: CabinetMedicine[] = [];
  const recommendations: string[] = [];

  const now = new Date();

  // 1. Check expired / recalled / suspicious
  cabinet.forEach(med => {
    if (med.expiry_date && new Date(med.expiry_date) < now) {
      expiredMedicines.push(med);
      score += 25;
      recommendations.push(`Safely dispose expired medicine "${med.brand || med.name}" (Expired ${new Date(med.expiry_date).toLocaleDateString()}).`);
    }
    if (med.status === 'recalled' || med.status === 'suspicious') {
      recalledMedicines.push(med);
      score += 35;
      recommendations.push(`IMMEDIATE ACTION: Do not consume "${med.brand || med.name}" — flagged as ${med.status.toUpperCase()}.`);
    }
    if (med.status === 'unknown') {
      unverifiedMedicines.push(med);
      score += 10;
    }
  });

  // 2. Check drug-drug interactions
  for (let i = 0; i < cabinet.length; i++) {
    for (let j = i + 1; j < cabinet.length; j++) {
      const medA = cabinet[i];
      const medB = cabinet[j];

      const keyA = `${medA.name} ${medA.brand} ${medA.active_ingredient} ${medA.category}`.toLowerCase();
      const keyB = `${medB.name} ${medB.brand} ${medB.active_ingredient} ${medB.category}`.toLowerCase();

      INTERACTION_RULES.forEach(rule => {
        const matchesA = keyA.includes(rule.drugA) || keyA.includes(rule.drugB);
        const matchesB = keyB.includes(rule.drugA) || keyB.includes(rule.drugB);
        const crossMatch = (keyA.includes(rule.drugA) && keyB.includes(rule.drugB)) ||
                           (keyA.includes(rule.drugB) && keyB.includes(rule.drugA));

        if (crossMatch || (matchesA && matchesB && rule.drugA !== rule.drugB)) {
          detectedInteractions.push({ rule, medicineA: medA, medicineB: medB });
          if (rule.severity === 'critical') score += 30;
          else if (rule.severity === 'moderate') score += 15;
          else score += 5;

          recommendations.push(`Interaction alert: ${rule.title} between ${medA.brand || medA.name} and ${medB.brand || medB.name}.`);
        }
      });
    }
  }

  // Cap score at 100
  const finalScore = Math.min(100, Math.max(0, score));

  let level: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  let color = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  let badgeText = 'LOW RISK — Cabinet Appears Safe';

  if (finalScore >= 70) {
    level = 'critical';
    color = 'text-red-700 bg-red-50 border-red-300';
    badgeText = 'CRITICAL HEALTH RISK — Immediate Review Needed';
  } else if (finalScore >= 40) {
    level = 'high';
    color = 'text-amber-800 bg-amber-50 border-amber-300';
    badgeText = 'HIGH RISK — Attention Required';
  } else if (finalScore >= 15) {
    level = 'moderate';
    color = 'text-yellow-800 bg-yellow-50 border-yellow-200';
    badgeText = 'MODERATE RISK — Minor Warnings Detected';
  }

  if (recommendations.length === 0) {
    recommendations.push('Keep medications stored in a cool, dry place away from direct sunlight.');
    recommendations.push('Always check expiry dates before consuming any medicine.');
  }

  return {
    score: finalScore,
    level,
    color,
    badgeText,
    detectedInteractions,
    expiredMedicines,
    recalledMedicines,
    unverifiedMedicines,
    recommendations,
  };
}
