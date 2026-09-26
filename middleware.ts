export const config = {
  // Run on every path except static assets and known multi-segment app routes.
  matcher: "/:slug((?!assets|api|.*\\..*).*)",
};

// Keep this in sync with RESERVED_APP_PATHS in src/lib/shortLinks.ts.
const RESERVED = new Set([
  "", "about", "apps", "movies", "games", "bollywood", "solo", "multiplayer",
  "room", "tic-tac-toe", "rock-paper-scissors", "interests", "gallery",
  "links", "misc", "miscellaneous", "chat", "admin", "shortener", "api",
  "login", "signup", "auth", "dashboard", "settings", "status", "profile",
  "playlist", "feed", "rss",
]);

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const slug = url.pathname.replace(/^\/+|\/+$/g, "").toLowerCase();

  // Not a candidate slug (empty, nested path, or a real app route) — let the SPA handle it.
  if (!slug || slug.includes("/") || RESERVED.has(slug)) return;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/short_links?slug=eq.${encodeURIComponent(slug)}&select=target_url&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    );
    if (res.ok) {
      const rows = await res.json();
      const target = rows?.[0]?.target_url;
      if (target) return Response.redirect(target, 302);
    }
  } catch {
    // Any failure (network, RLS, slug not found) just falls through to the SPA,
    // which still resolves it client-side exactly as before.
  }
}