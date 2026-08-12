-- ==========================================
-- CREATE DEMO PATIENT (ID 1 / PASSWORD 1)
-- ==========================================
-- Enables the web-style demo login (ID `1`, password `1`) in the mobile app.
-- The app maps demo credentials to this account, so RLS and Realtime work
-- exactly like a normal patient. Run once in the Supabase SQL Editor.
--
-- Demo account: demo@patient.com / 1
-- Reuses the mocked web demo user id: 11111111-1111-1111-1111-111111111111

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo@patient.com') THEN
    INSERT INTO auth.users
      (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
       created_at, updated_at, confirmation_token, email_change,
       email_change_token_new, recovery_token)
    VALUES
      ('00000000-0000-0000-0000-000000000000',
       '11111111-1111-1111-1111-111111111111',
       'authenticated', 'authenticated', 'demo@patient.com',
       crypt('1', gen_salt('bf')), now(),
       now(), now(), '{"provider":"email","providers":["email"]}'::jsonb,
       '{}'::jsonb, now(), now(), '', '', '', '');

    INSERT INTO auth.identities
      (id, user_id, provider_id, identity_data, provider, last_sign_in_at,
       created_at, updated_at)
    VALUES
      ('11111111-1111-1111-1111-111111111111',
       '11111111-1111-1111-1111-111111111111',
       '11111111-1111-1111-1111-111111111111',
       '{"sub":"11111111-1111-1111-1111-111111111111","email":"demo@patient.com"}'::jsonb,
       'email', now(), now(), now());
  END IF;
END $$;

-- Demo patient profile (patient_id for appointments/bills/records etc.)
INSERT INTO public.profiles
  (id, first_name, last_name, phone_number, gender, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111',
   'Demo', 'Patient', '555-0100', 'Male', now(), now())
ON CONFLICT (id) DO NOTHING;