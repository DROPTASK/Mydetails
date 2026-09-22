import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Sparkles, FolderGit2, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { supabase, type PortfolioAsset } from "../lib/supabase";
import { sfxClick } from "../lib/sound";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export function AssetList({
  type,
  title,
  empty,
}: {
  type: PortfolioAsset["type"];
  title: string;
  empty: string;
}) {
  const [items, setItems] = useState<PortfolioAsset[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    supabase
      .from("portfolio_assets")
      .select("*")
      .eq("type", type)
      .eq("is_published", true)
      .order("sort_order")
      .then(
        ({ data }) => {
          setItems(data || []);
          setReady(true);
        },
        () => {
          setItems([]);
          setReady(true);
        }
      );
  }, [type]);

  const isPhoto = type === "photo";
  const isApp = type === "app";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--accent)] border border-[var(--hairline)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curated Portfolio</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--ink)]">
          {title}
        </h1>
        <p className="text-[15px] text-[var(--muted)]">
          {isApp && "Software applications, interactive web utilities, and experimental platforms."}
          {type === "interest" && "Areas of deep curiosity, ongoing studies, and technical crafts."}
          {type === "link" && "Important URLs, public channels, and places to connect."}
          {isPhoto && "Visual snapshots, workspace setups, and study ambiance."}
        </p>
      </div>

      {/* Loading Skeleton */}
      {!ready && (
        <div className={isPhoto ? "columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4" : "grid sm:grid-cols-2 gap-4"}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`surface-elevated rounded-2xl animate-pulse bg-[var(--surface-2)] ${
                isPhoto ? "h-56 break-inside-avoid" : "h-36"
              }`}
            />
          ))}
        </div>
      )}

      {/* Ready and Empty */}
      {ready && items.length === 0 && (
        <div className="surface p-8 text-center text-[15px] text-[var(--muted)] rounded-2xl border border-[var(--hairline)]">
          {empty}
        </div>
      )}

      {/* Content Display */}
      {ready && items.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className={
            isPhoto
              ? "columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4"
              : isApp
              ? "grid md:grid-cols-2 gap-4"
              : "grid sm:grid-cols-2 gap-3.5"
          }
        >
          {items.map((asset) => {
            if (isPhoto) {
              return (
                <motion.div
                  key={asset.id}
                  variants={item}
                  className="break-inside-avoid surface-elevated rounded-2xl overflow-hidden border border-[var(--hairline)] group relative transition-transform hover:-translate-y-1 hover:shadow-lg"
                >
                  {asset.image_url ? (
                    <div className="relative aspect-auto overflow-hidden">
                      <img
                        src={asset.image_url}
                        alt={asset.title}
                        className="w-full block object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-sm font-semibold">{asset.title}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center text-sm text-[var(--muted)]">
                      {asset.title}
                    </div>
                  )}
                </motion.div>
              );
            }

            if (isApp) {
              return (
                <motion.div
                  key={asset.id}
                  variants={item}
                  className="surface-elevated rounded-2xl p-5 border border-[var(--hairline)] flex flex-col justify-between hover:shadow-md hover:border-[var(--accent)]/30 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {asset.image_url ? (
                          <img
                            src={asset.image_url}
                            alt=""
                            className="w-12 h-12 object-cover rounded-xl border border-[var(--hairline)] shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] flex items-center justify-center shrink-0 text-[var(--accent)]">
                            <FolderGit2 className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-base text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                            {asset.title}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Live & Maintained
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-[var(--muted)] leading-relaxed line-clamp-3">
                      {asset.description}
                    </p>
                  </div>

                  {asset.url && (
                    <div className="pt-4 mt-2 border-t border-[var(--hairline)] flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--muted)]">Explore Project</span>
                      <a
                        href={asset.url}
                        target={asset.url.startsWith("http") ? "_blank" : undefined}
                        rel="noreferrer"
                        onClick={sfxClick}
                        className="btn btn-secondary text-xs px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 group-hover:bg-[var(--accent)] group-hover:text-white transition-colors"
                      >
                        <span>Launch</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </motion.div>
              );
            }

            // Standard Link or Interest Card
            return (
              <motion.a
                key={asset.id}
                variants={item}
                whileTap={{ scale: 0.98 }}
                href={asset.url || "#"}
                target={asset.url?.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                onClick={sfxClick}
                className="surface-elevated rounded-2xl p-4 border border-[var(--hairline)] flex items-center justify-between gap-3 hover:shadow-md hover:border-[var(--accent)]/30 transition-all group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {asset.image_url ? (
                    <img
                      src={asset.image_url}
                      alt=""
                      className="w-12 h-12 object-cover rounded-xl shrink-0 border border-[var(--hairline)]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center shrink-0 text-[var(--accent)]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate">
                      {asset.title}
                    </div>
                    {asset.description && (
                      <div className="text-xs text-[var(--muted)] line-clamp-2 mt-0.5 leading-snug">
                        {asset.description}
                      </div>
                    )}
                  </div>
                </div>

                {asset.url && (
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center shrink-0 text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:bg-[var(--accent)]/10 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                )}
              </motion.a>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
