-- Migration 006: Seed portfolio assets & playlist data, update check constraints and game room policies
-- Safe to run multiple times in Supabase SQL editor.

-- 1. Ensure portfolio_assets accepts 'interest' and 'game' asset types
ALTER TABLE public.portfolio_assets DROP CONSTRAINT IF EXISTS portfolio_assets_type_check;
ALTER TABLE public.portfolio_assets ADD CONSTRAINT portfolio_assets_type_check 
  CHECK (type IN ('photo', 'app', 'connection', 'link', 'interest', 'game'));

-- 2. Ensure game_rooms has necessary columns for multiplayer round win synchronization and points
ALTER TABLE public.game_rooms ADD COLUMN IF NOT EXISTS round integer NOT NULL DEFAULT 1;
ALTER TABLE public.game_rooms ADD COLUMN IF NOT EXISTS scores jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.game_rooms ADD COLUMN IF NOT EXISTS winner_nickname text;
ALTER TABLE public.game_rooms ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'playing';
ALTER TABLE public.game_rooms ADD COLUMN IF NOT EXISTS next_movie_at bigint;

-- Enable update and delete policies on game_rooms for multiplayer progression
DROP POLICY IF EXISTS "anyone can update game rooms" ON public.game_rooms;
CREATE POLICY "anyone can update game rooms" ON public.game_rooms FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_rooms TO anon, authenticated;

-- 3. Seed Portfolio Assets (Apps, Interests, Links, Photos, Loved Games)
INSERT INTO public.portfolio_assets (type, title, description, url, image_url, sort_order, is_published)
VALUES
  -- APPS
  (
    'app',
    'AnonRoom',
    'Ephemeral, encrypted anonymous chat rooms with real-time presence, custom room codes, and zero log storage. Built with React, Supabase & WebSockets.',
    'https://anonroom.vanshkumar.in',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    1,
    true
  ),
  (
    'app',
    'JeeFlow',
    'Comprehensive study tracker, mock test performance analyzer, and countdown timer tailored for JEE 2026 aspirants.',
    'https://jeeflow.vanshkumar.in',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
    2,
    true
  ),
  (
    'app',
    'Bollywood Movie Quiz',
    'Interactive Hindi cinema word-guessing game with dynamic hints, letter tracking, solo puzzles, and live real-time multiplayer room battles.',
    '/games/bollywood',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
    3,
    true
  ),
  (
    'app',
    'Portfolio OS',
    'Personal interactive hub featuring synthesized Web Audio sound engine, Cmd+K command palette, music player, and mini-games.',
    'https://github.com/DROPTASK/Mydetails',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    4,
    true
  ),

  -- INTERESTS
  (
    'interest',
    'Competitive Programming & Problem Solving',
    'Exploring algorithmic paradigms, dynamic programming, graph traversal, and mathematical proofs on Codeforces and LeetCode.',
    null,
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80',
    1,
    true
  ),
  (
    'interest',
    'Physics & Theoretical Mechanics',
    'Deep dive into kinematics, rotational dynamics, electromagnetism, and calculus as part of Arjuna JEE 2.0 curriculum.',
    null,
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
    2,
    true
  ),
  (
    'interest',
    'Modern Web Systems & Real-time Sync',
    'Building resilient client-server apps with TypeScript, React 18, WebSockets, Supabase Postgres changes, and Tailwind CSS.',
    null,
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    3,
    true
  ),
  (
    'interest',
    'Sound Synthesis & Late-Night Beats',
    'Synthesizing soft tones with Web Audio API oscillators, relaxing lo-fi soundtracks, and Bollywood film scores.',
    null,
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    4,
    true
  ),

  -- LINKS
  (
    'link',
    'GitHub Profile',
    'Explore all open-source repositories, utilities, and daily code commits.',
    'https://github.com/vansh-kumar',
    null,
    1,
    true
  ),
  (
    'link',
    'AnonRoom Project',
    'Launch the ephemeral anonymous chat application.',
    'https://anonroom.vanshkumar.in',
    null,
    2,
    true
  ),
  (
    'link',
    'JeeFlow Planner',
    'Exam countdown, topic checklists, and mock revision tracker.',
    'https://jeeflow.vanshkumar.in',
    null,
    3,
    true
  ),
  (
    'link',
    'Email & Direct Inquiries',
    'Send an email for inquiries, collaborations, or tech discussions.',
    'mailto:vanshadd003@gmail.com',
    null,
    4,
    true
  ),
  (
    'link',
    'Live Chat Guestbook',
    'Leave a message directly on this portfolio or chat with the AI assistant.',
    '/chat',
    null,
    5,
    true
  ),

  -- PHOTOS
  (
    'photo',
    'Workspace & Code Aesthetics',
    'Focus space setup with dual monitors, mechanical keyboard, and evening lighting.',
    null,
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    1,
    true
  ),
  (
    'photo',
    'Mechanical Keyboard & Focus',
    'Tactile switches tuned for late-night programming sessions and problem-solving.',
    null,
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    2,
    true
  ),
  (
    'photo',
    'Physics & Problem Solving Notes',
    'Calculus derivations, mechanics diagrams, and revision formulas.',
    null,
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    3,
    true
  ),
  (
    'photo',
    'Late Night Coding Glow',
    'Terminal windows, compiler outputs, and dark mode IDE theme.',
    null,
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    4,
    true
  ),
  (
    'photo',
    'Books & Competitive Prep',
    'HC Verma, Irodov, and reference texts on the study shelf.',
    null,
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    5,
    true
  ),
  (
    'photo',
    'Minimalist Desk Flow',
    'Clean workspace keeping distractions minimal during deep study blocks.',
    null,
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    6,
    true
  ),

  -- GAMES (Loved Favorites)
  (
    'game',
    'Minecraft',
    'Sandbox survival, redstone engineering, and endless algorithmic creativity.',
    'https://www.minecraft.net',
    'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=600&q=80',
    1,
    true
  ),
  (
    'game',
    'Portal 2',
    'Masterpiece of spatial puzzle mechanics, physics, and dark humor.',
    'https://store.steampowered.com/app/620/Portal_2/',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    2,
    true
  ),
  (
    'game',
    'Chess.com',
    'Rapid and blitz tactical matches, solving daily positional puzzles.',
    'https://www.chess.com',
    'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80',
    3,
    true
  )
ON CONFLICT DO NOTHING;

-- 4. Seed Playlist Audio Tracks
INSERT INTO public.playlist (title, artist, audio_url, artwork_url, sort_order)
VALUES
  (
    'Lofi Study Session',
    'Chillhop Beats',
    'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=300&q=80',
    1
  ),
  (
    'Late Night Code',
    'Lofi Dreamer',
    'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
    2
  ),
  (
    'Coffee & Focus',
    'Ambient Waves',
    'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f772dd.mp3',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=300&q=80',
    3
  )
ON CONFLICT DO NOTHING;
