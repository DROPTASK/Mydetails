import { useEffect, useState } from "react";
import { supabase, type PortfolioAsset } from "../lib/supabase";
import { loadAllPortfolioAssets, isConfiguredHomeSocial } from "../lib/portfolioStorage";
import { SocialAppLogo, detectPlatform } from "../lib/platformThemes";
import { sfxClick } from "../lib/sound";

export function SocialLinks() {
  const [links, setLinks] = useState<PortfolioAsset[]>([]);

  const load = async () => {
    try {
      const all = await loadAllPortfolioAssets();
      // Only show connection links that are set in the admin socials tab and marked for home
      const connections = all.filter(isConfiguredHomeSocial);
      setLinks(connections);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    load();

    const handleAssetsUpdated = () => {
      load();
    };

    window.addEventListener("vk_portfolio_assets_updated", handleAssetsUpdated);

    const channel = supabase
      .channel("social-links-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "portfolio_assets" }, load)
      .subscribe();

    return () => {
      window.removeEventListener("vk_portfolio_assets_updated", handleAssetsUpdated);
      supabase.removeChannel(channel);
    };
  }, []);

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-3.5 py-2">
      {links.map((l) => {
        if (!l.url) return null;
        const theme = detectPlatform(l.url, l.title, l.platform);

        return (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            onClick={sfxClick}
            aria-label={`${l.title || theme.name}`}
            className="group relative transition-all duration-200 hover:-translate-y-1 active:scale-95"
          >
            {/* Direct App Themed Logo (No corner badges) */}
            <SocialAppLogo
              platform={l.platform}
              url={l.url}
              title={l.title}
              customLogoUrl={l.image_url}
              size="md"
            />

            {/* Clean Hover Floating Tooltip */}
            <div className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--ink)]/95 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold text-[var(--bg)] opacity-0 shadow-xl transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0.5 z-30 flex items-center gap-1.5 border border-white/10">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: theme.brandColor }}
              />
              <span>{l.title || theme.name}</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
