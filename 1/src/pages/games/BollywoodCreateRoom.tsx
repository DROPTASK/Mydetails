import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getBollywoodMovies, hasTmdbKey } from "../../lib/tmdb";

const LIFE_OPTIONS = [3, 5, 7, 10];

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function BollywoodCreateRoom() {
  const [lives, setLives] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const create = async () => {
    setLoading(true);
    setError("");
    try {
      const movies = await getBollywoodMovies(1 + Math.floor(Math.random() * 5));
      if (!movies.length) throw new Error("no movies");
      const pick = movies[Math.floor(Math.random() * movies.length)];
      const room_code = randomCode();
      const { error: dbError } = await supabase.from("game_rooms").insert({
        room_code,
        movie_id: pick.id,
        movie_title: pick.title,
        poster_path: pick.poster_path,
        lives,
      });
      if (dbError) throw dbError;
      navigate(`/games/bollywood/room/${room_code}`);
    } catch {
      setError(hasTmdbKey() ? "Couldn't create a room — try again." : "TMDB API key isn't configured, so a room can't be created.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto text-center space-y-5 pt-6">
      <span className="icon-btn mx-auto" style={{ width: 48, height: 48 }}>
        <Users className="w-5 h-5" />
      </span>
      <h2 className="text-2xl font-extrabold">🎬 Bollywood — Multiplayer</h2>
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Create a room, share the link, and whoever opens it plays the same movie with you — live, no sign-in.
      </p>
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Lives per player</p>
        <div className="flex justify-center gap-2">
          {LIFE_OPTIONS.map((n) => (
            <button key={n} onClick={() => setLives(n)} className={`pill ${lives === n ? "active" : ""}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
      <button onClick={create} disabled={loading} className="btn btn-primary px-6 py-3 mx-auto">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create room"}
      </button>
    </div>
  );
}
