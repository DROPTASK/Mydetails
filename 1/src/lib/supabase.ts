import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export type ChatUser = {
  id: string;
  generated_user_id: string;
  generated_password_hash: string;
  display_name: string | null;
  last_seen: string;
  created_at: string;
};

export type Message = {
  id: string;
  sender_type: "user" | "ai" | "admin";
  content: string;
  chat_user_id: string;
  is_read: boolean;
  created_at: string;
};

export type FavoriteMovie = {
  id: string;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  release_date: string | null;
  vote_average: number | null;
  sort_order: number;
  created_at: string;
};

export type ProfileIdentity = {
  name: string;
  bio: string;
  avatar_url: string | null;
};

export type SiteProfile = {
  online: ProfileIdentity;
  real: ProfileIdentity;
};

export type GameRoom = {
  id: string;
  room_code: string;
  movie_id: number;
  movie_title: string;
  poster_path: string | null;
  lives: number;
  created_at: string;
};

export type PortfolioAsset = {
  id: string;
  type: "photo" | "app" | "connection" | "link" | "interest" | "game";
  title: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
  favicon_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type BollywoodMovieRecord = {
  id: number;
  title: string;
  year: string;
  overview: string;
  tagline: string;
  genres: string[];
  lead_actor?: string | null;
  leadActor?: string | null;
  director: string | null;
  poster_path: string | null;
};

export type SkillGroup = {
  category: string;
  icon: string;
  tags: string[];
};

export type MilestoneItem = {
  year: string;
  title: string;
  desc: string;
};

export type AboutBio = {
  title: string;
  subtitle: string;
  description: string;
  location: string;
  curriculum: string;
  stack: string;
  status_title: string;
  status_subtitle: string;
};
