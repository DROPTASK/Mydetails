import { supabase } from "./supabase";

/**
 * Calls the Supabase Edge Function `send-email`, which sends over real SMTP.
 * SMTP credentials live only as Edge Function secrets — never in the browser bundle.
 * Best-effort: failures are logged but never thrown, so a broken/unconfigured
 * mail setup never blocks chat or admin actions.
 */
export async function sendEmail(params: { to: string; subject: string; text: string; html?: string }) {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", { body: params });
    if (error) {
      console.warn("Email notification failed:", error);
      return false;
    }
    return Boolean(data?.sent);
  } catch (err) {
    console.warn("Email notification failed:", err);
    return false;
  }
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
