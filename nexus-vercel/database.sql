-- Nexus Vercel - Phase 2 Supabase Migration Schema
-- Execute this SQL to upgrade the database to Phase 2

-- Clear out Phase 1 objects for a fresh Phase 2 schema
DROP TABLE IF EXISTS public.visitors CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.units CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.api_retry_queue CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- 1. Create User Role ENUM
CREATE TYPE public.user_role AS ENUM ('super_admin', 'group_admin', 'guard');

-- 2. Create Units Table
CREATE TABLE public.units (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL, -- e.g., "Apartment 101" or "Business Suite A"
  type text NOT NULL CHECK (type IN ('residential', 'commercial')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Profiles Table (extends auth.users)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role public.user_role NOT NULL DEFAULT 'group_admin'::public.user_role,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL, -- Null for super_admin/guard
  full_name text,
  email text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Visitors Table v2
CREATE TABLE public.visitors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  visitor_name text NOT NULL,
  visitor_email text,
  access_date date NOT NULL,
  credential_number bigint NOT NULL,
  pin_code text NOT NULL,
  needs_parking boolean DEFAULT false NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Announcements Table
CREATE TABLE public.announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Audit Logs Table
CREATE TABLE public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Who did it
  action text NOT NULL, -- e.g. "INVITED_GUEST", "REVOKED_PASS", "SYNC_IMPRO"
  details jsonb, -- Flexible metadata payload
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create API Retry Queue Table
CREATE TABLE public.api_retry_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id uuid NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'failed', 'completed')),
  retry_count integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Configure Row Level Security (RLS)
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_retry_queue ENABLE ROW LEVEL SECURITY;

-- UNITS RLS
-- Super Admins can do everything. Everyone else can only view units.
CREATE POLICY "Units are universally viewable" ON public.units FOR SELECT USING (true);
CREATE POLICY "Super Admins can insert units" ON public.units FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Super Admins can update units" ON public.units FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- PROFILES RLS
-- Everyone can select profiles (needed for lookups/foreign keys).
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
-- Users can update their own profiles
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Super admins can insert/update any profile
CREATE POLICY "Super Admins can edit all profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- VISITORS RLS
-- Super admins and Guards can view all visitors. Group Admins view only their unit's visitors.
CREATE POLICY "Role-based visitor viewing" ON public.visitors FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'guard'))
  OR owner_id = auth.uid()
);
-- Only Owners (Group Admins) and Super Admins can insert visitors
CREATE POLICY "Owners can insert visitors" ON public.visitors FOR INSERT WITH CHECK (
  auth.uid() = owner_id
);
-- Owners can update their own visitors
CREATE POLICY "Owners can update their own visitors" ON public.visitors FOR UPDATE USING (
  auth.uid() = owner_id
);

-- ANNOUNCEMENTS RLS
-- Everyone can read announcements
CREATE POLICY "Announcements are readable by all" ON public.announcements FOR SELECT USING (auth.role() = 'authenticated');
-- Only Super Admins can insert announcements
CREATE POLICY "Super Admins can create announcements" ON public.announcements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- AUDIT LOGS RLS
-- Users can read logs where they are the actor. Super Admins can read all logs.
CREATE POLICY "Super Admins can view all logs, Users view own" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  OR actor_id = auth.uid()
);
-- Anyone can insert audit logs for tracing
CREATE POLICY "Everyone can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- API RETRY QUEUE RLS
-- Handled mostly by backend/Supabase Edge Functions, but let's lock it to Super Admins and Service Roles
CREATE POLICY "Super Admins can view retry queue" ON public.api_retry_queue FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- 9. Automatic Profile Creation Trigger (on auth trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'group_admin'::public.user_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. Indexes for performance
CREATE INDEX IF NOT EXISTS visitors_owner_id_idx ON public.visitors(owner_id);
CREATE INDEX IF NOT EXISTS visitors_unit_id_idx ON public.visitors(unit_id);
CREATE INDEX IF NOT EXISTS visitors_access_date_idx ON public.visitors(access_date);
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON public.audit_logs(actor_id);
