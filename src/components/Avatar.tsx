import { useMusic } from "../lib/musicStore";
import { cn } from "../lib/utils";

export function Avatar({
  src,
  name,
  size = 112,
  className,
}: {
  src: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
}) {
  const { playing } = useMusic();
  const initial = name.trim().charAt(0).toUpperCase() || "V";

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {/* Reacts to music: a soft accent-colored ring that breathes while a track plays. */}
      <span
        className={cn("absolute inset-0 rounded-full", playing && "avatar-pulse-ring")}
        style={{ boxShadow: `0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent)` }}
      />
      <div
        className={cn(
          "relative w-full h-full rounded-full overflow-hidden surface-elevated flex items-center justify-center",
          playing && "avatar-bob"
        )}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-extrabold" style={{ fontSize: size * 0.36, color: "var(--muted)" }}>
            {initial}
          </span>
        )}
      </div>
    </div>
  );
}
