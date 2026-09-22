-- Migration 007: Rip out static hardcoded portfolio data and migrate into database tables
-- Creates bollywood_movies table, bio/milestones/skills tables or settings, and inserts seed data.

-- 1. Bollywood Movies table (replaces static hardcoded array in TS with live database table)
CREATE TABLE IF NOT EXISTS public.bollywood_movies (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  year TEXT NOT NULL,
  overview TEXT,
  tagline TEXT,
  genres TEXT[] DEFAULT '{}',
  lead_actor TEXT,
  director TEXT,
  poster_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bollywood_movies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_bollywood_movies" ON public.bollywood_movies;
DROP POLICY IF EXISTS "public_all_bollywood_movies" ON public.bollywood_movies;
CREATE POLICY "public_select_bollywood_movies" ON public.bollywood_movies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_all_bollywood_movies" ON public.bollywood_movies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bollywood_movies TO anon, authenticated;

-- Seed initial bollywood movies into database if table is empty
INSERT INTO public.bollywood_movies (id, title, year, overview, tagline, genres, lead_actor, director, poster_path)
VALUES
  (101, '3 Idiots', '2009', 'Two friends search for their long lost companion who inspired them to think differently at engineering college.', 'Don''t chase success, chase excellence.', ARRAY['Comedy', 'Drama'], 'Aamir Khan', 'Rajkumar Hirani', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80'),
  (102, 'Dangal', '2016', 'Former wrestler Mahavir Singh Phogat trains his daughters Geeta and Babita to become world-class wrestlers.', 'Gold medals don''t grow on trees, you have to cultivate them.', ARRAY['Biography', 'Drama', 'Sport'], 'Aamir Khan', 'Nitesh Tiwari', 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=400&q=80'),
  (103, 'Sholay', '1975', 'Two ex-convicts are hired by a retired policeman to capture a ruthless dacoit who terrorized his village.', 'The greatest star cast ever assembled.', ARRAY['Action', 'Adventure', 'Drama'], 'Amitabh Bachchan', 'Ramesh Sippy', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80'),
  (104, 'Lagaan', '2001', 'In Victorian India, villagers stake their future on a game of cricket against ruthless British officers to waive taxation.', 'Once upon a time in India.', ARRAY['Drama', 'Musical', 'Sport'], 'Aamir Khan', 'Ashutosh Gowariker', 'https://images.unsplash.com/photo-1531415074868-036b1c5d53ec?auto=format&fit=crop&w=400&q=80'),
  (105, 'Taare Zameen Par', '2007', 'An eight-year-old boy is thought to be a lazy trouble-maker, until the new art teacher has the patience to discover the real face behind his struggles.', 'Every child is special.', ARRAY['Drama', 'Family'], 'Aamir Khan', 'Aamir Khan', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80'),
  (106, 'Dilwale Dulhania Le Jayenge', '1995', 'When Raj meets Simran in Europe, it isn''t love at first sight but when Simran moves to India for an arranged marriage, love conquers all.', 'Come, fall in love.', ARRAY['Drama', 'Romance'], 'Shah Rukh Khan', 'Aditya Chopra', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=400&q=80'),
  (107, 'Swades', '2004', 'A successful Indian scientist at NASA returns to an Indian village to find his childhood nanny and rediscovers his roots.', 'We, the people.', ARRAY['Drama'], 'Shah Rukh Khan', 'Ashutosh Gowariker', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80'),
  (108, 'Zindagi Na Milegi Dobara', '2011', 'Three friends decide to turn their fantasy vacation into reality after one of them becomes engaged.', 'Live life to the fullest.', ARRAY['Adventure', 'Comedy', 'Drama'], 'Hrithik Roshan', 'Zoya Akhtar', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80'),
  (109, 'Gangs of Wasseypur', '2012', 'A clash between Sultan and Shahid Khan leads to the expulsion of Khan from Wasseypur, igniting a deadly blood feud spanning three generations.', 'Kah ke lunga.', ARRAY['Action', 'Comedy', 'Crime'], 'Manoj Bajpayee', 'Anurag Kashyap', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80'),
  (110, 'PK', '2014', 'An innocent alien lands on Earth and loses his only device that can summon his spaceship, questioning human dogma.', 'One alien who changed perspectives.', ARRAY['Comedy', 'Drama', 'Sci-Fi'], 'Aamir Khan', 'Rajkumar Hirani', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=400&q=80'),
  (111, 'Barfi', '2012', 'Three young people learn that love can neither be defined nor contained by society''s norms of normal and abnormal.', 'Don''t worry, be Barfi.', ARRAY['Comedy', 'Drama', 'Romance'], 'Ranbir Kapoor', 'Anurag Basu', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'),
  (112, 'Queen', '2013', 'A Delhi girl from a traditional family sets out on a solo honeymoon trip to Paris and Amsterdam after her marriage gets called off.', 'Living life on her own terms.', ARRAY['Adventure', 'Comedy', 'Drama'], 'Kangana Ranaut', 'Vikas Bahl', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80'),
  (113, 'Andhadhun', '2018', 'A series of mysterious events unfolds when a piano player pretending to be blind inadvertently witnesses a murder.', 'He cannot see. But he sees everything.', ARRAY['Crime', 'Mystery', 'Thriller'], 'Ayushmann Khurrana', 'Sriram Raghavan', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80'),
  (114, 'Chak De India', '2007', 'A disgraced former hockey captain takes on the daunting mission to coach the underdog Indian women''s national hockey team.', 'One nation. One goal.', ARRAY['Drama', 'Sport'], 'Shah Rukh Khan', 'Shimit Amin', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80'),
  (115, 'Kahaani', '2012', 'A pregnant woman arrives in Kolkata during the Durga Puja festival in search of her missing husband.', 'A mother''s search in a city of secrets.', ARRAY['Mystery', 'Thriller'], 'Vidya Balan', 'Sujoy Ghosh', 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=400&q=80'),
  (116, 'Tumbbad', '2018', 'A mythological horror tale revolving around three generations of a family cursed by the greed of a demonic deity.', 'Greed has no limits.', ARRAY['Drama', 'Fantasy', 'Horror'], 'Sohum Shah', 'Rahi Anil Barve', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'),
  (117, 'Udaan', '2010', 'Expelled from boarding school, a young aspiring poet returns to Jamshedpur to live with an authoritarian father.', 'Break free from the cage.', ARRAY['Drama'], 'Rajat Barmecha', 'Vikramaditya Motwane', 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=400&q=80'),
  (118, 'Drishyam', '2015', 'Desperate measures are taken by a cable TV operator who tries to save his family from the dark side of the law.', 'Visuals can be deceptive.', ARRAY['Crime', 'Drama', 'Mystery'], 'Ajay Devgn', 'Nishikant Kamat', 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=400&q=80'),
  (119, 'Stree', '2018', 'In Chanderi town, the men live in fear of an evil spirit named Stree who abducts men during festival nights.', 'O Stree, kal aana.', ARRAY['Comedy', 'Horror'], 'Rajkummar Rao', 'Amar Kaushik', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80'),
  (120, 'Munna Bhai MBBS', '2003', 'A lovable street gangster sets out to fulfill his father''s dream by enrolling in a prestigious medical college.', 'Jadu ki jhappi cures everything.', ARRAY['Comedy', 'Drama', 'Musical'], 'Sanjay Dutt', 'Rajkumar Hirani', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to prevent ID conflict
SELECT setval('public.bollywood_movies_id_seq', (SELECT MAX(id) FROM public.bollywood_movies));

-- 2. Skills and Milestones dynamic database storage in admin_settings
INSERT INTO public.admin_settings (key, value)
VALUES (
  'skills',
  '[
    {
      "category": "Frontend & UI",
      "icon": "Layers",
      "tags": ["React 18", "TypeScript", "Tailwind CSS v4", "Framer Motion", "Vite", "Web Audio API"]
    },
    {
      "category": "Backend & Systems",
      "icon": "Database",
      "tags": ["Node.js", "Python", "Supabase", "PostgreSQL", "WebSockets / Realtime", "REST APIs"]
    },
    {
      "category": "Workflow & Tools",
      "icon": "Terminal",
      "tags": ["Git & GitHub", "Linux / Bash", "VS Code", "Vercel", "Figma"]
    }
  ]'::jsonb
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_settings (key, value)
VALUES (
  'milestones',
  '[
    {
      "year": "2024 – Present",
      "title": "Class 11 CS & Arjuna JEE 2.0",
      "desc": "Rigorous preparation for JEE 2026 (Physics, Chemistry, Mathematics) alongside Computer Science coursework in Meerut, India."
    },
    {
      "year": "2024",
      "title": "Architected AnonRoom",
      "desc": "Designed and deployed a real-time anonymous ephemeral chat room web app featuring room codes, live participant lists, and zero stored chat logs."
    },
    {
      "year": "2024",
      "title": "Created JeeFlow & Portfolio OS",
      "desc": "Engineered study-tracking utilities, countdown analytics, and this interactive retro-modern portfolio featuring dynamic audio feedback and multiplayer mini-games."
    }
  ]'::jsonb
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.admin_settings (key, value)
VALUES (
  'about_bio',
  '{
    "title": "Hey, I''m Vansh Kumar.",
    "subtitle": "Class 11 Computer Science • JEE 2026 Aspirant",
    "description": "I''m a high-school developer and student based in Meerut, India. When I''m not balancing physics equations and calculus problems for JEE preparation, I architect clean web products with React, TypeScript, and Supabase.",
    "location": "Meerut, UP, India",
    "curriculum": "Arjuna JEE 2.0",
    "stack": "TS, React, Python",
    "status_title": "Class 11 CS • Arjuna JEE 2.0",
    "status_subtitle": "Building AnonRoom & JeeFlow"
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Add new table to realtime publication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bollywood_movies;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
