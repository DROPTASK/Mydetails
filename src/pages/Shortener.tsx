import { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  QrCode,
  X,
  Share2,
  RefreshCw,
  FolderPlus,
  MousePointerClick,
  Globe,
  ShieldCheck,
  Lock,
  Unlock,
  Layers,
} from "lucide-react";
import {
  getAllShortLinks,
  createShortLink,
  deleteShortLink,
  isSlugAvailable,
  normalizeSlug,
  normalizeTargetUrl,
  validateSlug,
  validateTargetUrl,
  DOMAIN_NAME,
  RESERVED_APP_PATHS,
  type ShortLink,
} from "../lib/shortLinks";
import { isAdminSession, setAdminSession, verifyAdminPassword } from "../lib/adminAuth";
import { sfxClick, sfxSuccess } from "../lib/sound";

const RANDOM_SLUG_PREFIXES = ["vk", "go", "link", "dev", "app", "view", "hub", "page"];

export function Shortener({
  defaultSlug = "",
  isAdmin: propIsAdmin,
}: {
  defaultSlug?: string;
  isAdmin?: boolean;
}) {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => Boolean(propIsAdmin || isAdminSession()));
  const [showAdminUnlock, setShowAdminUnlock] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");

  // Form State
  const [targetUrl, setTargetUrl] = useState("");
  const [slug, setSlug] = useState(defaultSlug);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [addToLinks, setAddToLinks] = useState(false);

  // Validation State
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    valid?: boolean;
    message?: string;
  }>({ checking: false });

  const [formError, setFormError] = useState<string | null>(null);
  const [createdSuccess, setCreatedSuccess] = useState<ShortLink | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // QR Code Modal
  const [qrModalLink, setQrModalLink] = useState<ShortLink | null>(null);

  // Reserved paths preview toggle
  const [showReservedList, setShowReservedList] = useState(false);

  const formId = useId();

  // Keep admin in sync with prop if passed
  useEffect(() => {
    if (propIsAdmin !== undefined) {
      setIsAdmin(propIsAdmin);
    }
  }, [propIsAdmin]);

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(unlockPassword)) {
      sfxSuccess();
      setIsAdmin(true);
      setAdminSession(true);
      setAddToLinks(true);
      setShowAdminUnlock(false);
      setUnlockError("");
      setUnlockPassword("");
    } else {
      setUnlockError("Incorrect password");
    }
  };

  // Load links on mount
  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const data = await getAllShortLinks();
      setLinks(data);
    } catch {
      // Handled in getAllShortLinks
    } finally {
      setLoading(false);
    }
  };

  // Real-time slug availability debounce check
  useEffect(() => {
    const trimmed = slug.trim();
    if (!trimmed) {
      setSlugStatus({ checking: false });
      return;
    }

    const normalized = normalizeSlug(trimmed);
    const syntax = validateSlug(normalized);
    if (!syntax.valid) {
      setSlugStatus({ checking: false, valid: false, message: syntax.error });
      return;
    }

    setSlugStatus({ checking: true });
    const timer = setTimeout(async () => {
      const result = await isSlugAvailable(normalized);
      if (result.available) {
        setSlugStatus({
          checking: false,
          valid: true,
          message: `${DOMAIN_NAME}/${normalized} is available!`,
        });
      } else {
        setSlugStatus({
          checking: false,
          valid: false,
          message: result.error || "Slug is unavailable",
        });
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [slug]);

  // Generate random alias
  const handleRandomizeSlug = () => {
    sfxClick();
    const prefix = RANDOM_SLUG_PREFIXES[Math.floor(Math.random() * RANDOM_SLUG_PREFIXES.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    setSlug(`${prefix}-${randomNum}`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const normTarget = normalizeTargetUrl(targetUrl);
    const targetCheck = validateTargetUrl(normTarget);
    if (!targetCheck.valid) {
      setFormError(targetCheck.error || "Invalid destination URL");
      return;
    }

    const normSlug = normalizeSlug(slug);
    const slugCheck = validateSlug(normSlug);
    if (!slugCheck.valid) {
      setFormError(slugCheck.error || "Invalid custom alias");
      return;
    }

    setSubmitting(true);
    sfxClick();

    try {
      const result = await createShortLink({
        rawSlug: normSlug,
        rawTargetUrl: normTarget,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        addToLinks: isAdmin ? addToLinks : false,
        isAdmin,
      });

      if (!result.success || !result.link) {
        setFormError(result.error || "Failed to create short link");
        setSubmitting(false);
        return;
      }

      sfxSuccess();
      setCreatedSuccess(result.link);
      setLinks((prev) => [result.link!, ...prev.filter((l) => l.slug !== result.link!.slug)]);

      // Reset form
      setTargetUrl("");
      setSlug("");
      setTitle("");
      setDescription("");
      setSlugStatus({ checking: false });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong creating the link");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (link: ShortLink) => {
    if (!confirm(`Delete short link vanshkumar.in/${link.slug}?`)) return;
    sfxClick();
    await deleteShortLink(link.id, link.slug, link.asset_id);
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
  };

  const handleCopy = (shortUrl: string, linkSlug: string) => {
    sfxClick();
    navigator.clipboard.writeText(shortUrl);
    setCopiedSlug(linkSlug);
    setTimeout(() => {
      setCopiedSlug(null);
    }, 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--accent)] border border-[var(--hairline)]">
          <Link2 className="w-3.5 h-3.5" />
          <span>In-App URL Service</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--ink)]">
          Link Shortener
        </h1>
        <p className="text-[15px] text-[var(--muted)] max-w-2xl leading-relaxed">
          Create clean, personalized short links with custom aliases under{" "}
          <strong className="text-[var(--ink)] font-semibold">{DOMAIN_NAME}/&lt;alias&gt;</strong>.
          Includes in-app path protection, real-time availability checks, visit analytics, and one-tap integration with your public links.
        </p>
      </div>

      {/* Main Creation Card */}
      <div className="surface-elevated rounded-3xl p-6 sm:p-8 border border-[var(--hairline)] shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Create Personalized Short Link</h2>
              <p className="text-xs text-[var(--muted)]">vanshkumar.in/&lt;personalized&gt;</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowReservedList((p) => !p)}
            className="text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg hover:bg-[var(--surface-2)]"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Reserved paths ({RESERVED_APP_PATHS.size})</span>
          </button>
        </div>

        {/* Reserved Paths Drawer / Alert */}
        <AnimatePresence>
          {showReservedList && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--ink)] space-y-2">
                <div className="flex items-center justify-between font-semibold text-amber-700 dark:text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> Protected In-App Paths
                  </span>
                  <button
                    onClick={() => setShowReservedList(false)}
                    className="p-1 hover:opacity-75"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[var(--muted)]">
                  To prevent breaking the website or navigation, these paths cannot be used as short links:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Array.from(RESERVED_APP_PATHS)
                    .filter(Boolean)
                    .map((path) => (
                      <span
                        key={path}
                        className="px-2 py-0.5 rounded-md bg-[var(--surface)] text-[11px] font-mono border border-[var(--hairline)]"
                      >
                        /{path}
                      </span>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleCreate} className="space-y-5">
          {/* Target URL */}
          <div className="space-y-1.5">
            <label htmlFor={`${formId}-target`} className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
              Destination URL <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="relative flex items-center">
              <Globe className="w-4 h-4 absolute left-3.5 text-[var(--muted)] pointer-events-none" />
              <input
                id={`${formId}-target`}
                type="text"
                placeholder="https://github.com/vanshkumar or any destination link"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                required
                className="field pl-10 pr-4 py-3 text-sm rounded-xl w-full border border-[var(--hairline)] bg-[var(--surface-2)] focus:bg-[var(--surface)] transition-all"
              />
            </div>
          </div>

          {/* Personalized Slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={`${formId}-slug`} className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                Custom Alias / Slug <span className="text-[var(--danger)]">*</span>
              </label>
              <button
                type="button"
                onClick={handleRandomizeSlug}
                className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Suggest Alias
              </button>
            </div>

            <div className="flex rounded-xl overflow-hidden border border-[var(--hairline)] bg-[var(--surface-2)] focus-within:border-[var(--accent)] focus-within:bg-[var(--surface)] transition-all">
              <span className="inline-flex items-center px-3.5 text-xs sm:text-sm font-semibold text-[var(--muted)] border-r border-[var(--hairline)] select-none bg-[var(--surface-2)]/60">
                {DOMAIN_NAME}/
              </span>
              <input
                id={`${formId}-slug`}
                type="text"
                placeholder="personalized"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="flex-1 px-3.5 py-3 text-sm bg-transparent outline-none font-mono text-[var(--ink)] placeholder:text-[var(--muted)]/50"
              />
              <div className="flex items-center pr-3.5">
                {slugStatus.checking && (
                  <RefreshCw className="w-4 h-4 animate-spin text-[var(--muted)]" />
                )}
                {!slugStatus.checking && slugStatus.valid === true && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                {!slugStatus.checking && slugStatus.valid === false && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>

            {/* Availability feedback */}
            {slugStatus.message && (
              <p
                className={`text-xs flex items-center gap-1.5 transition-colors ${
                  slugStatus.valid ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-red-500 font-medium"
                }`}
              >
                {slugStatus.valid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{slugStatus.message}</span>
              </p>
            )}
          </div>

          {/* Optional Title & Description */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor={`${formId}-title`} className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                Title / Label <span className="text-[var(--muted)] font-normal text-[11px]">(optional)</span>
              </label>
              <input
                id={`${formId}-title`}
                type="text"
                placeholder="e.g. My Resume / Project Demo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="field px-3.5 py-2.5 text-sm rounded-xl w-full border border-[var(--hairline)] bg-[var(--surface-2)] focus:bg-[var(--surface)] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor={`${formId}-desc`} className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                Description / Note <span className="text-[var(--muted)] font-normal text-[11px]">(optional)</span>
              </label>
              <input
                id={`${formId}-desc`}
                type="text"
                placeholder="e.g. Shared for recruiters & team"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="field px-3.5 py-2.5 text-sm rounded-xl w-full border border-[var(--hairline)] bg-[var(--surface-2)] focus:bg-[var(--surface)] transition-all"
              />
            </div>
          </div>

          {/* Admin vs Non-Admin Curated Links Inclusion */}
          {isAdmin ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-bold text-[var(--ink)]">Add to My Links (Curated)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    👑 Admin Verified
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Feature this link permanently in the public Curated Links tab on /links.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 sm:mt-0">
                <input
                  type="checkbox"
                  checked={addToLinks}
                  onChange={(e) => setAddToLinks(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--surface)] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 border border-[var(--hairline)]" />
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--accent)]" />
                    <span className="text-sm font-bold text-[var(--ink)]">
                      Short Link Saved
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--surface)] text-[var(--muted)] border border-[var(--hairline)]">
                      Public
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    Only Admin can add links to &ldquo;My Links&rdquo;.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdminUnlock((p) => !p)}
                  className="btn btn-secondary text-xs px-3 py-1.5 rounded-xl font-medium inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Admin Unlock</span>
                </button>
              </div>

              {showAdminUnlock && (
                <div className="p-3.5 rounded-2xl surface border border-amber-500/30 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="password"
                    placeholder="Enter Admin Password"
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    className="w-full sm:w-60 text-xs px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)]"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleUnlockAdmin}
                      className="btn btn-primary text-xs px-3 py-2 rounded-xl font-bold flex-1 sm:flex-none"
                    >
                      Unlock Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAdminUnlock(false)}
                      className="btn btn-secondary text-xs px-2.5 py-2 rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                  {unlockError && (
                    <span className="text-xs text-rose-500 font-semibold">{unlockError}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Creation Success Banner */}
          {createdSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    Short Link Created!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCreatedSuccess(null)}
                  className="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  Dismiss
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--hairline)]">
                <span className="font-mono text-xs sm:text-sm font-bold text-[var(--accent)] truncate">
                  {DOMAIN_NAME}/{createdSuccess.slug}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(`https://${DOMAIN_NAME}/${createdSuccess.slug}`, createdSuccess.slug)}
                    className="btn btn-secondary text-xs px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                  <a
                    href={`/${createdSuccess.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary text-xs px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Test</span>
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span>
                  {createdSuccess.add_to_links
                    ? "⭐ Added to Curated 'My Links'"
                    : "ℹ️ Your short link is live"}
                </span>
              </div>
            </div>
          )}

          {/* Form Error */}
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting || (slugStatus.valid === false)}
            className="w-full btn btn-primary py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Creating Short Link...</span>
              </>
            ) : (
              <>
                <span>Create vanshkumar.in/{normalizeSlug(slug) || "<personalized>"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Created Links Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[var(--ink)]">Your Short Links</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--hairline)]">
              {links.length}
            </span>
          </div>

          <button
            onClick={loadLinks}
            className="text-xs text-[var(--muted)] hover:text-[var(--ink)] flex items-center gap-1 transition-colors"
            title="Refresh links"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="surface-elevated rounded-2xl h-24 animate-pulse bg-[var(--surface-2)] border border-[var(--hairline)]"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && links.length === 0 && (
          <div className="surface p-8 sm:p-12 text-center rounded-3xl border border-[var(--hairline)] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] text-[var(--muted)] mx-auto flex items-center justify-center">
              <Link2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[var(--ink)]">No short links yet</h3>
            <p className="text-sm text-[var(--muted)] max-w-sm mx-auto">
              Create your first short link above using <span className="font-semibold text-[var(--ink)]">vanshkumar.in/&lt;personalized&gt;</span>.
            </p>
          </div>
        )}

        {/* Links Grid / List */}
        {!loading && links.length > 0 && (
          <div className="grid gap-3.5">
            {links.map((item) => {
              const fullShortUrl = `https://${DOMAIN_NAME}/${item.slug}`;
              const isCopied = copiedSlug === item.slug;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="surface-elevated rounded-2xl p-4 sm:p-5 border border-[var(--hairline)] hover:border-[var(--accent)]/30 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-base font-extrabold text-[var(--accent)] hover:underline flex items-center gap-1 font-mono tracking-tight"
                      >
                        <span>{DOMAIN_NAME}/{item.slug}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </a>

                      {item.add_to_links && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Check className="w-2.5 h-2.5" /> On /links
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--hairline)]">
                        <MousePointerClick className="w-3 h-3" />
                        <span>{item.clicks || 0} clicks</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] truncate max-w-full">
                      <span className="font-medium text-[var(--ink)] shrink-0">{item.title}</span>
                      <span className="opacity-40">•</span>
                      <span className="truncate">{item.target_url}</span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-[var(--muted)] line-clamp-1 italic">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--hairline)]">
                    <button
                      onClick={() => handleCopy(fullShortUrl, item.slug)}
                      className="btn btn-secondary text-xs px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 transition-all"
                      title="Copy short link"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        sfxClick();
                        setQrModalLink(item);
                      }}
                      className="icon-btn rounded-xl"
                      style={{ width: 34, height: 34 }}
                      title="Generate QR code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    <a
                      href={`/${item.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={sfxClick}
                      className="icon-btn rounded-xl"
                      style={{ width: 34, height: 34 }}
                      title="Test direct link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => handleDelete(item)}
                      className="icon-btn rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                      style={{ width: 34, height: 34 }}
                      title="Delete link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrModalLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-elevated rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-[var(--hairline)] shadow-2xl space-y-5 text-center"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                  QR Code & Share
                </span>
                <button
                  onClick={() => setQrModalLink(null)}
                  className="icon-btn"
                  style={{ width: 32, height: 32 }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-white rounded-2xl mx-auto w-fit shadow-xs">
                <img
                  src={`https://quickchart.io/qr?text=${encodeURIComponent(
                    `https://${DOMAIN_NAME}/${qrModalLink.slug}`
                  )}&size=200&margin=2`}
                  alt={`QR code for ${DOMAIN_NAME}/${qrModalLink.slug}`}
                  className="w-48 h-48 block mx-auto"
                />
              </div>

              <div className="space-y-1">
                <div className="font-mono text-sm font-bold text-[var(--ink)]">
                  {DOMAIN_NAME}/{qrModalLink.slug}
                </div>
                <div className="text-xs text-[var(--muted)] truncate max-w-full">
                  {qrModalLink.target_url}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleCopy(`https://${DOMAIN_NAME}/${qrModalLink.slug}`, qrModalLink.slug);
                  }}
                  className="btn btn-primary flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Short URL</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
