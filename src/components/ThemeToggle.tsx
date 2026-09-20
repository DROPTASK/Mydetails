import { useTheme } from "../hooks/useTheme";
import { cn } from "../lib/utils";
import { sfxToggle } from "../lib/sound";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => {
        sfxToggle();
        toggle();
      }}
      aria-label="Toggle theme"
      className={cn("weather-switch", className)}
      data-on={isDark}
    >
      <span className="weather-switch-sky">
        <span className="weather-cloud weather-cloud-1" />
        <span className="weather-cloud weather-cloud-2" />
        <span className="weather-star weather-star-1" />
        <span className="weather-star weather-star-2" />
        <span className="weather-star weather-star-3" />
      </span>
      <span className="weather-switch-thumb">{isDark ? "🌙" : "☀️"}</span>
    </button>
  );
}
