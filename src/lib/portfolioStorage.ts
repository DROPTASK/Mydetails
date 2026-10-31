import { supabase, isSupabaseConfigured, type PortfolioAsset } from "./supabase";
import { DEFAULT_PORTFOLIO_ASSETS } from "./fallbackData";

const STORAGE_KEY_CUSTOM_ASSETS = "vk_custom_portfolio_assets_v2";
const STORAGE_KEY_DELETED_IDS = "vk_deleted_portfolio_asset_ids_v2";
const STORAGE_KEY_OVERRIDES = "vk_portfolio_asset_overrides_v1";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

export function getAssetOverrides(): Record<string, Partial<PortfolioAsset>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OVERRIDES);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function saveAssetOverride(id: string, patch: Partial<PortfolioAsset>): void {
  try {
    const current = getAssetOverrides();
    current[id] = { ...(current[id] || {}), ...patch };
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(current));

    // Also update custom asset if it exists
    const custom = getCustomAssets();
    const idx = custom.findIndex((a) => a.id === id);
    if (idx >= 0) {
      custom[idx] = { ...custom[idx], ...patch };
      localStorage.setItem(STORAGE_KEY_CUSTOM_ASSETS, JSON.stringify(custom));
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vk_portfolio_assets_updated", { detail: { updatedId: id, patch } }));
    }
  } catch (err) {
    console.warn("Failed to save asset override:", err);
  }
}

export function getDeletedAssetIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_IDS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function markAssetAsDeleted(id: string): void {
  try {
    const deleted = getDeletedAssetIds();
    deleted.add(id);
    localStorage.setItem(STORAGE_KEY_DELETED_IDS, JSON.stringify(Array.from(deleted)));

    // Also remove from custom assets if present
    const custom = getCustomAssets();
    const filtered = custom.filter((a) => a.id !== id);
    if (filtered.length !== custom.length) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_ASSETS, JSON.stringify(filtered));
    }

    // Dispatch update event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vk_portfolio_assets_updated", { detail: { deletedId: id } }));
    }
  } catch (err) {
    console.warn("Failed to mark asset as deleted in localStorage:", err);
  }
}

export function getCustomAssets(): PortfolioAsset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_ASSETS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveCustomAsset(asset: PortfolioAsset): void {
  try {
    const custom = getCustomAssets();
    const idx = custom.findIndex((a) => a.id === asset.id);
    if (idx >= 0) {
      custom[idx] = asset;
    } else {
      custom.push(asset);
    }
    localStorage.setItem(STORAGE_KEY_CUSTOM_ASSETS, JSON.stringify(custom));

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vk_portfolio_assets_updated", { detail: { addedAsset: asset } }));
    }
  } catch (err) {
    console.warn("Failed to save custom asset to localStorage:", err);
  }
}

/**
 * Loads all portfolio assets with resilient fallback & deletion filtering.
 * 1. Checks Supabase if configured.
 * 2. Merges with locally added custom assets.
 * 3. Falls back to default assets if empty.
 * 4. Filters out any assets marked as deleted.
 */
export async function loadAllPortfolioAssets(): Promise<PortfolioAsset[]> {
  const deletedIds = getDeletedAssetIds();
  const customAssets = getCustomAssets();
  let supabaseAssets: PortfolioAsset[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("portfolio_assets")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!error && Array.isArray(data)) {
        supabaseAssets = data as PortfolioAsset[];
      }
    } catch (err) {
      console.warn("Supabase loadAllPortfolioAssets error:", err);
    }
  }

  // Merge items: Supabase items take precedence, then custom local items, then default fallback items
  const itemMap = new Map<string, PortfolioAsset>();

  // 1. Add defaults
  for (const item of DEFAULT_PORTFOLIO_ASSETS) {
    if (!deletedIds.has(item.id)) {
      itemMap.set(item.id, item);
    }
  }

  // 2. Add local custom items
  for (const item of customAssets) {
    if (!deletedIds.has(item.id)) {
      itemMap.set(item.id, item);
    }
  }

  // 3. Add Supabase items
  for (const item of supabaseAssets) {
    if (!deletedIds.has(item.id)) {
      itemMap.set(item.id, item);
    }
  }

  // 4. Apply local overrides (e.g. show_on_home toggles, custom platform tags)
  const overrides = getAssetOverrides();
  for (const [id, patch] of Object.entries(overrides)) {
    const existing = itemMap.get(id);
    if (existing) {
      itemMap.set(id, { ...existing, ...patch });
    }
  }

  const allAssets = Array.from(itemMap.values())
    .filter((a) => !deletedIds.has(a.id))
    .map((a) => ({
      ...a,
      show_on_home: a.show_on_home !== false,
    }));
  return allAssets;
}

/**
 * Toggles whether an asset is shown on the homepage social/connection links.
 * Works persistently for default items, locally added items, and Supabase items.
 */
export async function toggleAssetShowOnHome(id: string, show_on_home: boolean): Promise<boolean> {
  saveAssetOverride(id, { show_on_home });

  if (isSupabaseConfigured && isValidUuid(id)) {
    try {
      await supabase.from("portfolio_assets").update({ is_published: show_on_home }).eq("id", id);
    } catch (err) {
      console.warn("Supabase toggleAssetShowOnHome error:", err);
    }
  }

  return true;
}

/**
 * Adds an asset to Supabase (if available) and saves locally to guarantee persistence.
 */
export async function addPortfolioAsset(
  newAsset: {
    type: string;
    title: string;
    description?: string | null;
    url?: string | null;
    image_url?: string | null;
    show_on_home?: boolean;
    platform?: string | null;
  }
): Promise<PortfolioAsset> {
  const now = new Date().toISOString();
  const generatedId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `asset_${Date.now()}`;

  let createdAsset: PortfolioAsset = {
    id: generatedId,
    type: newAsset.type as PortfolioAsset["type"],
    title: newAsset.title,
    description: newAsset.description || null,
    url: newAsset.url || null,
    image_url: newAsset.image_url || null,
    favicon_url: null,
    sort_order: Date.now(),
    is_published: true,
    show_on_home: newAsset.show_on_home !== false,
    platform: newAsset.platform || null,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("portfolio_assets")
        .insert({
          type: newAsset.type,
          title: newAsset.title,
          url: newAsset.url || null,
          image_url: newAsset.image_url || null,
          description: newAsset.description || null,
          is_published: true,
        })
        .select()
        .single();

      if (!error && data) {
        createdAsset = { ...createdAsset, ...(data as PortfolioAsset), show_on_home: newAsset.show_on_home !== false };
      }
    } catch (err) {
      console.warn("Supabase addPortfolioAsset error, using local fallback:", err);
    }
  }

  saveCustomAsset(createdAsset);
  return createdAsset;
}

/**
 * Deletes an asset from Supabase (if it has a valid UUID) and marks it deleted locally
 * so it never returns even if offline or from default seed data.
 */
export async function deletePortfolioAsset(id: string): Promise<boolean> {
  // 1. Mark deleted locally immediately
  markAssetAsDeleted(id);

  // 2. If it's a valid UUID in Supabase, execute deletion in Supabase database
  if (isSupabaseConfigured && isValidUuid(id)) {
    try {
      const { error } = await supabase.from("portfolio_assets").delete().eq("id", id);
      if (error) {
        console.warn("Supabase deletePortfolioAsset error:", error);
      }
    } catch (err) {
      console.warn("Supabase deletePortfolioAsset network error:", err);
    }
  }

  return true;
}
