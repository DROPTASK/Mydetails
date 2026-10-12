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
  const cleanEmail = userEmail.trim().toLowerCase();

  // If user is authenticated, check if they already have an existing plan short_code in DB
  let shortCode = "";
  let planId = plan.id;

  if (isSupabaseConfigured && cleanEmail && !cleanEmail.startsWith("guest@")) {
    try {
      const { data: existingUserPlan } = await supabase
        .from("strategy_plans")
        .select("id, short_code")
        .ilike("user_email", cleanEmail)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingUserPlan?.short_code) {
        shortCode = existingUserPlan.short_code;
        if (existingUserPlan.id) {
          planId = existingUserPlan.id;
        }
      }
    } catch {
      // Continue
    }
  }

  // Fallback to local cache by plan.id
  if (!shortCode) {
    shortCode = localRecords[plan.id]?.shortCode || "";
  }

  if (!shortCode) {
    shortCode = generateShortCode();
  }

  const now = Date.now();

  // Standardized share URL: use window origin if available
  const origin = typeof window !== "undefined" ? window.location.origin : "https://vanshkumar.in";
  // Standardized direct share URL using short code synced from DB
  const shareUrl = `${origin}/apps/strategy-builder?code=${shortCode}`;

  const record: CloudPlanRecord = {
    id: planId,
    shortCode,
    userEmail: cleanEmail,
    title: plan.title,
    studentName: plan.studentName,
    planData: {
      ...plan,
      id: planId,
    },
    shareUrl,
    createdAt: localRecords[planId]?.createdAt || now,
    updatedAt: now,
  };

  // 1. Save in local cloud registry
  localRecords[planId] = record;
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
          user_email: cleanEmail,
          student_name: plan.studentName || "",
          title: plan.title || "Class 12th Board Strategy",
          plan_data: {
            ...plan,
            id: planId,
          },
          share_url: shareUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (!planDbError) {
        isDatabaseSynced = true;
      } else {
        console.warn("Supabase strategy_plans upsert warning:", planDbError);
      }

      // Also register in short_links table for direct short slug redirects (e.g. /12th-xxxx)
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
    } catch (e) {
      console.warn("Supabase table fallback:", e);
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
 * Looks up a strategy plan by Short Code, Cloud ID, URL parameter, or Account Email
 */
export async function loadStrategyFromCloud(
  identifier: string
): Promise<StrategyPlan | null> {
  if (!identifier) return null;
  let clean = identifier.trim();

  // If a full URL was passed, extract code or plan or slug
  if (clean.includes("http://") || clean.includes("https://") || clean.includes("?")) {
    try {
      const matchCode = clean.match(/[?&](?:code|cloudPlan)=([^&#\s]+)/i);
      if (matchCode) {
        clean = decodeURIComponent(matchCode[1]).trim();
      } else {
        const matchPlan = clean.match(/[?&](?:shared|plan)=([^&#\s]+)/i);
        if (matchPlan) {
          clean = decodeURIComponent(matchPlan[1]).trim();
        }
      }
    } catch {
      // Continue
    }
  }

  // Normalize short code variations (e.g. "T5QV" -> "12TH-T5QV", "12th-t5qv" -> "12TH-T5QV")
  const upper = clean.toUpperCase();
  const formattedCode = upper.startsWith("12TH-")
    ? upper
    : clean.length <= 6 && !clean.includes("@") && !clean.startsWith("plan_")
    ? `12TH-${upper}`
    : upper;

  // 1. Check local cloud registry by ID or shortCode
  const localRecords = getLocalCloudPlans();
  if (localRecords[clean]?.planData) return localRecords[clean].planData;
  if (localRecords[upper]?.planData) return localRecords[upper].planData;
  if (localRecords[formattedCode]?.planData) return localRecords[formattedCode].planData;

  // 2. Try decoding as base64 share string directly
  const decoded = decodePlanFromShareString(clean);
  if (decoded) return decoded;

  // 3. Try querying Supabase strategy_plans table directly
  if (isSupabaseConfigured) {
    try {
      // Check by short_code (exact & formatted) or id
      const { data: planRecord, error } = await supabase
        .from("strategy_plans")
        .select("plan_data, id, short_code, user_email, share_url, student_name, title")
        .or(`short_code.ilike.${upper},short_code.ilike.${formattedCode},id.eq.${clean}`)
        .limit(1)
        .maybeSingle();

      if (planRecord?.plan_data) {
        // Cache in local storage for fast offline access
        const planObj = planRecord.plan_data as StrategyPlan;
        const cacheRec: CloudPlanRecord = {
          id: planRecord.id,
          shortCode: planRecord.short_code,
          userEmail: planRecord.user_email,
          title: planRecord.title || planObj.title,
          studentName: planRecord.student_name || planObj.studentName,
          planData: planObj,
          shareUrl: planRecord.share_url || `/apps/strategy-builder?code=${planRecord.short_code}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        localRecords[cacheRec.id] = cacheRec;
        localRecords[cacheRec.shortCode] = cacheRec;
        saveLocalCloudPlans(localRecords);

        return planObj;
      }

      // If user passed an email address, lookup their latest saved plan
      if (clean.includes("@")) {
        const { data: emailRecord } = await supabase
          .from("strategy_plans")
          .select("plan_data")
          .ilike("user_email", clean.toLowerCase())
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (emailRecord?.plan_data) {
          return emailRecord.plan_data as StrategyPlan;
        }
      }

      // Fallback: check short_links table for slug
      const { data: shortLinkData } = await supabase
        .from("short_links")
        .select("target_url")
        .or(`slug.ilike.${clean.toLowerCase()},slug.ilike.${formattedCode.toLowerCase()}`)
        .maybeSingle();

      if (shortLinkData?.target_url) {
        const matchCode = shortLinkData.target_url.match(/[?&]code=([^&#\s]+)/i);
        if (matchCode && matchCode[1] !== clean) {
          const loaded = await loadStrategyFromCloud(matchCode[1]);
          if (loaded) return loaded;
        }
        const matchPlan = shortLinkData.target_url.match(/[?&]plan=([^&#\s]+)/i);
        if (matchPlan) {
          const fromUrl = decodePlanFromShareString(matchPlan[1]);
          if (fromUrl) return fromUrl;
        }
      }
    } catch (e) {
      console.warn("Error querying strategy plan from Supabase:", e);
    }
  }

  return null;
}

/**
 * Fetches the active/latest plan saved for a logged-in user directly from Cloud DB
 */
export async function fetchUserLatestPlanFromCloud(
  userEmail: string
): Promise<CloudPlanRecord | null> {
  if (!userEmail) return null;
  const cleanEmail = userEmail.trim().toLowerCase();

  // Check local cache first
  const localList = getUserCloudPlans(cleanEmail);
  const localLatest = localList.length > 0 ? localList[0] : null;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("strategy_plans")
        .select("*")
        .ilike("user_email", cleanEmail)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.plan_data) {
        const record: CloudPlanRecord = {
          id: data.id,
          shortCode: data.short_code,
          userEmail: data.user_email,
          title: data.title || (data.plan_data as StrategyPlan).title,
          studentName: data.student_name || (data.plan_data as StrategyPlan).studentName,
          planData: data.plan_data as StrategyPlan,
          shareUrl: data.share_url,
          createdAt: new Date(data.created_at || Date.now()).getTime(),
          updatedAt: new Date(data.updated_at || Date.now()).getTime(),
        };

        // Sync into local cache
        const local = getLocalCloudPlans();
        local[record.id] = record;
        local[record.shortCode] = record;
        saveLocalCloudPlans(local);

        return record;
      }
    } catch (e) {
      console.error("Error fetching user cloud plan from DB:", e);
    }
  }

  return localLatest;
}

/**
 * Get all plans saved by the current logged-in user from DB and local storage
 */
export async function getUserCloudPlansFromDb(
  userEmail: string
): Promise<CloudPlanRecord[]> {
  if (!userEmail) return [];
  const cleanEmail = userEmail.trim().toLowerCase();
  const list: CloudPlanRecord[] = [];
  const seenIds = new Set<string>();

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from("strategy_plans")
        .select("*")
        .ilike("user_email", cleanEmail)
        .order("updated_at", { ascending: false });

      if (data && data.length > 0) {
        const local = getLocalCloudPlans();
        for (const row of data) {
          if (row.plan_data && !seenIds.has(row.id)) {
            seenIds.add(row.id);
            const rec: CloudPlanRecord = {
              id: row.id,
              shortCode: row.short_code,
              userEmail: row.user_email,
              title: row.title || row.plan_data.title,
              studentName: row.student_name || row.plan_data.studentName,
              planData: row.plan_data as StrategyPlan,
              shareUrl: row.share_url,
              createdAt: new Date(row.created_at || Date.now()).getTime(),
              updatedAt: new Date(row.updated_at || Date.now()).getTime(),
            };
            list.push(rec);
            local[rec.id] = rec;
            local[rec.shortCode] = rec;
          }
        }
        saveLocalCloudPlans(local);
        return list;
      }
    } catch {
      // Fallback to local
    }
  }

  return getUserCloudPlans(cleanEmail);
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
