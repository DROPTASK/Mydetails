import { motion } from "framer-motion";
import {
  Home,
  User,
  LayoutGrid,
  Clapperboard,
  Gamepad2,
  MessageCircle,
  Search,
  Sparkles,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { sfxClick } from "../lib/sound";

const DOCK_ITEMS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/about", icon: User, label: "About" },
  { to: "/apps", icon: LayoutGrid, label: "Apps" },
  { to: "/movies", icon: Clapperboard, label: "Movies" },
  { to: "/games", icon: Gamepad2, label: "Games" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
];

export function Dock({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:hidden max-w-[95vw]"
      aria-label="Bottom Navigation"
    >
      <div className="glass surface-elevated rounded-full px-2.5 py-1.5 flex items-center gap-1 shadow-xl border border-[var(--hairline)]">
        {DOCK_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              onClick={sfxClick}
              className={cn(
                "relative flex flex-col items-center justify-center w-11 h-11 rounded-full text-[var(--muted)] transition-all",
                isActive && "text-[var(--accent)] font-semibold"
              )}
              title={label}
            >
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.4 : 1.8} />
              {isActive && (
                <motion.span
                  layoutId="mobile-dock-indicator"
                  className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--accent)]"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </NavLink>
          );
        })}

        {onOpenSearch && (
          <button
            onClick={() => {
              sfxClick();
              onOpenSearch();
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
            title="Search & Commands (⌘K)"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
      </div>
    </nav>
  );
}
