import { Sun, Moon } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { cn } from "../lib/utils";
import { sfxToggle } from "../lib/sound";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => {
        sfxToggle();
        toggle();
      }}
      className={cn("theme-switch", className)}
      data-active={isDark}
    >
      {/* Track ambient indicators */}
      <span className="flex items-center justify-between w-full px-2 pointer-events-none select-none" aria-hidden="true">
        <Sun
          className={cn(
            "w-3 h-3 transition-opacity duration-200",
            isDark ? "opacity-30 text-[var(--muted)]" : "opacity-0"
          )}
        />
        <Moon
          className={cn(
            "w-3 h-3 transition-opacity duration-200",
            isDark ? "opacity-0" : "opacity-40 text-[var(--muted)]"
          )}
        />
      </span>

      {/* Tactile Sliding Thumb */}
      <span className="toggle-thumb" aria-hidden="true">
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-[var(--accent)] transition-transform duration-200 rotate-0" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-600 transition-transform duration-200 rotate-0" />
        )}
      </span>
    </button>
  );
}
