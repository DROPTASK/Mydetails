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

/** Popular Hindi-language (Bollywood) movies — used to seed the word-guess game. */
export async function getBollywoodMovies(page = 1): Promise<Movie[]> {
  const data = await tmdb<{ results: Movie[] }>(`/discover/movie`, {
    with_original_language: "hi",
    sort_by: "popularity.desc",
    page: String(page),
    "vote_count.gte": "50",
  });
  return data.results.filter((m) => m.title && m.title.replace(/[^a-zA-Z]/g, "").length >= 4);
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  return tmdb<MovieDetails>(`/movie/${id}`);
}
