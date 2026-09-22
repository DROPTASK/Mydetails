import { useCallback, useEffect, useRef, useState } from "react";
import { Music, X, SkipForward, Pause, Play } from "lucide-react";

type Track = {
  title: string;
  artist: string;
  preview: string;
  artwork: string;
};

const SEARCH_TERMS = [
  "lofi hip hop",
  "chill instrumental",
  "indie pop",
  "acoustic guitar",
  "synthwave",
  "jazz instrumental",
  "indian indie",
  "electronic chill",
];

async function fetchRandomTrack(): Promise<Track | null> {
  const term = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=25`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const withPreview = (data.results || []).filter((r: any) => r.previewUrl);
  if (!withPreview.length) return null;
  const pick = withPreview[Math.floor(Math.random() * withPreview.length)];
  return {
    title: pick.trackName || "Unknown",
    artist: pick.artistName || "Unknown",
    preview: pick.previewUrl,
    artwork: (pick.artworkUrl100 || "").replace("100x100", "300x300"),
  };
}

export function MusicPlayer() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [track, setTrack] = useState<Track | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadAndPlay = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchRandomTrack();
      if (!next) return;
      setTrack(next);
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = next.preview;
      audioRef.current.volume = 0.7;
      await audioRef.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      setPlaying(false);
      loadAndPlay();
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [track, loadAndPlay]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current || !track) {
      await loadAndPlay();
      return;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      await audioRef.current.play();
      setPlaying(true);
    }
  };

  const close = () => {
    audioRef.current?.pause();
    setPlaying(false);
    setOpen(false);
  };

  const openPlayer = async () => {
    setOpen(true);
    if (!track) await loadAndPlay();
  };

  return (
    <>
      <button
        onClick={openPlayer}
        aria-label="Open music player"
        className="fixed left-4 bottom-6 z-50 w-12 h-12 rounded-full bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
      >
        <Music className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} aria-label="Close overlay" />
          <div className="relative glass-strong rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wide uppercase text-zinc-500">Now playing</span>
              <button onClick={close} className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="relative w-44 h-44">
                <div
                  className={`w-44 h-44 rounded-full overflow-hidden border-4 border-zinc-800 shadow-xl ${playing ? "spin-disc" : ""}`}
                  style={{
                    background: track?.artwork
                      ? `url(${track.artwork}) center/cover`
                      : "radial-gradient(circle at 30% 30%, #3f3f46, #09090b)",
                  }}
                >
                  <div className="absolute inset-0 rounded-full" style={{
                    background: "radial-gradient(circle at center, transparent 18%, rgba(0,0,0,0.15) 19%, transparent 22%)",
                  }} />
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-300 border-4 border-zinc-800" />
              </div>

              <div className="text-center min-h-[3rem]">
                <div className="font-semibold truncate max-w-[260px]">{loading ? "Finding a track…" : track?.title || "Tap play"}</div>
                <div className="text-sm text-zinc-500 truncate max-w-[260px]">{track?.artist || "iTunes preview"}</div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-[#007AFF] text-white flex items-center justify-center hover:bg-[#0066DD]"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={loadAndPlay}
                  className="w-12 h-12 rounded-full glass flex items-center justify-center"
                  aria-label="Next random song"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 text-center">Random 30s previews via iTunes Search (free, no key)</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
