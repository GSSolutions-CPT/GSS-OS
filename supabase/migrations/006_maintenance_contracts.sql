-- Migration 006: Create maintenance_contracts table
-- compliance_logs did not exist; creating fresh with full schema

CREATE TABLE IF NOT EXISTS public.maintenance_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES public.profiles(id),
    equipment_type TEXT CHECK (equipment_type IN ('cctv', 'access_control', 'intercom', 'alarm')),
    system_status TEXT CHECK (system_status IN ('operational', 'degraded', 'offline')),
    tasks_completed JSONB,
    photo_url TEXT,
    gps JSONB,
    notes TEXT,
    contract_status TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN system_status = 'operational' THEN 'MAINTAINED' 
            ELSE 'SERVICE_REQUIRED' 
        END
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.maintenance_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read maintenance contracts"
ON public.maintenance_contracts FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role = 'super_admin'
    )
);

CREATE POLICY "Technicians can insert maintenance contracts"
ON public.maintenance_contracts FOR INSERT
WITH CHECK (technician_id = (SELECT auth.uid()));
