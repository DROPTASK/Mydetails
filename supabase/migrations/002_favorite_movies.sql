-- Admin-curated "Favourites" movies for the Movies page (mirrors the playlist table pattern)
CREATE TABLE IF NOT EXISTS public.favorite_movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  overview TEXT,
  release_date TEXT,
  vote_average NUMERIC,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.favorite_movies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_favorite_movies" ON public.favorite_movies;
DROP POLICY IF EXISTS "public_all_favorite_movies" ON public.favorite_movies;
CREATE POLICY "public_select_favorite_movies" ON public.favorite_movies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_all_favorite_movies" ON public.favorite_movies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorite_movies TO anon, authenticated;
