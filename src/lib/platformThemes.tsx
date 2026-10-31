import React, { useState } from "react";

export type PlatformId =
  | "twitter"
  | "whatsapp"
  | "reddit"
  | "telegram"
  | "instagram"
  | "github"
  | "linkedin"
  | "youtube"
  | "discord"
  | "spotify"
  | "threads"
  | "mail"
  | "web";

export interface PlatformTheme {
  id: PlatformId;
  name: string;
  brandColor: string;
  gradient: string;
  glow: string;
  urlPrefix: string;
  exampleUrl: string;
  usernamePrefix: string;
  badgeBg: string;
  badgeText: string;
  Icon: (props: { className?: string; style?: React.CSSProperties }) => React.JSX.Element;
}

// Crisp Vector SVGs for Official Themed Logos
export const TwitterIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const WhatsAppIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M17.472 14.382c-.301-.15-1.782-.88-2.058-.98-.276-.1-.477-.15-.678.15-.2.301-.778.98-.954 1.18-.176.2-.352.226-.653.076-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.785-1.676-2.086-.176-.301-.019-.464.132-.614.136-.135.301-.352.452-.527.15-.175.2-.301.301-.502.1-.2.05-.376-.025-.527-.075-.15-.678-1.634-.929-2.239-.244-.589-.493-.509-.678-.518-.176-.009-.377-.01-.578-.01-.2 0-.527.075-.803.376s-1.054 1.03-1.054 2.511 1.08 2.912 1.23 3.113c.15.2 2.125 3.245 5.148 4.551.719.311 1.28.497 1.718.636.722.23 1.379.197 1.9.12.58-.088 1.782-.728 2.033-1.431.251-.703.251-1.305.176-1.431-.076-.126-.277-.201-.578-.351zM12.04 2C6.536 2 2.072 6.46 2.072 11.96c0 1.97.575 3.805 1.57 5.352L2 22l4.832-1.579c1.477.893 3.21 1.405 5.068 1.405 5.503 0 9.967-4.46 9.967-9.96s-4.464-9.866-9.827-9.866z" />
  </svg>
);

export const RedditIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.83.5 3.54 1.36 5.01L2 22l5.12-1.33C8.56 21.52 10.22 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm6.91 12.01c-.13.88-.84 1.73-2.12 2.37-1.36.68-3.08 1.02-4.79 1.02s-3.43-.34-4.79-1.02c-1.28-.64-1.99-1.49-2.12-2.37-.16-1.12.58-2.22 1.72-2.58.07-.58.33-1.12.75-1.53.64-.63 1.54-.98 2.45-.98.24 0 .48.03.71.08.38-.85 1.13-1.48 2.05-1.74l1.24-2.81 2.36.52c.2-.42.63-.7 1.12-.7.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25c-.65 0-1.18-.49-1.24-1.13l-1.77-.39-.98 2.21c.88.29 1.62.9 2.05 1.72.33-.09.68-.14 1.03-.14 1.13 0 2.19.53 2.87 1.45 1.03.41 1.68 1.46 1.49 2.54z" />
    <circle cx="9.5" cy="13.5" r="1.2" />
    <circle cx="14.5" cy="13.5" r="1.2" />
    <path d="M10 16.5c.6.5 1.3.8 2 .8s1.4-.3 2-.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
  </svg>
);

export const TelegramIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.63 3.73-.53.36-1.02.54-1.45.53-.48-.01-1.4-.27-2.09-.49-.84-.27-1.51-.42-1.45-.89.03-.25.38-.51 1.07-.78 4.2-1.83 7-3.04 8.4-3.64 4-.1.71 4.84.42 5.04.41.04 0 .16.03.22.09.06.06.08.15.08.2z" />
  </svg>
);

export const InstagramIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export const GitHubIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const LinkedInIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

export const YouTubeIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const DiscordIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

export const SpotifyIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
);

export const ThreadsIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
    <path d="M12.186 24C5.467 24 0 18.643 0 12.046 0 5.449 5.467.092 12.186.092c6.643 0 11.97 5.23 12.012 11.758 0 .285-.23.515-.515.515h-1.942c-.285 0-.515-.23-.515-.515-.04-5.215-4.225-9.39-9.04-9.39-5.148 0-9.336 4.103-9.336 9.146 0 5.043 4.188 9.146 9.336 9.146 4.316 0 8.014-2.887 8.972-7.05.064-.28.34-.465.626-.408l1.905.38c.28.056.465.334.408.62-1.22 5.263-5.918 8.906-11.407 8.906zm-.186-6.18c-3.142 0-5.7-2.502-5.7-5.578 0-3.076 2.558-5.578 5.7-5.578 3.142 0 5.7 2.502 5.7 5.578 0 3.076-2.558 5.578-5.7 5.578z" />
  </svg>
);

export const MailIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export const WebIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

export const PLATFORM_THEMES: Record<PlatformId, PlatformTheme> = {
  twitter: {
    id: "twitter",
    name: "X (Twitter)",
    brandColor: "#000000",
    gradient: "linear-gradient(135deg, #1f2937 0%, #000000 100%)",
    glow: "rgba(255, 255, 255, 0.35)",
    urlPrefix: "https://x.com/",
    exampleUrl: "https://x.com/0xUnique_",
    usernamePrefix: "@",
    badgeBg: "#000000",
    badgeText: "#ffffff",
    Icon: TwitterIcon,
  },
  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp",
    brandColor: "#25D366",
    gradient: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    glow: "rgba(37, 211, 102, 0.45)",
    urlPrefix: "https://wa.me/",
    exampleUrl: "https://wa.me/919999999999",
    usernamePrefix: "+",
    badgeBg: "#25D366",
    badgeText: "#ffffff",
    Icon: WhatsAppIcon,
  },
  reddit: {
    id: "reddit",
    name: "Reddit",
    brandColor: "#FF4500",
    gradient: "linear-gradient(135deg, #FF5722 0%, #FF4500 100%)",
    glow: "rgba(255, 69, 0, 0.45)",
    urlPrefix: "https://reddit.com/u/",
    exampleUrl: "https://reddit.com/u/VanshKumar",
    usernamePrefix: "u/",
    badgeBg: "#FF4500",
    badgeText: "#ffffff",
    Icon: RedditIcon,
  },
  telegram: {
    id: "telegram",
    name: "Telegram",
    brandColor: "#229ED9",
    gradient: "linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)",
    glow: "rgba(34, 158, 217, 0.45)",
    urlPrefix: "https://t.me/",
    exampleUrl: "https://t.me/vanshkumar",
    usernamePrefix: "t.me/",
    badgeBg: "#229ED9",
    badgeText: "#ffffff",
    Icon: TelegramIcon,
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    brandColor: "#E1306C",
    gradient: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
    glow: "rgba(225, 48, 108, 0.45)",
    urlPrefix: "https://instagram.com/",
    exampleUrl: "https://instagram.com/vansh_kumar",
    usernamePrefix: "@",
    badgeBg: "#E1306C",
    badgeText: "#ffffff",
    Icon: InstagramIcon,
  },
  github: {
    id: "github",
    name: "GitHub",
    brandColor: "#24292e",
    gradient: "linear-gradient(135deg, #24292e 0%, #0d1117 100%)",
    glow: "rgba(255, 255, 255, 0.3)",
    urlPrefix: "https://github.com/",
    exampleUrl: "https://github.com/DROPTASK",
    usernamePrefix: "github.com/",
    badgeBg: "#181717",
    badgeText: "#ffffff",
    Icon: GitHubIcon,
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    brandColor: "#0A66C2",
    gradient: "linear-gradient(135deg, #0A66C2 0%, #004182 100%)",
    glow: "rgba(10, 102, 194, 0.45)",
    urlPrefix: "https://linkedin.com/in/",
    exampleUrl: "https://linkedin.com/in/vansh-kumar",
    usernamePrefix: "in/",
    badgeBg: "#0A66C2",
    badgeText: "#ffffff",
    Icon: LinkedInIcon,
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    brandColor: "#FF0000",
    gradient: "linear-gradient(135deg, #FF0000 0%, #CC0000 100%)",
    glow: "rgba(255, 0, 0, 0.45)",
    urlPrefix: "https://youtube.com/@",
    exampleUrl: "https://youtube.com/@vanshkumar",
    usernamePrefix: "@",
    badgeBg: "#FF0000",
    badgeText: "#ffffff",
    Icon: YouTubeIcon,
  },
  discord: {
    id: "discord",
    name: "Discord",
    brandColor: "#5865F2",
    gradient: "linear-gradient(135deg, #5865F2 0%, #4752C4 100%)",
    glow: "rgba(88, 101, 242, 0.45)",
    urlPrefix: "https://discord.com/",
    exampleUrl: "https://discord.gg/invite",
    usernamePrefix: "discord:",
    badgeBg: "#5865F2",
    badgeText: "#ffffff",
    Icon: DiscordIcon,
  },
  spotify: {
    id: "spotify",
    name: "Spotify",
    brandColor: "#1DB954",
    gradient: "linear-gradient(135deg, #1DB954 0%, #15883e 100%)",
    glow: "rgba(29, 185, 84, 0.45)",
    urlPrefix: "https://open.spotify.com/user/",
    exampleUrl: "https://open.spotify.com/user/vansh",
    usernamePrefix: "spotify:",
    badgeBg: "#1DB954",
    badgeText: "#ffffff",
    Icon: SpotifyIcon,
  },
  threads: {
    id: "threads",
    name: "Threads",
    brandColor: "#000000",
    gradient: "linear-gradient(135deg, #18181b 0%, #000000 100%)",
    glow: "rgba(255, 255, 255, 0.3)",
    urlPrefix: "https://threads.net/@",
    exampleUrl: "https://threads.net/@vansh",
    usernamePrefix: "@",
    badgeBg: "#000000",
    badgeText: "#ffffff",
    Icon: ThreadsIcon,
  },
  mail: {
    id: "mail",
    name: "Email",
    brandColor: "#EA4335",
    gradient: "linear-gradient(135deg, #EA4335 0%, #C5221F 100%)",
    glow: "rgba(234, 67, 53, 0.4)",
    urlPrefix: "mailto:",
    exampleUrl: "mailto:itsme@vanshkumar.in",
    usernamePrefix: "",
    badgeBg: "#EA4335",
    badgeText: "#ffffff",
    Icon: MailIcon,
  },
  web: {
    id: "web",
    name: "Website / Portfolio",
    brandColor: "var(--accent)",
    gradient: "linear-gradient(135deg, var(--accent) 0%, #6366f1 100%)",
    glow: "rgba(99, 102, 241, 0.4)",
    urlPrefix: "https://",
    exampleUrl: "https://vanshkumar.in",
    usernamePrefix: "",
    badgeBg: "var(--accent)",
    badgeText: "#ffffff",
    Icon: WebIcon,
  },
};

export const ALL_PLATFORMS = Object.values(PLATFORM_THEMES);

/**
 * Detects the best matching platform theme from URL, explicit platform key, or title.
 */
export function detectPlatform(url: string = "", title: string = "", explicitPlatform?: string | null): PlatformTheme {
  if (explicitPlatform && PLATFORM_THEMES[explicitPlatform as PlatformId]) {
    return PLATFORM_THEMES[explicitPlatform as PlatformId];
  }

  const u = (url || "").toLowerCase();
  const t = (title || "").toLowerCase();

  if (u.includes("wa.me") || u.includes("whatsapp") || t.includes("whatsapp")) return PLATFORM_THEMES.whatsapp;
  if (u.includes("reddit.com") || u.includes("redd.it") || t.includes("reddit")) return PLATFORM_THEMES.reddit;
  if (u.includes("t.me") || u.includes("telegram") || t.includes("telegram")) return PLATFORM_THEMES.telegram;
  if (u.includes("instagram.com") || u.includes("instagr.am") || t.includes("instagram") || t.includes("insta")) return PLATFORM_THEMES.instagram;
  if (u.includes("twitter.com") || u.includes("x.com") || t.includes("twitter") || t === "x") return PLATFORM_THEMES.twitter;
  if (u.includes("github.com") || t.includes("github")) return PLATFORM_THEMES.github;
  if (u.includes("linkedin.com") || t.includes("linkedin")) return PLATFORM_THEMES.linkedin;
  if (u.includes("youtube.com") || u.includes("youtu.be") || t.includes("youtube")) return PLATFORM_THEMES.youtube;
  if (u.includes("discord.gg") || u.includes("discord.com") || t.includes("discord")) return PLATFORM_THEMES.discord;
  if (u.includes("spotify.com") || t.includes("spotify")) return PLATFORM_THEMES.spotify;
  if (u.includes("threads.net") || t.includes("threads")) return PLATFORM_THEMES.threads;
  if (u.startsWith("mailto:") || u.includes("@") || t.includes("email") || t.includes("mail")) return PLATFORM_THEMES.mail;

  return PLATFORM_THEMES.web;
}

interface AdvancedPfpProps {
  src?: string | null;
  title: string;
  url?: string | null;
  platform?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  showBadge?: boolean;
  showGlow?: boolean;
  isOnline?: boolean;
  className?: string;
}

/**
 * Advanced PFP: Multi-layer circular avatar featuring:
 * - Ambient platform neon halo & dual specular rings
 * - Scaled high-resolution image with smooth error fallback
 * - Themed Platform Mini Corner Badge with SVG site logo
 * - Subtle glassmorphic specular glare overlay
 */
export const AdvancedPfp: React.FC<AdvancedPfpProps> = ({
  src,
  title,
  url,
  platform: explicitPlatform,
  size = "md",
  showBadge = true,
  showGlow = true,
  isOnline = false,
  className = "",
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const theme = detectPlatform(url || "", title, explicitPlatform);
  const { Icon } = theme;

  // Size dimensions
  const sizeMap = {
    sm: {
      container: "w-9 h-9",
      img: "w-9 h-9",
      badge: "w-4 h-4 -bottom-1 -right-1",
      badgeIcon: "w-2.5 h-2.5",
      ring: "border-[1.5px]",
      font: "text-[11px]",
    },
    md: {
      container: "w-12 h-12",
      img: "w-12 h-12",
      badge: "w-5 h-5 -bottom-1 -right-1",
      badgeIcon: "w-3 h-3",
      ring: "border-2",
      font: "text-xs",
    },
    lg: {
      container: "w-14 h-14 sm:w-16 sm:h-16",
      img: "w-14 h-14 sm:w-16 sm:h-16",
      badge: "w-6 h-6 -bottom-1 -right-1",
      badgeIcon: "w-3.5 h-3.5",
      ring: "border-2",
      font: "text-sm",
    },
    xl: {
      container: "w-20 h-20",
      img: "w-20 h-20",
      badge: "w-7 h-7 -bottom-1.5 -right-1.5",
      badgeIcon: "w-4 h-4",
      ring: "border-[2.5px]",
      font: "text-base",
    },
  }[size];

  const hasPhoto = Boolean(src && !imageFailed);

  return (
    <div
      className={`relative inline-block select-none shrink-0 group ${sizeMap.container} ${className}`}
      style={{
        filter: showGlow ? `drop-shadow(0 2px 8px ${theme.glow})` : undefined,
      }}
    >
      {/* Outer Halo / Border Ring */}
      <div
        className={`w-full h-full rounded-full overflow-hidden ${sizeMap.ring} border-white/20 dark:border-white/10 transition-transform duration-300 group-hover:scale-105 group-hover:border-white/50 flex items-center justify-center relative shadow-sm`}
        style={{
          background: hasPhoto ? "var(--surface-2)" : theme.gradient,
        }}
      >
        {hasPhoto ? (
          <>
            <img
              src={src!}
              alt={title}
              onError={() => setImageFailed(true)}
              className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
            {/* Specular glass reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/15 pointer-events-none rounded-full" />
          </>
        ) : (
          /* Themed Site Logo / Monogram Fallback */
          <div className="w-full h-full flex items-center justify-center text-white relative">
            <Icon className="w-1/2 h-1/2 opacity-95 transition-transform duration-300 group-hover:scale-110 drop-shadow" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20 pointer-events-none rounded-full" />
          </div>
        )}
      </div>

      {/* Online indicator ping */}
      {isOnline && (
        <span className="absolute top-0 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[var(--bg)]" />
        </span>
      )}

      {/* Themed Platform Corner Badge (Prefixed App Logo) */}
      {showBadge && (
        <div
          className={`absolute ${sizeMap.badge} rounded-full flex items-center justify-center shadow-md border-[1.5px] border-[var(--bg)] transition-transform duration-200 group-hover:scale-115 z-10`}
          style={{
            background: theme.gradient,
            color: "#ffffff",
          }}
          title={theme.name}
        >
          <Icon className={sizeMap.badgeIcon} />
        </div>
      )}
    </div>
  );
};

export interface SocialAppLogoProps {
  platform?: string | null;
  url?: string | null;
  title?: string;
  customLogoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * SocialAppLogo: Pure App Themed Logo for socials.
 * No corner mini-badges: the entire button IS the app's authentic themed icon
 * with brand gradient, crisp vector glyph, and smooth specular glass reflection.
 * If customLogoUrl is provided for "other sites", it renders the user-provided logo.
 */
export const SocialAppLogo: React.FC<SocialAppLogoProps> = ({
  platform: explicitPlatform,
  url,
  title,
  customLogoUrl,
  size = "md",
  className = "",
}) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const theme = detectPlatform(url || "", title || "", explicitPlatform);
  const { Icon } = theme;

  const sizeClasses = {
    sm: "w-9 h-9 rounded-xl",
    md: "w-11 h-11 sm:w-12 sm:h-12 rounded-2xl",
    lg: "w-14 h-14 rounded-2xl",
    xl: "w-16 h-16 rounded-3xl",
  }[size];

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5 sm:w-6 sm:h-6",
    lg: "w-7 h-7",
    xl: "w-8 h-8",
  }[size];

  // If user provided a custom logo for an "other site":
  if (customLogoUrl && !logoFailed) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-md border border-[var(--hairline)] bg-[var(--surface-2)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${sizeClasses} ${className}`}
      >
        <img
          src={customLogoUrl}
          alt={title || "Site Logo"}
          onError={() => setLogoFailed(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10 pointer-events-none" />
      </div>
    );
  }

  // Pure App Themed Logo
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-md border border-white/10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl text-white ${sizeClasses} ${className}`}
      style={{
        background: theme.gradient,
        boxShadow: `0 4px 14px -2px ${theme.glow}`,
      }}
    >
      <Icon className={`${iconSizes} drop-shadow-sm transition-transform duration-300 group-hover:scale-110`} />
      {/* Specular curved glass gloss reflection */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/20 pointer-events-none" />
    </div>
  );
};

