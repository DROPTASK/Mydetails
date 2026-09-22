-- Migration 008: Update admin_settings rows seeded by migration 007
-- with the current about_bio / milestones (skills unchanged, re-asserted for safety).
-- Uses ON CONFLICT ... DO UPDATE so it overwrites whatever is already stored,
-- unlike 007 which only inserted if the key didn't exist yet.

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
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.admin_settings (key, value)
VALUES (
  'milestones',
  '[
    {
      "year": "2024 – 2025",
      "title": "Class 11th",
      "desc": "(Physics, Chemistry, Mathematics) alongside Computer Science coursework in India."
    }
  ]'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.admin_settings (key, value)
VALUES (
  'about_bio',
  '{
    "title": "Hey, I''m Vansh Kumar.",
    "subtitle": "Cinephile • Athiest • Technology",
    "description": "I''m a high-school developer and student based in India. When I''m not balancing physics equations and calculus I architect clean web products with React, TypeScript, and Supabase.",
    "location": "UP, India",
    "curriculum": "CBSE",
    "stack": "TS, React, Python",
    "status_title": "Class 12 CS • CBSE",
    "status_subtitle": "I support decentralization."
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- profile (name/bio shown on ProfileSwap + Admin toggle)
INSERT INTO public.admin_settings (key, value)
VALUES (
  'profile',
  '{
    "online": { "name": "Vansh", "bio": "Online.", "avatar_url": null },
    "real": { "name": "Vansh Kumar", "bio": "Indian · Class 12 · Computer Science", "avatar_url": null }
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
