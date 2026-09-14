export type MedicineStatus = 'verified' | 'suspicious' | 'recalled' | 'unknown';
export type ReportStatus = 'submitted' | 'under_review' | 'action_taken' | 'dismissed';

export interface Medicine {
  id: string;
  name: string;
  brand: string;
  manufacturer: string;
  batch_number: string;
  manufacturing_date: string;
  expiry_date: string;
  active_ingredient: string;
  category: string;
  dosage: string;
  license_number: string;
  status: MedicineStatus;
  description: string;
  country: string;
  created_at: string;
}

export interface Report {
  id: string;
  report_id: string;
  medicine_name: string;
  batch_number: string;
  location: string;
  description: string;
  image_url?: string;
  reporter_name?: string;
  reporter_email?: string;
  status: ReportStatus;
  created_at: string;
}

export interface Verification {
  id: string;
  medicine_id: string;
  search_term: string;
  result: string;
  verified_at: string;
}
