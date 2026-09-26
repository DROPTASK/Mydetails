-- Complete, safe, idempotent setup script for public.game_rooms
-- Paste into Supabase SQL Editor and click 'Run'.

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL,
  round integer NOT NULL DEFAULT 1,
  movie_id integer NOT NULL DEFAULT 0,
  movie_title text NOT NULL DEFAULT '',
  poster_path text,
  movie_data jsonb,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'playing',
  winner_name text,
  winner_id text,
  lives integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Ensure all columns exist even if the table already existed previously
ALTER TABLE public.game_rooms 
  ADD COLUMN IF NOT EXISTS round integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS movie_id integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS movie_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS poster_path text,
  ADD COLUMN IF NOT EXISTS movie_data jsonb,
  ADD COLUMN IF NOT EXISTS scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'playing',
  ADD COLUMN IF NOT EXISTS winner_name text,
  ADD COLUMN IF NOT EXISTS winner_id text,
  ADD COLUMN IF NOT EXISTS lives integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 3. Row Level Security (RLS) policies
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read game rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "anyone can create game rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "anyone can update game rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "anyone can delete game rooms" ON public.game_rooms;

CREATE POLICY "anyone can read game rooms" 
  ON public.game_rooms FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "anyone can create game rooms" 
  ON public.game_rooms FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "anyone can update game rooms" 
  ON public.game_rooms FOR UPDATE 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "anyone can delete game rooms" 
  ON public.game_rooms FOR DELETE 
  TO anon, authenticated 
  USING (true);

-- 4. Enable Supabase Realtime CDC replication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
