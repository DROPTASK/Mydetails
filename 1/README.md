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
- **Aesthetic pass** — sun/moon sliding theme switch, a segmented rectangle tab control (used on Games), brand-colored social icon buttons, decorative sparkles/sticker badges/gradient glow across the site. (Skipped the literal Spider-Man sticker — that's Marvel's copyrighted character — and used a generic geometric web doodle instead.)
- **Social links** — add them from Admin → Content (type: Link/contact/social); they render as icon buttons below the profile on Home, platform auto-detected from the URL.
- **Games section** (`/games`) — a "Loved" tab (your own editable game picks, added the same way as Apps/Movies) and a "Play" tab with three playable games:
  - **Tic-Tac-Toe** — local 2-player.
  - **Rock-Paper-Scissors** — vs CPU.
  - **Bollywood** — a Hangman-style word game. Solo mode fetches a real title from TMDB (vowels shown, consonants hidden, on-screen keyboard, configurable lives, automatic hint at the halfway mark). Multiplayer mode creates a shareable room — anyone who opens the link joins with just a nickname (no auth), everyone gets the same movie, and Realtime syncs each player's progress (shown to others as colour-only boxes, never the letters) plus an in-room chat.

Run **all five** migrations in order in the Supabase SQL Editor (001 → 005) — 004 and 005 are new and required for the profile/avatar features, Realtime, and the multiplayer game rooms.

**Heads up on the multiplayer game:** the room's answer sits in the `game_rooms` table under the same permissive access model as the rest of this app (see `001_initial_schema.sql`), so it's readable directly from the table by anyone who looks — fine for a casual portfolio game, but not spoiler-proof against someone poking at the network tab.

## What's new in this pass

- **Visual redesign** — moved from the icon-sticker aesthetic to a calmer, professional look: warm cozy color palette (terracotta accent, cream/espresso surfaces instead of stark black-and-white), soft layered shadows, and a subtle mouse-tracked 3D tilt on the profile avatar and game cards (`src/components/TiltCard.tsx`).
- **Bollywood hint system rebuilt** — instead of auto-revealing a random letter, hitting the hint (unlocked halfway through your lives) now offers a choice of hint *types* — Plot, Lead actor, and two more picked at random each game (Director / Genre / Release year / Tagline, whichever the movie has) — and shows a sentence instead of spoiling a letter. The plot hint is phrased by **Grok** (xAI) when configured, and falls back to a plain TMDB-sourced line if it isn't — the game always works either way.
  - Deploy: `supabase functions deploy movie-hint --no-verify-jwt`
  - Optional secret: `supabase secrets set GROK_API_KEY=xai-...` (get one at console.x.ai) — without it, hints just skip the AI phrasing step.
- **Game bug fixes**:
  - Multiplayer: fixed a bug where a player could see themselves listed as an "opponent" (was matching by nickname, which breaks with duplicate names — now matches by a stable per-connection key).
  - The old hint mechanic had a bug where using it could instantly hide itself again — that whole mechanic is replaced by the sentence-hint system above.
  - Keyboard now hides vowels entirely instead of showing them as unusable — simpler, less confusing.

Run migrations **001 → 005** in order if you haven't already (005 added the multiplayer `game_rooms` table).

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
