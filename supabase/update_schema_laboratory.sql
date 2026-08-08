-- --------------------------------------------------------
-- LABORATORY PORTAL EXTENDED TABLES & POLICIES
-- --------------------------------------------------------

-- Lab Samples table
CREATE TABLE IF NOT EXISTS public.lab_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.lab_orders(id) ON DELETE CASCADE NOT NULL,
  barcode TEXT UNIQUE,
  status TEXT DEFAULT 'Awaiting Collection', -- Awaiting Collection, Collected, Processing, Completed, Rejected
  collected_by UUID REFERENCES public.lab_staff(id) ON DELETE SET NULL,
  collection_notes TEXT,
  recollection_required BOOLEAN DEFAULT false,
  recollection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Lab Reports (Two-stage approval)
CREATE TABLE IF NOT EXISTS public.lab_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.lab_orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'Draft', -- Draft, Pending Approval, Approved, Released
  results_data JSONB, -- Stores the actual test results
  technician_id UUID REFERENCES public.lab_staff(id) ON DELETE SET NULL,
  pathologist_id UUID REFERENCES public.lab_staff(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  report_file_url TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Lab Reagents (Inventory)
CREATE TABLE IF NOT EXISTS public.lab_reagents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  manufacturer TEXT,
  batch_number TEXT,
  stock_level INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 10,
  unit TEXT DEFAULT 'ml',
  expiry_date DATE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Lab Equipment Maintenance
CREATE TABLE IF NOT EXISTS public.lab_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE NOT NULL,
  maintenance_type TEXT, -- Routine, Repair, Calibration
  scheduled_date DATE,
  completed_date DATE,
  performed_by TEXT,
  notes TEXT,
  status TEXT DEFAULT 'Scheduled', -- Scheduled, In Progress, Completed, Overdue
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.lab_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reagents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_maintenance ENABLE ROW LEVEL SECURITY;

-- Lab staff access policies for new tables
DROP POLICY IF EXISTS "Lab staff full access lab_samples" ON public.lab_samples;
CREATE POLICY "Lab staff full access lab_samples" ON public.lab_samples FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lab staff full access lab_reports" ON public.lab_reports;
CREATE POLICY "Lab staff full access lab_reports" ON public.lab_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lab staff full access lab_reagents" ON public.lab_reagents;
CREATE POLICY "Lab staff full access lab_reagents" ON public.lab_reagents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lab staff full access lab_maintenance" ON public.lab_maintenance;
CREATE POLICY "Lab staff full access lab_maintenance" ON public.lab_maintenance FOR ALL USING (true) WITH CHECK (true);

-- Doctors access to view released reports
DROP POLICY IF EXISTS "Doctors view all lab_reports" ON public.lab_reports;
CREATE POLICY "Doctors view all lab_reports" ON public.lab_reports FOR SELECT USING (status = 'Released' OR status = 'Approved');

-- Patients access to view their own released reports
-- Note: Requires JOIN through lab_orders. We can keep it simple by allowing patients to view if they have a matching order.
DROP POLICY IF EXISTS "Patients view own lab_reports" ON public.lab_reports;
CREATE POLICY "Patients view own lab_reports" ON public.lab_reports FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.lab_orders 
    WHERE lab_orders.id = lab_reports.order_id 
    AND lab_orders.patient_id = auth.uid()
  )
  AND status = 'Released'
);
