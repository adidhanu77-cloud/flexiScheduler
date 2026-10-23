-- ══════════════════════════════════════════════════════════════════════════════
-- FLEXISCHEDULER - SUPABASE DATABASE & BACKEND SCHEMA
-- Run this complete script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. MACHINES TABLE
CREATE TABLE IF NOT EXISTS public.machines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running', -- 'running', 'breakdown', 'healing', 'idle', 'maintenance'
    health INTEGER NOT NULL DEFAULT 95,
    temperature NUMERIC(5,2) DEFAULT 42.0,
    vibration NUMERIC(5,2) DEFAULT 0.28,
    load INTEGER DEFAULT 75,
    current_job TEXT DEFAULT 'Idle',
    eta_minutes INTEGER DEFAULT 0,
    reassigned_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDERS TABLE (Pipeline + FIFO)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer TEXT NOT NULL,
    part TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 100,
    priority TEXT NOT NULL DEFAULT 'Standard', -- 'Standard', 'High', 'RUSH'
    status TEXT NOT NULL DEFAULT 'Queued', -- 'Queued', 'In Pipeline', 'Processing', 'Quality Check', 'Completed'
    workflow_stage TEXT DEFAULT 'Intake & Verification',
    lead_time_hours INTEGER DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BREAKDOWN ALERTS & TWILIO NOTIFICATIONS LOG
CREATE TABLE IF NOT EXISTS public.breakdown_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    trigger_type TEXT NOT NULL DEFAULT 'manual', -- 'automatic', 'manual', 'test'
    machine_id TEXT,
    fault TEXT,
    message TEXT NOT NULL,
    recipient TEXT NOT NULL,
    channels TEXT[] DEFAULT ARRAY['whatsapp', 'sms'],
    results JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DISRUPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.disruptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'machine_breakdown', 'rush_order', 'material_delay'
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakdown_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disruptions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access (anon public key) for demo/factory operations
CREATE POLICY "Public read/write access for machines" ON public.machines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access for orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access for breakdown_alerts" ON public.breakdown_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access for disruptions" ON public.disruptions FOR ALL USING (true) WITH CHECK (true);

-- 7. ENABLE REALTIME SUBSCRIPTIONS
-- Supabase Realtime broadcast for live updates across connected clients
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.machines, public.orders, public.breakdown_alerts, public.disruptions;
COMMIT;

-- 8. INITIAL FACTORY SEED DATA
INSERT INTO public.machines (id, name, type, status, health, temperature, vibration, load, current_job, eta_minutes)
VALUES
    ('CNC-01', 'CNC Milling Cell #1', 'CNC Milling', 'running', 94, 43.5, 0.28, 78, 'JOB-1029 (Titanium Bracket)', 28),
    ('CNC-02', '5-Axis Precision Mill', '5-Axis CNC', 'running', 91, 46.2, 0.32, 85, 'JOB-1033 (Aerospace Turbine)', 45),
    ('ROBOT-01', 'KUKA 6-Axis Welding Cell', 'Welding Arm', 'running', 97, 38.9, 0.14, 62, 'JOB-1040 (Chassis Frame)', 18),
    ('ASSEMBLY-01', 'FastFlow Automated Assembly', 'Assembly Line', 'running', 99, 32.1, 0.08, 55, 'JOB-1048 (Sub-Assembly Pack)', 34),
    ('PACK-01', 'Robotic Palletizing Cell', 'Packaging', 'running', 96, 30.5, 0.11, 40, 'JOB-1052 (Final QC & Box)', 15)
ON CONFLICT (id) DO UPDATE SET
    health = EXCLUDED.health,
    status = EXCLUDED.status,
    current_job = EXCLUDED.current_job;

INSERT INTO public.orders (order_number, customer, part, quantity, priority, status, workflow_stage, lead_time_hours)
VALUES
    ('ORD-8821', 'AeroCorp Industries', 'Titanium Turbine Blade', 250, 'High', 'Processing', 'Machining & Turning', 6),
    ('ORD-8822', 'AutoMotion Dynamics', 'Steering Knuckle Casing', 500, 'Standard', 'Queued', 'Intake & Verification', 12),
    ('ORD-8823', 'SpaceFrontier Ltd', 'Carbon Truss Bracket', 120, 'RUSH', 'In Pipeline', 'Thermal Treatment', 3)
ON CONFLICT (order_number) DO NOTHING;
