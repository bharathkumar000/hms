-- ==========================================
-- ENABLE REALTIME FOR PATIENT PORTAL TABLES
-- Run this in the Supabase SQL Editor once.
-- Without it the mobile app falls back to polling.
-- ==========================================

-- Realtime change data capture needs the full row payload.
ALTER TABLE public.profiles          REPLICA IDENTITY FULL;
ALTER TABLE public.appointments      REPLICA IDENTITY FULL;
ALTER TABLE public.patient_queue     REPLICA IDENTITY FULL;
ALTER TABLE public.medical_records   REPLICA IDENTITY FULL;
ALTER TABLE public.prescriptions     REPLICA IDENTITY FULL;
ALTER TABLE public.bills             REPLICA IDENTITY FULL;
ALTER TABLE public.bill_items        REPLICA IDENTITY FULL;
ALTER TABLE public.lab_orders        REPLICA IDENTITY FULL;
ALTER TABLE public.notifications     REPLICA IDENTITY FULL;
ALTER TABLE public.admissions        REPLICA IDENTITY FULL;
ALTER TABLE public.bed_transfers     REPLICA IDENTITY FULL;
ALTER TABLE public.doctors           REPLICA IDENTITY FULL;
ALTER TABLE public.food_categories   REPLICA IDENTITY FULL;
ALTER TABLE public.menu_items        REPLICA IDENTITY FULL;
ALTER TABLE public.canteen_orders    REPLICA IDENTITY FULL;
ALTER TABLE public.canteen_order_items REPLICA IDENTITY FULL;
ALTER TABLE public.daily_vitals      REPLICA IDENTITY FULL;
ALTER TABLE public.medication_reminders REPLICA IDENTITY FULL;

-- Add every patient portal table to the realtime publication (idempotent).
DO $$
DECLARE
  t TEXT;
  tbl TEXT[] := ARRAY[
    'profiles', 'appointments', 'patient_queue', 'medical_records',
    'prescriptions', 'bills', 'bill_items', 'lab_orders',
    'notifications', 'admissions', 'bed_transfers', 'doctors',
    'food_categories', 'menu_items', 'canteen_orders', 'canteen_order_items',
    'daily_vitals', 'medication_reminders'
  ];
BEGIN
  FOREACH t IN ARRAY tbl LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;