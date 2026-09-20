import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gamepad2, Users, User, Hand, Grid3x3 } from "lucide-react";
import { supabase, type PortfolioAsset } from "../lib/supabase";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { sfxClick } from "../lib/sound";

const PLAY_ITEMS = [
  { to: "/games/bollywood/solo", label: "Bollywood — Solo", desc: "Guess the movie, letter by letter", icon: User, emoji: "🎬" },
  { to: "/games/bollywood/multiplayer", label: "Bollywood — Multiplayer", desc: "Create a room, share the link", icon: Users, emoji: "🎬" },
  { to: "/games/tic-tac-toe", label: "Tic-Tac-Toe", desc: "Classic, local 2-player", icon: Grid3x3, emoji: "⭕" },
  { to: "/games/rock-paper-scissors", label: "Rock · Paper · Scissors", desc: "Best of luck vs the CPU", icon: Hand, emoji: "✊" },
];

export function Games() {
  const [tab, setTab] = useState<"loved" | "play">("play");
  const [loved, setLoved] = useState<PortfolioAsset[]>([]);

  useEffect(() => {
    supabase
      .from("portfolio_assets")
      .select("*")
      .eq("type", "game")
      .order("sort_order")
      .then(({ data }) => data && setLoved(data));
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-5 pt-2">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold flex items-center justify-center gap-2">
          <Gamepad2 className="w-6 h-6" /> Games
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Games I love, and a few you can play right here.</p>
      </div>

      <div className="flex justify-center">
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { id: "play", label: "Play" },
            { id: "loved", label: "Loved" },
          ]}
        />
      </div>

      {tab === "play" && (
        <div className="grid sm:grid-cols-2 gap-3">
          {PLAY_ITEMS.map((item) => (
            <Link key={item.to} to={item.to} onClick={sfxClick} className="surface-elevated p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <span className="text-3xl">{item.emoji}</span>
              <div>
                <div className="font-bold text-sm">{item.label}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "loved" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {loved.length === 0 && (
            <p className="col-span-full text-center text-sm" style={{ color: "var(--muted)" }}>
              Nothing added yet — add favourite games from the admin Content tab (type: Game).
            </p>
          )}
          {loved.map((g) => (
            <a
              key={g.id}
              href={g.url || undefined}
              target={g.url ? "_blank" : undefined}
              rel="noreferrer"
              className="surface-elevated overflow-hidden group"
            >
              {g.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img src={g.image_url} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              )}
              <div className="p-2.5">
                <div className="font-bold text-sm truncate">{g.title}</div>
                {g.description && <div className="text-xs truncate" style={{ color: "var(--muted)" }}>{g.description}</div>}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
