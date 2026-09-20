import { useEffect, useState } from "react";
import { Heart, RotateCcw, Lightbulb, Loader2 } from "lucide-react";
import { getBollywoodMovies, posterUrl, hasTmdbKey, type Movie } from "../../lib/tmdb";
import { buildWordState, guessLetter, type WordState } from "../../lib/bollywoodGame";
import { WordBoard } from "../../components/games/WordBoard";
import { Keyboard } from "../../components/games/Keyboard";
import { sfxCoin, sfxPop } from "../../lib/sound";

const LIFE_OPTIONS = [3, 5, 7, 10];

export function BollywoodSolo() {
  const [lives, setLives] = useState(5);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [movie, setMovie] = useState<Movie | null>(null);
  const [state, setState] = useState<WordState | null>(null);

  const start = async () => {
    setLoading(true);
    setError("");
    try {
      const page = 1 + Math.floor(Math.random() * 5);
      const movies = await getBollywoodMovies(page);
      if (movies.length === 0) throw new Error("No movies found");
      const pick = movies[Math.floor(Math.random() * movies.length)];
      setMovie(pick);
      setState(buildWordState(pick.title, lives));
      setStarted(true);
    } catch {
      setError(hasTmdbKey() ? "Couldn't load a movie — try again." : "TMDB API key isn't configured, so this game can't fetch movies.");
    } finally {
      setLoading(false);
    }
  };

  const guess = (letter: string) => {
    if (!state) return;
    const next = guessLetter(state, letter);
    setState(next);
    if (next.status === "won") sfxCoin();
    else if (next.status === "lost") sfxPop();
  };

  const restart = () => {
    setStarted(false);
    setMovie(null);
    setState(null);
  };

  if (!started) {
    return (
      <div className="max-w-sm mx-auto text-center space-y-5 pt-6">
        <h2 className="text-2xl font-extrabold">🎬 Bollywood — Solo</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Vowels are shown for free. Guess the consonants before you run out of lives — you'll get one hint halfway through.
        </p>
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>Lives</p>
          <div className="flex justify-center gap-2">
            {LIFE_OPTIONS.map((n) => (
              <button key={n} onClick={() => setLives(n)} className={`pill ${lives === n ? "active" : ""}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
        <button onClick={start} disabled={loading} className="btn btn-primary px-6 py-3 mx-auto">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start game"}
        </button>
      </div>
    );
  }

  if (!state || !movie) return null;

  return (
    <div className="max-w-md mx-auto text-center space-y-5 pt-4">
      <div className="flex items-center justify-center gap-1">
        {Array.from({ length: state.maxLives }).map((_, i) => (
          <Heart
            key={i}
            className="w-5 h-5"
            style={{ color: i < state.livesLeft ? "#ff3b30" : "var(--surface-2)" }}
            fill={i < state.livesLeft ? "#ff3b30" : "none"}
          />
        ))}
      </div>

      <WordBoard cells={state.cells} />

      {state.hintUsed && state.status === "playing" && (
        <p className="text-xs flex items-center justify-center gap-1" style={{ color: "var(--accent)" }}>
          <Lightbulb className="w-3.5 h-3.5" /> Hint used — one letter revealed for free
        </p>
      )}

      {state.status === "playing" && (
        <Keyboard
          guessed={state.guessed}
          correctLetters={Array.from(new Set<string>(state.cells.filter((c) => c.status === "revealed").map((c) => c.char.toLowerCase())))}
          onGuess={guess}
        />
      )}

      {state.status !== "playing" && (
        <div className="space-y-3">
          <p className="text-lg font-extrabold">{state.status === "won" ? "🎉 You got it!" : "😅 Out of lives"}</p>
          <div className="flex items-center justify-center gap-3">
            {posterUrl(movie.poster_path, "w342") && (
              <img src={posterUrl(movie.poster_path, "w342")!} alt="" className="w-14 h-20 rounded-lg object-cover" />
            )}
            <div className="text-left">
              <div className="font-bold">{movie.title}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>{movie.release_date?.slice(0, 4)}</div>
            </div>
          </div>
          <button onClick={restart} className="btn btn-secondary px-5 py-2.5 mx-auto">
            <RotateCcw className="w-4 h-4" /> Play again
          </button>
        </div>
      )}
    </div>
  );
}
