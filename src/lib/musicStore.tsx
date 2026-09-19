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
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  selectTrack: (id: string) => void;
};

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load playlist once. No autoplay — browsers block it anyway.
  useEffect(() => {
    supabase
      .from("playlist")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        setTracks((data as PlaylistTrack[]) || []);
        setReady(true);
      }, () => setReady(true));
  }, []);

  const nextRef = useRef<() => void>(() => {});

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
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
    try {
      if (audio.src !== track.audio_url) {
        audio.src = track.audio_url;
      }
      setLoading(true);
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  const pause = () => {
    audioRef.current?.pause();
    setPlaying(false);
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
    setPlaying(true);
    setIndex(i);
  };

  useEffect(() => {
    nextRef.current = next;
  });

  // When the track changes while the user intends to be playing, load & play the new source.
  const wasPlaying = useRef(false);
  useEffect(() => {
    if (wasPlaying.current) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  useEffect(() => {
    wasPlaying.current = playing;
  }, [playing]);

  return (
    <MusicContext.Provider
      value={{ tracks, track, index, playing, loading, ready, play, pause, toggle, next, prev, selectTrack }}
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
