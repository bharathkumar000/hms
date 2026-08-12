-- ==========================================
-- ADMIN PORTAL ENTERPRISE MODULES SCHEMA
-- ==========================================

-- 1. Modifying Wards Table
ALTER TABLE public.wards
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS head_nurse_id UUID,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS ward_code TEXT UNIQUE;

-- 2. Modifying Rooms Table
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS capacity INTEGER,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- 3. Modifying Beds Table
ALTER TABLE public.beds
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Available',
ADD COLUMN IF NOT EXISTS maintenance_info TEXT;

-- Migrate existing is_occupied data
UPDATE public.beds SET status = 'Occupied' WHERE is_occupied = true;

-- 4. Creating Nurses Table
CREATE TABLE IF NOT EXISTS public.nurses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  phone_number TEXT,
  email TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key constraint to wards for head_nurse_id
ALTER TABLE public.wards
DROP CONSTRAINT IF EXISTS fk_wards_head_nurse;

ALTER TABLE public.wards
ADD CONSTRAINT fk_wards_head_nurse
FOREIGN KEY (head_nurse_id) REFERENCES public.nurses(id) ON DELETE SET NULL;

-- 5. Roles & User Roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, role_id)
);

-- Pre-populate default roles
INSERT INTO public.roles (name, description) VALUES
  ('Admin', 'Full hospital management access'),
  ('Doctor', 'Patient consultation and medical records'),
  ('Receptionist', 'Patient registration and admissions'),
  ('Laboratory Staff', 'Lab tests and reports'),
  ('Pharmacist', 'Inventory and dispensing'),
  ('Billing Staff', 'Invoices and payments'),
  ('Nurse', 'Ward and patient care')
ON CONFLICT (name) DO NOTHING;

-- 6. Hospital Settings table
CREATE TABLE IF NOT EXISTS public.hospital_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Login History table
CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'Success'
);

-- Enable RLS (Assuming existing tables already have it, enabling on new tables)
ALTER TABLE public.nurses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Standard Public Policies for now (can be restricted later via Admin role checks)
CREATE POLICY "Enable read access for all users" ON public.nurses FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.nurses FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.user_roles FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.hospital_settings FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.hospital_settings FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON public.login_history FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.login_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Additional policies for existing infrastructure tables to allow Admin CRUD
CREATE POLICY "Enable all access for authenticated users" ON public.wards FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.rooms FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.beds FOR ALL USING (auth.role() = 'authenticated');
