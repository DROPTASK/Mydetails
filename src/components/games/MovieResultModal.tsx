import { useEffect, useRef } from "react";
import { Check, RotateCcw, Trophy, Film, Star, User, Sparkles, X, Clock } from "lucide-react";
import { posterUrl } from "../../lib/tmdb";
import { sfxClick } from "../../lib/sound";

export interface MovieResultModalProps {
  isOpen: boolean;
  status: "won" | "lost";
  movie: {
    title: string;
    year?: string;
    industryLabel?: string;
    release_date?: string;
    poster_path: string | null;
    overview?: string;
    tagline?: string;
    leadActor?: string | null;
    director?: string | null;
    genres?: string[];
    vote_average?: number;
  };
  winnerName?: string;
  isSelfWinner?: boolean;
  isMultiplayer?: boolean;
  scores?: Record<string, number>;
  round?: number;
  countdownSeconds?: number | null;
  onOk: () => void;
}

export function MovieResultModal({
  isOpen,
  status,
  movie,
  winnerName,
  isSelfWinner,
  isMultiplayer,
  scores,
  round,
  countdownSeconds,
  onOk,
}: MovieResultModalProps) {
  const okButtonRef = useRef<HTMLButtonElement>(null);

  // Auto focus on OK button & handle Enter/Space key to dismiss quickly
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      okButtonRef.current?.focus();
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        sfxClick();
        onOk();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onOk]);

  if (!isOpen) return null;

  const isWon = status === "won";
  const displayYear = movie.year || movie.release_date?.slice(0, 4) || "";
  const poster = movie.poster_path?.startsWith("http")
    ? movie.poster_path
    : posterUrl(movie.poster_path, "w500");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sfxClick();
          onOk();
        }
      }}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[var(--surface)] text-[var(--ink)] shadow-2xl p-5 sm:p-7 max-h-[92vh] flex flex-col justify-between overflow-y-auto no-scrollbar"
        style={{
          boxShadow: isWon
            ? "0 20px 50px -10px rgba(52, 199, 89, 0.25)"
            : "0 20px 50px -10px rgba(226, 121, 90, 0.25)",
        }}
      >
        {/* Close icon button */}
        <button
          onClick={() => {
            sfxClick();
            onOk();
          }}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Status Header Badge */}
        <div className="flex flex-col items-center text-center space-y-2 mb-4">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${
              isWon
                ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                : "bg-red-500/15 text-red-500 border border-red-500/30"
            }`}
          >
            {isWon ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                <span>
                  {isMultiplayer
                    ? winnerName
                      ? isSelfWinner
                        ? `You Won Round ${round || 1}! 🎉`
                        : `👑 ${winnerName} Won Round ${round || 1}!`
                      : "Round Cleared! 🎉"
                    : "Nailed It! You Won 🎉"}
                </span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Round Over • Out of Lives</span>
              </>
            )}
          </div>

          {/* Winner announcement callout */}
          {isMultiplayer && winnerName && (
            <div className="text-xs font-bold text-[var(--muted)]">
              {isSelfWinner ? (
                <span className="text-emerald-500 font-extrabold">
                  ⚡ You cracked the movie before anyone else! +1 pt
                </span>
              ) : (
                <span>
                  🎯 <strong className="text-[var(--ink)]">{winnerName}</strong> guessed this movie! Moving to next round together.
                </span>
              )}
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--ink)]">
            The Movie Was:
          </h2>
        </div>

        {/* Large Poster & Details Showcase */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 my-2">
          {/* Bigger Poster with glow */}
          <div className="shrink-0 relative group">
            {poster ? (
              <img
                src={poster}
                alt={movie.title}
                className="w-36 sm:w-44 h-52 sm:h-64 object-cover rounded-2xl shadow-xl ring-2 ring-white/10 mx-auto"
              />
            ) : (
              <div className="w-36 sm:w-44 h-52 sm:h-64 rounded-2xl bg-[var(--surface-2)] flex flex-col items-center justify-center text-[var(--muted)] border border-[var(--hairline)]">
                <Film className="w-10 h-10 mb-2 opacity-50" />
                <span className="text-xs font-semibold">Cinema Classic</span>
              </div>
            )}
            {movie.industryLabel && (
              <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-sm text-[11px] font-bold text-white shadow-sm border border-white/10">
                {movie.industryLabel}
              </span>
            )}
          </div>

          {/* Metadata content */}
          <div className="flex-1 text-center sm:text-left space-y-2.5 min-w-0">
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-[var(--ink)] leading-tight tracking-tight">
                {movie.title}
              </h3>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-[var(--muted)] mt-1">
                {displayYear && (
                  <span className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--hairline)]">
                    {displayYear}
                  </span>
                )}
                {movie.vote_average && (
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{movie.vote_average.toFixed(1)}</span>
                  </span>
                )}
                {movie.genres && movie.genres.length > 0 && (
                  <span>• {movie.genres.slice(0, 2).join(", ")}</span>
                )}
              </div>
            </div>

            {movie.tagline && (
              <p className="text-xs italic text-[var(--muted)] font-medium leading-relaxed border-l-2 border-[var(--accent)] pl-2 sm:pl-3 text-left">
                "{movie.tagline}"
              </p>
            )}

            <div className="space-y-1 text-xs text-[var(--muted)] text-left bg-[var(--surface-2)]/50 p-3 rounded-xl border border-[var(--hairline)]">
              {movie.director && (
                <div className="flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <span className="font-semibold text-[var(--ink)] truncate">Director:</span>
                  <span className="truncate">{movie.director}</span>
                </div>
              )}
              {movie.leadActor && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <span className="font-semibold text-[var(--ink)] truncate">Lead:</span>
                  <span className="truncate">{movie.leadActor}</span>
                </div>
              )}
            </div>

            {movie.overview && (
              <p className="text-xs text-[var(--muted)] line-clamp-3 text-left leading-relaxed">
                {movie.overview}
              </p>
            )}
          </div>
        </div>

        {/* Multiplayer score recap */}
        {isMultiplayer && scores && Object.keys(scores).length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[var(--ink)] mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Room Leaderboard</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(scores)
                .sort(([, a], [, b]) => b - a)
                .map(([name, score]) => (
                  <span
                    key={name}
                    className="px-2.5 py-1 rounded-lg bg-[var(--surface)] text-[var(--ink)] font-mono font-bold border border-[var(--hairline)] flex items-center gap-1"
                  >
                    <span>{name}:</span>
                    <span className="text-[var(--accent)]">{score} pts</span>
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Big Prominent OK / NEXT Button with Countdown */}
        <div className="mt-5 pt-3 border-t border-[var(--hairline)] space-y-2">
          {countdownSeconds !== undefined && countdownSeconds !== null && countdownSeconds > 0 && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--muted)] font-semibold">
              <Clock className="w-3.5 h-3.5 text-[var(--accent)] animate-pulse" />
              <span>Auto-advancing to next round in {countdownSeconds}s...</span>
            </div>
          )}

          <button
            ref={okButtonRef}
            onClick={() => {
              sfxClick();
              onOk();
            }}
            className="btn btn-primary w-full py-4 text-base font-extrabold tracking-wide uppercase shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>
              {countdownSeconds !== undefined && countdownSeconds !== null && countdownSeconds > 0
                ? `OK • Next Movie (${countdownSeconds}s)`
                : "OK • Next Movie"}
            </span>
            <span className="text-[11px] font-mono opacity-60 ml-2 lowercase hidden sm:inline">
              (press Enter)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
