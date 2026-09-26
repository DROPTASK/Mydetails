export interface GameUser {
  id: string; // 3-digit tag e.g. "001", "042", "718"
  name: string; // e.g. "Vansh"
  displayName: string; // e.g. "Vansh #001"
}

const STORAGE_KEY = "cine_game_user";

function generateUserId(): string {
  // Returns a nice 3-digit user ID
  return String(Math.floor(1 + Math.random() * 999)).padStart(3, "0");
}

function readRawUser(): GameUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.name === "string" && typeof parsed.id === "string") {
        const id = String(parsed.id).padStart(3, "0");
        const cleanName = parsed.name.replace(/#\d+$/, "").trim() || "Player";
        return {
          id,
          name: cleanName,
          displayName: `${cleanName} #${id}`,
        };
      }
    }
  } catch {
    // Ignore JSON parse errors
  }
  return null;
}

export function getStoredGameUser(): GameUser {
  const existing = readRawUser();
  if (existing) {
    return existing;
  }

  // Check legacy "bw_nickname"
  let legacyName = "Player";
  try {
    const savedLegacy = localStorage.getItem("bw_nickname");
    if (savedLegacy) {
      legacyName = savedLegacy.split("#")[0].trim() || "Player";
    }
  } catch {
    // Ignore
  }

  const id = generateUserId();
  const newUser: GameUser = {
    id,
    name: legacyName,
    displayName: `${legacyName} #${id}`,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem("bw_nickname", newUser.displayName);
  } catch {
    // Ignore
  }

  return newUser;
}

export function saveStoredGameUser(name: string, customId?: string): GameUser {
  let existingId = customId;
  if (!existingId) {
    const existing = readRawUser();
    existingId = existing?.id || generateUserId();
  }

  const id = existingId.padStart(3, "0");
  const cleanName = name.replace(/#\d+$/, "").trim() || "Player";
  const updated: GameUser = {
    id,
    name: cleanName,
    displayName: `${cleanName} #${id}`,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem("bw_nickname", updated.displayName);
  } catch {
    // Ignore
  }

  return updated;
}
