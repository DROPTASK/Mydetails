import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Users, Sparkles, Infinity as InfinityIcon } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getCinemaMovie, CINEMA_CATEGORIES, type CinemaIndustry } from "../../lib/cinemaMovies";
import { getStoredGameUser } from "../../lib/userStore";
import { PlayerBadge } from "../../components/games/PlayerBadge";
import { setRoomLiveCache, syncRoomStateToDb, UNLIMITED_LIVES } from "../../lib/roomRealtime";
import { sfxClick } from "../../lib/sound";

const LIFE_OPTIONS = [
  { label: "3 Lives", value: 3 },
  { label: "5 Lives", value: 5 },
  { label: "7 Lives", value: 7 },
  { label: "10 Lives", value: 10 },
  { label: "∞ Unlimited", value: UNLIMITED_LIVES },
];

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function BollywoodCreateRoom() {
  const [user, setUser] = useState(getStoredGameUser);
  const [industry, setIndustry] = useState<CinemaIndustry>("all");
  const [lives, setLives] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const create = async () => {
    setLoading(true);
    setError("");
    try {
      const pick = await getCinemaMovie(industry);
      const room_code = randomCode();

      // Store in Supabase game_rooms table
      const { error: dbError } = await supabase.from("game_rooms").insert({
        room_code,
        movie_id: pick.id,
        movie_title: pick.title,
        poster_path: pick.poster_path,
        lives,
      });

      // Synchronize full live room state
      await syncRoomStateToDb(room_code, {
        round: 1,
        movie: pick,
        scores: {},
        winner: null,
        status: "playing",
        lives,
      });

      // Local session backup
      sessionStorage.setItem(
        `room_${room_code}`,
        JSON.stringify({
          room_code,
          movie_id: pick.id,
          movie_title: pick.title,
          poster_path: pick.poster_path,
          lives,
          industry,
        })
      );

      if (dbError) {
        console.warn("Supabase room insert note:", dbError.message);
      }

      navigate(`/games/bollywood/room/${room_code}?cat=${industry}`);
    } catch (err) {
      console.error("Room creation error:", err);
      const fallbackCode = randomCode();
      const pick = await getCinemaMovie(industry);
      setRoomLiveCache(fallbackCode, {
        round: 1,
        movie: pick,
        scores: {},
        winner: null,
        allLost: false,
        lives,
        updatedAt: Date.now(),
      });
      navigate(`/games/bollywood/room/${fallbackCode}?cat=${industry}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto text-center space-y-6 pt-4 pb-12">
      <div className="flex justify-center">
        <PlayerBadge user={user} onUserChange={setUser} />
      </div>

      <div className="space-y-2">
        <span className="icon-btn mx-auto" style={{ width: 52, height: 52 }}>
          <Users className="w-6 h-6 text-[var(--accent)]" />
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-[var(--ink)]">
          Live Multiplayer Room
        </h2>
        <p className="text-xs sm:text-sm text-[var(--muted)] max-w-sm mx-auto">
          Create a room, share the code, and compete against friends in real-time cinema trivia!
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] space-y-5 text-left shadow-xs">
        {/* Cinema Industry Selector */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-[var(--muted)] block mb-2">
            Select Cinema Industry
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CINEMA_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  sfxClick();
                  setIndustry(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  industry === cat.id
                    ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm"
                    : "bg-[var(--surface-2)] text-[var(--ink)] border-[var(--hairline)] hover:border-[var(--accent)]/50"
                }`}
              >
                <span>{cat.icon}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lives Selector with Unlimited Option */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">
              Lives Per Player
            </label>
            {lives >= UNLIMITED_LIVES && (
              <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                <InfinityIcon className="w-3.5 h-3.5" />
                <span>Unlimited Lives Enabled</span>
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {LIFE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  sfxClick();
                  setLives(opt.value);
                }}
                className={`pill py-2 text-xs font-bold cursor-pointer text-center ${
                  lives === opt.value ? "active" : ""
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

        <button
          onClick={create}
          disabled={loading}
          className="btn btn-primary w-full py-3.5 text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Create Live Room</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
