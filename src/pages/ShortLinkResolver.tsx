import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ExternalLink, ArrowRight, Sparkles, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import {
  getShortLinkBySlug,
  getCachedShortLink,
  recordLinkClick,
  normalizeSlug,
  RESERVED_APP_PATHS,
  DOMAIN_NAME,
  type ShortLink,
} from "../lib/shortLinks";

export function ShortLinkResolver() {
  const { slug: rawSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const slug = normalizeSlug(rawSlug || "");

  // Instant synchronous cache check
  const initialCached = slug && !RESERVED_APP_PATHS.has(slug) ? getCachedShortLink(slug) : null;
  const [loading, setLoading] = useState(!initialCached);
  const [shortLink, setShortLink] = useState<ShortLink | null>(initialCached);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      navigate("/", { replace: true });
      return;
    }

    // If it is a reserved in-app path, forward to it immediately
    if (RESERVED_APP_PATHS.has(slug)) {
      navigate(`/${slug}`, { replace: true });
      return;
    }

    // 1. Instant Cache Redirect: If link is in synchronous local cache, forward right now!
    if (initialCached && initialCached.target_url) {
      recordLinkClick(slug).catch(() => {});
      window.location.replace(initialCached.target_url);
      return;
    }

    let isMounted = true;

    async function resolve() {
      try {
        const link = await getShortLinkBySlug(slug);
        if (!isMounted) return;

        if (link && link.target_url) {
          setShortLink(link);
          setLoading(false);

          // Record click in background
          recordLinkClick(slug).catch(() => {});

          // Zero-delay immediate forwarding
          window.location.replace(link.target_url);
        } else {
          setNotFound(true);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }

    resolve();

    return () => {
      isMounted = false;
    };
  }, [slug, navigate, initialCached]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] animate-pulse">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[var(--ink)]">Looking up short link...</h2>
          <p className="text-sm font-mono text-[var(--muted)]">
            {DOMAIN_NAME}/{slug}
          </p>
        </div>
      </div>
    );
  }

  // Found and redirecting
  if (shortLink) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shadow-xs">
          <ExternalLink className="w-8 h-8 animate-bounce" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Redirecting now</span>
          </div>

          <h1 className="text-2xl font-extrabold text-[var(--ink)] tracking-tight">
            Forwarding you to destination
          </h1>

          <p className="text-xs font-mono text-[var(--muted)] truncate max-w-xs mx-auto">
            {DOMAIN_NAME}/{shortLink.slug}
          </p>

          <p className="text-sm text-[var(--ink)] font-medium pt-1">
            {shortLink.title || shortLink.target_url}
          </p>
        </div>

        <div className="w-full space-y-3">
          <a
            href={shortLink.target_url}
            className="w-full btn btn-primary py-3 px-5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Continue to Website</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <p className="text-xs text-[var(--muted)]">
            Not redirecting automatically? Click the button above.
          </p>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            404 Link Not Found
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
            This short link does not exist
          </h1>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            The alias <strong className="font-mono text-[var(--ink)] font-semibold">{DOMAIN_NAME}/{slug}</strong> hasn&apos;t been claimed yet or has been removed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            to={`/shortener?claim=${encodeURIComponent(slug)}`}
            className="flex-1 btn btn-primary py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Claim &quot;{slug}&quot;</span>
          </Link>

          <Link
            to="/links"
            className="flex-1 btn btn-secondary py-3 rounded-2xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Links</span>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
