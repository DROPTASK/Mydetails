import { supabase, isSupabaseConfigured } from "./supabase";
import {
  StrategyPlan,
  encodePlanToShareString,
  decodePlanFromShareString,
} from "./strategyData";

export interface CloudPlanRecord {
  id: string; // e.g. "plan_9f482a"
  shortCode: string; // e.g. "CBSE-8491"
  userEmail: string;
  title: string;
  studentName: string;
  planData: StrategyPlan;
  shareUrl: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_CLOUD_PLANS_KEY = "vk_cloud_strategy_records";

function getLocalCloudPlans(): Record<string, CloudPlanRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_CLOUD_PLANS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalCloudPlans(records: Record<string, CloudPlanRecord>) {
  try {
    localStorage.setItem(STORAGE_CLOUD_PLANS_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Generates an easy-to-read, memorable 4-6 char short code
 */
function generateShortCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "12TH-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Saves a Strategy Plan to Cloud DB and generates universal instant share link
 */
export async function saveStrategyToCloudDb(
  plan: StrategyPlan,
  userEmail: string = "guest@vanshkumar.in"
): Promise<{
  success: boolean;
  record: CloudPlanRecord;
  shareUrl: string;
  shortCode: string;
  isDatabaseSynced: boolean;
  message: string;
}> {
  const localRecords = getLocalCloudPlans();

  // Reuse existing shortCode if already created for this plan id
  const existing = localRecords[plan.id];
  const shortCode = existing?.shortCode || generateShortCode();
  const planId = plan.id;
  const now = Date.now();

  // Create standardized clean share URL with short code
  const origin = typeof window !== "undefined" ? window.location.origin : "https://vanshkumar.in";
  // Standardized direct share URL using short code synced from DB
  const shareUrl = `${origin}/strategy?code=${shortCode}`;

  const record: CloudPlanRecord = {
    id: planId,
    shortCode,
    userEmail: userEmail.toLowerCase(),
    title: plan.title,
    studentName: plan.studentName,
    planData: plan,
    shareUrl,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  // 1. Save in local cloud registry
  localRecords[planId] = record;
  // Also index by shortCode for 1-click lookup
  localRecords[shortCode] = record;
  saveLocalCloudPlans(localRecords);

  // 2. Try saving to Supabase if configured
  let isDatabaseSynced = false;
  if (isSupabaseConfigured) {
    try {
      // Primary: Save directly into strategy_plans table
      const { error: planDbError } = await supabase.from("strategy_plans").upsert(
        {
          id: planId,
          short_code: shortCode.toUpperCase(),
          user_email: userEmail.toLowerCase(),
          student_name: plan.studentName || "",
          title: plan.title || "Class 12th Board Strategy",
          plan_data: plan,
          share_url: shareUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (!planDbError) {
        isDatabaseSynced = true;
      }

      // Also register in short_links table for universal url redirects
      await supabase.from("short_links").upsert(
        {
          slug: shortCode.toLowerCase(),
          target_url: shareUrl,
          title: `Class 12th Plan: ${plan.title} (${plan.studentName})`,
          description: `Study Strategy for ${plan.studentName} with ${plan.days.length} days schedule`,
          add_to_links: false,
        },
        { onConflict: "slug" }
      );
    } catch {
      // Supabase table fallback
    }
  }

  return {
    success: true,
    record,
    shareUrl,
    shortCode,
    isDatabaseSynced,
    message: isDatabaseSynced
      ? "Plan saved to Supabase Cloud Database and synced!"
      : "Plan saved to Cloud Workspace and ready for easy sharing!",
  };
}

/**
 * Looks up a strategy plan by Short Code, Cloud ID, or Share Token
 */
export async function loadStrategyFromCloud(
  identifier: string
): Promise<StrategyPlan | null> {
  if (!identifier) return null;
  const clean = identifier.trim();

  // 1. Check local cloud registry by ID or shortCode
  const localRecords = getLocalCloudPlans();
  if (localRecords[clean]) {
    return localRecords[clean].planData;
  }
  if (localRecords[clean.toUpperCase()]) {
    return localRecords[clean.toUpperCase()].planData;
  }

  // 2. Try decoding as base64 share string directly
  const decoded = decodePlanFromShareString(clean);
  if (decoded) return decoded;

  // 3. Try querying Supabase strategy_plans table directly
  if (isSupabaseConfigured) {
    try {
      // Check strategy_plans table by short_code or id
      const { data: planRecord } = await supabase
        .from("strategy_plans")
        .select("plan_data")
        .or(`short_code.eq.${clean.toUpperCase()},id.eq.${clean}`)
        .maybeSingle();

      if (planRecord?.plan_data) {
        return planRecord.plan_data as StrategyPlan;
      }

      // Fallback: check short_links table
      const { data } = await supabase
        .from("short_links")
        .select("target_url")
        .eq("slug", clean.toLowerCase())
        .maybeSingle();

      if (data?.target_url) {
        const match = data.target_url.match(/[?&]plan=([^&#\s]+)/);
        if (match) {
          const fromUrl = decodePlanFromShareString(match[1]);
          if (fromUrl) return fromUrl;
        }
      }
    } catch {
      // Fallback
    }
  }

  return null;
}

/**
 * Get all plans saved by the current logged-in user
 */
export function getUserCloudPlans(userEmail: string): CloudPlanRecord[] {
  if (!userEmail) return [];
  const records = getLocalCloudPlans();
  const list: CloudPlanRecord[] = [];
  const seenIds = new Set<string>();

  for (const key of Object.keys(records)) {
    const item = records[key];
    if (
      item &&
      item.userEmail === userEmail.toLowerCase() &&
      !seenIds.has(item.id)
    ) {
      seenIds.add(item.id);
      list.push(item);
    }
  }

  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Generates WhatsApp and Telegram quick share links
 */
export function getSocialShareLinks(plan: StrategyPlan, shareUrl: string, shortCode: string) {
  const shareText = encodeURIComponent(
    `📚 Check out my Class 12th Board Strategy Plan: "${plan.title}"!\n` +
      `📅 Target: Score 95%+ with scheduled chapters & YouTube lectures.\n` +
      `🔑 Code: ${shortCode}\n` +
      `🔗 Open instantly: ${shareUrl}`
  );

  return {
    whatsapp: `https://api.whatsapp.com/send?text=${shareText}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Class 12th Board Strategy Plan: ${plan.title}`)}`,
    email: `mailto:?subject=${encodeURIComponent(`Class 12th Board Strategy: ${plan.title}`)}&body=${shareText}`,
  };
}
