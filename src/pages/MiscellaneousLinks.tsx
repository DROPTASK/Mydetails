import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  ExternalLink,
  Copy,
  Check,
  Search,
  Sparkles,
  QrCode,
  Trash2,
  TrendingUp,
  MousePointerClick,
  Layers,
  ArrowRight,
  ShieldCheck,
  Globe,
  PlusCircle,
  X,
  Share2,
} from "lucide-react";
import {
  getAllShortLinks,
  deleteShortLink,
  DOMAIN_NAME,
  type ShortLink,
} from "../lib/shortLinks";
import { isAdminSession } from "../lib/adminAuth";
import { sfxClick, sfxSuccess } from "../lib/sound";

export function MiscellaneousLinks({
  onCreateClick,
}: {
  onCreateClick?: () => void;
}) {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [qrModalLink, setQrModalLink] = useState<ShortLink | null>(null);
  const [sortBy, setSortBy] = useState<"clicks" | "newest" | "name">("clicks");
  const isAdmin = isAdminSession();

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const data = await getAllShortLinks();
      setLinks(data);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (shortUrl: string, linkSlug: string) => {
    sfxClick();
    navigator.clipboard.writeText(shortUrl);
    setCopiedSlug(linkSlug);
    setTimeout(() => {
      setCopiedSlug(null);
    }, 2000);
  };

  const handleDelete = async (link: ShortLink) => {
    if (!confirm(`Delete short link ${DOMAIN_NAME}/${link.slug}?`)) return;
    sfxClick();
    await deleteShortLink(link.id, link.slug, link.asset_id);
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
  };

  const filteredLinks = links
    .filter((l) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        l.slug.toLowerCase().includes(q) ||
        l.target_url.toLowerCase().includes(q) ||
        (l.title && l.title.toLowerCase().includes(q)) ||
        (l.description && l.description.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "clicks") {
        return (b.clicks || 0) - (a.clicks || 0);
      }
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return a.slug.localeCompare(b.slug);
    });

  const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
  const adminLinksCount = links.filter((l) => l.is_admin_created || l.add_to_links).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header and Explanation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--accent)] border border-[var(--hairline)]">
            <Layers className="w-3.5 h-3.5" />
            <span>Community & App Aliases</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--ink)]">
            Miscellaneous Links
          </h1>
          <p className="text-sm text-[var(--muted)] max-w-xl leading-relaxed">
            All vanity and custom links generated under{" "}
            <strong className="text-[var(--ink)] font-semibold">{DOMAIN_NAME}/*</strong>.
            Visitors and users can create custom shortcuts here, while official portfolio links are kept clean in Curated Links.
          </p>
        </div>

        {onCreateClick && (
          <button
            onClick={onCreateClick}
            className="btn btn-primary text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shrink-0 flex items-center gap-2 self-start md:self-auto shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Shorten New Link</span>
          </button>
        )}
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="surface-elevated p-3.5 sm:p-4 rounded-2xl border border-[var(--hairline)]">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] font-medium">
            <span>Total Short Links</span>
            <Globe className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-2xl font-black text-[var(--ink)] mt-1">
            {links.length}
          </div>
        </div>

        <div className="surface-elevated p-3.5 sm:p-4 rounded-2xl border border-[var(--hairline)]">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] font-medium">
            <span>Total Clicks Forwarded</span>
            <MousePointerClick className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {totalClicks}
          </div>
        </div>

        <div className="surface-elevated p-3.5 sm:p-4 rounded-2xl border border-[var(--hairline)] col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] font-medium">
            <span>Curated by Admin</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {adminLinksCount}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search short links by alias, title, or destination..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--hairline)] text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-hidden focus:border-[var(--accent)] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--hairline)] shrink-0 self-end sm:self-auto">
          <button
            onClick={() => setSortBy("clicks")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sortBy === "clicks"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            Popular
          </button>
          <button
            onClick={() => setSortBy("newest")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sortBy === "newest"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => setSortBy("name")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sortBy === "name"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Links List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 surface-elevated rounded-2xl animate-pulse bg-[var(--surface-2)]"
            />
          ))}
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="surface-elevated rounded-3xl p-10 text-center border border-[var(--hairline)] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--muted)] mx-auto">
            <Link2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--ink)]">
              {searchQuery ? "No matching short links found" : "No short links yet"}
            </h3>
            <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
              {searchQuery
                ? `No short links match "${searchQuery}". Try a different keyword.`
                : "Create custom short links with custom aliases under vanshkumar.in/..."}
            </p>
          </div>
          {onCreateClick && (
            <button
              onClick={onCreateClick}
              className="btn btn-primary text-xs px-4 py-2.5 rounded-xl font-bold inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Short Link</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLinks.map((link) => {
            const shortUrl = `https://${DOMAIN_NAME}/${link.slug}`;
            const isCopied = copiedSlug === link.slug;
            const isAdminVerified = link.is_admin_created || link.add_to_links;

            return (
              <motion.div
                key={link.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="surface-elevated rounded-2xl p-4 sm:p-5 border border-[var(--hairline)] hover:border-[var(--accent)]/40 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left details */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm sm:text-base font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                      {DOMAIN_NAME}/<span className="text-[var(--accent)]">{link.slug}</span>
                    </span>

                    {isAdminVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Admin Curated</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--muted)] text-[10px] font-medium border border-[var(--hairline)]">
                        <span>Misc Link</span>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      <MousePointerClick className="w-3 h-3" />
                      <span>{link.clicks || 0} visits</span>
                    </span>
                  </div>

                  {link.title && link.title !== `${DOMAIN_NAME}/${link.slug}` && (
                    <div className="text-xs font-semibold text-[var(--ink)] truncate">
                      {link.title}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] truncate max-w-md">
                    <span className="shrink-0 font-medium">Forwarding to:</span>
                    <a
                      href={link.target_url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline text-[var(--ink)] truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {link.target_url}
                    </a>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleCopy(shortUrl, link.slug)}
                    className={`btn text-xs px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all ${
                      isCopied
                        ? "bg-emerald-500 text-white border-transparent"
                        : "btn-secondary"
                    }`}
                    title="Copy Short URL"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    onClick={() => {
                      sfxClick();
                      setQrModalLink(link);
                    }}
                    className="icon-btn rounded-xl"
                    style={{ width: 34, height: 34 }}
                    title="Generate QR code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  <a
                    href={`/${link.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={sfxClick}
                    className="icon-btn rounded-xl"
                    style={{ width: 34, height: 34 }}
                    title="Test fast redirect"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(link)}
                      className="icon-btn text-rose-500 hover:bg-rose-500/10 rounded-xl"
                      style={{ width: 34, height: 34 }}
                      title="Delete link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrModalLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-elevated rounded-3xl p-6 max-w-sm w-full border border-[var(--hairline)] shadow-xl space-y-5 text-center relative"
            >
              <button
                onClick={() => setQrModalLink(null)}
                className="icon-btn absolute right-4 top-4"
                style={{ width: 32, height: 32 }}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1 pt-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] text-[11px] font-bold text-[var(--accent)]">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Instant QR Code</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)]">
                  {DOMAIN_NAME}/{qrModalLink.slug}
                </h3>
              </div>

              {/* QR Image */}
              <div className="p-4 bg-white rounded-2xl w-fit mx-auto border border-zinc-200 shadow-xs">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    `https://${DOMAIN_NAME}/${qrModalLink.slug}`
                  )}`}
                  alt={`QR for ${DOMAIN_NAME}/${qrModalLink.slug}`}
                  className="w-48 h-48 block"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(`https://${DOMAIN_NAME}/${qrModalLink.slug}`, qrModalLink.slug)}
                  className="flex-1 btn btn-secondary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>
                <a
                  href={`https://${DOMAIN_NAME}/${qrModalLink.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 btn btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Link</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
