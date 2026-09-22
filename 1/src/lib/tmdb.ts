const API_KEY = import.meta.env.VITE_TMDB_API_KEY || "";
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

export const posterUrl = (path: string | null, size: "w342" | "w500" | "original" = "w500") =>
  path ? `${IMG}/${size}${path}` : null;

export const backdropUrl = (path: string | null, size: "w780" | "w1280" | "original" = "w1280") =>
  path ? `${IMG}/${size}${path}` : null;

export type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids?: number[];
};

export type MovieDetails = Movie & {
  runtime: number | null;
  genres: { id: number; name: string }[];
  tagline: string;
};

export class TmdbConfigError extends Error {}

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_KEY) throw new TmdbConfigError("Missing VITE_TMDB_API_KEY");
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json() as Promise<T>;
}

export function hasTmdbKey() {
  return Boolean(API_KEY);
}

export async function getTrending(window: "day" | "week" = "week"): Promise<Movie[]> {
  const data = await tmdb<{ results: Movie[] }>(`/trending/movie/${window}`);
  return data.results;
}

export async function getPopular(page = 1): Promise<Movie[]> {
  const data = await tmdb<{ results: Movie[] }>(`/movie/popular`, { page: String(page) });
  return data.results;
}

export async function getTopRated(): Promise<Movie[]> {
  const data = await tmdb<{ results: Movie[] }>(`/movie/top_rated`);
  return data.results;
}

export async function getUpcoming(): Promise<Movie[]> {
  const data = await tmdb<{ results: Movie[] }>(`/movie/upcoming`);
  return data.results;
}

export async function searchMovies(query: string): Promise<Movie[]> {
  if (!query.trim()) return [];
  const data = await tmdb<{ results: Movie[] }>(`/search/movie`, { query });
  return data.results;
}

import { getDatabaseBollywoodMovies, getDatabaseBollywoodMovieById } from "./bollywoodMovies";

/** Popular Hindi-language (Bollywood) movies — queried directly from database or TMDB API. */
export async function getBollywoodMovies(page = 1): Promise<Movie[]> {
  if (hasTmdbKey()) {
    try {
      const data = await tmdb<{ results: Movie[] }>(`/discover/movie`, {
        with_original_language: "hi",
        sort_by: "popularity.desc",
        page: String(page),
        "vote_count.gte": "50",
      });
      const filtered = data.results.filter((m) => m.title && m.title.replace(/[^a-zA-Z]/g, "").length >= 4);
      if (filtered.length > 0) return filtered;
    } catch {
      // Fall through to database
    }
  }

  // Database Bollywood movie pool
  const dbMovies = await getDatabaseBollywoodMovies();
  if (dbMovies.length > 0) {
    return dbMovies.map((m) => ({
      id: m.id,
      title: m.title,
      overview: m.overview,
      poster_path: m.poster_path,
      backdrop_path: m.poster_path,
      release_date: `${m.year}-01-01`,
      vote_average: 8.5,
    }));
  }

  return [];
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  return tmdb<MovieDetails>(`/movie/${id}`);
}

export type MovieHintData = {
  overview: string;
  tagline: string;
  genres: string[];
  year: string;
  leadActor: string | null;
  director: string | null;
};

/** One extra call, bundling credits — everything the hint picker needs about a movie. */
export async function getMovieHintData(id: number, releaseDate: string): Promise<MovieHintData> {
  if (hasTmdbKey() && id > 1000) {
    try {
      const data = await tmdb<
        MovieDetails & { credits: { cast: { name: string; order: number }[]; crew: { name: string; job: string }[] } }
      >(`/movie/${id}`, { append_to_response: "credits" });
      const lead = [...(data.credits?.cast || [])].sort((a, b) => a.order - b.order)[0];
      const director = data.credits?.crew?.find((c) => c.job === "Director");
      return {
        overview: data.overview || "",
        tagline: data.tagline || "",
        genres: (data.genres || []).map((g) => g.name),
        year: releaseDate?.slice(0, 4) || "",
        leadActor: lead?.name || null,
        director: director?.name || null,
      };
    } catch {
      // Fall back to database
    }
  }

  const dbMovie = await getDatabaseBollywoodMovieById(id);
  if (dbMovie) {
    return {
      overview: dbMovie.overview,
      tagline: dbMovie.tagline,
      genres: dbMovie.genres,
      year: dbMovie.year,
      leadActor: dbMovie.leadActor || dbMovie.lead_actor || "Bollywood Star",
      director: dbMovie.director || "Director",
    };
  }

  return {
    overview: "A beloved Hindi cinema classic celebrating life, friendship, and emotion.",
    tagline: "An unforgettable story.",
    genres: ["Drama", "Bollywood"],
    year: releaseDate?.slice(0, 4) || "2015",
    leadActor: "Star Ensemble",
    director: "Acclaimed Filmmaker",
  };
}
