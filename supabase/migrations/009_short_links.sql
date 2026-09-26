-- Supabase Migration: 009_short_links.sql
-- In-app link shortener for vanshkumar.in/<personalized>

CREATE TABLE IF NOT EXISTS public.short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  target_url text NOT NULL,
  title text NOT NULL DEFAULT '',
  description text,
  clicks integer NOT NULL DEFAULT 0,
  add_to_links boolean NOT NULL DEFAULT false,
  asset_id uuid REFERENCES public.portfolio_assets(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_clicked_at timestamptz
);

-- Ensure all columns are present if the table already existed
ALTER TABLE public.short_links
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS target_url text,
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS clicks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS add_to_links boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS asset_id uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_clicked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_short_links_slug ON public.short_links (slug);
CREATE INDEX IF NOT EXISTS idx_short_links_created_at ON public.short_links (created_at DESC);

-- Row Level Security policies
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_short_links" ON public.short_links;
DROP POLICY IF EXISTS "public_insert_short_links" ON public.short_links;
DROP POLICY IF EXISTS "public_update_short_links" ON public.short_links;
DROP POLICY IF EXISTS "public_delete_short_links" ON public.short_links;

CREATE POLICY "public_select_short_links"
  ON public.short_links FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_insert_short_links"
  ON public.short_links FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "public_update_short_links"
  ON public.short_links FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "public_delete_short_links"
  ON public.short_links FOR DELETE
  TO anon, authenticated
  USING (true);

-- Enable Supabase Realtime for short_links
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.short_links;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
