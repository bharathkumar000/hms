-- Patients table (extended profile)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  phone_number TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  blood_group TEXT,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  department TEXT,
  phone_number TEXT,
  email TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'Upcoming', -- Upcoming, Completed, Cancelled
  reason_for_visit TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Medical Records table
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  diagnosis TEXT,
  doctor_notes TEXT,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Documents (Lab reports, etc.) table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- Lab Report, Prescription, Other
  document_url TEXT NOT NULL,
  title TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  status TEXT DEFAULT 'Active', -- Active, Completed
  
  -- Pharmacy tracking fields
  dispense_status TEXT DEFAULT 'Pending', -- Pending, Partially Dispensed, Completed
  dispensed_quantity INTEGER DEFAULT 0,
  pharmacist_id UUID, -- Will reference pharmacists table
  dispense_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  bill_type TEXT DEFAULT 'General', -- General, Pharmacy
  status TEXT DEFAULT 'Pending', -- Pending, Paid
  due_date DATE,
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  transaction_id TEXT
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT, -- Appointment, Billing, Report
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Laboratory Staff table
CREATE TABLE IF NOT EXISTS public.lab_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  role TEXT DEFAULT 'Technician', -- Technician, Pathologist
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Lab Orders table (Expanded for Laboratory Portal)
CREATE TABLE IF NOT EXISTS public.lab_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  test_category TEXT NOT NULL,
  notes TEXT,
  
  -- Laboratory fields
  technician_id UUID REFERENCES public.lab_staff(id) ON DELETE SET NULL,
  sample_id TEXT,
  collection_time TIMESTAMP WITH TIME ZONE,
  processing_start_time TIMESTAMP WITH TIME ZONE,
  completion_time TIMESTAMP WITH TIME ZONE,
  report_url TEXT,
  report_status TEXT DEFAULT 'Pending', -- Draft, Approved, Released
  urgent BOOLEAN DEFAULT false,
  
  status TEXT DEFAULT 'Pending', -- Pending, Sample Requested, Sample Collected, Sample Received, Processing, Completed, Report Ready, Released, Cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Emergency Cases table
CREATE TABLE IF NOT EXISTS public.emergency_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  priority TEXT NOT NULL, -- Critical, High, Medium
  department TEXT NOT NULL,
  notes TEXT,
  arrival_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT DEFAULT 'Active' -- Active, Resolved
);

-- Doctor Availability table
CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  working_days TEXT[] NOT NULL,
  working_hours TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Leave Requests table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reception Staff table
CREATE TABLE IF NOT EXISTS public.reception_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Patient Queue table
CREATE TABLE IF NOT EXISTS public.patient_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  token_number TEXT NOT NULL,
  status TEXT DEFAULT 'Waiting', -- Waiting, In Consultation, Completed, Skipped
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Patients
-- Patients can read and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Patients can read their own appointments
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = patient_id);
-- Patients can create their own appointments
CREATE POLICY "Users can create own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
-- Patients can update their own appointments (e.g., reschedule, cancel)
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = patient_id);

-- Patients can read their own medical records
CREATE POLICY "Users can view own medical records" ON public.medical_records FOR SELECT USING (auth.uid() = patient_id);

-- Patients can read their own documents
CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (auth.uid() = patient_id);

-- Patients can read their own prescriptions
CREATE POLICY "Users can view own prescriptions" ON public.prescriptions FOR SELECT USING (auth.uid() = patient_id);

-- Patients can read their own bills
CREATE POLICY "Users can view own bills" ON public.bills FOR SELECT USING (auth.uid() = patient_id);

-- Patients can read their own payments
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = patient_id);

-- Patients can read and update their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Doctors table is readable by everyone (so patients can see doctor list)
CREATE POLICY "Doctors are viewable by everyone" ON public.doctors FOR SELECT USING (true);

-- Enable RLS on new tables
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reception_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Doctors
-- In a real app, doctors would only access their own assigned patients.
-- For this demo/development environment, we will allow doctors to view everything, 
-- or limit to doctor_id where applicable.
CREATE POLICY "Doctors view all appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Doctors update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors view all medical records" ON public.medical_records FOR SELECT USING (true);
CREATE POLICY "Doctors insert medical records" ON public.medical_records FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors update medical records" ON public.medical_records FOR UPDATE USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors view all prescriptions" ON public.prescriptions FOR SELECT USING (true);
CREATE POLICY "Doctors insert prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors view all profiles" ON public.profiles FOR SELECT USING (true);

-- Doctor Availability
CREATE POLICY "Doctors view own availability" ON public.doctor_availability FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors insert own availability" ON public.doctor_availability FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors update own availability" ON public.doctor_availability FOR UPDATE USING (auth.uid() = doctor_id);

-- Leave Requests
CREATE POLICY "Doctors view own leave" ON public.leave_requests FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors insert own leave" ON public.leave_requests FOR INSERT WITH CHECK (auth.uid() = doctor_id);

-- Lab Orders
CREATE POLICY "Doctors view all lab orders" ON public.lab_orders FOR SELECT USING (true);
CREATE POLICY "Doctors insert lab orders" ON public.lab_orders FOR INSERT WITH CHECK (auth.uid() = doctor_id);

-- Emergency Cases
CREATE POLICY "Doctors view all emergency cases" ON public.emergency_cases FOR SELECT USING (true);

-- RLS Policies for Reception Staff
-- In this demo environment, reception staff have full access to these tables.
CREATE POLICY "Reception staff full access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Reception staff full access appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Reception staff full access patient_queue" ON public.patient_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Reception staff full access bills" ON public.bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Reception staff full access payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Reception staff view own profile" ON public.reception_staff FOR SELECT USING (true);
CREATE POLICY "Reception staff update own profile" ON public.reception_staff FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Laboratory Staff
CREATE POLICY "Lab staff full access lab_orders" ON public.lab_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lab staff view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Lab staff view doctors" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Lab staff full access documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lab staff view own profile" ON public.lab_staff FOR SELECT USING (true);
CREATE POLICY "Lab staff update own profile" ON public.lab_staff FOR UPDATE USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- PHARMACY PORTAL TABLES
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pharmacists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We add foreign key constraint here to avoid circular dependency above
ALTER TABLE public.prescriptions 
  ADD CONSTRAINT fk_pharmacist FOREIGN KEY (pharmacist_id) REFERENCES public.pharmacists(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  manufacturer TEXT,
  description TEXT,
  price_per_unit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  minimum_stock_level INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.medicine_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  batch_number TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE NOT NULL,
  manufacture_date DATE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.stock_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
  batch_id UUID REFERENCES public.medicine_batches(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- IN, OUT
  quantity INTEGER NOT NULL,
  reference_type TEXT, -- Prescription, Purchase Order, Manual
  reference_id TEXT, -- Prescription ID or PO ID
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Pending', -- Pending, Approved, Received, Cancelled
  total_amount DECIMAL(10, 2) DEFAULT 0,
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  invoice_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
  medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Pharmacy tables
ALTER TABLE public.pharmacists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Pharmacists
-- Pharmacists have full access to pharmacy modules
CREATE POLICY "Pharmacist view own profile" ON public.pharmacists FOR SELECT USING (true);
CREATE POLICY "Pharmacist update own profile" ON public.pharmacists FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Pharmacist full access medicines" ON public.medicines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Pharmacist full access suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Pharmacist full access batches" ON public.medicine_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Pharmacist full access transactions" ON public.stock_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Pharmacist full access purchase orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Pharmacist full access po items" ON public.purchase_order_items FOR ALL USING (true) WITH CHECK (true);

-- Pharmacists need access to prescriptions and profiles
CREATE POLICY "Pharmacist full access prescriptions" ON public.prescriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Pharmacist view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Pharmacist full access bills" ON public.bills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Pharmacist full access payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------
-- ADMIN PORTAL TABLES
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  head_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Active', -- Active, Inactive
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  department TEXT,
  status TEXT DEFAULT 'Operational', -- Operational, Maintenance, Faulty
  maintenance_schedule DATE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- e.g., 'Profile', 'Appointment'
  entity_id TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL, -- Auth, Database, API, Security
  message TEXT NOT NULL,
  error_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Admin tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Admins get full access to EVERYTHING. For demo, we just allow anyone to do anything on these tables to keep it simple, 
-- but in reality we would use auth.uid() matching an admin record. 
-- Since we are doing a demo where any logged in user can potentially be an admin if they use the admin portal login,
-- we'll allow all authenticated users (or just true) for these new tables.
CREATE POLICY "Admins full access admins" ON public.admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access equipment" ON public.equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access system_logs" ON public.system_logs FOR ALL USING (true) WITH CHECK (true);
