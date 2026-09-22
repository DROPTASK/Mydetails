import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSfxEnabled, setSfxEnabled, sfxToggle } from "../lib/sound";
import { cn } from "../lib/utils";

export function SoundToggle({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(isSfxEnabled());

  useEffect(() => {
    const handleStorage = () => setEnabled(isSfxEnabled());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSfxEnabled(next);
    if (next) sfxToggle();
  };

  return (
    <button
      onClick={handleToggle}
      className={cn("icon-btn relative group", className)}
      aria-label={enabled ? "Mute sound effects" : "Enable sound effects"}
      title={enabled ? "Sound effects active (tap to mute)" : "Sound effects muted (tap to enable)"}
    >
      {enabled ? (
        <Volume2 className="w-4 h-4 transition-transform group-hover:scale-110" />
      ) : (
        <VolumeX className="w-4 h-4 opacity-60 transition-transform group-hover:scale-110" />
      )}
      {enabled && (
        <span
          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: "var(--accent)" }}
        />
      )}
    </button>
  );
}
