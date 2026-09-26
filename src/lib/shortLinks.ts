import { supabase, isSupabaseConfigured } from "./supabase";

export type ShortLink = {
  id: string;
  slug: string;
  target_url: string;
  title: string;
  description: string | null;
  clicks: number;
  add_to_links: boolean;
  is_admin_created?: boolean;
  asset_id?: string | null;
  created_at: string;
  last_clicked_at?: string | null;
};

export const DOMAIN_NAME = "vanshkumar.in";

/**
 * In-app paths and system endpoints that cannot be used as short link slugs.
 */
export const RESERVED_APP_PATHS = new Set([
  "",
  "about",
  "apps",
  "movies",
  "games",
  "bollywood",
  "solo",
  "multiplayer",
  "room",
  "tic-tac-toe",
  "rock-paper-scissors",
  "interests",
  "gallery",
  "links",
  "misc",
  "miscellaneous",
  "chat",
  "admin",
  "shortener",
  "api",
  "login",
  "signup",
  "auth",
  "dashboard",
  "settings",
  "status",
  "profile",
  "playlist",
  "feed",
  "rss",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "favicon.svg",
  "site.webmanifest",
  "assets",
  "public",
  "index.html",
  "sw.js",
]);

const LOCAL_STORAGE_KEY = "vk_short_links_cache";

/**
 * Normalizes input slug by trimming, lowercasing, and removing forbidden characters.
 */
export function normalizeSlug(raw: string): string {
  if (!raw) return "";
  return raw
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

/**
 * Validates a personalized slug against format rules and in-app reserved paths.
 */
export function validateSlug(rawSlug: string): { valid: boolean; error?: string } {
  const slug = normalizeSlug(rawSlug);
  if (!slug) {
    return { valid: false, error: "Please enter a personalized alias (e.g. github, resume, project)." };
  }
  if (slug.length < 2) {
    return { valid: false, error: "Slug must be at least 2 characters long." };
  }
  if (slug.length > 50) {
    return { valid: false, error: "Slug must not exceed 50 characters." };
  }
  if (!/^[a-z0-9][a-z0-9-_]*[a-z0-9]$/.test(slug) && slug.length > 1) {
    return {
      valid: false,
      error: "Slug must begin and end with alphanumeric characters (a-z, 0-9) and only contain dashes or underscores.",
    };
  }
  if (RESERVED_APP_PATHS.has(slug)) {
    return {
      valid: false,
      error: `"${slug}" is an in-app path and cannot be used as a short link alias.`,
    };
  }
  return { valid: true };
}

/**
 * Normalizes destination URL to always include http:// or https://
 */
export function normalizeTargetUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Validates destination URL format.
 */
export function validateTargetUrl(url: string): { valid: boolean; error?: string } {
  const normalized = normalizeTargetUrl(url);
  if (!normalized) {
    return { valid: false, error: "Please enter a destination URL." };
  }
  try {
    const parsed = new URL(normalized);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, error: "Destination must use http:// or https://" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Please enter a valid URL (e.g. https://github.com/vanshkumar)." };
  }
}

/**
 * Retrieves local fallback cache of short links.
 */
function getLocalLinks(): ShortLink[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Saves local fallback cache of short links.
 */
function saveLocalLinks(links: ShortLink[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(links));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Checks whether a slug is already taken (either in Supabase or local storage).
 */
export async function isSlugAvailable(rawSlug: string, currentId?: string): Promise<{ available: boolean; error?: string }> {
  const slug = normalizeSlug(rawSlug);
  const validation = validateSlug(slug);
  if (!validation.valid) {
    return { available: false, error: validation.error };
  }

  // Check local cache first
  const local = getLocalLinks();
  const localTaken = local.some((l) => l.slug === slug && l.id !== currentId);
  if (localTaken) {
    return { available: false, error: `vanshkumar.in/${slug} is already taken.` };
  }

  // Check Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("short_links")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data && data.id !== currentId) {
        return { available: false, error: `vanshkumar.in/${slug} is already taken.` };
      }
    } catch {
      // In case table does not exist or network is offline, local check is sufficient
    }
  }

  return { available: true };
}

/**
 * Fetches all short links, ordered by creation date descending.
 */
export async function getAllShortLinks(): Promise<ShortLink[]> {
  const local = getLocalLinks();

  if (!isSupabaseConfigured) {
    return local.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  try {
    const { data, error } = await supabase
      .from("short_links")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return local;
    }

    // Merge and update local cache
    const remoteSlugs = new Set(data.map((d: ShortLink) => d.slug));
    const merged = [...data, ...local.filter((l) => !remoteSlugs.has(l.slug))];
    saveLocalLinks(merged);
    return merged;
  } catch {
    return local;
  }
}

/**
 * Synchronously checks local cache for instant short link redirection.
 */
export function getCachedShortLink(rawSlug: string): ShortLink | null {
  const slug = normalizeSlug(rawSlug);
  if (!slug) return null;
  const local = getLocalLinks();
  return local.find((l) => l.slug === slug) || null;
}

/**
 * Looks up a short link by slug for immediate redirection.
 */
export async function getShortLinkBySlug(rawSlug: string): Promise<ShortLink | null> {
  const slug = normalizeSlug(rawSlug);
  if (!slug) return null;

  // Check synchronous cache first for instant resolution
  const cached = getCachedShortLink(slug);
  if (cached) return cached;

  // If not cached locally, query Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("short_links")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) {
        // Cache for subsequent instant hits
        const local = getLocalLinks();
        saveLocalLinks([data as ShortLink, ...local.filter((l) => l.slug !== slug)]);
        return data as ShortLink;
      }
    } catch {
      // Ignore
    }
  }

  return null;
}

/**
 * Creates a new personalized short link.
 * Note: ONLY admin users can add links to the curated "portfolio_assets" list (My Links).
 */
export async function createShortLink({
  rawSlug,
  rawTargetUrl,
  title,
  description,
  addToLinks,
  isAdmin = false,
}: {
  rawSlug: string;
  rawTargetUrl: string;
  title?: string;
  description?: string;
  addToLinks: boolean;
  isAdmin?: boolean;
}): Promise<{ success: boolean; link?: ShortLink; error?: string }> {
  const slug = normalizeSlug(rawSlug);
  const slugCheck = validateSlug(slug);
  if (!slugCheck.valid) {
    return { success: false, error: slugCheck.error };
  }

  const target_url = normalizeTargetUrl(rawTargetUrl);
  const urlCheck = validateTargetUrl(target_url);
  if (!urlCheck.valid) {
    return { success: false, error: urlCheck.error };
  }

  const availability = await isSlugAvailable(slug);
  if (!availability.available) {
    return { success: false, error: availability.error };
  }

  const resolvedTitle = (title && title.trim()) || `vanshkumar.in/${slug}`;
  const resolvedDesc = description?.trim() || null;
  const now = new Date().toISOString();

  // ONLY admin-created links are permitted to be added to curated portfolio assets ("My Links")
  const canAddToPortfolioLinks = Boolean(isAdmin && addToLinks);
  let asset_id: string | null = null;

  if (canAddToPortfolioLinks && isSupabaseConfigured) {
    try {
      const { data: assetData } = await supabase
        .from("portfolio_assets")
        .insert({
          type: "connection",
          title: resolvedTitle,
          description: resolvedDesc || `Short link: vanshkumar.in/${slug}`,
          url: `https://${DOMAIN_NAME}/${slug}`,
          is_published: true,
        })
        .select("id")
        .single();

      if (assetData) {
        asset_id = assetData.id;
      }
    } catch {
      // Non-fatal if portfolio_assets fails
    }
  }

  const newLink: ShortLink = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `link_${Date.now()}`,
    slug,
    target_url,
    title: resolvedTitle,
    description: resolvedDesc,
    clicks: 0,
    add_to_links: canAddToPortfolioLinks,
    is_admin_created: Boolean(isAdmin),
    asset_id,
    created_at: now,
  };

  // 2. Insert into Supabase short_links
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("short_links")
        .insert({
          id: newLink.id,
          slug: newLink.slug,
          target_url: newLink.target_url,
          title: newLink.title,
          description: newLink.description,
          clicks: 0,
          add_to_links: canAddToPortfolioLinks,
          asset_id,
          created_at: now,
        })
        .select()
        .single();

      if (!error && data) {
        newLink.id = data.id;
      }
    } catch {
      // In case table is not yet created in Supabase, we still succeed with local storage
    }
  }

  // 3. Save to local cache
  const local = getLocalLinks();
  saveLocalLinks([newLink, ...local.filter((l) => l.slug !== slug)]);

  return { success: true, link: newLink };
}

/**
 * Increments click count for a short link.
 */
export async function recordLinkClick(slug: string): Promise<void> {
  const normalized = normalizeSlug(slug);
  const now = new Date().toISOString();

  // 1. Update local cache
  const local = getLocalLinks();
  const updated = local.map((l) => {
    if (l.slug === normalized) {
      return { ...l, clicks: (l.clicks || 0) + 1, last_clicked_at: now };
    }
    return l;
  });
  saveLocalLinks(updated);

  // 2. Update Supabase
  if (isSupabaseConfigured) {
    try {
      // Use RPC or direct update
      const { data } = await supabase
        .from("short_links")
        .select("clicks")
        .eq("slug", normalized)
        .maybeSingle();

      if (data) {
        await supabase
          .from("short_links")
          .update({
            clicks: (data.clicks || 0) + 1,
            last_clicked_at: now,
          })
          .eq("slug", normalized);
      }
    } catch {
      // Ignore
    }
  }
}

/**
 * Deletes a short link and optionally cleans up its associated portfolio asset.
 */
export async function deleteShortLink(id: string, slug: string, assetId?: string | null): Promise<boolean> {
  // 1. Remove from local cache
  const local = getLocalLinks();
  saveLocalLinks(local.filter((l) => l.id !== id && l.slug !== slug));

  // 2. Remove from Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase.from("short_links").delete().eq("id", id);
      if (assetId) {
        await supabase.from("portfolio_assets").delete().eq("id", assetId);
      }
    } catch {
      // Ignore
    }
  }

  return true;
}
