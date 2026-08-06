-- ==========================================
-- PATIENT PORTAL ENTERPRISE MODULES SCHEMA
-- ==========================================

-- 1. ADMISSION MANAGEMENT
CREATE TABLE IF NOT EXISTS public.wards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'General', 'ICU', 'Emergency', 'Pediatrics'
  capacity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_id UUID REFERENCES public.wards(id) ON DELETE CASCADE NOT NULL,
  room_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(ward_id, room_number)
);

CREATE TABLE IF NOT EXISTS public.beds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  bed_number TEXT NOT NULL,
  is_occupied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(room_id, bed_number)
);

CREATE TABLE IF NOT EXISTS public.admissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  head_nurse_name TEXT,
  bed_id UUID REFERENCES public.beds(id) ON DELETE SET NULL,
  admission_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expected_discharge_date TIMESTAMP WITH TIME ZONE,
  actual_discharge_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'Admitted', -- 'Admitted', 'Discharged', 'Transferred'
  reason_for_admission TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bed_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_id UUID REFERENCES public.admissions(id) ON DELETE CASCADE NOT NULL,
  previous_bed_id UUID REFERENCES public.beds(id) ON DELETE SET NULL,
  new_bed_id UUID REFERENCES public.beds(id) ON DELETE SET NULL,
  transfer_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reason TEXT
);

-- 2. CANTEEN / FOOD ORDERING
CREATE TABLE IF NOT EXISTS public.food_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.food_categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.canteen_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  admission_id UUID REFERENCES public.admissions(id) ON DELETE SET NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Preparing', 'Delivering', 'Delivered', 'Cancelled'
  delivery_location TEXT NOT NULL, -- e.g., 'Ward A, Room 101, Bed 3' or 'Self Pickup'
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.canteen_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.canteen_orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bed_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canteen_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canteen_order_items ENABLE ROW LEVEL SECURITY;

-- Patients can view wards, rooms, beds, food categories, menu items
CREATE POLICY "Public read wards" ON public.wards FOR SELECT USING (true);
CREATE POLICY "Public read rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Public read beds" ON public.beds FOR SELECT USING (true);
CREATE POLICY "Public read food categories" ON public.food_categories FOR SELECT USING (true);
CREATE POLICY "Public read menu items" ON public.menu_items FOR SELECT USING (true);

-- Patients can only see their own admissions and transfers
CREATE POLICY "Patient read own admissions" ON public.admissions FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patient read own transfers" ON public.bed_transfers FOR SELECT USING (
  admission_id IN (SELECT id FROM public.admissions WHERE patient_id = auth.uid())
);

-- Patients can see their own orders and insert them
CREATE POLICY "Patient read own orders" ON public.canteen_orders FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patient insert own orders" ON public.canteen_orders FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patient read own order items" ON public.canteen_order_items FOR SELECT USING (
  order_id IN (SELECT id FROM public.canteen_orders WHERE patient_id = auth.uid())
);
CREATE POLICY "Patient insert own order items" ON public.canteen_order_items FOR INSERT WITH CHECK (
  order_id IN (SELECT id FROM public.canteen_orders WHERE patient_id = auth.uid())
);

-- Note: Staff RLS policies would normally be added here allowing them full CRUD access.
-- For the sake of the Patient Portal, these policies allow the system to work for the authenticated patient.
