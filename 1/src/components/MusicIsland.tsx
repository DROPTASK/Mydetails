import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Music2, Pause, Play, SkipBack, SkipForward, ChevronDown } from "lucide-react";
import { useMusic } from "../lib/musicStore";
import { sfxClick } from "../lib/sound";

export function MusicIsland() {
  const { track, tracks, playing, loading, ready, toggle, next, prev } = useMusic();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (open && panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const disabled = !ready || tracks.length === 0;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          sfxClick();
          setOpen((v) => !v);
        }}
        className="h-[30px] px-2 sm:px-2.5 rounded-full flex items-center gap-1.5 border border-[var(--hairline)] bg-[var(--surface-2)] hover:bg-[var(--surface)] hover:border-[var(--accent)]/40 transition-all text-xs text-[var(--ink)] shadow-xs select-none"
        aria-label="Music playlist & track info"
        title={track ? `${track.title} · ${track.artist || "Lofi"}` : "Music Playlist"}
      >
        <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 relative bg-[var(--surface)] border border-[var(--hairline)] flex items-center justify-center">
          {track?.artwork_url ? (
            <span
              className={`block w-full h-full bg-cover bg-center ${playing ? "spin-disc" : ""}`}
              style={{ backgroundImage: `url(${track.artwork_url})` }}
            />
          ) : (
            <Music2 className="w-2.5 h-2.5 text-[var(--muted)]" />
          )}
          {playing && (
            <span className="absolute inset-0 rounded-full ring-1 ring-[var(--accent)] animate-ping opacity-25" />
          )}
        </div>

        <span className="hidden sm:inline max-w-[90px] md:max-w-[120px] truncate text-[11px] font-medium text-[var(--muted)]">
          {track ? track.title : "Playlist"}
        </span>

        <ChevronDown className={`w-3 h-3 text-[var(--muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-10 z-[80] surface-elevated p-3.5 w-72 rounded-2xl border border-[var(--hairline)] shadow-xl origin-top-right bg-[var(--surface)]"
          >
            {disabled ? (
              <p className="text-xs px-1 py-2 text-[var(--muted)]">
                {ready ? "No tracks available in playlist." : "Loading audio tracks…"}
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-cover bg-center border border-[var(--hairline)] ${playing ? "spin-disc" : ""}`}
                  style={{
                    backgroundImage: track?.artwork_url
                      ? `url(${track.artwork_url})`
                      : "conic-gradient(from 0deg, #444, #999, #444)",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold truncate text-[var(--ink)]">{track?.title}</div>
                  <div className="text-[11px] truncate text-[var(--muted)]">{track?.artist || "Unknown artist"}</div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-[var(--hairline)]/50">
              <button
                onClick={() => {
                  sfxClick();
                  prev();
                }}
                disabled={disabled}
                className="icon-btn hover:text-[var(--accent)]"
                aria-label="Previous track"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  sfxClick();
                  toggle();
                }}
                disabled={disabled}
                className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
                aria-label={playing ? "Pause" : "Play"}
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : playing ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => {
                  sfxClick();
                  next();
                }}
                disabled={disabled}
                className="icon-btn hover:text-[var(--accent)]"
                aria-label="Next track"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
