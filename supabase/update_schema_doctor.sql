-- ==========================================
-- DOCTOR PORTAL ENTERPRISE SCHEMA UPDATES
-- ==========================================

-- 1. Treatment Plans (Extends Medical Records)
CREATE TABLE IF NOT EXISTS public.treatment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  symptoms TEXT,
  examination_findings TEXT,
  treatment_instructions TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ward Transfer Requests
CREATE TABLE IF NOT EXISTS public.ward_transfer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_id UUID REFERENCES public.admissions(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  from_ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
  to_ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  request_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  processed_date TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. Discharge Recommendations
CREATE TABLE IF NOT EXISTS public.discharge_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_id UUID REFERENCES public.admissions(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  recommended_discharge_date DATE NOT NULL,
  discharge_notes TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  processed_date TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ward_transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discharge_recommendations ENABLE ROW LEVEL SECURITY;

-- Note: We use "Enable for all users" in Demo Mode because the Demo Auth cookie 
-- bypasses the real Supabase JWT, treating requests as anonymous.
DROP POLICY IF EXISTS "Enable all access for treatment_plans" ON public.treatment_plans;
CREATE POLICY "Enable all access for treatment_plans" ON public.treatment_plans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for ward_transfer_requests" ON public.ward_transfer_requests;
CREATE POLICY "Enable all access for ward_transfer_requests" ON public.ward_transfer_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for discharge_recommendations" ON public.discharge_recommendations;
CREATE POLICY "Enable all access for discharge_recommendations" ON public.discharge_recommendations FOR ALL USING (true) WITH CHECK (true);

-- Also ensure doctors (public in demo mode) can insert and update medical_records
DROP POLICY IF EXISTS "Enable all access for medical_records" ON public.medical_records;
CREATE POLICY "Enable all access for medical_records" ON public.medical_records FOR ALL USING (true) WITH CHECK (true);

-- Ensure doctors can update appointments
DROP POLICY IF EXISTS "Enable all access for appointments" ON public.appointments;
CREATE POLICY "Enable all access for appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);

-- Ensure doctors can insert prescriptions
DROP POLICY IF EXISTS "Enable all access for prescriptions" ON public.prescriptions;
CREATE POLICY "Enable all access for prescriptions" ON public.prescriptions FOR ALL USING (true) WITH CHECK (true);

-- Ensure doctors can insert lab_orders
DROP POLICY IF EXISTS "Enable all access for lab_orders" ON public.lab_orders;
CREATE POLICY "Enable all access for lab_orders" ON public.lab_orders FOR ALL USING (true) WITH CHECK (true);

-- Ensure doctors can update their own availability and leave requests
DROP POLICY IF EXISTS "Enable all access for doctor_availability" ON public.doctor_availability;
CREATE POLICY "Enable all access for doctor_availability" ON public.doctor_availability FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for leave_requests" ON public.leave_requests;
CREATE POLICY "Enable all access for leave_requests" ON public.leave_requests FOR ALL USING (true) WITH CHECK (true);

-- Ensure doctors can view profiles
DROP POLICY IF EXISTS "Enable all access for profiles" ON public.profiles;
CREATE POLICY "Enable all access for profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Ensure doctors can update doctors table (for settings/profile)
DROP POLICY IF EXISTS "Enable all access for doctors" ON public.doctors;
CREATE POLICY "Enable all access for doctors" ON public.doctors FOR ALL USING (true) WITH CHECK (true);
