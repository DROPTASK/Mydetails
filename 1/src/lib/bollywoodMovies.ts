import { supabase, type BollywoodMovieRecord } from "./supabase";

/**
 * Fetches bollywood movies from the Supabase database table `bollywood_movies`.
 */
export async function getDatabaseBollywoodMovies(): Promise<BollywoodMovieRecord[]> {
  try {
    const { data, error } = await supabase
      .from("bollywood_movies")
      .select("*")
      .order("id");

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((d) => ({
      id: d.id,
      title: d.title,
      year: d.year,
      overview: d.overview || "",
      tagline: d.tagline || "",
      genres: d.genres || [],
      leadActor: d.lead_actor || d.leadActor || "Bollywood Star",
      lead_actor: d.lead_actor || d.leadActor || "Bollywood Star",
      director: d.director || "Director",
      poster_path: d.poster_path,
    }));
  } catch (err) {
    console.error("Error fetching bollywood movies from database:", err);
    return [];
  }
}

export async function getDatabaseBollywoodMovieById(id: number): Promise<BollywoodMovieRecord | undefined> {
  try {
    const { data, error } = await supabase
      .from("bollywood_movies")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return undefined;

    return {
      id: data.id,
      title: data.title,
      year: data.year,
      overview: data.overview || "",
      tagline: data.tagline || "",
      genres: data.genres || [],
      leadActor: data.lead_actor || data.leadActor || "Bollywood Star",
      lead_actor: data.lead_actor || data.leadActor || "Bollywood Star",
      director: data.director || "Director",
      poster_path: data.poster_path,
    };
  } catch {
    return undefined;
  }
}
