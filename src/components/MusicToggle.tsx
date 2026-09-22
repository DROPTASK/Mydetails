import { Volume2, VolumeX, Music2 } from "lucide-react";
import { useMusic } from "../lib/musicStore";
import { sfxToggle } from "../lib/sound";
import { cn } from "../lib/utils";

export function MusicToggle({ className }: { className?: string }) {
  const { playing, toggle, track } = useMusic();

  const handleToggle = () => {
    sfxToggle();
    toggle();
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={playing}
      aria-label={playing ? "Pause background music" : "Play background music"}
      title={
        playing
          ? `Now playing: ${track?.title || "Lofi Beats"} (Click to pause)`
          : "Play background music (Click to play)"
      }
      onClick={handleToggle}
      className={cn("music-switch", className)}
      data-active={playing}
    >
      {/* Track ambient indicators */}
      <span className="flex items-center justify-between w-full px-2 pointer-events-none select-none" aria-hidden="true">
        {/* Left slot: animated equalizer when playing, hidden under thumb when paused */}
        <span className="flex items-center justify-center w-3 h-3">
          {playing ? (
            <span className="music-track-eq">
              <span className="music-track-bar" />
              <span className="music-track-bar" />
              <span className="music-track-bar" />
            </span>
          ) : (
            <VolumeX className="w-3 h-3 text-[var(--muted)] opacity-0" />
          )}
        </span>

        {/* Right slot: subtle music icon when paused, hidden under thumb when playing */}
        <span className="flex items-center justify-center w-3 h-3">
          <Music2
            className={cn(
              "w-3 h-3 transition-opacity duration-200",
              playing ? "opacity-0" : "opacity-40 text-[var(--muted)]"
            )}
          />
        </span>
      </span>

      {/* Tactile Sliding Thumb */}
      <span className="toggle-thumb" aria-hidden="true">
        {playing ? (
          <Volume2 className="w-3.5 h-3.5 text-[var(--accent)] transition-transform duration-200" />
        ) : (
          <VolumeX className="w-3.5 h-3.5 text-[var(--muted)] transition-transform duration-200" />
        )}
      </span>
    </button>
  );
}
