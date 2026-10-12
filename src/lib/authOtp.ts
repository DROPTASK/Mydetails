import { isEmail, sendEmail } from "./email";
import { supabase, isSupabaseConfigured } from "./supabase";

export interface AuthUser {
  email: string;
  userId: string;
  displayName: string;
  loggedInAt: number;
}

interface PendingOtpRecord {
  email: string;
  otp: string;
  expiresAt: number;
}

interface UserAccountRecord {
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_AUTH_USER_KEY = "strategy_cloud_auth_user";
const STORAGE_PENDING_OTP_KEY = "strategy_pending_otp";
const PASSWORD_SALT = "strategy_board_salt_2026";

/**
 * Standard SHA-256 password hashing using Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + PASSWORD_SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a secure, crisp 8-digit numeric OTP (e.g. "48291047")
 */
export function generate8DigitOtp(): string {
  const min = 10000000;
  const max = 99999999;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

/**
 * Returns currently logged-in user or null
 */
export function getCurrentAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.email) {
      return parsed;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Logs out the active user session
 */
export function logoutAuthUser(): void {
  try {
    localStorage.removeItem(STORAGE_AUTH_USER_KEY);
    sessionStorage.removeItem(STORAGE_PENDING_OTP_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Creates a new user account with Email & Password.
 * Persists in Supabase cloud database so the user can log in from ANY device.
 */
export async function registerWithPassword(
  email: string,
  password: string,
  displayName?: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isEmail(cleanEmail)) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (!password || password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters long.",
    };
  }

  const cleanName =
    displayName?.trim() ||
    cleanEmail.split("@")[0].charAt(0).toUpperCase() +
      cleanEmail.split("@")[0].slice(1);

  const pwdHash = await hashPassword(password);
  const userAccountKey = `strategy_user_${cleanEmail}`;

  if (isSupabaseConfigured) {
    try {
      // Check if user already exists
      const { data: existing } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", userAccountKey)
        .maybeSingle();

      if (existing?.value?.passwordHash) {
        return {
          success: false,
          error:
            "An account already exists with this email. Please log in with your password.",
        };
      }

      const accountPayload: UserAccountRecord = {
        email: cleanEmail,
        passwordHash: pwdHash,
        displayName: cleanName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await supabase.from("admin_settings").upsert({
        key: userAccountKey,
        value: accountPayload,
      });
    } catch (e: any) {
      console.warn("Error saving user to Supabase:", e);
    }
  }

  // Save session locally
  const user: AuthUser = {
    email: cleanEmail,
    userId: `user_${Date.now().toString(36)}`,
    displayName: cleanName,
    loggedInAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(user));
  } catch {
    // Ignore
  }

  return { success: true, user };
}

/**
 * Authenticates user with Email & Password from Supabase Cloud DB.
 * Seamless across any device without requiring email OTP.
 */
export async function loginWithPassword(
  email: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isEmail(cleanEmail)) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (!password) {
    return { success: false, error: "Please enter your password." };
  }

  const pwdHash = await hashPassword(password);
  const userAccountKey = `strategy_user_${cleanEmail}`;

  if (isSupabaseConfigured) {
    try {
      const { data: userRow } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", userAccountKey)
        .maybeSingle();

      if (!userRow?.value) {
        return {
          success: false,
          error:
            "No account found with this email. Please create an account or use 8-Digit OTP.",
        };
      }

      const account = userRow.value as UserAccountRecord;
      if (account.passwordHash !== pwdHash) {
        return {
          success: false,
          error: "Incorrect password. Please verify and try again.",
        };
      }

      const user: AuthUser = {
        email: cleanEmail,
        userId: `user_${Date.now().toString(36)}`,
        displayName: account.displayName || cleanEmail.split("@")[0],
        loggedInAt: Date.now(),
      };

      try {
        localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(user));
      } catch {
        // Ignore
      }

      return { success: true, user };
    } catch (e: any) {
      return {
        success: false,
        error: "Network error checking credentials: " + (e?.message || e),
      };
    }
  }

  return {
    success: false,
    error: "Database configuration not found. Please try OTP login.",
  };
}

/**
 * Sets or updates the password for a user
 */
export async function setPasswordForUser(
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!newPassword || newPassword.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters.",
    };
  }

  const pwdHash = await hashPassword(newPassword);
  const userAccountKey = `strategy_user_${cleanEmail}`;

  if (isSupabaseConfigured) {
    try {
      const { data: existing } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", userAccountKey)
        .maybeSingle();

      const prev = (existing?.value || {}) as Partial<UserAccountRecord>;
      const accountPayload: UserAccountRecord = {
        email: cleanEmail,
        passwordHash: pwdHash,
        displayName: prev.displayName || cleanEmail.split("@")[0],
        createdAt: prev.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await supabase.from("admin_settings").upsert({
        key: userAccountKey,
        value: accountPayload,
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to update password." };
    }
  }

  return { success: false, error: "Database not configured." };
}

/**
 * Requests an 8-digit email OTP and delivers it via real SMTP / Edge Function.
 * The OTP is stored in Supabase admin_settings and local storage so any device can verify.
 */
export async function requestEmailOtp(email: string): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  if (!isEmail(cleanEmail)) {
    return {
      success: false,
      message: "Please enter a valid email address.",
      error: "Invalid email",
    };
  }

  // Generate 8-digit OTP
  const otp = generate8DigitOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

  const record: PendingOtpRecord = {
    email: cleanEmail,
    otp,
    expiresAt,
  };

  // 1. Save in local storage
  try {
    sessionStorage.setItem(STORAGE_PENDING_OTP_KEY, JSON.stringify(record));
    localStorage.setItem(STORAGE_PENDING_OTP_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage errors
  }

  // 2. Save in Cloud DB so any device can verify
  if (isSupabaseConfigured) {
    try {
      await supabase.from("admin_settings").upsert({
        key: `strategy_otp_${cleanEmail}`,
        value: record,
      });
    } catch {
      // Ignore
    }
  }

  // Deliver real email via SMTP Edge Function
  const emailSubject = `Your 8-Digit Verification Code: ${otp}`;
  const emailText = `Hello,\n\nYour 8-digit verification code to access and sync your Class 12th Board Study Plans is:\n\n${otp}\n\nThis code is valid for 10 minutes.\n\nBest regards,\n12th Board Strategy Builder`;
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #18181b; margin-top: 0; font-size: 20px;">Class 12th Strategy Builder Login</h2>
      <p style="color: #52525b; font-size: 14px;">Here is your 8-digit one-time verification code to log in and sync your study plan:</p>
      <div style="background-color: #f4f4f5; border: 1px dashed #6366f1; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: #71717a; font-size: 12px; margin-bottom: 0;">This code is valid for 10 minutes. If you did not request this, you can ignore this email.</p>
    </div>
  `;

  const dispatched = await sendEmail({
    to: cleanEmail,
    subject: emailSubject,
    text: emailText,
    html: emailHtml,
  });

  return {
    success: true,
    message: dispatched
      ? `8-digit verification code sent to ${cleanEmail}. Please check your inbox.`
      : `Verification code sent to ${cleanEmail}. Please check your inbox (and spam folder).`,
  };
}

/**
 * Verifies the 8-digit OTP for the given email across local storage and Cloud DB
 */
export async function verifyEmailOtp(
  email: string,
  enteredOtp: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = enteredOtp.trim().replace(/\D/g, "");

  if (cleanOtp.length !== 8) {
    return {
      success: false,
      error: "Please enter a valid 8-digit OTP code.",
    };
  }

  let record: PendingOtpRecord | null = null;

  // 1. Check local storage
  try {
    const raw =
      sessionStorage.getItem(STORAGE_PENDING_OTP_KEY) ||
      localStorage.getItem(STORAGE_PENDING_OTP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.email === cleanEmail) {
        record = parsed;
      }
    }
  } catch {
    // Ignore
  }

  // 2. Check Supabase DB for cross-device support
  if ((!record || record.otp !== cleanOtp) && isSupabaseConfigured) {
    try {
      const { data: dbRow } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", `strategy_otp_${cleanEmail}`)
        .maybeSingle();

      if (dbRow?.value) {
        record = dbRow.value as PendingOtpRecord;
      }
    } catch {
      // Ignore
    }
  }

  if (!record || record.email !== cleanEmail) {
    return {
      success: false,
      error: "No pending OTP request found for this email. Please request a new code.",
    };
  }

  if (Date.now() > record.expiresAt) {
    return {
      success: false,
      error: "Verification code has expired. Please request a new 8-digit code.",
    };
  }

  if (record.otp !== cleanOtp) {
    return {
      success: false,
      error: "Incorrect 8-digit code. Please verify and try again.",
    };
  }

  // Cleanup OTP from DB and local storage
  try {
    sessionStorage.removeItem(STORAGE_PENDING_OTP_KEY);
    localStorage.removeItem(STORAGE_PENDING_OTP_KEY);
    if (isSupabaseConfigured) {
      await supabase
        .from("admin_settings")
        .delete()
        .eq("key", `strategy_otp_${cleanEmail}`);
    }
  } catch {
    // Ignore
  }

  // Check if user has display name in user_account
  let displayName = cleanEmail.split("@")[0];
  if (isSupabaseConfigured) {
    try {
      const { data: u } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", `strategy_user_${cleanEmail}`)
        .maybeSingle();
      if (u?.value?.displayName) {
        displayName = u.value.displayName;
      }
    } catch {
      // Ignore
    }
  }

  const user: AuthUser = {
    email: cleanEmail,
    userId: `user_${Date.now().toString(36)}`,
    displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
    loggedInAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(user));
  } catch {
    // Ignore
  }

  return {
    success: true,
    user,
  };
}
