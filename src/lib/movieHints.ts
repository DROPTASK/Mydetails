import type { MovieHintData } from "./tmdb";
import { supabase } from "./supabase";

export type HintCategory = "plot" | "actor" | "director" | "genre" | "year" | "tagline";

const LABELS: Record<HintCategory, string> = {
  plot: "🎭 Plot",
  actor: "⭐ Lead actor",
  director: "🎬 Director",
  genre: "🏷️ Genre",
  year: "📅 Release year",
  tagline: "💬 Tagline",
};

function availableCategories(data: MovieHintData): HintCategory[] {
  const cats: HintCategory[] = ["plot"];
  if (data.leadActor) cats.push("actor");
  if (data.director) cats.push("director");
  if (data.genres.length) cats.push("genre");
  if (data.year) cats.push("year");
  if (data.tagline) cats.push("tagline");
  return cats;
}

/** Plot + lead actor (the two most useful) plus two more picked at random each game. */
export function pickHintChoices(data: MovieHintData): { category: HintCategory; label: string }[] {
  const all = availableCategories(data);
  const guaranteed = all.filter((c) => c === "plot" || c === "actor");
  const rest = all.filter((c) => c !== "plot" && c !== "actor");
  const shuffled = [...rest].sort(() => Math.random() - 0.5);
  const picked = [...guaranteed, ...shuffled].slice(0, 4);
  return picked.map((category) => ({ category, label: LABELS[category] }));
}

function firstSentence(text: string) {
  const match = text.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

async function aiPlotHint(title: string, overview: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("movie-hint", { body: { title, overview } });
    if (error || !data?.hint) return null;
    return data.hint as string;
  } catch {
    return null;
  }
}

/** Resolves the chosen category into a spoiler-light sentence. */
export async function resolveHint(category: HintCategory, data: MovieHintData, movieTitle: string): Promise<string> {
  switch (category) {
    case "plot": {
      const ai = await aiPlotHint(movieTitle, data.overview);
      if (ai) return ai;
      return `Plot hint: ${firstSentence(data.overview) || "No plot summary available."}`;
    }
    case "actor":
      return `The lead role is played by ${data.leadActor}.`;
    case "director":
      return `It's directed by ${data.director}.`;
    case "genre":
      return `Genre: ${data.genres.slice(0, 2).join(" / ")}.`;
    case "year":
      return `It released in ${data.year}.`;
    case "tagline":
      return `Tagline: "${data.tagline}"`;
  }
}
