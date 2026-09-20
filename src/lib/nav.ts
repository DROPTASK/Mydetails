import type { LucideIcon } from "lucide-react";
import { Home, User, LayoutGrid, Sparkles, Image, Link2, MessageCircle, Clapperboard, Gamepad2 } from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon };

export const NAV: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/about", label: "About", icon: User },
  { to: "/apps", label: "Apps", icon: LayoutGrid },
  { to: "/movies", label: "Movies", icon: Clapperboard },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/interests", label: "Interests", icon: Sparkles },
  { to: "/gallery", label: "Gallery", icon: Image },
  { to: "/links", label: "Links", icon: Link2 },
  { to: "/chat", label: "Chat", icon: MessageCircle },
];
