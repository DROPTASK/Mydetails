-- Paste into Supabase SQL Editor and Run. Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL,
  movie_id integer NOT NULL,
  movie_title text NOT NULL,
  poster_path text,
  lives integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read game rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "anyone can create game rooms" ON public.game_rooms;
CREATE POLICY "anyone can read game rooms" ON public.game_rooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone can create game rooms" ON public.game_rooms FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Rooms are short-lived by nature (a single game session); no separate cleanup
-- job is required, but you can periodically prune old rows if the table grows:
--   DELETE FROM public.game_rooms WHERE created_at < now() - interval '2 days';

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
