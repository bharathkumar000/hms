-- ==========================================
-- HOSPITAL CANTEEN MANAGEMENT SYSTEM SCHEMA
-- ==========================================

-- 1. Modify existing canteen_orders to support Staff Orders & Delivery Tracking
ALTER TABLE public.canteen_orders ALTER COLUMN patient_id DROP NOT NULL;
ALTER TABLE public.canteen_orders ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.canteen_orders ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'Patient' CHECK (order_type IN ('Patient', 'Staff'));
ALTER TABLE public.canteen_orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Refunded'));
ALTER TABLE public.canteen_orders ADD COLUMN IF NOT EXISTS delivery_person_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.canteen_orders ADD COLUMN IF NOT EXISTS delivery_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.canteen_orders ADD COLUMN IF NOT EXISTS kitchen_notes TEXT;

-- 2. Modify existing menu_items
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS category TEXT;

-- 3. Canteen Payments
CREATE TABLE IF NOT EXISTS public.canteen_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.canteen_orders(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Card', 'Added to Bill')),
  transaction_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'Completed' CHECK (payment_status IN ('Completed', 'Failed', 'Refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Canteen Settings
CREATE TABLE IF NOT EXISTS public.canteen_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_open BOOLEAN DEFAULT true,
  opening_time TIME NOT NULL DEFAULT '07:00:00',
  closing_time TIME NOT NULL DEFAULT '22:00:00',
  notification_email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initialize default settings
INSERT INTO public.canteen_settings (id, is_open) 
VALUES (uuid_generate_v4(), true)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.canteen_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canteen_settings ENABLE ROW LEVEL SECURITY;

-- Note: In this project's demo context, RLS policies are typically bypassed for the demo,
-- but we create basic open policies for the authenticated users as a foundation.
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.canteen_payments;
CREATE POLICY "Enable read access for all authenticated users" ON public.canteen_payments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON public.canteen_payments;
CREATE POLICY "Enable insert for all authenticated users" ON public.canteen_payments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON public.canteen_payments;
CREATE POLICY "Enable update for all authenticated users" ON public.canteen_payments FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.canteen_settings;
CREATE POLICY "Enable read access for all authenticated users" ON public.canteen_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON public.canteen_settings;
CREATE POLICY "Enable insert for all authenticated users" ON public.canteen_settings FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON public.canteen_settings;
CREATE POLICY "Enable update for all authenticated users" ON public.canteen_settings FOR UPDATE TO authenticated USING (true);

-- 5. Fix RLS for menu_items and canteen_orders for Canteen Portal Operations (Allowing Demo Mode / Anon)
DROP POLICY IF EXISTS "Enable insert for all users" ON public.menu_items;
CREATE POLICY "Enable insert for all users" ON public.menu_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON public.menu_items;
CREATE POLICY "Enable update for all users" ON public.menu_items FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Enable delete for all users" ON public.menu_items;
CREATE POLICY "Enable delete for all users" ON public.menu_items FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON public.food_categories;
CREATE POLICY "Enable insert for all users" ON public.food_categories FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON public.food_categories;
CREATE POLICY "Enable update for all users" ON public.food_categories FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON public.canteen_orders;
CREATE POLICY "Enable insert for all users" ON public.canteen_orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for all users" ON public.canteen_orders;
CREATE POLICY "Enable update for all users" ON public.canteen_orders FOR UPDATE USING (true);
