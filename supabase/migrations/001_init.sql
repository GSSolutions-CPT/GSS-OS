-- 001_init.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES & SITES
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USERS (Mocking auth.users linkage for simplicity in this demo)
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'technician', 'visitor');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DEVICES & CREDENTIALS
CREATE TYPE device_type AS ENUM ('public_gate', 'private_door', 'alarm_panel');

CREATE TABLE devices (
  id TEXT PRIMARY KEY, -- e.g., 'esp32_01'
  site_id UUID REFERENCES sites(id),
  name TEXT NOT NULL,
  type device_type NOT NULL,
  status TEXT DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL, -- 'ble_uuid', 'wiegand_26'
  value TEXT NOT NULL, -- The actual UUID or Hex string
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ATTENDANCE (Business View)
CREATE TABLE attendance_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  site_id UUID REFERENCES sites(id),
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ,
  total_hours NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMPLIANCE (Technician View)
CREATE TABLE compliance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID REFERENCES users(id),
  site_id UUID REFERENCES sites(id),
  voltage INTEGER NOT NULL,
  photo_url TEXT,
  gps JSONB,
  status TEXT GENERATED ALWAYS AS (CASE WHEN voltage > 6000 THEN 'COMPLIANT' ELSE 'NON-COMPLIANT' END) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ALARMS & EVENTS (Security View)
CREATE TABLE alarm_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT REFERENCES devices(id),
  event_group INTEGER,
  zone_id INTEGER,
  partition INTEGER,
  raw_status TEXT, -- 'OPEN' or 'CLOSE'
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STORAGE BUCKET (Mocking via SQL for local Supabase, or manual setup instructions)
-- Note: In real Supabase, buckets are inserted into storage.buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('compliance-evidence', 'compliance-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- RLS POLICIES
ALTER TABLE attendance_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own company attendance" ON attendance_periods
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.company_id = attendance_periods.company_id
    -- Note: This implies auth.uid() matches users.id in this mock setup
  )
);

-- SEED DATA for DEMO
DO $$
DECLARE
  v_company_id UUID;
  v_staff_id UUID;
  v_tech_id UUID;
  v_site_id UUID;
BEGIN
  -- Company
  INSERT INTO companies (name) VALUES ('Acme Corp') RETURNING id INTO v_company_id;
  
  -- Site
  INSERT INTO sites (company_id, name, address) VALUES (v_company_id, 'HQ Building', '123 Fake St') RETURNING id INTO v_site_id;

  -- Users
  INSERT INTO users (id, company_id, full_name, email, role) 
  VALUES (uuid_generate_v4(), v_company_id, 'Alice Staff', 'alice@acme.com', 'staff') RETURNING id INTO v_staff_id;
  
  INSERT INTO users (id, company_id, full_name, email, role) 
  VALUES (uuid_generate_v4(), v_company_id, 'Bob Tech', 'bob@techOps.com', 'technician') RETURNING id INTO v_tech_id;

  -- Devices
  INSERT INTO devices (id, site_id, name, type) VALUES ('esp32_01', v_site_id, 'Main Gate Controller', 'public_gate');
  INSERT INTO devices (id, site_id, name, type) VALUES ('paradox_panel_01', v_site_id, 'Main Alarm Panel', 'alarm_panel');

  -- Credentials (BLE)
  -- Matches the uuid in the implementation plan / mock script: 123e4567-e89b-12d3-a456-426614174000
  INSERT INTO credentials (user_id, type, value, valid_until)
  VALUES (v_staff_id, 'ble_uuid', '123e4567-e89b-12d3-a456-426614174000', NOW() + INTERVAL '1 year');

END $$;
