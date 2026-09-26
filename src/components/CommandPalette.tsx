import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Home,
  User,
  LayoutGrid,
  Clapperboard,
  Gamepad2,
  Sparkles,
  Image,
  Link2,
  MessageCircle,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  Copy,
  Check,
  Shield,
  ExternalLink,
  Command,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useMusic } from "../lib/musicStore";
import { isSfxEnabled, setSfxEnabled, sfxClick, sfxSuccess } from "../lib/sound";

type CommandItem = {
  id: string;
  title: string;
  subtitle?: string;
  category: "Pages" | "Games" | "Actions" | "Preferences";
  icon: React.ComponentType<{ className?: string }>;
  perform: () => void;
  keywords?: string[];
};

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();
  const { playing, toggle: toggleMusic, next: nextTrack, track } = useMusic();
  const [sfx, setSfx] = useState(isSfxEnabled());
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const toggleSound = () => {
    const next = !sfx;
    setSfx(next);
    setSfxEnabled(next);
    if (next) sfxSuccess();
  };

  const copyEmail = () => {
    navigator.clipboard.writeText("itsme@vanshkumar.in");
    setCopied(true);
    sfxSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  const items: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: "nav-home",
        title: "Home",
        subtitle: "Return to profile & overview",
        category: "Pages",
        icon: Home,
        perform: () => navigate("/"),
        keywords: ["root", "landing", "main"],
      },
      {
        id: "nav-about",
        title: "About Me",
        subtitle: "Class 12 CS, CBSE, skills & background",
        category: "Pages",
        icon: User,
        perform: () => navigate("/about"),
        keywords: ["bio", "story", "education", "experience"],
      },
      {
        id: "nav-apps",
        title: "Projects & Apps",
        subtitle: "AnonRoom, JeeFlow, web apps & tools",
        category: "Pages",
        icon: LayoutGrid,
        perform: () => navigate("/apps"),
        keywords: ["projects", "code", "portfolio", "work"],
      },
      {
        id: "nav-movies",
        title: "Movie Hub",
        subtitle: "TMDB trending, top rated & favorites",
        category: "Pages",
        icon: Clapperboard,
        perform: () => navigate("/movies"),
        keywords: ["films", "cinema", "tmdb", "trending"],
      },
      {
        id: "nav-games",
        title: "Games Hub",
        subtitle: "Bollywood word game, Tic-Tac-Toe, RPS",
        category: "Pages",
        icon: Gamepad2,
        perform: () => navigate("/games"),
        keywords: ["play", "bollywood", "fun"],
      },
      {
        id: "nav-interests",
        title: "Interests & Passions",
        subtitle: "Math, CS, physics & sound design",
        category: "Pages",
        icon: Sparkles,
        perform: () => navigate("/interests"),
        keywords: ["hobbies", "learning", "books"],
      },
      {
        id: "nav-gallery",
        title: "Photo Gallery",
        subtitle: "Setups, workspace & captures",
        category: "Pages",
        icon: Image,
        perform: () => navigate("/gallery"),
        keywords: ["photos", "shots", "setup"],
      },
      {
        id: "nav-links",
        title: "Links & Resources",
        subtitle: "Socials, repositories & shortcuts",
        category: "Pages",
        icon: Link2,
        perform: () => navigate("/links"),
        keywords: ["socials", "contact", "bookmarks"],
      },
      {
        id: "nav-shortener",
        title: "Link Shortener",
        subtitle: "Create custom vanshkumar.in/<personalized> short links",
        category: "Pages",
        icon: Link2,
        perform: () => navigate("/shortener"),
        keywords: ["shortener", "url", "vanity", "link", "vanshkumar.in", "slug"],
      },
      {
        id: "nav-chat",
        title: "Live Chat / Guestbook",
        subtitle: "Send a message or talk to AI assistant",
        category: "Pages",
        icon: MessageCircle,
        perform: () => navigate("/chat"),
        keywords: ["message", "contact", "dm", "ai"],
      },

      // Games
      {
        id: "game-bollywood-solo",
        title: "Bollywood — Solo",
        subtitle: "Guess the Hindi film letter by letter",
        category: "Games",
        icon: Gamepad2,
        perform: () => navigate("/games/bollywood/solo"),
        keywords: ["movie", "hangman", "guess"],
      },
      {
        id: "game-bollywood-multi",
        title: "Bollywood — Multiplayer",
        subtitle: "Create or join a live room with friends",
        category: "Games",
        icon: Gamepad2,
        perform: () => navigate("/games/bollywood/multiplayer"),
        keywords: ["room", "friends", "multiplayer"],
      },
      {
        id: "game-tictactoe",
        title: "Tic-Tac-Toe",
        subtitle: "Classic 2-player grid match",
        category: "Games",
        icon: Gamepad2,
        perform: () => navigate("/games/tic-tac-toe"),
        keywords: ["oxo", "board"],
      },
      {
        id: "game-rps",
        title: "Rock · Paper · Scissors",
        subtitle: "Play a quick duel vs CPU",
        category: "Games",
        icon: Gamepad2,
        perform: () => navigate("/games/rock-paper-scissors"),
        keywords: ["rps", "cpu"],
      },

      // Actions
      {
        id: "act-email",
        title: copied ? "Email Copied!" : "Copy Email Address",
        subtitle: "itsme@vanshkumar.in",
        category: "Actions",
        icon: copied ? Check : Copy,
        perform: copyEmail,
        keywords: ["mail", "contact", "reach out"],
      },
      {
        id: "act-github",
        title: "Open GitHub Profile",
        subtitle: "github.com/DROPTASK",
        category: "Actions",
        icon: ExternalLink,
        perform: () => window.open("https://github.com/DROPTASK", "_blank"),
        keywords: ["repo", "git", "source"],
      },
      {
        id: "act-admin",
        title: "Admin Dashboard",
        subtitle: "Manage assets, tracks & profile",
        category: "Actions",
        icon: Shield,
        perform: () => navigate("/admin"),
        keywords: ["login", "manage", "settings"],
      },

      // Preferences
      {
        id: "pref-theme",
        title: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
        subtitle: `Currently in ${theme} mode`,
        category: "Preferences",
        icon: theme === "dark" ? Sun : Moon,
        perform: () => {
          toggleTheme();
        },
        keywords: ["appearance", "style", "color", "dark", "light"],
      },
      {
        id: "pref-sound",
        title: sfx ? "Mute UI Sound Effects" : "Enable UI Sound Effects",
        subtitle: sfx ? "Tones currently active" : "Audio muted",
        category: "Preferences",
        icon: sfx ? VolumeX : Volume2,
        perform: toggleSound,
        keywords: ["audio", "sfx", "mute", "unmute"],
      },
      {
        id: "pref-music",
        title: playing ? "Pause Ambient Music" : "Play Ambient Music",
        subtitle: track ? track.title : "Background playlist",
        category: "Preferences",
        icon: playing ? Pause : Play,
        perform: () => toggleMusic(),
        keywords: ["song", "lofi", "tracks", "audio"],
      },
      {
        id: "pref-next-music",
        title: "Next Music Track",
        subtitle: "Skip to following song",
        category: "Preferences",
        icon: SkipForward,
        perform: () => nextTrack(),
        keywords: ["skip", "song"],
      },
    ],
    [navigate, theme, toggleTheme, playing, toggleMusic, nextTrack, track, sfx, copied]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle?.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchSub || matchCat || matchKeywords;
    });
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        sfxClick();
        filtered[selectedIndex].perform();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center pt-16 md:pt-24 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl surface-elevated rounded-2xl overflow-hidden shadow-2xl z-10 border border-[var(--hairline)]"
            onKeyDown={handleKeyDown}
          >
            {/* Search Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--hairline)]">
              <Search className="w-5 h-5 text-[var(--muted)] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command, page, or search..."
                className="w-full bg-transparent text-[15px] outline-none text-[var(--ink)] placeholder:text-[var(--muted)]"
              />
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-[var(--hairline)] text-[var(--muted)] hidden sm:inline-block">
                ESC
              </span>
            </div>

            {/* Results list */}
            <div ref={listRef} className="max-h-[380px] overflow-y-auto p-2 divide-y divide-[var(--hairline)]/30">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-[var(--muted)] text-sm">
                  No matching commands or pages found.
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        sfxClick();
                        item.perform();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                        isSelected
                          ? "bg-[var(--accent)] text-white shadow-sm"
                          : "hover:bg-[var(--surface-2)] text-[var(--ink)]"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-[var(--surface-2)] text-[var(--ink)]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate leading-tight">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div
                            className={`text-xs truncate ${
                              isSelected ? "text-white/80" : "text-[var(--muted)]"
                            }`}
                          >
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-[var(--surface-2)] text-[var(--muted)]"
                        }`}
                      >
                        {item.category}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer keyboard hints */}
            <div className="px-4 py-2.5 bg-[var(--surface-2)] border-t border-[var(--hairline)] flex items-center justify-between text-xs text-[var(--muted)]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--hairline)] text-[10px]">
                    ↑↓
                  </kbd>{" "}
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--hairline)] text-[10px]">
                    ↵
                  </kbd>{" "}
                  Select
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Command className="w-3 h-3" /> <span>+ K anywhere</span>
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
