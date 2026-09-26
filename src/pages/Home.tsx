import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import {
  ChevronRight,
  Sparkles,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { NAV } from "../lib/nav";
import { ProfileSwap } from "../components/ProfileSwap";
import { SocialLinks } from "../components/SocialLinks";
import { sfxClick } from "../lib/sound";
import { supabase, type PortfolioAsset, type AboutBio } from "../lib/supabase";
import { DEFAULT_PORTFOLIO_ASSETS, DEFAULT_ABOUT_BIO } from "../lib/fallbackData";

const defaultFeaturedApps = DEFAULT_PORTFOLIO_ASSETS.filter((a) => a.type === "app").slice(0, 4);
const defaultCounts: Record<string, number> = DEFAULT_PORTFOLIO_ASSETS.reduce((acc, curr) => {
  acc[curr.type] = (acc[curr.type] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export function Home() {
  const [time, setTime] = useState("");
  const [featuredApps, setFeaturedApps] = useState<PortfolioAsset[]>(defaultFeaturedApps);
  const [counts, setCounts] = useState<Record<string, number>>(defaultCounts);
  const [bio, setBio] = useState<AboutBio | null>(DEFAULT_ABOUT_BIO);

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const istTime = now.toLocaleTimeString("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
        setTime(istTime);
      } catch {
        setTime("IST");
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch featured apps and dynamic counts from the database
  useEffect(() => {
    // 1. Fetch featured projects (type: 'app' ordered by sort_order)
    supabase
      .from("portfolio_assets")
      .select("*")
      .eq("type", "app")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(4)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setFeaturedApps(data as PortfolioAsset[]);
        }
      });

    // 2. Fetch asset counts for navigation tags
    supabase
      .from("portfolio_assets")
      .select("type")
      .eq("is_published", true)
      .then(({ data }) => {
        if (data) {
          const tally: Record<string, number> = {};
          data.forEach((row) => {
            tally[row.type] = (tally[row.type] || 0) + 1;
          });
          setCounts(tally);
        }
      });

    // 3. Fetch status banner text from admin_settings
    supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "about_bio")
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.value) {
          setBio(data.value as AboutBio);
        }
      });
  }, []);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-xl mx-auto flex flex-col items-center gap-6 pt-2"
    >
      {/* 3D Profile Flip Card */}
      <motion.div variants={item} className="w-full">
        <ProfileSwap />
      </motion.div>

      {/* Social Media Links */}
      <motion.div variants={item}>
        <SocialLinks />
      </motion.div>

      {/* Real-time Status Badge */}
      <motion.div
        variants={item}
        className="w-full surface-elevated rounded-2xl p-4 border border-[var(--hairline)] flex items-center justify-between gap-3 text-xs sm:text-sm"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="min-w-0">
            <span className="font-semibold text-[var(--ink)] block truncate">
              {bio?.status_title || "Class 11 CS • Arjuna JEE 2.0"}
            </span>
            <span className="text-[var(--muted)] text-xs block truncate">
              {bio?.status_subtitle || "Building AnonRoom & JeeFlow"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--muted)] font-mono text-xs">
          <Clock className="w-3 h-3 text-[var(--accent)]" />
          <span>{time || "Meerut (IST)"}</span>
        </div>
      </motion.div>

      {/* Featured Projects Spotlight Cards (Database backed) */}
      <motion.div variants={item} className="w-full space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Featured Projects
          </span>
          <NavLink
            to="/apps"
            onClick={sfxClick}
            className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(featuredApps.length > 0 ? featuredApps.slice(0, 2) : [
            {
              id: "anonroom",
              title: "AnonRoom",
              description: "Ephemeral anonymous live chat rooms with WebSockets.",
              url: "https://anonroom.vanshkumar.in",
            },
            {
              id: "jeeflow",
              title: "JeeFlow",
              description: "JEE 2026 prep planner, syllabus tracker & countdown.",
              url: "https://jeeflow.vanshkumar.in",
            },
          ]).map((app) => (
            <a
              key={app.id}
              href={app.url || "#"}
              target={app.url ? "_blank" : undefined}
              rel="noreferrer"
              onClick={sfxClick}
              className="surface-elevated p-3.5 rounded-2xl border border-[var(--hairline)] flex flex-col justify-between hover:shadow-md hover:border-[var(--accent)]/40 transition-all group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--accent)] truncate max-w-[120px]">
                    {app.title}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors shrink-0" />
                </div>
                <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                  {app.description || "Portfolio project built with modern web technologies."}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[var(--accent)] mt-2 inline-block">
                Open App →
              </span>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Main Navigation Hub */}
      <motion.div variants={item} className="w-full space-y-2">
        <div className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Explore Portfolio
        </div>

        <div className="flex flex-col gap-2">
          {NAV.filter((n) => n.to !== "/").map((n) => {
            const Icon = n.icon;
            // Dynamic badge tags based on route and live database counts
            let tag = "";
            if (n.to === "/about") tag = "Story & Stack";
            if (n.to === "/apps") tag = counts.app ? `${counts.app} Projects` : "Projects";
            if (n.to === "/movies") tag = "TMDB Hub";
            if (n.to === "/games") tag = counts.game ? `${counts.game} Games` : "Mini-Games";
            if (n.to === "/interests") tag = counts.interest ? `${counts.interest} Topics` : "Passions";
            if (n.to === "/gallery") tag = counts.photo ? `${counts.photo} Photos` : "Photos";
            if (n.to === "/links") tag = counts.link ? `${counts.link} Links` : "Resources";
            if (n.to === "/chat") tag = "Guestbook / AI";

            return (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={sfxClick}
                className="link-pill group hover:border-[var(--accent)]/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink)] group-hover:text-[var(--accent)] group-hover:bg-[var(--accent)]/10 transition-colors">
                    <Icon className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                  <span className="font-semibold text-sm sm:text-base text-[var(--ink)]">
                    {n.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {tag && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
                      {tag}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all" strokeWidth={2.4} />
                </div>
              </NavLink>
            );
          })}
        </div>
      </motion.div>

      {/* Interactive Quick Help Tip */}
      <motion.div
        variants={item}
        className="w-full text-center py-2 text-xs text-[var(--muted)] flex items-center justify-center gap-1.5"
      >
        <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span>Tip: Press</span>
        <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--hairline)] font-semibold text-[10px] text-[var(--ink)]">
          ⌘K
        </kbd>
        <span>anywhere to quickly search or trigger actions</span>
      </motion.div>
    </motion.div>
  );
}
