import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Heart,
  RotateCcw,
  Loader2,
  Users,
  User,
  PlusCircle,
  LogIn,
  Clapperboard,
  Sparkles,
} from "lucide-react";
import {
  getBollywoodMovies,
  getMovieHintData,
  posterUrl,
  type Movie,
  type MovieHintData,
} from "../../lib/tmdb";
import {
  buildWordState,
  guessLetter,
  hintAvailable,
  markHintUsed,
  type WordState,
} from "../../lib/bollywoodGame";
import { WordBoard } from "../../components/games/WordBoard";
import { Keyboard } from "../../components/games/Keyboard";
import { HintPicker } from "../../components/games/HintPicker";
import { SegmentedTabs } from "../../components/SegmentedTabs";
import { sfxCoin, sfxPop, sfxClick } from "../../lib/sound";
import { supabase } from "../../lib/supabase";

const SOLO_LIFE_OPTIONS = [4, 6, 8];
const MULTI_LIFE_OPTIONS = [3, 5, 7, 10];

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function Bollywood() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "multiplayer" ? "multiplayer" : "solo";
  const [mode, setMode] = useState<"solo" | "multiplayer">(initialMode);
  const navigate = useNavigate();

  // Solo state
  const [soloLives, setSoloLives] = useState(6);
  const [soloStarted, setSoloStarted] = useState(false);
  const [soloLoading, setSoloLoading] = useState(false);
  const [soloMovie, setSoloMovie] = useState<Movie | null>(null);
  const [soloState, setSoloState] = useState<WordState | null>(null);
  const [soloHintData, setSoloHintData] = useState<MovieHintData | null>(null);
  const [soloScores, setSoloScores] = useState({ won: 0, total: 0 });

  // Multiplayer state
  const [multiLives, setMultiLives] = useState(5);
  const [multiLoading, setMultiLoading] = useState(false);
  const [multiError, setMultiError] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const startSolo = async () => {
    setSoloLoading(true);
    try {
      const page = 1 + Math.floor(Math.random() * 5);
      const movies = await getBollywoodMovies(page);
      const pick = movies[Math.floor(Math.random() * movies.length)];
      setSoloMovie(pick);
      setSoloState(buildWordState(pick.title, soloLives));
      setSoloStarted(true);
      getMovieHintData(pick.id, pick.release_date)
        .then(setSoloHintData)
        .catch(() => setSoloHintData(null));
    } catch (err) {
      console.error("Failed to load Bollywood movie:", err);
    } finally {
      setSoloLoading(false);
    }
  };

  const guessSolo = (letter: string) => {
    if (!soloState) return;
    const next = guessLetter(soloState, letter);
    setSoloState(next);
    if (next.status === "won") {
      sfxCoin();
      setSoloScores((s) => ({ won: s.won + 1, total: s.total + 1 }));
    } else if (next.status === "lost") {
      sfxPop();
      setSoloScores((s) => ({ ...s, total: s.total + 1 }));
    }
  };

  const restartSolo = () => {
    setSoloStarted(false);
    setSoloMovie(null);
    setSoloState(null);
    setSoloHintData(null);
  };

  // Create Multiplayer Room
  const createRoom = async () => {
    setMultiLoading(true);
    setMultiError("");
    try {
      const movies = await getBollywoodMovies(1 + Math.floor(Math.random() * 5));
      const pick = movies[Math.floor(Math.random() * movies.length)];
      const room_code = generateRoomCode();

      const { error: dbError } = await supabase.from("game_rooms").insert({
        room_code,
        movie_id: pick.id,
        movie_title: pick.title,
        poster_path: pick.poster_path,
        lives: multiLives,
      });

      if (dbError) throw dbError;
      navigate(`/games/bollywood/room/${room_code}`);
    } catch (err) {
      console.error("Failed to create room:", err);
      setMultiError("Couldn't create room right now. Please try again.");
    } finally {
      setMultiLoading(false);
    }
  };

  // Join Room
  const joinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    navigate(`/games/bollywood/room/${code}`);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-2 pb-12">
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--accent)] border border-[var(--hairline)]">
          <Clapperboard className="w-3.5 h-3.5" />
          <span>Bollywood Cinema Quiz</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[var(--ink)]">
          Bollywood Word Guess
        </h1>
        <p className="text-sm text-[var(--muted)] max-w-sm mx-auto">
          Vowels are free. Guess the consonants before your lives run out!
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center">
        <SegmentedTabs
          options={[
            { id: "solo", label: "Solo Puzzle" },
            { id: "multiplayer", label: "Live Multiplayer" },
          ]}
          value={mode}
          onChange={(m) => {
            setMode(m);
            setSearchParams({ mode: m });
          }}
        />
      </div>

      {/* SOLO MODE */}
      {mode === "solo" && (
        <div className="space-y-6">
          {!soloStarted ? (
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] text-center space-y-5 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] mx-auto flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[var(--ink)]">Single Player Match</h3>
                <p className="text-xs text-[var(--muted)]">
                  Play through Hindi cinema classics. Hints unlock when you need help!
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2.5">
                  Lives Allowed
                </p>
                <div className="flex justify-center gap-2">
                  {SOLO_LIFE_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setSoloLives(n)}
                      className={`pill text-xs font-bold px-4 py-2 ${soloLives === n ? "active" : ""}`}
                    >
                      {n} Lives
                    </button>
                  ))}
                </div>
              </div>

              {soloScores.total > 0 && (
                <div className="text-xs font-bold text-[var(--muted)]">
                  Session: {soloScores.won} wins / {soloScores.total} rounds
                </div>
              )}

              <button
                onClick={startSolo}
                disabled={soloLoading}
                className="btn btn-primary w-full py-3 text-sm font-bold shadow-md"
              >
                {soloLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Start Solo Game"
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6 p-5 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] text-center shadow-xs">
              {soloState && (
                <>
                  <div className="flex items-center justify-between px-2">
                    <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                      Lives Remaining
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: soloState.maxLives }).map((_, i) => (
                        <Heart
                          key={i}
                          className="w-4 h-4 transition-colors"
                          style={{
                            color: i < soloState.livesLeft ? "#e2795a" : "var(--surface-2)",
                          }}
                          fill={i < soloState.livesLeft ? "#e2795a" : "none"}
                        />
                      ))}
                    </div>
                  </div>

                  <WordBoard cells={soloState.cells} />

                  {soloState.status === "playing" && (
                    <div className="space-y-4 pt-2">
                      {(hintAvailable(soloState) || soloState.hintUsed) && soloMovie && (
                        <HintPicker
                          movieTitle={soloMovie.title}
                          hintData={soloHintData}
                          onUsed={() =>
                            setSoloState((s) => (s ? markHintUsed(s) : s))
                          }
                        />
                      )}
                      <Keyboard
                        guessed={soloState.guessed}
                        correctLetters={Array.from(
                          new Set<string>(
                            soloState.cells
                              .filter((c) => c.status === "revealed")
                              .map((c) => c.char.toLowerCase())
                          )
                        )}
                        onGuess={guessSolo}
                      />
                    </div>
                  )}

                  {soloState.status !== "playing" && soloMovie && (
                    <div className="space-y-4 pt-3">
                      <div
                        className={`p-4 rounded-xl text-center space-y-1 font-bold ${
                          soloState.status === "won"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                      >
                        <p className="text-base">
                          {soloState.status === "won"
                            ? "Splendid! You guessed it! 🎉"
                            : "Out of lives! 😅"}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] text-left">
                        {posterUrl(soloMovie.poster_path, "w342") && (
                          <img
                            src={posterUrl(soloMovie.poster_path, "w342")!}
                            alt=""
                            className="w-14 h-20 rounded-lg object-cover shadow-sm"
                          />
                        )}
                        <div>
                          <div className="font-extrabold text-[var(--ink)]">
                            {soloMovie.title}
                          </div>
                          <div className="text-xs text-[var(--muted)]">
                            Released {soloMovie.release_date?.slice(0, 4)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={startSolo}
                        className="btn btn-primary w-full py-2.5 text-xs font-bold gap-2"
                      >
                        <RotateCcw className="w-4 h-4" /> Next Movie
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* MULTIPLAYER MODE */}
      {mode === "multiplayer" && (
        <div className="space-y-5">
          {/* Create Room Box */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[var(--ink)]">Create a Game Room</h3>
                <p className="text-xs text-[var(--muted)]">
                  Get a shareable code and invite friends to play live.
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                Lives Per Player
              </p>
              <div className="flex gap-2">
                {MULTI_LIFE_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setMultiLives(n)}
                    className={`pill flex-1 text-xs font-bold py-1.5 ${
                      multiLives === n ? "active" : ""
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {multiError && (
              <p className="text-xs font-bold text-red-500">{multiError}</p>
            )}

            <button
              onClick={createRoom}
              disabled={multiLoading}
              className="btn btn-primary w-full py-3 text-sm font-bold shadow-md"
            >
              {multiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                "Create Room & Generate Code"
              )}
            </button>
          </div>

          {/* Join Room Box */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-[var(--ink)] flex items-center justify-center">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[var(--ink)]">Join with Code</h3>
                <p className="text-xs text-[var(--muted)]">
                  Enter an existing 5-letter room code from a friend.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                placeholder="e.g. 7X3KQ"
                maxLength={6}
                className="field uppercase text-center font-mono font-bold tracking-widest text-base flex-1"
              />
              <button
                onClick={joinRoom}
                disabled={!joinCode.trim()}
                className="btn btn-secondary px-5 py-2.5 text-xs font-bold"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const BollywoodSolo = Bollywood;
