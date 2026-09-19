import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

export type PlaylistTrack = {
  id: string;
  title: string;
  artist: string | null;
  audio_url: string;
  artwork_url: string | null;
  sort_order: number;
};

type MusicContextValue = {
  tracks: PlaylistTrack[];
  track: PlaylistTrack | undefined;
  index: number;
  playing: boolean;
  loading: boolean;
  ready: boolean;
  needsGesture: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  selectTrack: (id: string) => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

const STATE_KEY = "vk_music_state"; // { trackId, wantPlaying }

type SavedState = { trackId?: string; wantPlaying?: boolean };

function loadSaved(): SavedState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as SavedState) : {};
  } catch {
    return {};
  }
}

function saveState(state: SavedState) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wantPlayingRef = useRef(true); // default ON, per product decision — music plays unless the user pauses it

  // Load playlist once, then keep it live via Realtime so admin edits reflect instantly.
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("playlist")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        if (cancelled) return;
        const list = (data as PlaylistTrack[]) || [];
        setTracks(list);
        const saved = loadSaved();
        wantPlayingRef.current = saved.wantPlaying !== false; // default true
        if (saved.trackId) {
          const i = list.findIndex((t) => t.id === saved.trackId);
          if (i !== -1) setIndex(i);
        }
        setReady(true);
      }, () => setReady(true));

    const channel = supabase
      .channel("playlist-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "playlist" }, () => {
        supabase
          .from("playlist")
          .select("*")
          .order("sort_order")
          .then(({ data }) => data && setTracks(data as PlaylistTrack[]));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const nextRef = useRef<() => void>(() => {});

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;
    const onEnded = () => nextRef.current();
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    const onError = () => {
      setLoading(false);
      setPlaying(false);
    };
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("error", onError);
    return () => {
      audio.pause();
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const track = tracks[index];

  const play = async () => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    wantPlayingRef.current = true;
    saveState({ trackId: track.id, wantPlaying: true });
    try {
      if (audio.src !== track.audio_url) {
        audio.src = track.audio_url;
      }
      setLoading(true);
      await audio.play();
      setPlaying(true);
      setNeedsGesture(false);
    } catch {
      // Autoplay was blocked — wait for the first tap/click anywhere and retry then.
      setPlaying(false);
      setNeedsGesture(true);
    } finally {
      setLoading(false);
    }
  };

  const pause = () => {
    audioRef.current?.pause();
    setPlaying(false);
    wantPlayingRef.current = false;
    if (track) saveState({ trackId: track.id, wantPlaying: false });
  };

  const toggle = () => (playing ? pause() : play());

  const prev = () => {
    if (!tracks.length) return;
    setPlaying(false);
    setIndex((i) => (i - 1 + tracks.length) % tracks.length);
  };
  const next = () => {
    if (!tracks.length) return;
    setPlaying(false);
    setIndex((i) => (i + 1) % tracks.length);
  };
  const selectTrack = (id: string) => {
    const i = tracks.findIndex((t) => t.id === id);
    if (i === -1) return;
    if (i === index) {
      toggle();
      return;
    }
    wantPlayingRef.current = true;
    setPlaying(true);
    setIndex(i);
  };

  useEffect(() => {
    nextRef.current = next;
  });

  // When the track changes while the user intends to be playing, load & play the new source.
  const wasPlaying = useRef(false);
  useEffect(() => {
    if (wasPlaying.current || wantPlayingRef.current) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  useEffect(() => {
    wasPlaying.current = playing;
    if (track) saveState({ trackId: track.id, wantPlaying: playing });
  }, [playing, track]);

  // Default-on: once the playlist is ready, try to start playback immediately.
  // Browsers block audio before any user gesture — if that happens, fall back
  // to starting on the very first tap/click/key anywhere on the page.
  useEffect(() => {
    if (!ready || !track) return;
    if (!wantPlayingRef.current) return;
    if (playing) return;
    play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, track]);

  useEffect(() => {
    if (!needsGesture) return;
    const resume = () => {
      if (wantPlayingRef.current && !playing) play();
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsGesture]);

  return (
    <MusicContext.Provider
      value={{ tracks, track, index, playing, loading, ready, needsGesture, play, pause, toggle, next, prev, selectTrack }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within a MusicProvider");
  return ctx;
}
