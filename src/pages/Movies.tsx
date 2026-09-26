import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Star, X, Clapperboard, Clock, Heart, Music2, Pause, Play } from "lucide-react";
import {
  getTrending,
  getTopRated,
  getUpcoming,
  searchMovies,
  getMovieDetails,
  posterUrl,
  backdropUrl,
  hasTmdbKey,
  type Movie,
  type MovieDetails,
} from "../lib/tmdb";
import { supabase, type FavoriteMovie } from "../lib/supabase";
import { DEFAULT_FAVORITE_MOVIES } from "../lib/fallbackData";
import { useMusic } from "../lib/musicStore";

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function PosterGrid({ movies, onSelect }: { movies: Movie[]; onSelect: (m: Movie) => void }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035 } } }}
      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4"
    >
      {movies.map((m) => {
        const poster = posterUrl(m.poster_path, "w342");
        return (
          <motion.button
            key={m.id}
            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(m)}
            className="text-left group"
          >
            <div className="surface overflow-hidden aspect-[2/3] relative">
              {poster ? (
                <img src={poster} alt={m.title} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--muted)" }}>
                  <Clapperboard className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-1.5 flex items-center gap-1 bg-gradient-to-t from-black/70 to-transparent">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[11px] font-semibold text-white">{m.vote_average?.toFixed(1) ?? "—"}</span>
              </div>
            </div>
            <div className="mt-2 text-[13px] font-semibold leading-tight line-clamp-2">{m.title}</div>
            <div className="text-[11px]" style={{ color: "var(--muted)" }}>
              {m.release_date?.slice(0, 4) || "TBA"}
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="skeleton aspect-[2/3]" />
          <div className="skeleton h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

function favoriteToMovie(f: FavoriteMovie): Movie {
  return {
    id: f.tmdb_id,
    title: f.title,
    overview: f.overview || "",
    poster_path: f.poster_path,
    backdrop_path: f.backdrop_path,
    release_date: f.release_date || "",
    vote_average: f.vote_average || 0,
  };
}

function MovieModal({ id, fallback, onClose }: { id: number; fallback?: Movie; onClose: () => void }) {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getMovieDetails(id)
      .then((d) => active && setDetails(d))
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // If the live TMDB lookup fails (e.g. no API key configured), fall back to
  // whatever the admin already cached for this favourite so it still renders nicely.
  const shown: MovieDetails | null = details || (failed && fallback ? { ...fallback, runtime: null, genres: [], tagline: "" } : null);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/60"
        style={{ backdropFilter: "blur(6px)" }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative z-10 w-full sm:max-w-lg surface-elevated overflow-hidden max-h-[88dvh] flex flex-col rounded-b-none sm:rounded-b-[24px]"
      >
        <button
          onClick={onClose}
          className="icon-btn absolute top-3 right-3 z-10"
          style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}
        >
          <X className="w-4 h-4" />
        </button>

        {!shown ? (
          <div className="skeleton aspect-video w-full" />
        ) : (
          <>
            <div className="relative aspect-video shrink-0">
              {backdropUrl(shown.backdrop_path) ? (
                <img src={backdropUrl(shown.backdrop_path)!} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-black/10 dark:bg-white/10" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
            </div>
            <div className="p-5 pt-2 overflow-y-auto space-y-3">
              <h2 className="text-2xl font-extrabold tracking-tight leading-tight">{shown.title}</h2>
              {shown.tagline && (
                <p className="text-sm italic" style={{ color: "var(--muted)" }}>
                  {shown.tagline}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-[13px]" style={{ color: "var(--muted)" }}>
                <span className="flex items-center gap-1 font-semibold" style={{ color: "var(--ink)" }}>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {shown.vote_average?.toFixed(1)}
                </span>
                <span>{shown.release_date?.slice(0, 4)}</span>
                {shown.runtime ? (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {Math.floor(shown.runtime / 60)}h {shown.runtime % 60}m
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {shown.genres?.map((g) => (
                  <span key={g.id} className="pill active !text-[11px] !py-1">
                    {g.name}
                  </span>
                ))}
              </div>
              <p className="text-[15px] leading-relaxed pb-4">{shown.overview}</p>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

type Tab = "favourites" | "trending" | "top_rated" | "upcoming";

function MusicSection() {
  const { tracks, track, playing, ready, selectTrack } = useMusic();

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold tracking-tight">Music</h2>
      </div>
      {!ready ? (
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-32 shrink-0 space-y-2">
              <div className="skeleton aspect-square" />
              <div className="skeleton h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="surface p-6" style={{ color: "var(--muted)" }}>
          No tracks yet — add some in admin.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {tracks.map((t) => {
            const isCurrent = track?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => selectTrack(t.id)}
                className="w-32 shrink-0 text-left group"
              >
                <div className="surface overflow-hidden aspect-square relative">
                  {t.artwork_url ? (
                    <img src={t.artwork_url} alt={t.title} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--muted)" }}>
                      <Music2 className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span
                      className="icon-btn opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(255,255,255,0.9)", color: "#000" }}
                    >
                      {isCurrent && playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </span>
                  </div>
                  {isCurrent && playing && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
                  )}
                </div>
                <div className="mt-2 text-[13px] font-semibold leading-tight line-clamp-1">{t.title}</div>
                <div className="text-[11px] line-clamp-1" style={{ color: "var(--muted)" }}>
                  {t.artist || "Unknown artist"}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Movies() {
  const [tab, setTab] = useState<Tab>("favourites");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query);
  const [searchResults, setSearchResults] = useState<Movie[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [favLoading, setFavLoading] = useState(true);

  const keyMissing = useMemo(() => !hasTmdbKey(), []);

  useEffect(() => {
    supabase
      .from("favorite_movies")
      .select("*")
      .order("sort_order")
      .then(
        ({ data }) => {
          if (data && data.length > 0) {
            setFavorites(data as FavoriteMovie[]);
          } else {
            setFavorites(DEFAULT_FAVORITE_MOVIES);
          }
          setFavLoading(false);
        },
        () => {
          setFavorites(DEFAULT_FAVORITE_MOVIES);
          setFavLoading(false);
        }
      );
  }, []);

  useEffect(() => {
    if (tab === "favourites") return;
    if (keyMissing) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrored(false);
    const fetcher = tab === "trending" ? getTrending() : tab === "top_rated" ? getTopRated() : getUpcoming();
    fetcher
      .then(setMovies)
      .catch(() => setErrored(true))
      .finally(() => setLoading(false));
  }, [tab, keyMissing]);

  useEffect(() => {
    if (keyMissing || !debouncedQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    searchMovies(debouncedQuery)
      .then(setSearchResults)
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, [debouncedQuery, keyMissing]);

  const showingSearch = debouncedQuery.trim().length > 0;
  const selectedFallback = selected != null ? favorites.find((f) => f.tmdb_id === selected) : undefined;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Movies</h1>
      </div>

      {!keyMissing && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies"
            className="field field-icon"
          />
        </div>
      )}

      {!showingSearch && (
        <div className="flex items-center gap-1 no-scrollbar overflow-x-auto">
          {([
            { id: "favourites" as const, label: "Favourites", icon: Heart as typeof Heart | null },
            { id: "trending" as const, label: "Trending", icon: null },
            { id: "top_rated" as const, label: "Top Rated", icon: null },
            { id: "upcoming" as const, label: "Upcoming", icon: null },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pill flex items-center gap-1.5 ${tab === t.id ? "active" : ""}`}
            >
              {t.icon ? <t.icon className="w-3.5 h-3.5" /> : null}
              {t.label}
            </button>
          ))}
        </div>
      )}

      {showingSearch ? (
        keyMissing ? null : searching ? (
          <SkeletonGrid />
        ) : searchResults && searchResults.length > 0 ? (
          <PosterGrid movies={searchResults} onSelect={(m) => setSelected(m.id)} />
        ) : (
          <div className="surface p-6" style={{ color: "var(--muted)" }}>
            No movies found for "{debouncedQuery}".
          </div>
        )
      ) : tab === "favourites" ? (
        favLoading ? (
          <SkeletonGrid />
        ) : favorites.length > 0 ? (
          <PosterGrid movies={favorites.map(favoriteToMovie)} onSelect={(m) => setSelected(m.id)} />
        ) : (
          <div className="surface p-6 space-y-1 max-w-lg" style={{ color: "var(--muted)" }}>
            <p className="font-semibold flex items-center gap-2" style={{ color: "var(--ink)" }}>
              <Heart className="w-4 h-4" /> No favourites yet
            </p>
            <p className="text-[14px] leading-relaxed">Add some from the admin dashboard's Movies tab.</p>
          </div>
        )
      ) : keyMissing ? (
        <div className="surface p-6 space-y-2 max-w-lg">
          <p className="font-semibold flex items-center gap-2">
            <Clapperboard className="w-4 h-4" /> Connect a TMDB API key
          </p>
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>
            Get a free key at themoviedb.org → Settings → API, then set{" "}
            <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">VITE_TMDB_API_KEY</code> in your
            environment and redeploy.
          </p>
        </div>
      ) : loading ? (
        <SkeletonGrid />
      ) : errored ? (
        <div className="surface p-6" style={{ color: "var(--muted)" }}>
          Couldn't reach TMDB right now. Try again shortly.
        </div>
      ) : (
        <PosterGrid movies={movies} onSelect={(m) => setSelected(m.id)} />
      )}

      <MusicSection />

      <AnimatePresence>
        {selected != null && (
          <MovieModal
            id={selected}
            fallback={selectedFallback ? favoriteToMovie(selectedFallback) : undefined}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
