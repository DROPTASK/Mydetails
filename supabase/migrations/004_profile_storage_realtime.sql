-- Paste into Supabase SQL Editor and Run. Safe to run more than once.

-- ---------- Dual profile identities (Online persona / Real persona) ----------
-- Shown on Home as a coin-flip avatar swap. Edited from Admin → Profile tab.
INSERT INTO public.admin_settings (key, value)
VALUES (
  'profile',
  '{
    "online": {"name": "Vansh", "bio": "Online.", "avatar_url": null},
    "real":   {"name": "Vansh Kumar", "bio": "Meerut · Class 11 · Computer Science", "avatar_url": null}
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- ---------- Storage bucket for avatars & admin-uploaded images ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_portfolio_bucket" ON storage.objects;
DROP POLICY IF EXISTS "public_write_portfolio_bucket" ON storage.objects;

CREATE POLICY "public_read_portfolio_bucket" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'portfolio');

-- Matches this project's existing security model (see 001_initial_schema.sql):
-- the anon key can write everywhere; the admin route is gated by hostname + password,
-- not real per-row auth. Keep it consistent rather than half-locking just this table.
CREATE POLICY "public_write_portfolio_bucket" ON storage.objects
  FOR ALL TO anon, authenticated
  USING (bucket_id = 'portfolio')
  WITH CHECK (bucket_id = 'portfolio');

-- ---------- Realtime: add tables to the replication publication ----------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_users;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio_assets;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.playlist;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.favorite_movies;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_settings;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
