import { supabase, type GameRoom } from "./supabase";
import {
  getCinemaMovie,
  findCinemaMovie,
  type CinemaMovie,
  type CinemaIndustry,
  getCinemaCategoryLabel,
} from "./cinemaMovies";
import type { OpponentSnapshot } from "./bollywoodGame";

export const UNLIMITED_LIVES = 999;

export function isUnlimitedLives(lives?: number): boolean {
  if (lives === undefined || lives === null) return false;
  return lives >= 999;
}

export interface PeerLiveInfo {
  nickname: string;
  userId: string;
  livesLeft: number;
  maxLives: number;
  score: number;
  status: "playing" | "spectating" | "won" | "lost";
  snapshot: OpponentSnapshot | null;
}

export interface WinnerPayload {
  winner: string;
  winnerId: string;
  movieTitle: string;
  scores: Record<string, number>;
  round: number;
}

export interface AllLostPayload {
  movieTitle: string;
  round: number;
}

export interface NextRoundPayload {
  round: number;
  movie: CinemaMovie;
  scores: Record<string, number>;
}

export interface RoomSyncPayload {
  targetKey?: string;
  round: number;
  movie: CinemaMovie;
  scores: Record<string, number>;
  winner: WinnerPayload | null;
  allLost: boolean;
  lives: number;
}

export interface CachedRoomState {
  round: number;
  movie: CinemaMovie;
  scores: Record<string, number>;
  winner: WinnerPayload | null;
  allLost: boolean;
  lives: number;
  updatedAt: number;
}

export function getRoomLiveCache(code: string): CachedRoomState | null {
  try {
    const raw = localStorage.getItem(`cine_live_room_${code.toUpperCase()}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

export function setRoomLiveCache(code: string, state: CachedRoomState): void {
  try {
    localStorage.setItem(`cine_live_room_${code.toUpperCase()}`, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/**
 * Authoritative DB reader: Loads room directly from Supabase game_rooms table
 */
export async function loadRoomFromDb(
  code: string,
  industryParam: CinemaIndustry = "all"
): Promise<CachedRoomState | null> {
  const cleanCode = code.toUpperCase();

  try {
    const { data, error } = await supabase
      .from("game_rooms")
      .select("*")
      .eq("room_code", cleanCode)
      .maybeSingle();

    if (error) {
      console.warn("Supabase fetch room error:", error.message);
    }

    if (data) {
      const raw = data as any;
      const lives = raw.lives ?? 5;
      const round = typeof raw.round === "number" && raw.round > 0 ? raw.round : 1;
      const scores = raw.scores && typeof raw.scores === "object" ? raw.scores : {};
      const winnerName = raw.winner_name || null;
      const winnerId = raw.winner_id || "";

      let movie: CinemaMovie | null = null;

      // 1. Try movie_data JSON if saved
      if (raw.movie_data && raw.movie_data.title) {
        movie = raw.movie_data as CinemaMovie;
      }

      // 2. Try looking up by id or title in curated pool
      if (!movie) {
        movie = findCinemaMovie(raw.movie_id) || findCinemaMovie(raw.movie_title) || null;
      }

      // 3. Fallback: fetch movie details
      if (!movie) {
        const fallback = await getCinemaMovie(industryParam);
        movie = {
          id: raw.movie_id,
          title: raw.movie_title,
          year: fallback.year,
          industry: fallback.industry,
          industryLabel: fallback.industryLabel || getCinemaCategoryLabel(fallback.industry),
          overview: fallback.overview,
          tagline: fallback.tagline,
          genres: fallback.genres,
          leadActor: fallback.leadActor,
          director: fallback.director,
          poster_path: raw.poster_path || fallback.poster_path,
          vote_average: fallback.vote_average,
        };
      }

      let winner: WinnerPayload | null = null;
      if (winnerName) {
        winner = {
          winner: winnerName,
          winnerId,
          movieTitle: movie.title,
          scores,
          round,
        };
      }

      const roomState: CachedRoomState = {
        round,
        movie,
        scores,
        winner,
        allLost: raw.status === "lost",
        lives,
        updatedAt: Date.now(),
      };

      setRoomLiveCache(cleanCode, roomState);
      return roomState;
    }
  } catch (err) {
    console.warn("loadRoomFromDb error, checking cache:", err);
  }

  // Fallback to local cache if DB was unreachable or empty
  return getRoomLiveCache(cleanCode);
}

/**
 * Authoritative DB writer: Syncs room state directly to Supabase game_rooms table
 */
export async function syncRoomStateToDb(
  code: string,
  state: {
    round: number;
    movie: CinemaMovie;
    scores: Record<string, number>;
    winner: WinnerPayload | null;
    status: "playing" | "won" | "lost";
    lives: number;
  }
): Promise<void> {
  const cleanCode = code.toUpperCase();

  // Save to local cache immediately
  setRoomLiveCache(cleanCode, {
    round: state.round,
    movie: state.movie,
    scores: state.scores,
    winner: state.winner,
    allLost: state.status === "lost",
    lives: state.lives,
    updatedAt: Date.now(),
  });

  try {
    // Attempt full update with enhanced columns
    const fullPayload = {
      round: state.round,
      movie_id: state.movie.id,
      movie_title: state.movie.title,
      poster_path: state.movie.poster_path,
      movie_data: state.movie,
      scores: state.scores,
      status: state.status,
      winner_name: state.winner?.winner || null,
      winner_id: state.winner?.winnerId || null,
      lives: state.lives,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("game_rooms")
      .update(fullPayload)
      .eq("room_code", cleanCode);

    if (error) {
      // If error is due to missing columns in DB, update only core columns
      console.warn("Full update note, trying core columns fallback:", error.message);
      await supabase
        .from("game_rooms")
        .update({
          movie_id: state.movie.id,
          movie_title: state.movie.title,
          poster_path: state.movie.poster_path,
          lives: state.lives,
        })
        .eq("room_code", cleanCode);
    }
  } catch (err) {
    console.warn("syncRoomStateToDb failed (cached locally):", err);
  }
}
