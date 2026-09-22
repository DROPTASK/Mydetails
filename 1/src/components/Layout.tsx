import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Search, Sparkles } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { MusicToggle } from "./MusicToggle";
import { MusicIsland } from "./MusicIsland";
import { CommandPalette } from "./CommandPalette";
import { Dock } from "./Dock";
import { NAV } from "../lib/nav";
import { cn } from "../lib/utils";
import { sfxClick } from "../lib/sound";

export function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isRoot = pathname === "/";
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  useEffect(() => {
    const active = scrollerRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [pathname]);

  // Global shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentNav = NAV.find((n) => (n.to === "/" ? isRoot : pathname.startsWith(n.to)));
  const currentLabel = currentNav?.label ?? "Vansh";

  return (
    <div className="min-h-dvh flex flex-col justify-between" style={{ background: "var(--bg)" }}>
      <div className="flex-1">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 w-full bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--hairline)]/70 transition-all">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            {/* Main Header Bar */}
            <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
              {/* Brand & Breadcrumbs */}
              <div className="flex items-center gap-2.5 min-w-0">
                <NavLink
                  to="/"
                  onClick={sfxClick}
                  className="flex items-center gap-2 group shrink-0"
                  title="Vansh Kumar - Home"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/85 text-white flex items-center justify-center font-black text-xs shadow-xs tracking-tight transition-transform group-hover:scale-105">
                    VK
                  </div>
                  <span className="font-extrabold tracking-tight text-base text-[var(--ink)] leading-none">
                    Vansh
                  </span>
                </NavLink>

                {isRoot ? (
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[11px] font-medium text-[var(--muted)] border border-[var(--hairline)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Class 12 · CBSE</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 min-w-0 text-xs">
                    <span className="text-[var(--muted)] opacity-40 select-none">/</span>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--hairline)] min-w-0 max-w-[130px] xs:max-w-[190px] sm:max-w-[280px]">
                      <button
                        onClick={() => {
                          sfxClick();
                          navigate(-1);
                        }}
                        className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors shrink-0 p-0.5 -ml-1"
                        aria-label="Go back"
                        title="Go back"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-[var(--ink)] truncate">
                        {currentLabel}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Action Controls: Search, Music Island, Music Toggle, Theme Toggle */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Quick Command Bar Trigger */}
                <button
                  onClick={() => {
                    sfxClick();
                    setPaletteOpen(true);
                  }}
                  className="hidden sm:flex items-center gap-2 text-xs font-medium px-3 h-[30px] rounded-full bg-[var(--surface)] border border-[var(--hairline)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)]/40 transition-all shadow-xs group"
                  title="Search & Quick Actions (⌘K)"
                >
                  <Search className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors" />
                  <span>Search</span>
                  <kbd className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--hairline)]">
                    ⌘K
                  </kbd>
                </button>

                {/* Audio Track Island (Artwork, Title & Playlist) */}
                <MusicIsland />

                {/* Music Play/Pause Tactile Switch */}
                <MusicToggle />

                {/* Theme Day/Night Tactile Switch */}
                <ThemeToggle />
              </div>
            </div>

            {/* Desktop Horizontal Navigation Bar */}
            <nav
              ref={scrollerRef}
              className="hidden md:flex items-center gap-1.5 no-scrollbar overflow-x-auto py-2 border-t border-[var(--hairline)]/50"
              aria-label="Desktop Navigation"
            >
              {NAV.map((n) => {
                const Icon = n.icon;
                const active = n.to === "/" ? isRoot : pathname.startsWith(n.to);
                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.to === "/"}
                    data-active={active}
                    onClick={sfxClick}
                    className={cn(
                      "px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 text-xs font-semibold transition-all border",
                      active
                        ? "bg-[var(--surface)] text-[var(--ink)] border-[var(--hairline)] shadow-xs"
                        : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] border-transparent"
                    )}
                  >
                    <Icon
                      className={cn("w-3.5 h-3.5 transition-colors", active ? "text-[var(--accent)]" : "text-[var(--muted)]")}
                      strokeWidth={active ? 2.3 : 1.8}
                    />
                    <span>{n.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-5xl mx-auto px-4 pb-28 md:pb-16 pt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Footer subtle imprint */}
      <footer className="max-w-5xl mx-auto px-4 pb-20 md:pb-8 pt-4 w-full flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--muted)] gap-2 border-t border-[var(--hairline)]/40">
        <div className="flex items-center gap-1.5">
          <span>Crafted with passion by</span>
          <span className="font-semibold text-[var(--ink)]">Vansh Kumar</span>
          <span>• Class 12 CS</span>
        </div>
        <div className="flex items-center gap-3">
          <NavLink to="/chat" onClick={sfxClick} className="hover:text-[var(--accent)] transition-colors">
            Guestbook & Chat
          </NavLink>
          <span>•</span>
          <button
            onClick={() => {
              sfxClick();
              setPaletteOpen(true);
            }}
            className="hover:text-[var(--accent)] transition-colors"
          >
            ⌘K Palette
          </button>
          <span>•</span>
          <a
            href="https://github.com/DROPTASK"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--accent)] transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>

      {/* Mobile Floating Dock */}
      <Dock onOpenSearch={() => setPaletteOpen(true)} />

      {/* Command Palette Modal */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
