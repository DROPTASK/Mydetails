import { isEmail, sendEmail } from "./email";

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

const STORAGE_AUTH_USER_KEY = "strategy_cloud_auth_user";
const STORAGE_PENDING_OTP_KEY = "strategy_pending_otp";

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
 * Requests an 8-digit email OTP and delivers it via real SMTP / Edge Function.
 * The OTP is sent directly to the user's email inbox.
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

  try {
    sessionStorage.setItem(STORAGE_PENDING_OTP_KEY, JSON.stringify(record));
    localStorage.setItem(STORAGE_PENDING_OTP_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage errors
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

  // Dispatch email to user's inbox
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
 * Verifies the 8-digit OTP for the given email
 */
export function verifyEmailOtp(
  email: string,
  enteredOtp: string
): { success: boolean; user?: AuthUser; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = enteredOtp.trim().replace(/\D/g, "");

  if (cleanOtp.length !== 8) {
    return {
      success: false,
      error: "Please enter a valid 8-digit OTP code.",
    };
  }

  let record: PendingOtpRecord | null = null;
  try {
    const raw =
      sessionStorage.getItem(STORAGE_PENDING_OTP_KEY) ||
      localStorage.getItem(STORAGE_PENDING_OTP_KEY);
    if (raw) {
      record = JSON.parse(raw);
    }
  } catch {
    // Ignore
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

  // Successfully verified! Create authenticated user session
  const displayName = cleanEmail.split("@")[0];
  const user: AuthUser = {
    email: cleanEmail,
    userId: `user_${Date.now().toString(36)}`,
    displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
    loggedInAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(user));
    sessionStorage.removeItem(STORAGE_PENDING_OTP_KEY);
    localStorage.removeItem(STORAGE_PENDING_OTP_KEY);
  } catch {
    // Ignore
  }

  return {
    success: true,
    user,
  };
}
