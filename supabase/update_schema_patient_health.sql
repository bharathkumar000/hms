-- ==========================================
-- PATIENT HEALTH TRACKING SCHEMA
-- Daily vitals (BP / sugar) + medication reminders
-- ==========================================

-- 1. DAILY VITALS (one row per patient per day, updated by patient or staff)
CREATE TABLE IF NOT EXISTS public.daily_vitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recorded_on DATE NOT NULL DEFAULT CURRENT_DATE,
  bp_systolic INTEGER,
  bp_diastolic INTEGER,
  blood_sugar INTEGER, -- mg/dL
  sugar_type TEXT DEFAULT 'Fasting', -- Fasting / Post Meal / Random
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(patient_id, recorded_on)
);

ALTER TABLE public.daily_vitals ENABLE ROW LEVEL SECURITY;

-- Patients can read / insert / update their own vitals
DROP POLICY IF EXISTS "Patients view own daily vitals" ON public.daily_vitals;
CREATE POLICY "Patients view own daily vitals" ON public.daily_vitals
  FOR SELECT USING (auth.uid() = patient_id);
DROP POLICY IF EXISTS "Patients insert own daily vitals" ON public.daily_vitals;
CREATE POLICY "Patients insert own daily vitals" ON public.daily_vitals
  FOR INSERT WITH CHECK (auth.uid() = patient_id);
DROP POLICY IF EXISTS "Patients update own daily vitals" ON public.daily_vitals;
CREATE POLICY "Patients update own daily vitals" ON public.daily_vitals
  FOR UPDATE USING (auth.uid() = patient_id);

-- Hospital staff (doctors, nurses, lab, reception) can read all vitals
DROP POLICY IF EXISTS "Staff view all daily vitals" ON public.daily_vitals;
CREATE POLICY "Staff view all daily vitals" ON public.daily_vitals
  FOR SELECT TO authenticated USING (true);

-- 2. MEDICATION REMINDERS
CREATE TABLE IF NOT EXISTS public.medication_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT, -- e.g. 'Twice daily', 'Once daily'
  reminder_times TEXT[], -- e.g. {'08:00','20:00'}
  schedule_note TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients view own reminders" ON public.medication_reminders;
CREATE POLICY "Patients view own reminders" ON public.medication_reminders
  FOR SELECT USING (auth.uid() = patient_id);
DROP POLICY IF EXISTS "Patients update own reminders" ON public.medication_reminders;
CREATE POLICY "Patients update own reminders" ON public.medication_reminders
  FOR UPDATE USING (auth.uid() = patient_id);
DROP POLICY IF EXISTS "Staff view all reminders" ON public.medication_reminders;
CREATE POLICY "Staff view all reminders" ON public.medication_reminders
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff insert reminders" ON public.medication_reminders;
CREATE POLICY "Staff insert reminders" ON public.medication_reminders
  FOR INSERT TO authenticated WITH CHECK (true);