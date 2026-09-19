import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Music2, Pause, Play, SkipBack, SkipForward } from "lucide-react";
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
        className="icon-btn relative"
        aria-label="Music"
        title={track ? track.title : "Playlist"}
      >
        {track?.artwork_url ? (
          <span
            className={`block w-full h-full rounded-full bg-cover bg-center ${playing ? "spin-disc" : ""}`}
            style={{ backgroundImage: `url(${track.artwork_url})` }}
          />
        ) : (
          <Music2 className="w-4 h-4" />
        )}
        {playing && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-12 z-[80] surface-elevated p-3 w-72 origin-top-right"
          >
            {disabled ? (
              <p className="text-sm px-1 py-2" style={{ color: "var(--muted)" }}>
                {ready ? "No tracks yet — add some in admin." : "Loading playlist…"}
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-cover bg-center ${playing ? "spin-disc" : ""}`}
                  style={{
                    backgroundImage: track?.artwork_url
                      ? `url(${track.artwork_url})`
                      : "conic-gradient(from 0deg, #444, #999, #444)",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold truncate">{track?.title}</div>
                  <div className="text-[12px] truncate" style={{ color: "var(--muted)" }}>{track?.artist || "Unknown artist"}</div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mt-3">
              <button onClick={prev} disabled={disabled} className="icon-btn" aria-label="Previous">
                <SkipBack className="w-4 h-4" />
              </button>
              <button onClick={toggle} disabled={disabled} className="icon-btn" style={{ width: 44, height: 44 }} aria-label={playing ? "Pause" : "Play"}>
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : playing ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              <button onClick={next} disabled={disabled} className="icon-btn" aria-label="Next">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
