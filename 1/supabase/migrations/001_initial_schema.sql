-- Vansh Kumar Portfolio — paste ALL of this into Supabase SQL Editor and click Run
-- No dollar-quotes. Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.chat_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_user_id TEXT NOT NULL UNIQUE,
  generated_password_hash TEXT NOT NULL,
  display_name TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'ai', 'admin')),
  content TEXT NOT NULL,
  chat_user_id UUID NOT NULL REFERENCES public.chat_users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.portfolio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('photo', 'app', 'connection', 'link')),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  image_url TEXT,
  favicon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_users_generated_user_id ON public.chat_users (generated_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_user_id ON public.messages (chat_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_assets_type ON public.portfolio_assets (type);

INSERT INTO public.admin_settings (key, value)
VALUES ('online_status', '{"is_online": false, "last_updated": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.chat_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_chat_users" ON public.chat_users;
DROP POLICY IF EXISTS "public_select_chat_users" ON public.chat_users;
DROP POLICY IF EXISTS "public_insert_messages" ON public.messages;
DROP POLICY IF EXISTS "public_select_messages" ON public.messages;
DROP POLICY IF EXISTS "public_update_messages" ON public.messages;
DROP POLICY IF EXISTS "public_delete_messages" ON public.messages;
DROP POLICY IF EXISTS "public_select_assets" ON public.portfolio_assets;
DROP POLICY IF EXISTS "public_all_assets_admin" ON public.portfolio_assets;
DROP POLICY IF EXISTS "public_select_settings" ON public.admin_settings;
DROP POLICY IF EXISTS "public_upsert_settings" ON public.admin_settings;

CREATE POLICY "public_insert_chat_users" ON public.chat_users FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_select_chat_users" ON public.chat_users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert_messages" ON public.messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_select_messages" ON public.messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_update_messages" ON public.messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_messages" ON public.messages FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "public_select_assets" ON public.portfolio_assets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_all_assets_admin" ON public.portfolio_assets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_select_settings" ON public.admin_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_upsert_settings" ON public.admin_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_assets TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_settings TO anon, authenticated;


CREATE TABLE IF NOT EXISTS public.playlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  audio_url TEXT NOT NULL,
  artwork_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.playlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_playlist" ON public.playlist;
DROP POLICY IF EXISTS "public_all_playlist" ON public.playlist;
CREATE POLICY "public_select_playlist" ON public.playlist FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_all_playlist" ON public.playlist FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlist TO anon, authenticated;
