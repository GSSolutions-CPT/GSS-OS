-- Migration: Add visitor_access_windows table
-- Allows multiple access days with specific time windows per visitor

-- Create the access windows table
CREATE TABLE IF NOT EXISTS public.visitor_access_windows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id uuid NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  access_date date NOT NULL,
  start_time time NOT NULL DEFAULT '00:00',
  end_time time NOT NULL DEFAULT '23:59',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast lookup by visitor
CREATE INDEX IF NOT EXISTS visitor_access_windows_visitor_id_idx ON public.visitor_access_windows(visitor_id);
CREATE INDEX IF NOT EXISTS visitor_access_windows_date_idx ON public.visitor_access_windows(access_date);

-- Enable RLS
ALTER TABLE public.visitor_access_windows ENABLE ROW LEVEL SECURITY;

-- RLS Policies: same rules as visitors table
CREATE POLICY "Role-based access windows viewing" ON public.visitor_access_windows FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.visitors v
    JOIN public.profiles p ON p.id = (select auth.uid())
    WHERE v.id = visitor_access_windows.visitor_id
    AND (p.role IN ('super_admin', 'guard') OR v.owner_id = (select auth.uid()))
  )
);

CREATE POLICY "Owners can insert access windows" ON public.visitor_access_windows FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.visitors v
    WHERE v.id = visitor_access_windows.visitor_id AND v.owner_id = (select auth.uid())
  )
);

CREATE POLICY "Owners can update access windows" ON public.visitor_access_windows FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.visitors v
    WHERE v.id = visitor_access_windows.visitor_id AND v.owner_id = (select auth.uid())
  )
);

CREATE POLICY "Owners can delete access windows" ON public.visitor_access_windows FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.visitors v
    WHERE v.id = visitor_access_windows.visitor_id AND v.owner_id = (select auth.uid())
  )
);

-- Backfill: create a window for every existing visitor based on their access_date
-- This ensures no data is lost for existing records
INSERT INTO public.visitor_access_windows (visitor_id, access_date, start_time, end_time)
SELECT id, access_date, '06:00'::time, '22:00'::time
FROM public.visitors
ON CONFLICT DO NOTHING;
