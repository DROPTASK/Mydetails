import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Code2,
  GraduationCap,
  Sparkles,
  MapPin,
  Clock,
  Terminal,
  Cpu,
  Database,
  Layers,
  Send,
  Copy,
  Check,
  Flame,
  Layout,
  Globe,
  Server,
  Wrench,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { sfxClick, sfxSuccess } from "../lib/sound";
import { supabase, type SkillGroup, type MilestoneItem, type AboutBio } from "../lib/supabase";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

// Fallback initial data in case DB has not populated yet
const DEFAULT_SKILLS: SkillGroup[] = [
  {
    category: "Frontend & UI",
    icon: "Layers",
    tags: ["React 18", "TypeScript", "Tailwind CSS v4", "Framer Motion", "Vite", "Web Audio API"],
  },
  {
    category: "Backend & Systems",
    icon: "Database",
    tags: ["Node.js", "Python", "Supabase", "PostgreSQL", "WebSockets / Realtime", "REST APIs"],
  },
  {
    category: "Workflow & Tools",
    icon: "Terminal",
    tags: ["Git & GitHub", "Linux / Bash", "VS Code", "Vercel", "Figma"],
  },
];

const DEFAULT_MILESTONES: MilestoneItem[] = [
  {
    year: "2024 – 2025",
    title: "Class 11th",
    desc: "(Physics, Chemistry, Mathematics) alongside Computer Science coursework in India.",
  },
];

const DEFAULT_BIO: AboutBio = {
  title: "Hey, I'm Vansh Kumar.",
  subtitle: "Cinephile • Athiest • Technology",
  description: "I'm a high-school developer and student based in India. When I'm not balancing physics equations and calculus I architect clean web products with React, TypeScript, and Supabase.",
  location: "UP, India",
  curriculum: "CBSE",
  stack: "TS, React, Python",
  status_title: "Class 12 CS • CBSE",
  status_subtitle: "I support decentralization.",
};

const ICON_MAP: Record<string, typeof Layers> = {
  layers: Layers,
  database: Database,
  terminal: Terminal,
  cpu: Cpu,
  code: Code2,
  layout: Layout,
  globe: Globe,
  server: Server,
  wrench: Wrench,
};

export function About() {
  const [copied, setCopied] = useState(false);
  const [skills, setSkills] = useState<SkillGroup[]>(DEFAULT_SKILLS);
  const [milestones, setMilestones] = useState<MilestoneItem[]>(DEFAULT_MILESTONES);
  const [bio, setBio] = useState<AboutBio>(DEFAULT_BIO);

  useEffect(() => {
    // Load skills, milestones and bio dynamically from Supabase database
    supabase
      .from("admin_settings")
      .select("key, value")
      .in("key", ["skills", "milestones", "about_bio"])
      .then(({ data, error }) => {
        if (!error && data) {
          data.forEach((row) => {
            if (row.key === "skills" && Array.isArray(row.value) && row.value.length > 0) {
              setSkills(row.value as SkillGroup[]);
            } else if (row.key === "milestones" && Array.isArray(row.value) && row.value.length > 0) {
              setMilestones(row.value as MilestoneItem[]);
            } else if (row.key === "about_bio" && row.value && typeof row.value === "object") {
              setBio((prev) => ({ ...prev, ...(row.value as Partial<AboutBio>) }));
            }
          });
        }
      });
  }, []);

  const copyEmail = () => {
    navigator.clipboard.writeText("itsme@vanshkumar.in");
    setCopied(true);
    sfxSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  const getSkillIcon = (iconName: string) => {
    const key = (iconName || "").toLowerCase();
    return ICON_MAP[key] || Cpu;
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto space-y-8 pt-2"
    >
      {/* Header Bio */}
      <motion.div variants={item} className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--accent)] border border-[var(--hairline)]">
          <GraduationCap className="w-4 h-4" />
          <span>{bio.subtitle}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--ink)]">
          {bio.title}
        </h1>

        <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
          {bio.description}
        </p>
      </motion.div>

      {/* Quick Facts Bento Grid */}
      <motion.div variants={item} className="grid sm:grid-cols-3 gap-3">
        <div className="surface-elevated p-4 rounded-2xl border border-[var(--hairline)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-[var(--muted)] font-medium">Location</div>
            <div className="font-semibold text-sm text-[var(--ink)] truncate">{bio.location}</div>
          </div>
        </div>

        <div className="surface-elevated p-4 rounded-2xl border border-[var(--hairline)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-[var(--muted)] font-medium">Curriculum</div>
            <div className="font-semibold text-sm text-[var(--ink)] truncate">{bio.curriculum}</div>
          </div>
        </div>

        <div className="surface-elevated p-4 rounded-2xl border border-[var(--hairline)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-[var(--muted)] font-medium">Core Stack</div>
            <div className="font-semibold text-sm text-[var(--ink)] truncate">{bio.stack}</div>
          </div>
        </div>
      </motion.div>

      {/* Narrative Section */}
      <motion.div variants={item} className="surface-elevated p-6 sm:p-7 rounded-2xl border border-[var(--hairline)] space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--accent)]" />
          <span>My Approach & Passion</span>
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--muted)]">
          My philosophy revolves around building tools that are exceptionally fast, respect privacy, and look purposeful. I believe software should feel tactile—which is why this portfolio includes synthesized retro-modern audio tones, interactive micro-states, and keyboard-first command bars.
        </p>
        <p className="text-[15px] leading-relaxed text-[var(--muted)]">
          Balancing competitive exam prep with programming has taught me intense discipline, structured problem decomposition, and algorithmic rigor. Every day I switch between resolving complex electrodynamics challenges and building scalable reactive frontends.
        </p>
      </motion.div>

      {/* Skills Matrix */}
      <motion.div variants={item} className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[var(--accent)]" />
          <span>Technologies & Tooling</span>
        </h2>

        <div className="grid sm:grid-cols-3 gap-3.5">
          {skills.map((grp) => {
            const Icon = getSkillIcon(grp.icon);
            return (
              <div key={grp.category} className="surface-elevated p-4 rounded-2xl border border-[var(--hairline)] space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-sm text-[var(--ink)]">
                  <Icon className="w-4 h-4 text-[var(--accent)]" />
                  <span>{grp.category}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {grp.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-1 rounded-lg bg-[var(--surface-2)] text-[var(--ink)] font-medium border border-[var(--hairline)]/60"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Milestones & Journey */}
      <motion.div variants={item} className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--accent)]" />
          <span>Milestones & Timeline</span>
        </h2>

        <div className="surface-elevated rounded-2xl p-5 sm:p-6 border border-[var(--hairline)] divide-y divide-[var(--hairline)]">
          {milestones.map((m) => (
            <div key={m.title} className="py-4 first:pt-0 last:pb-0 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm sm:text-base text-[var(--ink)]">{m.title}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)]">
                  {m.year}
                </span>
              </div>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Connect Card */}
      <motion.div
        variants={item}
        className="surface-elevated p-6 sm:p-7 rounded-2xl border border-[var(--hairline)] flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="space-y-1 text-center sm:text-left">
          <div className="font-bold text-lg text-[var(--ink)]">Let's build something together.</div>
          <div className="text-sm text-[var(--muted)]">
            Open for collaborations, interesting technical chats, or just a hello.
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={copyEmail}
            className="btn btn-secondary px-4 py-2 text-xs sm:text-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied!" : "Copy Email"}</span>
          </button>

          <NavLink
            to="/chat"
            onClick={sfxClick}
            className="btn btn-primary px-4 py-2 text-xs sm:text-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Open Chat</span>
          </NavLink>
        </div>
      </motion.div>
    </motion.div>
  );
}
