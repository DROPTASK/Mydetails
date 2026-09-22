import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gamepad2, Clapperboard, Hand, Grid3x3, Sparkles, ExternalLink } from "lucide-react";
import { supabase, type PortfolioAsset } from "../lib/supabase";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { TiltCard } from "../components/TiltCard";
import { sfxClick } from "../lib/sound";

const PLAY_ITEMS = [
  {
    to: "/games/bollywood",
    label: "Bollywood Movie Quiz",
    desc: "Guess the Hindi film letter by letter. Choose Solo puzzle or Live Multiplayer room battles!",
    icon: Clapperboard,
    emoji: "🎬",
    badge: "Solo & Multiplayer",
  },
  {
    to: "/games/tic-tac-toe",
    label: "Tic-Tac-Toe",
    desc: "Classic, local 2-player match with win tracking",
    icon: Grid3x3,
    emoji: "⭕",
    badge: "2-Player",
  },
  {
    to: "/games/rock-paper-scissors",
    label: "Rock · Paper · Scissors",
    desc: "Test your luck & strategy against the smart CPU",
    icon: Hand,
    emoji: "✊",
    badge: "vs CPU",
  },
];

export function Games() {
  const [tab, setTab] = useState<"play" | "loved">("play");
  const [loved, setLoved] = useState<PortfolioAsset[]>([]);

  useEffect(() => {
    supabase
      .from("portfolio_assets")
      .select("*")
      .eq("type", "game")
      .order("sort_order")
      .then(({ data }) => {
        setLoved(data || []);
      });
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-2">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--accent)] border border-[var(--hairline)]">
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Arcade & Favorites</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">
          Games Lounge
        </h1>
        <p className="text-sm text-[var(--muted)] max-w-sm mx-auto">
          Titles I love, plus interactive browser mini-games built directly into this portfolio.
        </p>
      </div>

      <div className="flex justify-center">
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { id: "play", label: "Play Now (4)" },
            { id: "loved", label: "Favorite Games" },
          ]}
        />
      </div>

      {tab === "play" && (
        <div className="grid sm:grid-cols-2 gap-3.5">
          {PLAY_ITEMS.map((item) => (
            <TiltCard key={item.to} intensity={4}>
              <Link
                to={item.to}
                onClick={sfxClick}
                className="surface-elevated p-4 rounded-2xl flex flex-col justify-between h-full border border-[var(--hairline)] hover:shadow-md hover:border-[var(--accent)]/40 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                    {item.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                        {item.label}
                      </div>
                    </div>
                    <div className="text-xs text-[var(--muted)] mt-1 leading-snug">
                      {item.desc}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[var(--hairline)] flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] px-2 py-0.5 rounded bg-[var(--surface-2)]">
                    {item.badge}
                  </span>
                  <span className="text-xs font-semibold text-[var(--accent)] group-hover:translate-x-0.5 transition-transform">
                    Play →
                  </span>
                </div>
              </Link>
            </TiltCard>
          ))}
        </div>
      )}

      {tab === "loved" && (
        <div className="grid sm:grid-cols-3 gap-3.5">
          {loved.map((g) => (
            <a
              key={g.id}
              href={g.url || undefined}
              target={g.url ? "_blank" : undefined}
              rel="noreferrer"
              onClick={sfxClick}
              className="surface-elevated rounded-2xl overflow-hidden border border-[var(--hairline)] flex flex-col group hover:shadow-md hover:border-[var(--accent)]/30 transition-all"
            >
              {g.image_url && (
                <div className="aspect-[16/10] overflow-hidden bg-[var(--surface-2)]">
                  <img
                    src={g.image_url}
                    alt={g.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <div className="font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate">
                    {g.title}
                  </div>
                  {g.description && (
                    <div className="text-xs text-[var(--muted)] line-clamp-2 mt-1 leading-relaxed">
                      {g.description}
                    </div>
                  )}
                </div>

                {g.url && (
                  <div className="mt-3 pt-2 border-t border-[var(--hairline)] flex items-center justify-between text-xs text-[var(--muted)] group-hover:text-[var(--accent)]">
                    <span>Explore Game</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
