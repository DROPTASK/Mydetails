import { useEffect, useState } from "react";
import { Github, Instagram, Linkedin, Youtube, Twitter, MessageCircle, Send, Mail, Globe } from "lucide-react";
import { supabase, type PortfolioAsset } from "../lib/supabase";
import { sfxClick } from "../lib/sound";

function iconFor(url: string) {
  const u = url.toLowerCase();
  if (u.includes("github")) return { Icon: Github, bg: "#181717" };
  if (u.includes("linkedin")) return { Icon: Linkedin, bg: "#0a66c2" };
  if (u.includes("instagram")) return { Icon: Instagram, bg: "#e1306c" };
  if (u.includes("youtube")) return { Icon: Youtube, bg: "#ff0000" };
  if (u.includes("twitter") || u.includes("x.com")) return { Icon: Twitter, bg: "#000000" };
  if (u.includes("discord")) return { Icon: MessageCircle, bg: "#5865f2" };
  if (u.includes("t.me") || u.includes("telegram")) return { Icon: Send, bg: "#26a5e4" };
  if (u.startsWith("mailto:") || u.includes("@")) return { Icon: Mail, bg: "#6b7280" };
  return { Icon: Globe, bg: "var(--accent)" };
}

export function SocialLinks() {
  const [links, setLinks] = useState<PortfolioAsset[]>([]);

  useEffect(() => {
    const load = () =>
      supabase.from("portfolio_assets").select("*").eq("type", "connection").order("sort_order")
        .then(({ data }) => data && setLinks(data));
    load();
    const channel = supabase
      .channel("social-links-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "portfolio_assets" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {links.map((l) => {
        if (!l.url) return null;
        const { Icon, bg } = iconFor(l.url);
        return (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            onClick={sfxClick}
            title={l.title}
            className="social-btn"
            style={{ background: bg }}
          >
            <Icon className="w-[18px] h-[18px]" color="#fff" strokeWidth={2.2} />
          </a>
        );
      })}
    </div>
  );
}
