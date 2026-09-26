import { useState, useEffect, useCallback, useRef } from "react";
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
  Zap,
  Infinity as InfinityIcon,
} from "lucide-react";
import {
  getCinemaMovie,
  CINEMA_CATEGORIES,
  type CinemaIndustry,
  type CinemaMovie,
} from "../../lib/cinemaMovies";
import {
  buildWordState,
  guessLetter,
  hintAvailable,
  markHintUsed,
  type WordState,
} from "../../lib/bollywoodGame";
import { getStoredGameUser, type GameUser } from "../../lib/userStore";
import { WordBoard } from "../../components/games/WordBoard";
import { Keyboard } from "../../components/games/Keyboard";
import { HintPicker } from "../../components/games/HintPicker";
import { MovieResultModal } from "../../components/games/MovieResultModal";
import { PlayerBadge } from "../../components/games/PlayerBadge";
import { SegmentedTabs } from "../../components/SegmentedTabs";
import { sfxCoin, sfxPop, sfxClick, sfxSuccess } from "../../lib/sound";
import { setRoomLiveCache, syncRoomStateToDb, UNLIMITED_LIVES } from "../../lib/roomRealtime";
import { supabase } from "../../lib/supabase";

const SOLO_LIFE_OPTIONS = [
  { label: "4", value: 4 },
  { label: "6", value: 6 },
  { label: "8", value: 8 },
  { label: "∞", value: UNLIMITED_LIVES },
];
const MULTI_LIFE_OPTIONS = [
  { label: "3", value: 3 },
  { label: "5", value: 5 },
  { label: "7", value: 7 },
  { label: "10", value: 10 },
  { label: "∞", value: UNLIMITED_LIVES },
];

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

  // User Profile
  const [user, setUser] = useState<GameUser>(getStoredGameUser);

  // Cinema Industry
  const [industry, setIndustry] = useState<CinemaIndustry>("all");

  // Solo state
  const [soloLives, setSoloLives] = useState(6);
  const [soloStarted, setSoloStarted] = useState(false);
  const [soloLoading, setSoloLoading] = useState(false);
  const [soloMovie, setSoloMovie] = useState<CinemaMovie | null>(null);
  const [soloState, setSoloState] = useState<WordState | null>(null);
  const [soloScores, setSoloScores] = useState({ won: 0, total: 0 });
  const [showResultModal, setShowResultModal] = useState(false);

  // Multiplayer create / join state
  const [multiLives, setMultiLives] = useState(5);
  const [multiLoading, setMultiLoading] = useState(false);
  const [multiError, setMultiError] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const soloStartedRef = useRef(soloStarted);
  soloStartedRef.current = soloStarted;

  // Start Solo Game
  const startSolo = useCallback(
    async (targetIndustry?: CinemaIndustry) => {
      setSoloLoading(true);
      setShowResultModal(false);
      try {
        const ind = targetIndustry || industry;
        const pick = await getCinemaMovie(ind, soloMovie?.title);
        setSoloMovie(pick);
        setSoloState(buildWordState(pick.title, soloLives));
        setSoloStarted(true);
      } catch (err) {
        console.error("Failed to load movie:", err);
      } finally {
        setSoloLoading(false);
      }
    },
    [industry, soloLives, soloMovie]
  );

  // Solo Guess
  const guessSolo = (letter: string) => {
    if (!soloState || soloState.status !== "playing") return;
    const next = guessLetter(soloState, letter);
    setSoloState(next);

    if (next.status === "won") {
      sfxCoin();
      setSoloScores((s) => ({ won: s.won + 1, total: s.total + 1 }));
      // Open big beautiful movie result modal
      setTimeout(() => setShowResultModal(true), 350);
    } else if (next.status === "lost") {
      sfxPop();
      setSoloScores((s) => ({ ...s, total: s.total + 1 }));
      // Open big beautiful movie result modal
      setTimeout(() => setShowResultModal(true), 350);
    }
  };

  // Change industry during solo game
  const handleIndustryChange = (newIndustry: CinemaIndustry) => {
    setIndustry(newIndustry);
    sfxClick();
    if (soloStarted) {
      startSolo(newIndustry);
    }
  };

  // Create Multiplayer Room
  const createRoom = async () => {
    setMultiLoading(true);
    setMultiError("");
    try {
      const pick = await getCinemaMovie(industry);
      const room_code = generateRoomCode();

      // Store in Supabase
      const { error: dbError } = await supabase.from("game_rooms").insert({
        room_code,
        movie_id: pick.id,
        movie_title: pick.title,
        poster_path: pick.poster_path,
        lives: multiLives,
      });

      // Synchronize full live room state with database
      await syncRoomStateToDb(room_code, {
        round: 1,
        movie: pick,
        scores: {},
        winner: null,
        status: "playing",
        lives: multiLives,
      });

      // Always save a fallback in sessionStorage for resilience
      sessionStorage.setItem(
        `room_${room_code}`,
        JSON.stringify({
          room_code,
          movie_id: pick.id,
          movie_title: pick.title,
          poster_path: pick.poster_path,
          lives: multiLives,
          industry,
        })
      );

      if (dbError) {
        console.warn("Using session room fallback:", dbError.message);
      }

      navigate(`/games/bollywood/room/${room_code}?cat=${industry}`);
    } catch (err) {
      console.error("Failed to create room:", err);
      setMultiError("Creating room... redirecting");
      const fallbackCode = generateRoomCode();
      const pick = await getCinemaMovie(industry);
      sessionStorage.setItem(
        `room_${fallbackCode}`,
        JSON.stringify({
          room_code: fallbackCode,
          movie_id: pick.id,
          movie_title: pick.title,
          poster_path: pick.poster_path,
          lives: multiLives,
          industry,
        })
      );
      navigate(`/games/bollywood/room/${fallbackCode}?cat=${industry}`);
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
    <div className="max-w-xl mx-auto space-y-6 pt-2 pb-14 px-2 sm:px-4">
      {/* Top Header with User Badge & Edit */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--hairline)] pb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--accent)] border border-[var(--hairline)]">
          <Clapperboard className="w-3.5 h-3.5" />
          <span>Cinema Word Quiz</span>
        </div>

        <PlayerBadge user={user} onUserChange={setUser} />
      </div>

      {/* Main Title */}
      <div className="text-center space-y-1.5">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--ink)]">
          Cinema Word Guess
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] max-w-md mx-auto">
          Vowels are free! Type or tap consonants to guess the movie before lives run out.
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

      {/* Industry / Cinema Category Pills */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Cinema Industry:
          </span>
          {soloStarted && (
            <span className="text-[11px] font-semibold text-[var(--accent)]">
              {soloMovie?.industryLabel}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
          {CINEMA_CATEGORIES.map((cat) => {
            const isSelected = industry === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleIndustryChange(cat.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[var(--accent)] text-white shadow-sm scale-105"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--hairline)]"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SOLO MODE */}
      {mode === "solo" && (
        <div className="space-y-6">
          {!soloStarted ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--hairline)] text-center space-y-6 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] mx-auto flex items-center justify-center">
                <User className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-[var(--ink)]">Single Player Cinema Quiz</h3>
                <p className="text-xs sm:text-sm text-[var(--muted)] max-w-sm mx-auto">
                  Guess iconic titles across Bollywood, Hollywood, Tollywood, and Kollywood. Fast, tactile, and fun!
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2.5">
                  Lives Allowed
                </p>
                <div className="flex justify-center gap-2">
                  {SOLO_LIFE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSoloLives(opt.value)}
                      className={`pill text-xs font-bold px-3 sm:px-4 py-2 cursor-pointer ${
                        soloLives === opt.value ? "active" : ""
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {soloScores.total > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] text-xs font-bold text-[var(--ink)]">
                  <span>🏆 Session:</span>
                  <span className="text-emerald-500">{soloScores.won} Wins</span>
                  <span>/</span>
                  <span>{soloScores.total} Rounds</span>
                </div>
              )}

              <button
                onClick={() => startSolo()}
                disabled={soloLoading}
                className="btn btn-primary w-full py-4 text-base font-extrabold shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {soloLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Start Quick Game</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6 p-4 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--hairline)] shadow-sm">
              {soloState && soloMovie && (
                <>
                  {/* Top Bar: Lives & Next Fast Button */}
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mr-1">
                        Lives:
                      </span>
                      {soloState.maxLives >= UNLIMITED_LIVES ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-black flex items-center gap-1 border border-emerald-500/20">
                          <InfinityIcon className="w-3.5 h-3.5" />
                          <span>Unlimited</span>
                        </span>
                      ) : (
                        Array.from({ length: soloState.maxLives }).map((_, i) => (
                          <Heart
                            key={i}
                            className="w-4 h-4 transition-colors"
                            style={{
                              color: i < soloState.livesLeft ? "#e2795a" : "var(--surface-2)",
                            }}
                            fill={i < soloState.livesLeft ? "#e2795a" : "none"}
                          />
                        ))
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startSolo()}
                        disabled={soloLoading}
                        className="btn btn-secondary px-3 py-1.5 text-xs font-bold cursor-pointer flex items-center gap-1 hover:text-[var(--accent)]"
                        title="Skip to next movie"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Skip Movie</span>
                      </button>
                    </div>
                  </div>

                  {/* Word Board */}
                  <div className="py-2">
                    <WordBoard cells={soloState.cells} />
                  </div>

                  {/* Hint Section */}
                  {soloState.status === "playing" && (
                    <div className="space-y-4 pt-1">
                      {(hintAvailable(soloState) || soloState.hintUsed) && (
                        <HintPicker
                          movieTitle={soloMovie.title}
                          hintData={{
                            overview: soloMovie.overview,
                            tagline: soloMovie.tagline,
                            genres: soloMovie.genres,
                            year: soloMovie.year,
                            leadActor: soloMovie.leadActor,
                            director: soloMovie.director,
                          }}
                          onUsed={() => setSoloState((s) => (s ? markHintUsed(s) : s))}
                        />
                      )}

                      {/* Standardized QWERTY Keyboard with Physical Listener */}
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

                  {/* If game ended and modal was closed, show inline Next button */}
                  {soloState.status !== "playing" && (
                    <div className="pt-2">
                      <button
                        onClick={() => startSolo()}
                        className="btn btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Play Next Movie</span>
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
          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--hairline)] space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-[var(--ink)]">Create a Game Room</h3>
                <p className="text-xs text-[var(--muted)]">
                  Invite friends to compete live in real-time cinema trivia!
                </p>
              </div>
            </div>

            {/* Lives Selector */}
            <div>
              <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                Lives Per Player
              </p>
              <div className="flex gap-2">
                {MULTI_LIFE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMultiLives(opt.value)}
                    className={`pill flex-1 text-xs font-bold py-2 cursor-pointer text-center ${
                      multiLives === opt.value ? "active" : ""
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {multiError && <p className="text-xs font-bold text-red-500">{multiError}</p>}

            <button
              onClick={createRoom}
              disabled={multiLoading}
              className="btn btn-primary w-full py-3.5 text-sm font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {multiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Room ({industry.toUpperCase()})</span>
                </>
              )}
            </button>
          </div>

          {/* Join Room Box */}
          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--hairline)] space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--surface-2)] text-[var(--ink)] flex items-center justify-center">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-[var(--ink)]">Join with Code</h3>
                <p className="text-xs text-[var(--muted)]">
                  Enter an existing 5-letter room code from your friends.
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
                className="btn btn-secondary px-6 py-2.5 text-xs font-bold cursor-pointer"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Large Beautiful Movie Result Modal Popup */}
      {soloMovie && (
        <MovieResultModal
          isOpen={showResultModal}
          status={soloState?.status === "won" ? "won" : "lost"}
          movie={soloMovie}
          scores={{ [user.displayName]: soloScores.won }}
          onOk={() => {
            setShowResultModal(false);
            startSolo();
          }}
        />
      )}
    </div>
  );
}

export const BollywoodSolo = Bollywood;
