import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link2, Sparkles, PlusCircle } from "lucide-react";
import { AssetList } from "./AssetList";
import { Shortener } from "./Shortener";
import { sfxClick } from "../lib/sound";

type TabType = "portfolio" | "shortener";

export function Links() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const initialTab: TabType = rawTab === "shortener" ? "shortener" : "portfolio";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const claimSlug = searchParams.get("claim") || "";

  const handleTabChange = (tab: TabType) => {
    sfxClick();
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === "portfolio") {
        next.delete("tab");
      } else {
        next.set("tab", tab);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Switcher Segment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--hairline)] pb-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-[var(--surface-2)] p-1 rounded-2xl border border-[var(--hairline)] w-fit">
          <button
            onClick={() => handleTabChange("portfolio")}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "portfolio"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Curated Links</span>
          </button>

          <button
            onClick={() => handleTabChange("shortener")}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "shortener"
                ? "bg-[var(--surface)] text-[var(--accent)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Link Shortener</span>
          </button>
        </div>

        {activeTab !== "shortener" && (
          <button
            onClick={() => handleTabChange("shortener")}
            className="btn btn-secondary text-xs px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 w-fit shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Create Short Link</span>
          </button>
        )}
      </div>

      {/* Tab 1: Curated Portfolio Links (Only Admin added links appear here) */}
      {activeTab === "portfolio" && (
        <AssetList
          type="connection"
          title="Public Links & Channels"
          empty="No curated links published yet. Add them in admin dashboard or use the Link Shortener with admin privileges."
        />
      )}

      {/* Tab 2: Dedicated In-App Link Shortener */}
      {activeTab === "shortener" && <Shortener defaultSlug={claimSlug} />}
    </div>
  );
}
