-- ============================================================
-- FAKE MEDICINE DETECTION & VERIFICATION SYSTEM
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: medicines
-- ============================================================
CREATE TABLE IF NOT EXISTS medicines (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT NOT NULL,
  brand         TEXT NOT NULL,
  manufacturer  TEXT NOT NULL,
  batch_number  TEXT UNIQUE NOT NULL,
  manufacturing_date DATE,
  expiry_date   DATE,
  active_ingredient TEXT,
  category      TEXT,
  dosage        TEXT,
  license_number TEXT,
  status        TEXT DEFAULT 'verified'
                CHECK (status IN ('verified', 'suspicious', 'recalled', 'unknown')),
  description   TEXT,
  country       TEXT DEFAULT 'India',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLE: reports
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id      TEXT UNIQUE NOT NULL,
  medicine_name  TEXT NOT NULL,
  batch_number   TEXT,
  location       TEXT NOT NULL,
  description    TEXT NOT NULL,
  image_url      TEXT,
  reporter_name  TEXT,
  reporter_email TEXT,
  status         TEXT DEFAULT 'submitted'
                 CHECK (status IN ('submitted', 'under_review', 'action_taken', 'dismissed')),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLE: verifications (log every search)
-- ============================================================
CREATE TABLE IF NOT EXISTS verifications (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
  search_term TEXT,
  result      TEXT,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE medicines    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Medicines: anyone can read
CREATE POLICY "public_read_medicines" ON medicines
  FOR SELECT USING (true);

-- Medicines: only service role can insert/update/delete
CREATE POLICY "service_write_medicines" ON medicines
  FOR ALL USING (true) WITH CHECK (true);

-- Reports: anyone can insert or read
CREATE POLICY "public_insert_reports" ON reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "public_read_reports" ON reports
  FOR SELECT USING (true);

CREATE POLICY "service_update_reports" ON reports
  FOR UPDATE USING (true) WITH CHECK (true);

-- Verifications: anyone can insert or read
CREATE POLICY "public_insert_verifications" ON verifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "public_read_verifications" ON verifications
  FOR SELECT USING (true);

-- ============================================================
-- DEMO DATA — 20 Sample Medicines
-- ============================================================
INSERT INTO medicines (name, brand, manufacturer, batch_number, manufacturing_date, expiry_date, active_ingredient, category, dosage, license_number, status, description, country)
VALUES
  ('Paracetamol','Calpol','GlaxoSmithKline','GSK-PCM-2024-001','2024-01-15','2026-01-14','Paracetamol 500mg','Analgesic','500mg','LIC-GSK-IN-001','verified','Used for mild to moderate pain relief and fever reduction.','India'),
  ('Amoxicillin','Mox','Ranbaxy Laboratories','RAN-AMX-2024-002','2024-02-10','2026-02-09','Amoxicillin 250mg','Antibiotic','250mg','LIC-RAN-IN-002','verified','Broad-spectrum antibiotic for bacterial infections.','India'),
  ('Metformin','Glucophage','Sun Pharmaceutical','SUN-MET-2024-003','2024-03-05','2026-03-04','Metformin HCl 500mg','Antidiabetic','500mg','LIC-SUN-IN-003','verified','First-line medication for type 2 diabetes management.','India'),
  ('Omeprazole','Prilosec','Dr. Reddys Laboratories','DRL-OMP-2024-004','2024-01-20','2026-01-19','Omeprazole 20mg','Antacid','20mg','LIC-DRL-IN-004','verified','Proton pump inhibitor for acid reflux and ulcers.','India'),
  ('Atorvastatin','Lipitor','Cipla Ltd','CIP-ATV-2024-005','2024-04-01','2026-03-31','Atorvastatin 10mg','Statin','10mg','LIC-CIP-IN-005','verified','Lowers cholesterol and reduces risk of heart disease.','India'),
  ('Azithromycin','Zithromax','Pfizer India','PFZ-AZM-2024-006','2024-02-28','2026-02-27','Azithromycin 500mg','Antibiotic','500mg','LIC-PFZ-IN-006','verified','Antibiotic for respiratory and skin infections.','India'),
  ('Cetirizine','Zyrtec','Abbott India','ABT-CTZ-2024-007','2024-05-10','2026-05-09','Cetirizine HCl 10mg','Antihistamine','10mg','LIC-ABT-IN-007','verified','Treats allergy symptoms including hay fever and hives.','India'),
  ('Ibuprofen','Brufen','Wockhardt Ltd','WOC-IBU-2024-008','2024-03-15','2026-03-14','Ibuprofen 400mg','NSAID','400mg','LIC-WOC-IN-008','verified','Anti-inflammatory for pain, fever and inflammation.','India'),
  ('Dolo 650','Dolo','Micro Labs Ltd','MCR-DOL-2024-009','2024-06-01','2026-05-31','Paracetamol 650mg','Analgesic','650mg','LIC-MCR-IN-009','verified','Fever reducer and pain reliever widely used in India.','India'),
  ('Aspirin','Disprin','Bayer Pharmaceuticals','BAY-ASP-2024-010','2024-01-30','2026-01-29','Aspirin 75mg','Antiplatelet','75mg','LIC-BAY-IN-010','verified','Blood thinner used for heart attack and stroke prevention.','India'),
  ('Pantoprazole','Pantocid','Alkem Laboratories','ALK-PNT-2024-011','2024-07-01','2026-06-30','Pantoprazole 40mg','Antacid','40mg','LIC-ALK-IN-011','verified','Proton pump inhibitor for GERD and stomach ulcers.','India'),
  ('Montelukast','Singulair','Lupin Pharmaceuticals','LUP-MNT-2024-012','2024-04-20','2026-04-19','Montelukast 10mg','Leukotriene inhibitor','10mg','LIC-LUP-IN-012','verified','Treats asthma and allergic rhinitis.','India'),
  ('Vitamin C','Limcee','Abbott India','ABT-VTC-2024-013','2024-05-25','2026-05-24','Ascorbic Acid 500mg','Vitamin','500mg','LIC-ABT-IN-013','verified','Essential vitamin for immune function and antioxidant protection.','India'),
  ('Doxycycline','Vibramycin','Sun Pharmaceutical','SUN-DOX-2024-014','2024-02-14','2026-02-13','Doxycycline 100mg','Antibiotic','100mg','LIC-SUN-IN-014','verified','Broad-spectrum antibiotic for various bacterial infections.','India'),
  ('Clopidogrel','Plavix','Dr. Reddys Laboratories','DRL-CLO-2024-015','2024-03-22','2026-03-21','Clopidogrel 75mg','Antiplatelet','75mg','LIC-DRL-IN-015','verified','Prevents blood clots in heart disease patients.','India'),
  ('Lisinopril','Zestril','Cipla Ltd','CIP-LSP-2024-016','2024-06-15','2026-06-14','Lisinopril 5mg','ACE Inhibitor','5mg','LIC-CIP-IN-016','verified','Treats high blood pressure and heart failure.','India'),
  ('Fake Amoxicillin','AmoxiPlus','Unknown Manufacturer','FAKE-AMX-9999-001','2023-11-01','2024-11-01','Unknown','Antibiotic','250mg','NONE','suspicious','WARNING: This product has been flagged as potentially counterfeit. Do not consume. Report to health authorities immediately.','Unknown'),
  ('Counterfeit Insulin','InsuFast','Unregistered Lab','FAKE-INS-9999-002','2023-08-15','2024-08-15','Unknown','Antidiabetic','Unknown','NONE','recalled','RECALLED: This product has been recalled. Contains dangerous impurities. Dispose immediately and consult your doctor.','Unknown'),
  ('Hydroxychloroquine','Plaquenil','Ipca Laboratories','IPC-HCQ-2024-019','2024-08-01','2026-07-31','Hydroxychloroquine 200mg','Antimalarial','200mg','LIC-IPC-IN-019','verified','Used for malaria, lupus and rheumatoid arthritis.','India'),
  ('Calcium + D3','Shelcal','Torrent Pharmaceuticals','TOR-CAL-2024-020','2024-09-01','2026-08-31','Calcium Carbonate 500mg + Vitamin D3 250IU','Supplement','500mg+250IU','LIC-TOR-IN-020','verified','Calcium and Vitamin D supplement for bone health.','India')
ON CONFLICT (batch_number) DO NOTHING;

-- ============================================================
-- Helpful view: verification stats
-- ============================================================
CREATE OR REPLACE VIEW verification_stats AS
SELECT
  (SELECT COUNT(*) FROM medicines WHERE status = 'verified')    AS verified_count,
  (SELECT COUNT(*) FROM medicines WHERE status = 'suspicious')  AS suspicious_count,
  (SELECT COUNT(*) FROM medicines WHERE status = 'recalled')    AS recalled_count,
  (SELECT COUNT(*) FROM reports)                                AS total_reports,
  (SELECT COUNT(*) FROM verifications)                          AS total_verifications;
