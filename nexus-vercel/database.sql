-- Nexus Vercel - Supabase Migration Schema
-- Execute this SQL in your Supabase SQL Editor

-- 1. Create the visitors table
CREATE TABLE IF NOT EXISTS public.visitors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_name text NOT NULL,
  visitor_email text,
  access_date date NOT NULL,
  credential_number bigint NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Configure Row Level Security (RLS)
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can only view their own visitors
CREATE POLICY "Owners can view own visitors" 
  ON public.visitors 
  FOR SELECT 
  USING (auth.uid() = owner_id);

-- Policy: Owners can insert their own visitors
CREATE POLICY "Owners can insert own visitors" 
  ON public.visitors 
  FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Owners can update their own visitors
CREATE POLICY "Owners can update own visitors" 
  ON public.visitors 
  FOR UPDATE 
  USING (auth.uid() = owner_id);

-- Policy: Owners can delete their own visitors
CREATE POLICY "Owners can delete own visitors" 
  ON public.visitors 
  FOR DELETE 
  USING (auth.uid() = owner_id);

-- 3. Set up performance indexing
CREATE INDEX IF NOT EXISTS visitors_owner_id_idx ON public.visitors(owner_id);
CREATE INDEX IF NOT EXISTS visitors_access_date_idx ON public.visitors(access_date);
