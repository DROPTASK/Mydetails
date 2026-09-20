/** A generic geometric spider-web corner decoration — not the Marvel character (that's copyrighted). */
export function WebCorner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden>
      {[0, 22.5, 45, 67.5, 90].map((deg) => (
        <line key={deg} x1="0" y1="0" x2={120 * Math.cos((deg * Math.PI) / 180)} y2={120 * Math.sin((deg * Math.PI) / 180)} stroke="currentColor" strokeWidth="1" opacity="0.35" />
      ))}
      {[18, 36, 54, 72, 90, 108].map((r) => (
        <path
          key={r}
          d={`M ${r} 0 A ${r} ${r} 0 0 1 0 ${r}`}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.35"
          fill="none"
        />
      ))}
    </svg>
  );
}

/** Small rotated sticker badge, e.g. "Class 11 🎓". Purely decorative & generic. */
export function StickerBadge({ label, rotate = -6, className }: { label: string; rotate?: number; className?: string }) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "0.3rem 0.7rem",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: "var(--surface)",
        border: "1.5px dashed var(--accent)",
        color: "var(--accent)",
        transform: `rotate(${rotate}deg)`,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {label}
    </span>
  );
}

import type { CSSProperties } from "react";

export function FloatingSparkle({ style }: { style?: CSSProperties }) {
  return (
    <span className="floating-sparkle" style={style} aria-hidden>
      ✦
    </span>
  );
}
