import { useEffect, useState } from "react";
import { Github, Instagram, Linkedin, Youtube, Twitter, MessageCircle, Send, Mail, Globe } from "lucide-react";
import { supabase, type PortfolioAsset } from "../lib/supabase";
import { sfxClick } from "../lib/sound";

const DEFAULT_LINKS: { id: string; title: string; url: string }[] = [
  { id: "def-gh", title: "GitHub", url: "https://github.com/DROPTASK" },
  { id: "def-x", title: "X (Twitter)", url: "https://x.com/0xUnique_" },
  { id: "def-li", title: "LinkedIn", url: "https://www.linkedin.com/in/vansh-kumar-bb4981377/" },
  { id: "def-dc", title: "Discord", url: "https://discord.com/" },
  { id: "def-mail", title: "Email", url: "mailto:itsme@vanshkumar.in" },
];

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
      supabase
        .from("portfolio_assets")
        .select("*")
        .eq("type", "connection")
        .order("sort_order")
        .then(({ data }) => {
          if (data && data.length > 0) {
            setLinks(data);
          }
        });
    load();
    const channel = supabase
      .channel("social-links-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "portfolio_assets" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const displayLinks = links.length > 0 ? links : DEFAULT_LINKS;

  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {displayLinks.map((l) => {
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
            className="social-btn transition-transform hover:-translate-y-1 hover:shadow-md"
            style={{ background: bg }}
          >
            <Icon className="w-[18px] h-[18px]" color="#fff" strokeWidth={2.2} />
          </a>
        );
      })}
    </div>
  );
}
