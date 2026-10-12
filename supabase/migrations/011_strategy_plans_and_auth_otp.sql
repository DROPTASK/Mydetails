-- Supabase Migration: 011_strategy_plans.sql
-- Strategy Builder Cloud Persistence & Instant Cross-Device Sharability

-- Table for Strategy Plans & Cloud Sharability
CREATE TABLE IF NOT EXISTS public.strategy_plans (
  id text PRIMARY KEY,
  short_code text UNIQUE NOT NULL,
  user_email text NOT NULL,
  student_name text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  plan_data jsonb NOT NULL,
  share_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure columns exist if table is partially created
ALTER TABLE public.strategy_plans
  ADD COLUMN IF NOT EXISTS short_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS student_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS plan_data jsonb,
  ADD COLUMN IF NOT EXISTS share_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Indexes for lightning fast lookups by short code and user email
CREATE INDEX IF NOT EXISTS idx_strategy_plans_short_code ON public.strategy_plans (short_code);
CREATE INDEX IF NOT EXISTS idx_strategy_plans_user_email ON public.strategy_plans (user_email);
CREATE INDEX IF NOT EXISTS idx_strategy_plans_created_at ON public.strategy_plans (created_at DESC);

-- Row Level Security Policies
ALTER TABLE public.strategy_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_strategy_plans" ON public.strategy_plans;
DROP POLICY IF EXISTS "public_insert_strategy_plans" ON public.strategy_plans;
DROP POLICY IF EXISTS "public_update_strategy_plans" ON public.strategy_plans;
DROP POLICY IF EXISTS "public_delete_strategy_plans" ON public.strategy_plans;

-- Everyone can read shared plans via short code or id
CREATE POLICY "public_select_strategy_plans"
  ON public.strategy_plans FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can save / update strategy plans
CREATE POLICY "public_insert_strategy_plans"
  ON public.strategy_plans FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "public_update_strategy_plans"
  ON public.strategy_plans FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "public_delete_strategy_plans"
  ON public.strategy_plans FOR DELETE
  TO anon, authenticated
  USING (true);

-- Enable Supabase Realtime for instant multi-device syncing
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.strategy_plans;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
