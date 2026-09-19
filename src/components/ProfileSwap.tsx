import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { supabase, type SiteProfile } from "../lib/supabase";
import { Avatar } from "./Avatar";
import { sfxCoin } from "../lib/sound";

const SIDE_KEY = "vk_profile_side";
type Side = "online" | "real";

const DEFAULT_PROFILE: SiteProfile = {
  online: { name: "Vansh", bio: "Online.", avatar_url: null },
  real: { name: "Vansh Kumar", bio: "Meerut · Class 11 · Computer Science", avatar_url: null },
};

function loadSide(): Side {
  try {
    const v = localStorage.getItem(SIDE_KEY);
    return v === "real" ? "real" : "online";
  } catch {
    return "online";
  }
}

export function ProfileSwap() {
  const [profile, setProfile] = useState<SiteProfile>(DEFAULT_PROFILE);
  const [side, setSide] = useState<Side>(loadSide);
  const [flipping, setFlipping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const applyProfile = (value: unknown) => {
      const v = value as Partial<SiteProfile> | undefined;
      if (v?.online && v?.real) setProfile(v as SiteProfile);
    };

    supabase.from("admin_settings").select("value").eq("key", "profile").single()
      .then(({ data }) => applyProfile(data?.value));
    supabase.from("admin_settings").select("value").eq("key", "online_status").single()
      .then(({ data }) => setIsOnline(!!(data?.value as { is_online?: boolean } | undefined)?.is_online));

    const channel = supabase
      .channel("profile-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_settings", filter: "key=eq.profile" },
        (payload) => applyProfile((payload.new as { value?: unknown })?.value)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_settings", filter: "key=eq.online_status" },
        (payload) => setIsOnline(!!((payload.new as { value?: { is_online?: boolean } })?.value?.is_online))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const current = profile[side];

  const swap = () => {
    sfxCoin();
    setFlipping(true);
    const nextSide: Side = side === "online" ? "real" : "online";
    // Swap the content at the flip's midpoint so the "new face" appears once turned.
    setTimeout(() => {
      setSide(nextSide);
      try {
        localStorage.setItem(SIDE_KEY, nextSide);
      } catch {
        /* ignore */
      }
    }, 180);
    setTimeout(() => setFlipping(false), 420);
  };

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <button
        onClick={swap}
        aria-label="Swap profile"
        className="relative"
        style={{ perspective: 600 }}
      >
        <motion.div
          animate={{ rotateY: flipping ? 180 : 0 }}
          transition={{ duration: 0.42, ease: [0.65, 0, 0.35, 1] }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <Avatar src={current.avatar_url} name={current.name} size={104} />
        </motion.div>
        {isOnline && (
          <span
            className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2"
            style={{ background: "#34c759", borderColor: "var(--bg)" }}
            aria-label="Online now"
          />
        )}
        <span
          className="absolute -bottom-1 -left-1 icon-btn"
          style={{ width: 26, height: 26, background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
        >
          <RefreshCw className="w-3 h-3" style={{ color: "var(--muted)" }} />
        </span>
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={side}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          <h1 className="text-3xl font-extrabold tracking-tight">{current.name}</h1>
          {current.bio && (
            <p className="text-[15px] mt-1 max-w-xs" style={{ color: "var(--muted)" }}>
              {current.bio}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      <button
        onClick={swap}
        className="text-[12px] font-semibold tracking-wide"
        style={{ color: "var(--accent)" }}
      >
        Tap avatar to flip profile
      </button>
    </div>
  );
}
