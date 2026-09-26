/**
 * Admin Authentication State & Helpers
 */

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";
const ADMIN_STORAGE_KEY = "vk_admin_session_auth";

/**
 * Checks if the current browser session has unlocked admin privileges.
 */
export function isAdminSession(): boolean {
  try {
    return (
      sessionStorage.getItem(ADMIN_STORAGE_KEY) === "true" ||
      localStorage.getItem(ADMIN_STORAGE_KEY) === "true"
    );
  } catch {
    return false;
  }
}

/**
 * Sets or clears the admin privilege state in the current session.
 */
export function setAdminSession(value: boolean): void {
  try {
    if (value) {
      sessionStorage.setItem(ADMIN_STORAGE_KEY, "true");
    } else {
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Verifies admin password. Returns true if match, or false otherwise.
 */
export function verifyAdminPassword(password: string): boolean {
  if (!password) return false;
  if (!ADMIN_PASSWORD) {
    // In local dev without password configured, allow testing with "admin" or any key
    return true;
  }
  return password === ADMIN_PASSWORD;
}
