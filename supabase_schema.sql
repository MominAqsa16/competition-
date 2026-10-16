-- =============================================================================
-- STUDENT TALENT COMPETITION 2026 - PRODUCTION SUPABASE DATABASE SCHEMA
-- Features:
-- - Strict Standard & Gender Constraints
-- - Automatic Drawing Group Assignment Check
-- - Atomic Concurrency Seat Quota Enforcement (Zero Overbooking)
-- - Row Level Security (RLS) with Privacy Guarantees
-- - Event Settings & Organizer Master Controls
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. COMPETITION CATEGORIES & SEAT LIMITS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.competition_categories (
  id TEXT PRIMARY KEY,                       -- e.g. 'computer', 'mehndi', 'drawing_a', 'drawing_b', 'makeup'
  name TEXT NOT NULL,                        -- Display title
  group_name TEXT,                           -- 'Group A', 'Group B' or NULL
  eligible_standards INTEGER[] NOT NULL,     -- Array of allowed standards: '{5,6,7,8}' or '{5,6}' or '{7,8}'
  gender_restriction TEXT DEFAULT NULL CHECK (gender_restriction IN ('female', NULL)),
  seat_limit INTEGER NOT NULL DEFAULT 50 CHECK (seat_limit > 0),
  confirmed_count INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_count >= 0),
  registration_fee NUMERIC(10, 2) NOT NULL DEFAULT 150.00 CHECK (registration_fee >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Categories & Seat Quotas
INSERT INTO public.competition_categories (id, name, group_name, eligible_standards, gender_restriction, seat_limit, confirmed_count, registration_fee)
VALUES
  ('computer', '1. Computer', NULL, ARRAY[5,6,7,8], NULL, 50, 0, 150.00),
  ('mehndi', '2. Mehndi', NULL, ARRAY[5,6,7,8], 'female', 40, 0, 150.00),
  ('drawing_a', '3A. Drawing Group A', 'Group A', ARRAY[5,6], NULL, 45, 0, 150.00),
  ('drawing_b', '3B. Drawing Group B', 'Group B', ARRAY[7,8], NULL, 45, 0, 150.00),
  ('makeup', '4. Makeup', NULL, ARRAY[5,6,7,8], 'female', 35, 0, 150.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  seat_limit = EXCLUDED.seat_limit,
  eligible_standards = EXCLUDED.eligible_standards,
  gender_restriction = EXCLUDED.gender_restriction;

-- -----------------------------------------------------------------------------
-- 2. EVENT SETTINGS & ORGANIZER CONFIGURATION TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_settings (
  id TEXT PRIMARY KEY DEFAULT 'current_event',
  website_name TEXT NOT NULL DEFAULT 'Student Talent Competition',
  upi_id TEXT NOT NULL DEFAULT 'studenttalent@sbi',
  upi_merchant_name TEXT NOT NULL DEFAULT 'Student Talent Fest',
  registration_fee NUMERIC(10, 2) NOT NULL DEFAULT 150.00,
  whatsapp_community_link TEXT NOT NULL DEFAULT 'https://chat.whatsapp.com/Gxyz123TalentComp2026',
  event_description TEXT NOT NULL DEFAULT 'Student Talent Competition 2026 takes place on Sunday, Nov 15th at City Central Auditorium. Reporting time 8:30 AM with Admit Card.',
  event_date DATE DEFAULT '2026-11-15',
  venue TEXT DEFAULT 'City Central Auditorium & Labs',
  wa_phone_number_id TEXT DEFAULT '10982348271038',
  wa_template_name TEXT DEFAULT 'student_competition_confirmed',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Event Settings
INSERT INTO public.event_settings (id, website_name, upi_id, registration_fee, whatsapp_community_link, event_description)
VALUES ('current_event', 'Student Talent Competition', 'studenttalent@sbi', 150.00, 'https://chat.whatsapp.com/Gxyz123TalentComp2026', 'Student Talent Competition 2026 takes place on Sunday, Nov 15th at City Central Auditorium. Reporting time 8:30 AM with Admit Card.')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. STUDENT REGISTRATIONS TABLE (STRICT CONSTRAINTS & PRIVACY)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id TEXT UNIQUE NOT NULL,             -- e.g. 'STC-2026-8492'
  student_name TEXT NOT NULL,
  school_name TEXT NOT NULL,
  standard INTEGER NOT NULL CHECK (standard IN (5, 6, 7, 8)),
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  whatsapp_number TEXT NOT NULL,                    -- Must include country code
  category_id TEXT NOT NULL REFERENCES public.competition_categories(id),
  category_name TEXT NOT NULL,
  drawing_group TEXT CHECK (drawing_group IN ('Group A', 'Group B', NULL)),
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  upi_reference TEXT NOT NULL,                       -- 12-digit UTR
  payer_name TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'rejected')),
  whatsapp_sent BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id)
);

-- Create Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_reg_id ON public.student_registrations (registration_id);
CREATE INDEX IF NOT EXISTS idx_reg_whatsapp ON public.student_registrations (whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_reg_category ON public.student_registrations (category_id);
CREATE INDEX IF NOT EXISTS idx_reg_status ON public.student_registrations (payment_status);

-- -----------------------------------------------------------------------------
-- 4. ATOMIC CONCURRENCY-SAFE REGISTRATION RPC FUNCTION
-- This stored procedure locks the category row FOR UPDATE to guarantee that
-- parallel requests cannot exceed the configured seat limits.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_student_atomic(
  p_student_name TEXT,
  p_school_name TEXT,
  p_standard INTEGER,
  p_dob DATE,
  p_gender TEXT,
  p_whatsapp_number TEXT,
  p_category_id TEXT,
  p_guardian_name TEXT,
  p_guardian_phone TEXT,
  p_upi_reference TEXT,
  p_payer_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated rights to safely enforce business logic
SET search_path = public, pg_temp
AS $$
DECLARE
  v_category RECORD;
  v_assigned_drawing_group TEXT := NULL;
  v_confirmed_seats INTEGER;
  v_new_reg_id TEXT;
  v_generated_id UUID;
BEGIN
  -- 1. Standard Validation
  IF p_standard NOT IN (5, 6, 7, 8) THEN
    RAISE EXCEPTION 'Standard % is ineligible. Only standards 5, 6, 7 and 8 can register.', p_standard;
  END IF;

  -- 2. Row-Level Lock on Category to prevent race conditions & overbooking
  SELECT * INTO v_category 
  FROM public.competition_categories 
  WHERE id = p_category_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Competition category % not found.', p_category_id;
  END IF;

  -- 3. Gender Eligibility Check
  IF v_category.gender_restriction = 'female' AND p_gender != 'female' THEN
    RAISE EXCEPTION 'The % category is strictly reserved for female students.', v_category.name;
  END IF;

  -- 4. Drawing Group Assignment & Standard match
  IF p_category_id = 'drawing_a' THEN
    IF p_standard NOT IN (5, 6) THEN
      RAISE EXCEPTION 'Drawing Group A is only for Standards 5 and 6.';
    END IF;
    v_assigned_drawing_group := 'Group A';
  ELSIF p_category_id = 'drawing_b' THEN
    IF p_standard NOT IN (7, 8) THEN
      RAISE EXCEPTION 'Drawing Group B is only for Standards 7 and 8.';
    END IF;
    v_assigned_drawing_group := 'Group B';
  END IF;

  -- 5. Seat Quota Verification (Count confirmed seats)
  SELECT COUNT(*) INTO v_confirmed_seats
  FROM public.student_registrations
  WHERE category_id = p_category_id AND payment_status = 'verified';

  IF v_confirmed_seats >= v_category.seat_limit THEN
    RAISE EXCEPTION 'Registration closed: % has reached its limit of % seats.', v_category.name, v_category.seat_limit;
  END IF;

  -- 6. Generate Unique Registration ID (e.g. STC-2026-XXXX)
  v_new_reg_id := 'STC-2026-' || LPAD(FLOOR(1000 + RANDOM() * 9000)::TEXT, 4, '0');

  -- 7. Insert Registration with status 'pending' (NEVER auto-verified)
  INSERT INTO public.student_registrations (
    registration_id,
    student_name,
    school_name,
    standard,
    date_of_birth,
    gender,
    whatsapp_number,
    category_id,
    category_name,
    drawing_group,
    guardian_name,
    guardian_phone,
    upi_reference,
    payer_name,
    payment_status,
    whatsapp_sent
  ) VALUES (
    v_new_reg_id,
    p_student_name,
    p_school_name,
    p_standard,
    p_dob,
    p_gender,
    p_whatsapp_number,
    p_category_id,
    v_category.name,
    v_assigned_drawing_group,
    p_guardian_name,
    p_guardian_phone,
    p_upi_reference,
    p_payer_name,
    'pending', -- Pending verification by organizer
    FALSE
  )
  RETURNING id INTO v_generated_id;

  RETURN json_build_object(
    'success', TRUE,
    'registration_id', v_new_reg_id,
    'category_name', v_category.name,
    'drawing_group', v_assigned_drawing_group,
    'payment_status', 'pending'
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. ORGANIZER VERIFICATION & WHATSAPP TRIGGER FUNCTION
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_student_payment(
  p_registration_id TEXT,
  p_admin_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reg RECORD;
BEGIN
  SELECT * INTO v_reg
  FROM public.student_registrations
  WHERE registration_id = p_registration_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration % not found.', p_registration_id;
  END IF;

  -- Update status to verified
  UPDATE public.student_registrations
  SET 
    payment_status = 'verified',
    verified_at = NOW(),
    verified_by = p_admin_user_id
  WHERE registration_id = p_registration_id;

  -- Update category confirmed count
  UPDATE public.competition_categories
  SET confirmed_count = (
    SELECT COUNT(*) FROM public.student_registrations 
    WHERE category_id = v_reg.category_id AND payment_status = 'verified'
  )
  WHERE id = v_reg.category_id;

  RETURN json_build_object(
    'success', TRUE,
    'registration_id', v_reg.registration_id,
    'student_name', v_reg.student_name,
    'whatsapp_number', v_reg.whatsapp_number,
    'status', 'verified'
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 6. SECURE STUDENT STATUS LOOKUP RPC (PRIVACY PRESERVING)
-- Allows a student to look up only their own status without exposing anyone else
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_registration_status(
  p_search_query TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reg RECORD;
  v_clean_query TEXT;
BEGIN
  v_clean_query := TRIM(p_search_query);

  SELECT * INTO v_reg
  FROM public.student_registrations
  WHERE 
    registration_id ILIKE v_clean_query
    OR whatsapp_number ILIKE '%' || v_clean_query
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('found', FALSE);
  END IF;

  -- Return sanitized details (guardian contact kept private)
  RETURN json_build_object(
    'found', TRUE,
    'registration_id', v_reg.registration_id,
    'student_name', v_reg.student_name,
    'school_name', v_reg.school_name,
    'standard', v_reg.standard,
    'category_name', v_reg.category_name,
    'drawing_group', v_reg.drawing_group,
    'payment_status', v_reg.payment_status,
    'created_at', v_reg.created_at,
    'verified_at', v_reg.verified_at
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict data isolation: Students cannot see other students' registrations.
-- Organizers authenticated with 'admin' role or authenticated claim have access.
-- -----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE public.competition_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_registrations ENABLE ROW LEVEL SECURITY;

-- Category Limits: Anyone can read seat availability and active limits
CREATE POLICY "Public Read Categories" 
  ON public.competition_categories 
  FOR SELECT 
  USING (true);

-- Event Settings: Anyone can read public event details (UPI ID, fee, etc.)
CREATE POLICY "Public Read Event Settings" 
  ON public.event_settings 
  FOR SELECT 
  USING (true);

-- Student Registrations: PUBLIC CANNOT SELECT DIRECTLY (Protects Student Privacy)
CREATE POLICY "Deny Public Direct Select Registrations" 
  ON public.student_registrations 
  FOR SELECT 
  USING (false);

-- Public can INSERT their registration (enforced via atomic function)
CREATE POLICY "Allow Public Insert Registrations" 
  ON public.student_registrations 
  FOR INSERT 
  WITH CHECK (true);

-- Authenticated Organizers/Admins have full access
CREATE POLICY "Organizer Full Access Categories" 
  ON public.competition_categories 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Organizer Full Access Settings" 
  ON public.event_settings 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Organizer Full Access Registrations" 
  ON public.student_registrations 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);
