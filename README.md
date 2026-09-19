# Vansh Kumar — Portfolio & Chat

Apple-style personal portfolio with anonymous chat + AI clone (Groq) + locked admin panel.

## Stack
React 18 · Vite · TypeScript · Tailwind CSS v4 · Framer Motion · Supabase · Groq (server-side)

## Security model

| Secret | Where it lives | Exposed to browser? |
|--------|----------------|---------------------|
| Supabase URL + Anon key | `.env` as `VITE_*` | Yes — intentional (RLS protects data) |
| Groq API key | Supabase Edge Function secret | **No** |
| Admin password | `.env` as `VITE_*` | Yes — mitigated by hostname gate |

Groq is called only via the `ai-reply` Edge Function. The key never enters the client bundle.

## What's new in this rebuild

- **Home** is now a minimal, Linktree-style hub: a coin-flip dual profile (Online / Real persona) up top, stacked link pills below.
- **Music** defaults to on, resumes on refresh via `localStorage`, and stays in sync live across tabs (Supabase Realtime on the `playlist` table).
- **Sound effects** are synthesized in-browser (`src/lib/sound.ts`) — no audio files to host. Respects a mute flag in `localStorage`.
- **Avatar reacts to music** — a soft glow/breathing ring plays while a track is playing (`src/components/Avatar.tsx`).
- **Dual profile** — set the Online/Real name, bio, and photo from Admin → Profile. Visitors tap the avatar to flip between them.
- **Image uploads** go to a public Supabase Storage bucket (`portfolio`) instead of pasted URLs — used for profile avatars and gallery/asset images. Run migration `004_profile_storage_realtime.sql` to create it.
- **Realtime** — chat, the admin inbox, playlist, gallery/links, and the profile/online-status all update live via Supabase Realtime, no refresh needed.
- **Admin panel** restyled to match the public site's Apple-style light/dark surfaces instead of the old black/white brutalist look, plus a new Profile tab.
- Mobile bottom tab bar removed — Home's link list is the nav on mobile now.

Run **all four** migrations in order in the Supabase SQL Editor (001 → 004) — 004 is new and required for the profile/avatar features and Realtime.

## Setup

```bash
# 1. Install
npm install

# 2. Client env
cp .env.example .env
# Fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_PASSWORD

# 3. Database
# Supabase Dashboard → SQL Editor
# Paste supabase/migrations/001_initial_schema.sql → Run

# 4. Deploy Edge Function (keeps GROQ_API_KEY private)
# Install Supabase CLI: https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Set the secret (NOT in .env):
supabase secrets set GROQ_API_KEY=gsk_your_key_here

# Deploy the function
supabase functions deploy ai-reply --no-verify-jwt

# 5. Start
npm run dev
```

Open http://localhost:5173

### Admin (local)
http://localhost:5173/admin  
Password = `VITE_ADMIN_PASSWORD`

### Production admin
Only on hostname **exactly** `administrator.vanshkumar.in`  
Password required every visit. No sessions. Zero links from the main site.

## Deploy frontend
```bash
npm run build
# Serve the dist/ folder (Vercel, Cloudflare Pages, Netlify, etc.)
```
Point both `vanshkumar.in` and `administrator.vanshkumar.in` to the same build.

## Without Edge Function (dev only)
If you skip step 4, the AI clone returns a friendly offline message.
Chat + everything else still works.
