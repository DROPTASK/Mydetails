import { useEffect, useMemo, useRef, useState } from "react";
import {
  Lock, Image as ImageIcon, Trash2, Plus, LogOut, Wifi, WifiOff, Music, Clapperboard,
  Search, Star, MessageSquare, Send, ArrowLeft, Mail, Bell, UserCircle2, Upload, Check, Film, Link2, HardDrive,
  Eye, EyeOff, Sparkles, ExternalLink, Globe, Share2,
} from "lucide-react";
import { supabase, type Message, type PortfolioAsset, type FavoriteMovie, type ChatUser, type SiteProfile, type BollywoodMovieRecord } from "../lib/supabase";
import type { PlaylistTrack } from "../lib/musicStore";
import { searchMovies, posterUrl, type Movie } from "../lib/tmdb";
import { searchTracks, upsizeArtwork, type ItunesTrack } from "../lib/itunes";
import { sendEmail, isEmail } from "../lib/email";
import { uploadToPortfolioBucket } from "../lib/storage";
import { sfxToggle, sfxClick } from "../lib/sound";
import {
  loadAllPortfolioAssets,
  addPortfolioAsset,
  deletePortfolioAsset,
  toggleAssetShowOnHome,
  saveAssetOverride,
  isConfiguredHomeSocial,
  DUMMY_SEED_URLS,
} from "../lib/portfolioStorage";
import {
  AdvancedPfp,
  SocialAppLogo,
  ALL_PLATFORMS,
  detectPlatform,
  PLATFORM_THEMES,
  type PlatformId,
} from "../lib/platformThemes";
import { cn } from "../lib/utils";
import { Shortener } from "./Shortener";
import { Projects } from "./Projects";
import { isAdminSession, setAdminSession } from "../lib/adminAuth";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";

type NotificationSettings = {
  admin_email: string;
  notify_admin_on_message: boolean;
  notify_user_on_reply: boolean;
};

type Conversation = {
  user: ChatUser;
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
};

const DEFAULT_PROFILE: SiteProfile = {
  online: { name: "Vansh", bio: "Online.", avatar_url: null },
  real: { name: "Vansh Kumar", bio: "Indian · Class 12 · Computer Science", avatar_url: null },
};

export const STANDARD_SOCIAL_CONFIGS: {
  id: string;
  name: string;
  platform: PlatformId;
  placeholder: string;
}[] = [
  { id: "conn-x", name: "Twitter / X", platform: "twitter", placeholder: "https://x.com/yourhandle" },
  { id: "conn-wa", name: "WhatsApp", platform: "whatsapp", placeholder: "https://wa.me/91XXXXXXXXXX" },
  { id: "conn-rd", name: "Reddit", platform: "reddit", placeholder: "https://reddit.com/u/yourhandle" },
  { id: "conn-tg", name: "Telegram", platform: "telegram", placeholder: "https://t.me/yourhandle" },
  { id: "conn-ig", name: "Instagram", platform: "instagram", placeholder: "https://instagram.com/yourhandle" },
  { id: "conn-gh", name: "GitHub", platform: "github", placeholder: "https://github.com/yourhandle" },
  { id: "conn-li", name: "LinkedIn", platform: "linkedin", placeholder: "https://linkedin.com/in/yourhandle" },
  { id: "conn-yt", name: "YouTube", platform: "youtube", placeholder: "https://youtube.com/@yourchannel" },
  { id: "conn-dc", name: "Discord", platform: "discord", placeholder: "https://discord.gg/yourinvite" },
  { id: "conn-sp", name: "Spotify", platform: "spotify", placeholder: "https://open.spotify.com/user/yourhandle" },
  { id: "conn-mail", name: "Email", platform: "mail", placeholder: "mailto:your@email.com" },
];

const TABS = [
  { id: "chats" as const, label: "Chats", icon: MessageSquare },
  { id: "socials" as const, label: "Socials", icon: Share2 },
  { id: "profile" as const, label: "Profile", icon: UserCircle2 },
  { id: "projects" as const, label: "Projects", icon: HardDrive },
  { id: "assets" as const, label: "Content", icon: ImageIcon },
  { id: "shortlinks" as const, label: "Short Links", icon: Link2 },
  { id: "playlist" as const, label: "Playlist", icon: Music },
  { id: "movies" as const, label: "Movies", icon: Clapperboard },
  { id: "bollywood" as const, label: "Bollywood DB", icon: Film },
  { id: "status" as const, label: "Status", icon: Wifi },
];

export function Admin() {
  const [hostnameOk, setHostnameOk] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("chats");

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);

  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistTrack[]>([]);
  const [favMovies, setFavMovies] = useState<FavoriteMovie[]>([]);
  const [bollywoodList, setBollywoodList] = useState<BollywoodMovieRecord[]>([]);
  const [newBollywood, setNewBollywood] = useState({ title: "", year: "2024", overview: "", tagline: "", genres: "Drama", lead_actor: "", director: "", poster_path: "" });
  const [isOnline, setIsOnline] = useState(false);
  const [notif, setNotif] = useState<NotificationSettings>({
    admin_email: "",
    notify_admin_on_message: true,
    notify_user_on_reply: true,
  });
  const [notifSaved, setNotifSaved] = useState(false);

  const [profile, setProfileState] = useState<SiteProfile>(DEFAULT_PROFILE);
  const [profileSaved, setProfileSaved] = useState(false);
  const [uploadingOnline, setUploadingOnline] = useState(false);
  const [uploadingReal, setUploadingReal] = useState(false);
  const onlineFileRef = useRef<HTMLInputElement>(null);
  const realFileRef = useRef<HTMLInputElement>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  const [newAsset, setNewAsset] = useState<{
    type: string;
    title: string;
    url: string;
    image_url: string;
    description: string;
    show_on_home: boolean;
    platform: PlatformId;
  }>({
    type: "connection",
    title: "Twitter / X",
    url: "https://x.com/0xUnique_",
    image_url: "",
    description: "",
    show_on_home: true,
    platform: "twitter",
  });
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const assetFileRef = useRef<HTMLInputElement>(null);

  // Other Sites / Custom Links state
  const [newOtherSite, setNewOtherSite] = useState({
    title: "",
    url: "",
    image_url: "",
    show_on_home: true,
  });
  const [uploadingOtherLogo, setUploadingOtherLogo] = useState(false);
  const otherLogoFileRef = useRef<HTMLInputElement>(null);

  const [movieQuery, setMovieQuery] = useState("");
  const [movieResults, setMovieResults] = useState<Movie[]>([]);
  const [movieSearching, setMovieSearching] = useState(false);

  const [musicQuery, setMusicQuery] = useState("");
  const [musicResults, setMusicResults] = useState<ItunesTrack[]>([]);
  const [musicSearching, setMusicSearching] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    const path = window.location.pathname;
    if (
      host === "administrator.vanshkumar.in" ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.includes("run.app") ||
      path.startsWith("/admin")
    ) {
      setHostnameOk(true);
    }

    if (isAdminSession()) {
      setAuthed(true);
      loadData();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ADMIN_PASSWORD || password === ADMIN_PASSWORD) {
      setAuthed(true);
      setAdminSession(true);
      setError("");
      loadData();
    } else {
      setError("Incorrect password");
      setPassword("");
    }
  };

  const loadData = async () => {
    const { data: msgs } = await supabase.from("messages").select("*").order("created_at", { ascending: true }).limit(1000);
    if (msgs) setMessages(msgs);
    const { data: users } = await supabase.from("chat_users").select("*").order("last_seen", { ascending: false });
    if (users) setChatUsers(users as ChatUser[]);
    try {
      const assts = await loadAllPortfolioAssets();
      if (assts) setAssets(assts);
    } catch (err) {
      console.warn("Failed to load portfolio assets:", err);
    }
    const { data: tracks } = await supabase.from("playlist").select("*").order("sort_order");
    if (tracks) setPlaylist(tracks as PlaylistTrack[]);
    const { data: favs } = await supabase.from("favorite_movies").select("*").order("sort_order");
    if (favs) setFavMovies(favs as FavoriteMovie[]);
    const { data: bws } = await supabase.from("bollywood_movies").select("*").order("id");
    if (bws) setBollywoodList(bws as BollywoodMovieRecord[]);
    const { data: settings } = await supabase.from("admin_settings").select("value").eq("key", "online_status").single();
    if (settings?.value) setIsOnline(!!settings.value.is_online);
    const { data: notifRow } = await supabase.from("admin_settings").select("value").eq("key", "notifications").single();
    if (notifRow?.value) {
      setNotif({
        admin_email: notifRow.value.admin_email || "",
        notify_admin_on_message: notifRow.value.notify_admin_on_message !== false,
        notify_user_on_reply: notifRow.value.notify_user_on_reply !== false,
      });
    }
    const { data: profileRow } = await supabase.from("admin_settings").select("value").eq("key", "profile").single();
    if (profileRow?.value?.online && profileRow?.value?.real) setProfileState(profileRow.value as SiteProfile);
  };

  // Realtime: keep every tab live without needing a manual refresh.
  useEffect(() => {
    if (!authed) return;

    const handleAssetsUpdated = () => {
      loadAllPortfolioAssets().then((data) => setAssets(data));
    };
    window.addEventListener("vk_portfolio_assets_updated", handleAssetsUpdated);

    const channel = supabase
      .channel("admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        supabase.from("messages").select("*").order("created_at", { ascending: true }).limit(1000)
          .then(({ data }) => data && setMessages(data));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_users" }, () => {
        supabase.from("chat_users").select("*").order("last_seen", { ascending: false })
          .then(({ data }) => data && setChatUsers(data as ChatUser[]));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "portfolio_assets" }, () => {
        loadAllPortfolioAssets().then((data) => setAssets(data));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "playlist" }, () => {
        supabase.from("playlist").select("*").order("sort_order")
          .then(({ data }) => data && setPlaylist(data as PlaylistTrack[]));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "favorite_movies" }, () => {
        supabase.from("favorite_movies").select("*").order("sort_order")
          .then(({ data }) => data && setFavMovies(data as FavoriteMovie[]));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "bollywood_movies" }, () => {
        supabase.from("bollywood_movies").select("*").order("id")
          .then(({ data }) => data && setBollywoodList(data as BollywoodMovieRecord[]));
      })
      .subscribe();
    return () => {
      window.removeEventListener("vk_portfolio_assets_updated", handleAssetsUpdated);
      supabase.removeChannel(channel);
    };
  }, [authed]);

  const toggleOnline = async () => {
    sfxToggle();
    const next = !isOnline;
    await supabase.from("admin_settings").upsert({
      key: "online_status",
      value: { is_online: next, last_updated: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    });
    setIsOnline(next);
  };

  const saveNotifications = async () => {
    await supabase.from("admin_settings").upsert({
      key: "notifications",
      value: notif,
      updated_at: new Date().toISOString(),
    });
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 1800);
  };

  const saveProfile = async (next: SiteProfile) => {
    setProfileState(next);
    await supabase.from("admin_settings").upsert({
      key: "profile",
      value: next,
      updated_at: new Date().toISOString(),
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 1800);
  };

  const updateIdentity = (side: "online" | "real", patch: Partial<SiteProfile["online"]>) => {
    setProfileState((p) => ({ ...p, [side]: { ...p[side], ...patch } }));
  };

  const uploadAvatar = async (side: "online" | "real", file: File) => {
    const setUploading = side === "online" ? setUploadingOnline : setUploadingReal;
    setUploading(true);
    try {
      const url = await uploadToPortfolioBucket(file, `avatars/${side}`);
      const next = { ...profile, [side]: { ...profile[side], avatar_url: url } };
      await saveProfile(next);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed — check the 'portfolio' storage bucket exists (migration 004).");
    } finally {
      setUploading(false);
    }
  };

  const addAsset = async () => {
    if (!newAsset.title.trim()) return;
    try {
      sfxClick();
      const created = await addPortfolioAsset(newAsset);
      setAssets((p) => [created, ...p.filter((x) => x.id !== created.id)]);
      setNewAsset((prev) => ({
        ...prev,
        title: "",
        url: "",
        image_url: "",
        description: "",
      }));
      showToast(`Added "${created.title}" successfully`);
    } catch (err) {
      console.error("Failed to add asset:", err);
      showToast("Failed to add content item");
    }
  };

  const toggleShowOnHome = async (asset: PortfolioAsset) => {
    const nextVal = asset.show_on_home === false ? true : false;
    try {
      sfxClick();
      setAssets((prev) =>
        prev.map((a) => (a.id === asset.id ? { ...a, show_on_home: nextVal } : a))
      );
      await toggleAssetShowOnHome(asset.id, nextVal);
      showToast(nextVal ? `Showing "${asset.title}" on Homepage` : `Hidden "${asset.title}" from Homepage`);
    } catch (err) {
      console.error("Failed to toggle show on home:", err);
      showToast("Failed to update homepage visibility");
    }
  };

  const updateSocialUrl = (connId: string, url: string) => {
    const trimmed = url.trim();
    setAssets((prev) => {
      const idx = prev.findIndex((a) => a.id === connId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          url,
          show_on_home: trimmed ? (next[idx].show_on_home !== false) : false,
        };
        return next;
      }
      const cfg = STANDARD_SOCIAL_CONFIGS.find((c) => c.id === connId);
      const newConn: PortfolioAsset = {
        id: connId,
        type: "connection",
        title: cfg?.name || "Social",
        description: null,
        url,
        image_url: null,
        favicon_url: null,
        sort_order: Date.now(),
        is_published: true,
        show_on_home: trimmed.length > 0,
        platform: cfg?.platform || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return [...prev, newConn];
    });
    saveAssetOverride(connId, {
      url,
      show_on_home: trimmed.length > 0,
    });
  };

  const toggleSocialVisibility = async (connId: string) => {
    sfxClick();
    const existing = assets.find((a) => a.id === connId);
    const hasUrl = Boolean(existing?.url && existing.url.trim().length > 0 && !DUMMY_SEED_URLS.has(existing.url.trim()));
    if (!hasUrl) {
      const cfg = STANDARD_SOCIAL_CONFIGS.find((c) => c.id === connId);
      showToast(`Please enter a URL for ${cfg?.name || 'this social link'} first`);
      return;
    }
    const currentHome = existing?.show_on_home !== false;
    const nextHome = !currentHome;

    setAssets((prev) => {
      const idx = prev.findIndex((a) => a.id === connId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], show_on_home: nextHome };
        return next;
      }
      return prev;
    });

    await toggleAssetShowOnHome(connId, nextHome);
    const cfg = STANDARD_SOCIAL_CONFIGS.find((c) => c.id === connId);
    showToast(nextHome ? `Showing ${cfg?.name || 'social'} on Home` : `Hidden ${cfg?.name || 'social'} from Home`);
  };

  const addOtherSite = async () => {
    if (!newOtherSite.title.trim() || !newOtherSite.url.trim()) {
      showToast("Please enter site title and URL");
      return;
    }
    try {
      sfxClick();
      const created = await addPortfolioAsset({
        type: "connection",
        title: newOtherSite.title.trim(),
        url: newOtherSite.url.trim(),
        image_url: newOtherSite.image_url.trim() || null,
        show_on_home: newOtherSite.show_on_home,
        platform: "web",
      });
      setAssets((prev) => [created, ...prev.filter((a) => a.id !== created.id)]);
      setNewOtherSite({ title: "", url: "", image_url: "", show_on_home: true });
      showToast(`Added "${created.title}" with custom logo`);
    } catch (err) {
      console.error("Failed to add other site:", err);
      showToast("Failed to add site");
    }
  };

  const uploadOtherLogoImage = async (file: File) => {
    setUploadingOtherLogo(true);
    try {
      const url = await uploadToPortfolioBucket(file, "socials");
      setNewOtherSite((p) => ({ ...p, image_url: url }));
      showToast("Uploaded site logo successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed — check storage bucket.");
    } finally {
      setUploadingOtherLogo(false);
    }
  };

  const uploadAssetImage = async (file: File) => {
    setUploadingAsset(true);
    try {
      const url = await uploadToPortfolioBucket(file, "gallery");
      setNewAsset((p) => ({ ...p, image_url: url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed — check the 'portfolio' storage bucket exists (migration 004).");
    } finally {
      setUploadingAsset(false);
    }
  };

  const runMovieSearch = async (q: string) => {
    setMovieQuery(q);
    if (!q.trim()) {
      setMovieResults([]);
      return;
    }
    setMovieSearching(true);
    try {
      setMovieResults(await searchMovies(q));
    } catch {
      setMovieResults([]);
    } finally {
      setMovieSearching(false);
    }
  };

  const addFavoriteMovie = async (m: Movie) => {
    if (favMovies.some((f) => f.tmdb_id === m.id)) return;
    const { data } = await supabase
      .from("favorite_movies")
      .insert({
        tmdb_id: m.id,
        title: m.title,
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        overview: m.overview,
        release_date: m.release_date,
        vote_average: m.vote_average,
        sort_order: favMovies.length,
      })
      .select()
      .single();
    if (data) setFavMovies((p) => [...p, data as FavoriteMovie]);
  };

  const runMusicSearch = async (q: string) => {
    setMusicQuery(q);
    if (!q.trim()) {
      setMusicResults([]);
      return;
    }
    setMusicSearching(true);
    try {
      setMusicResults(await searchTracks(q));
    } catch {
      setMusicResults([]);
    } finally {
      setMusicSearching(false);
    }
  };

  const addTrackFromSearch = async (t: ItunesTrack) => {
    if (!t.previewUrl) return;
    const { data } = await supabase
      .from("playlist")
      .insert({
        title: t.trackName,
        artist: t.artistName,
        audio_url: t.previewUrl,
        artwork_url: upsizeArtwork(t.artworkUrl100),
        sort_order: playlist.length,
      })
      .select()
      .single();
    if (data) setPlaylist((p) => [...p, data as PlaylistTrack]);
  };

  // ---------- Conversations ----------
  const conversations: Conversation[] = useMemo(() => {
    const byUser = new Map<string, Message[]>();
    for (const m of messages) {
      const arr = byUser.get(m.chat_user_id) || [];
      arr.push(m);
      byUser.set(m.chat_user_id, arr);
    }
    const list: Conversation[] = [];
    for (const user of chatUsers) {
      const msgs = byUser.get(user.id) || [];
      if (msgs.length === 0) continue;
      const lastMessage = msgs[msgs.length - 1];
      const unreadCount = msgs.filter((m) => m.sender_type === "user" && !m.is_read).length;
      list.push({ user, messages: msgs, lastMessage, unreadCount });
    }
    return list.sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());
  }, [messages, chatUsers]);

  const selectedConvo = conversations.find((c) => c.user.id === selectedChatId) || null;

  const openConversation = async (id: string) => {
    setSelectedChatId(id);
    const unreadIds = messages.filter((m) => m.chat_user_id === id && m.sender_type === "user" && !m.is_read).map((m) => m.id);
    if (unreadIds.length === 0) return;
    setMessages((p) => p.map((m) => (unreadIds.includes(m.id) ? { ...m, is_read: true } : m)));
    await supabase.from("messages").update({ is_read: true }).in("id", unreadIds);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedConvo || replySending) return;
    const text = replyText.trim();
    setReplyText("");
    setReplySending(true);
    try {
      const { data } = await supabase
        .from("messages")
        .insert({ sender_type: "admin", content: text, chat_user_id: selectedConvo.user.id, is_read: true })
        .select()
        .single();
      if (data) setMessages((p) => [...p, data as Message]);

      const email = selectedConvo.user.generated_user_id;
      if (notif.notify_user_on_reply && isEmail(email)) {
        sendEmail({ to: email, subject: "Vansh replied to your message", text });
      }
    } finally {
      setReplySending(false);
    }
  };

  const deleteAsset = async (id: string, title?: string) => {
    try {
      sfxClick();
      setDeletingAssetId(id);
      setAssets((p) => p.filter((x) => x.id !== id));
      await deletePortfolioAsset(id);
      showToast(`Deleted "${title || "content item"}" permanently`);
    } catch (err) {
      console.error("Failed to delete asset:", err);
      showToast("Failed to delete item");
    } finally {
      setDeletingAssetId(null);
    }
  };
  const deleteTrack = async (id: string, title?: string) => {
    try {
      sfxClick();
      setPlaylist((p) => p.filter((x) => x.id !== id));
      await supabase.from("playlist").delete().eq("id", id);
      showToast(`Removed "${title || "track"}"`);
    } catch (err) {
      console.error("Failed to delete track:", err);
    }
  };
  const deleteFavMovie = async (id: string, title?: string) => {
    try {
      sfxClick();
      setFavMovies((p) => p.filter((x) => x.id !== id));
      await supabase.from("favorite_movies").delete().eq("id", id);
      showToast(`Removed "${title || "movie"}"`);
    } catch (err) {
      console.error("Failed to delete movie:", err);
    }
  };
  const deleteBollywoodMovie = async (id: number, title?: string) => {
    try {
      sfxClick();
      setBollywoodList((p) => p.filter((x) => x.id !== id));
      await supabase.from("bollywood_movies").delete().eq("id", id);
      showToast(`Removed "${title || "Bollywood movie"}"`);
    } catch (err) {
      console.error("Failed to delete Bollywood movie:", err);
    }
  };
  const addBollywoodMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBollywood.title.trim()) return;
    const genresArr = newBollywood.genres.split(",").map((g) => g.trim()).filter(Boolean);
    const { data } = await supabase.from("bollywood_movies").insert({
      title: newBollywood.title.trim(),
      year: newBollywood.year.trim() || "2024",
      overview: newBollywood.overview.trim(),
      tagline: newBollywood.tagline.trim(),
      genres: genresArr,
      lead_actor: newBollywood.lead_actor.trim() || null,
      director: newBollywood.director.trim() || null,
      poster_path: newBollywood.poster_path.trim() || null,
    }).select().single();
    if (data) {
      setBollywoodList((p) => [...p, data as BollywoodMovieRecord]);
      setNewBollywood({ title: "", year: "2024", overview: "", tagline: "", genres: "Drama", lead_actor: "", director: "", poster_path: "" });
    }
  };

  if (!hostnameOk) {
    return (
      <div className="min-h-dvh grid place-items-center" style={{ background: "var(--bg)", color: "var(--ink)" }}>
        <h1 className="text-2xl font-extrabold tracking-tight">404</h1>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-dvh grid place-items-center p-6" style={{ background: "var(--bg)" }}>
        <form onSubmit={handleLogin} className="w-full max-w-sm surface-elevated p-8 space-y-4">
          <span className="icon-btn" style={{ width: 44, height: 44 }}>
            <Lock className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-extrabold tracking-tight">Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="field"
          />
          {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
          <button type="submit" className="btn btn-primary w-full py-3">Unlock</button>
        </form>
      </div>
    );
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">Admin</h1>
          <button
            onClick={() => {
              setAuthed(false);
              setAdminSession(false);
            }}
            className="btn btn-secondary text-sm px-3 py-2"
          >
            <LogOut className="w-4 h-4" /> Lock
          </button>
        </header>

        <div className="flex flex-wrap gap-1.5 no-scrollbar overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn("relative pill flex items-center gap-1.5 shrink-0", tab === t.id && "active")}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
              {t.id === "chats" && !!totalUnread && (
                <span className="min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--danger)", color: "#fff" }}>
                  {totalUnread}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "status" && (
          <div className="space-y-4 max-w-lg">
            <button onClick={toggleOnline} className="surface p-4 flex items-center gap-3 w-full text-left hover:shadow-md transition-shadow">
              <span className="icon-btn" style={{ background: isOnline ? "color-mix(in srgb, #34c759 20%, transparent)" : undefined }}>
                {isOnline ? <Wifi className="w-4 h-4" style={{ color: "#34c759" }} /> : <WifiOff className="w-4 h-4" />}
              </span>
              <div>
                <div className="font-semibold text-sm">{isOnline ? "Online — AI replies off" : "Offline — AI replies on"}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>Tap to switch. Shows live on your Home avatar too.</div>
              </div>
            </button>

            <div className="surface-elevated p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm"><Bell className="w-4 h-4" /> Email notifications</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                Requires SMTP secrets set on the server (SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD…). Credentials never touch this panel.
              </p>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
                <input
                  type="email"
                  placeholder="Your email (gets notified on new messages)"
                  value={notif.admin_email}
                  onChange={(e) => setNotif((p) => ({ ...p, admin_email: e.target.value }))}
                  className="field field-icon"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={notif.notify_admin_on_message} onChange={(e) => setNotif((p) => ({ ...p, notify_admin_on_message: e.target.checked }))} />
                Email me when someone sends a new message
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={notif.notify_user_on_reply} onChange={(e) => setNotif((p) => ({ ...p, notify_user_on_reply: e.target.checked }))} />
                Email the user when I reply to their chat
              </label>
              <button onClick={saveNotifications} className="btn btn-primary text-sm px-4 py-2">
                {notifSaved ? <><Check className="w-4 h-4" /> Saved</> : "Save"}
              </button>
            </div>
          </div>
        )}

        {tab === "profile" && (
          <div className="space-y-4 max-w-2xl">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Two identities shown on Home — visitors flip between them like a coin. Upload a photo for each; it goes straight to Supabase Storage.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {(["online", "real"] as const).map((side) => {
                const identity = profile[side];
                const uploading = side === "online" ? uploadingOnline : uploadingReal;
                const fileRef = side === "online" ? onlineFileRef : realFileRef;
                return (
                  <div key={side} className="surface-elevated p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-full overflow-hidden shrink-0" style={{ background: "var(--surface-2)" }}>
                        {identity.avatar_url ? (
                          <img src={identity.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UserCircle2 className="w-8 h-8" style={{ color: "var(--muted)" }} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                          {side === "online" ? "Online persona" : "Real persona"}
                        </div>
                        <button
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                          className="btn btn-secondary text-xs px-3 py-1.5 mt-1"
                        >
                          <Upload className="w-3.5 h-3.5" /> {uploading ? "Uploading…" : "Change photo"}
                        </button>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadAvatar(side, file);
                            e.target.value = "";
                          }}
                        />
                      </div>
                    </div>
                    <input
                      placeholder="Display name"
                      value={identity.name}
                      onChange={(e) => updateIdentity(side, { name: e.target.value })}
                      className="field"
                    />
                    <input
                      placeholder="Short bio / tagline"
                      value={identity.bio}
                      onChange={(e) => updateIdentity(side, { bio: e.target.value })}
                      className="field"
                    />
                  </div>
                );
              })}
            </div>
            <button onClick={() => saveProfile(profile)} className="btn btn-primary px-4 py-2.5">
              {profileSaved ? <><Check className="w-4 h-4" /> Saved</> : "Save profile"}
            </button>
          </div>
        )}

        {tab === "chats" && (
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[70vh]">
            <div className={cn("surface overflow-y-auto", selectedChatId ? "hidden md:block" : "")}>
              {conversations.length === 0 && <p className="text-sm p-4" style={{ color: "var(--muted)" }}>No conversations yet.</p>}
              {conversations.map((c) => (
                <button
                  key={c.user.id}
                  onClick={() => openConversation(c.user.id)}
                  className="w-full text-left p-3 flex items-start gap-2 transition-colors"
                  style={{ background: selectedChatId === c.user.id ? "color-mix(in srgb, var(--ink) 6%, transparent)" : undefined, borderBottom: "1px solid var(--hairline)" }}
                >
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold uppercase" style={{ background: "var(--surface-2)" }}>
                    {c.user.generated_user_id.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{c.user.generated_user_id}</div>
                    <div className="text-xs truncate" style={{ color: "var(--muted)" }}>{c.lastMessage.content}</div>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--danger)", color: "#fff" }}>
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className={cn("surface flex flex-col", selectedChatId ? "" : "hidden md:flex")}>
              {!selectedConvo ? (
                <p className="text-sm p-4 m-auto" style={{ color: "var(--muted)" }}>Select a conversation.</p>
              ) : (
                <>
                  <div className="p-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--hairline)" }}>
                    <button onClick={() => setSelectedChatId(null)} className="md:hidden icon-btn" style={{ width: 30, height: 30 }}>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="font-semibold text-sm">{selectedConvo.user.generated_user_id}</div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {selectedConvo.messages.map((m) => {
                      const fromUser = m.sender_type === "user";
                      const fromAdmin = m.sender_type === "admin";
                      return (
                        <div key={m.id} className={cn("flex", fromAdmin ? "justify-end" : "justify-start")}>
                          <div
                            className="max-w-[75%] px-3 py-2 text-sm rounded-2xl"
                            style={
                              fromAdmin
                                ? { background: "var(--accent)", color: "#fff" }
                                : { background: "color-mix(in srgb, var(--ink) 6%, transparent)" }
                            }
                          >
                            {!fromAdmin && !fromUser && (
                              <div className="text-[10px] uppercase tracking-wide mb-0.5 opacity-60">AI</div>
                            )}
                            {m.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-3 flex gap-2" style={{ borderTop: "1px solid var(--hairline)" }}>
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendReply()}
                      placeholder="Reply…"
                      className="field flex-1"
                    />
                    <button onClick={sendReply} disabled={!replyText.trim() || replySending} className="btn btn-primary w-11 h-11 shrink-0">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === "socials" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="surface-elevated p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-base text-[var(--ink)]">
                  <Share2 className="w-5 h-5 text-[var(--accent)]" /> Social Links & Themed App Logos
                </h3>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--hairline)]">
                  {assets.filter(isConfiguredHomeSocial).length} active on Home
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Enter your profile links below. Only links configured here and marked as <strong>On Home</strong> appear on your homepage social bar.
                Socials render directly as authentic <strong>app themed logos</strong> with vector glyphs and brand styles (no badges).
              </p>
            </div>

            {/* Standard Social Links Form */}
            <div className="surface-elevated p-5 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--hairline)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Standard Social Platforms
                </span>
                <span className="text-xs text-[var(--muted)]">
                  Link & Visibility
                </span>
              </div>

              <div className="space-y-3">
                {STANDARD_SOCIAL_CONFIGS.map((cfg) => {
                  const asset = assets.find((a) => a.id === cfg.id);
                  const currentUrl = (asset?.url && !DUMMY_SEED_URLS.has(asset.url.trim())) ? asset.url : "";
                  const isConfigured = Boolean(currentUrl.trim());
                  const isShown = isConfigured && (asset ? asset.show_on_home !== false : false);

                  return (
                    <div
                      key={cfg.id}
                      className={cn(
                        "surface p-3 sm:p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-3 transition-all",
                        isShown
                          ? "border-[var(--hairline)] hover:border-[var(--accent)]/40"
                          : "border-[var(--hairline)]/50 opacity-90"
                      )}
                    >
                      {/* App Themed Logo & Name */}
                      <div className="flex items-center gap-3 sm:w-48 shrink-0">
                        <SocialAppLogo platform={cfg.platform} size="sm" />
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-[var(--ink)] truncate">{cfg.name}</div>
                          <div className="text-[11px] text-[var(--muted)]">
                            {isConfigured ? (isShown ? "Shown on Home" : "Hidden from Home") : "Not set"}
                          </div>
                        </div>
                      </div>

                      {/* URL Input Field */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={currentUrl}
                          onChange={(e) => updateSocialUrl(cfg.id, e.target.value)}
                          placeholder={cfg.placeholder}
                          className="field w-full text-xs font-mono py-2"
                        />
                      </div>

                      {/* Visibility Toggle Button */}
                      <div className="flex items-center justify-end shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleSocialVisibility(cfg.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border",
                            !isConfigured
                              ? "bg-[var(--surface-2)] text-[var(--muted)] border-[var(--hairline)] hover:text-[var(--ink)] cursor-pointer"
                              : isShown
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25"
                              : "bg-[var(--surface-2)] text-[var(--muted)] border-[var(--hairline)] hover:text-[var(--ink)]"
                          )}
                          title={
                            !isConfigured
                              ? "Enter a URL first to enable on Home"
                              : isShown
                              ? "Currently shown on Home. Click to hide."
                              : "Currently hidden. Click to show on Home."
                          }
                        >
                          {isShown ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-500" />
                              <span>On Home</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>{isConfigured ? "Hidden" : "Not Set"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Other Sites / Custom Links Section (Where user gives logo) */}
            <div className="surface-elevated p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--hairline)]">
                <div>
                  <h4 className="font-semibold text-sm text-[var(--ink)] flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[var(--accent)]" /> Other Sites & Custom Links
                  </h4>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Add any other site where you provide your own custom logo (e.g. Substack, Twitch, Behance, Portfolio).
                  </p>
                </div>
              </div>

              {/* Add Other Site Form */}
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)] space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Add New Site with Logo
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[var(--muted)]">Site Name</label>
                    <input
                      placeholder="e.g. My Blog, Substack, Twitch"
                      value={newOtherSite.title}
                      onChange={(e) => setNewOtherSite((p) => ({ ...p, title: e.target.value }))}
                      className="field"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[var(--muted)]">Site URL</label>
                    <input
                      placeholder="https://example.com"
                      value={newOtherSite.url}
                      onChange={(e) => setNewOtherSite((p) => ({ ...p, url: e.target.value }))}
                      className="field"
                    />
                  </div>
                </div>

                {/* Logo section */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--muted)]">Site Logo (Image URL or Upload)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      placeholder="Logo URL (e.g. https://.../logo.png or SVG)"
                      value={newOtherSite.image_url}
                      onChange={(e) => setNewOtherSite((p) => ({ ...p, image_url: e.target.value }))}
                      className="field flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => otherLogoFileRef.current?.click()}
                      disabled={uploadingOtherLogo}
                      className="btn btn-secondary px-3 py-2.5 shrink-0"
                      title="Upload logo file from computer"
                    >
                      <Upload className="w-4 h-4" /> {uploadingOtherLogo ? "…" : "Upload Logo"}
                    </button>
                    <input
                      ref={otherLogoFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadOtherLogoImage(file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>

                {/* Preview & Submit */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <SocialAppLogo
                      customLogoUrl={newOtherSite.image_url}
                      title={newOtherSite.title || "Custom Site"}
                      url={newOtherSite.url}
                      size="sm"
                    />
                    <div className="text-xs text-[var(--muted)]">
                      {newOtherSite.image_url ? "Custom logo preview" : "Default web glyph preview"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setNewOtherSite((p) => ({ ...p, show_on_home: !p.show_on_home }))}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all",
                        newOtherSite.show_on_home
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                          : "bg-[var(--surface)] text-[var(--muted)] border-[var(--hairline)]"
                      )}
                    >
                      {newOtherSite.show_on_home ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{newOtherSite.show_on_home ? "On Home" : "Hidden"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={addOtherSite}
                      disabled={!newOtherSite.title.trim() || !newOtherSite.url.trim()}
                      className="btn btn-primary px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Site
                    </button>
                  </div>
                </div>
              </div>

              {/* List of Custom / Other Sites */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] pt-1">
                  Added Other Sites ({assets.filter((a) => a.type === "connection" && !STANDARD_SOCIAL_CONFIGS.some((cfg) => cfg.id === a.id)).length})
                </div>

                {assets.filter((a) => a.type === "connection" && !STANDARD_SOCIAL_CONFIGS.some((cfg) => cfg.id === a.id)).length === 0 ? (
                  <div className="surface p-5 text-center text-xs text-[var(--muted)]">
                    No custom other sites added yet. Add your personal blogs, projects, or other platforms above.
                  </div>
                ) : (
                  assets
                    .filter((a) => a.type === "connection" && !STANDARD_SOCIAL_CONFIGS.some((cfg) => cfg.id === a.id))
                    .map((site) => {
                      const isShown = site.show_on_home !== false;
                      const isDeleting = deletingAssetId === site.id;

                      return (
                        <div
                          key={site.id}
                          className={cn(
                            "surface p-3 rounded-xl border border-[var(--hairline)] flex items-center justify-between gap-3 transition-all",
                            isDeleting && "opacity-40 pointer-events-none scale-98"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <SocialAppLogo
                              customLogoUrl={site.image_url}
                              title={site.title}
                              url={site.url}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-xs text-[var(--ink)] truncate">{site.title}</div>
                              <div className="text-[11px] text-[var(--accent)] truncate">{site.url}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleShowOnHome(site)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border",
                                isShown
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                                  : "bg-[var(--surface-2)] text-[var(--muted)] border-[var(--hairline)]"
                              )}
                            >
                              {isShown ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5" />}
                              <span>{isShown ? "On Home" : "Hidden"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteAsset(site.id, site.title)}
                              disabled={isDeleting}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Delete site"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "assets" && (
          <div className="space-y-4">
            {/* Socials Manager Banner */}
            <div className="surface p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-[var(--accent)]/30 bg-[var(--accent)]/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-[var(--accent)] shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-[var(--ink)]">Manage Socials & App Themed Logos</div>
                  <div className="text-xs text-[var(--muted)]">Configure links and homepage visibility for Twitter, WhatsApp, Reddit, Telegram, Instagram, & custom sites.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sfxClick();
                  setTab("socials");
                }}
                className="btn btn-primary px-3.5 py-1.5 text-xs font-semibold shrink-0 flex items-center gap-1.5"
              >
                <span>Open Socials Manager</span>
                <span>→</span>
              </button>
            </div>

            <div className="surface-elevated p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-sm text-[var(--ink)]">
                  <Plus className="w-4 h-4 text-[var(--accent)]" /> Add Content or Connection DP
                </h3>
                <span className="text-xs text-[var(--muted)]">{assets.length} total items</span>
              </div>

              {/* Asset Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--muted)]">Content Category</label>
                <select
                  value={newAsset.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setNewAsset((p) => ({
                      ...p,
                      type: newType,
                      show_on_home: newType === "connection" ? true : p.show_on_home,
                    }));
                  }}
                  className="field font-medium"
                >
                  <option value="connection">Connection Link / Social (Homepage DP with Themed Logo)</option>
                  <option value="photo">Photo (Gallery)</option>
                  <option value="app">App (Portfolio Projects)</option>
                  <option value="game">Game (Loved Games)</option>
                  <option value="link">Interest (Studies & Hobbies)</option>
                </select>
              </div>

              {/* Themed Platform Presets for Connections */}
              {newAsset.type === "connection" && (
                <div className="space-y-2 p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" /> Choose Themed Site Preset:
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">Auto-fills theme & prefix</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ALL_PLATFORMS.map((p) => {
                      const isSelected = newAsset.platform === p.id;
                      const { Icon } = p;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            sfxClick();
                            setNewAsset((prev) => ({
                              ...prev,
                              platform: p.id,
                              title: prev.title && prev.title !== PLATFORM_THEMES[prev.platform]?.name ? prev.title : p.name,
                              url: prev.url && !prev.url.startsWith("http") ? prev.url : p.exampleUrl,
                            }));
                          }}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border",
                            isSelected
                              ? "text-white shadow-md scale-102 border-transparent font-semibold"
                              : "bg-[var(--surface)] text-[var(--ink)] border-[var(--hairline)] hover:border-[var(--accent)]/50"
                          )}
                          style={{
                            background: isSelected ? p.gradient : undefined,
                          }}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--muted)]">Title / Username</label>
                  <input
                    placeholder="e.g. GitHub, WhatsApp, Vansh Kumar"
                    value={newAsset.title}
                    onChange={(e) => setNewAsset((p) => ({ ...p, title: e.target.value }))}
                    className="field"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--muted)]">URL / Link Target</label>
                  <input
                    placeholder="https://x.com/username or https://wa.me/..."
                    value={newAsset.url}
                    onChange={(e) => setNewAsset((p) => ({ ...p, url: e.target.value }))}
                    className="field"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--muted)]">Description (optional)</label>
                <input
                  placeholder="Short note or account handle"
                  value={newAsset.description}
                  onChange={(e) => setNewAsset((p) => ({ ...p, description: e.target.value }))}
                  className="field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--muted)]">
                  {newAsset.type === "connection" ? "Photo URL (User Avatar / DP)" : "Image / Thumbnail URL"}
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    placeholder={
                      newAsset.type === "connection"
                        ? "Avatar URL (e.g. https://github.com/user.png) — leave empty for themed logo avatar"
                        : "Image URL"
                    }
                    value={newAsset.image_url}
                    onChange={(e) => setNewAsset((p) => ({ ...p, image_url: e.target.value }))}
                    className="field flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => assetFileRef.current?.click()}
                    disabled={uploadingAsset}
                    className="btn btn-secondary px-3 py-2.5 shrink-0"
                    title="Upload image file"
                  >
                    <Upload className="w-4 h-4" /> {uploadingAsset ? "…" : "Upload"}
                  </button>
                  <input
                    ref={assetFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadAssetImage(file);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>

              {/* Show on Homepage Toggle Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--hairline)]">
                <div>
                  <div className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-500" /> Show on Homepage
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">
                    Display this item in the public homepage social/connection links bar.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sfxClick();
                    setNewAsset((p) => ({ ...p, show_on_home: !p.show_on_home }));
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 border",
                    newAsset.show_on_home
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-[var(--surface)] text-[var(--muted)] border-[var(--hairline)]"
                  )}
                >
                  {newAsset.show_on_home ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Visible</span>
                    </>
                  ) : (
                    <span>Hidden</span>
                  )}
                </button>
              </div>

              {/* Live Advanced PFP Preview */}
              {newAsset.type === "connection" && (
                <div className="p-3.5 rounded-xl border border-[var(--hairline)] bg-[var(--surface)] flex items-center gap-4">
                  <AdvancedPfp
                    src={newAsset.image_url}
                    title={newAsset.title || "Preview"}
                    url={newAsset.url}
                    platform={newAsset.platform}
                    size="lg"
                    showBadge={true}
                    showGlow={true}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[var(--ink)]">Live PFP Preview</div>
                    <div className="text-xs text-[var(--muted)]">
                      {newAsset.title || "Themed Site Link"} ({PLATFORM_THEMES[newAsset.platform]?.name})
                    </div>
                    <div className="text-[10px] text-[var(--accent)] mt-0.5">
                      Includes platform badge overlay + neon halo aura
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={addAsset}
                  disabled={!newAsset.title.trim()}
                  className="btn btn-primary px-5 py-2.5 text-xs font-semibold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[var(--surface-2)] rounded-xl border border-[var(--hairline)]">
              {[
                { id: "all", label: "All Items" },
                { id: "on_home", label: "On Home" },
                { id: "connection", label: "Connections (DP)" },
                { id: "photo", label: "Photos" },
                { id: "app", label: "Apps" },
                { id: "game", label: "Games" },
                { id: "link", label: "Interests" },
              ].map((f) => {
                let count = 0;
                if (f.id === "all") count = assets.length;
                else if (f.id === "on_home") count = assets.filter((a) => a.show_on_home !== false).length;
                else count = assets.filter((a) => a.type === f.id).length;

                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      sfxClick();
                      setAssetFilter(f.id);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                      assetFilter === f.id
                        ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm font-semibold"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    )}
                  >
                    <span>{f.label}</span>
                    <span className="text-[10px] opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Items list */}
            {assets.filter((a) => {
              if (assetFilter === "all") return true;
              if (assetFilter === "on_home") return a.show_on_home !== false;
              return a.type === assetFilter;
            }).length === 0 ? (
              <div className="surface p-8 text-center text-sm text-[var(--muted)]">
                No items found under this filter.
              </div>
            ) : (
              assets
                .filter((a) => {
                  if (assetFilter === "all") return true;
                  if (assetFilter === "on_home") return a.show_on_home !== false;
                  return a.type === assetFilter;
                })
                .map((a) => {
                  const isConn = a.type === "connection";
                  const isDeleting = deletingAssetId === a.id;
                  const theme = detectPlatform(a.url || "", a.title, a.platform);
                  const isShownOnHome = a.show_on_home !== false;

                  return (
                    <div
                      key={a.id}
                      className={cn(
                        "surface p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 transition-all",
                        isDeleting && "opacity-40 pointer-events-none scale-98"
                      )}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Advanced PFP or Asset Thumbnail Preview */}
                        {isConn ? (
                          <AdvancedPfp
                            src={a.image_url}
                            title={a.title}
                            url={a.url}
                            platform={a.platform}
                            size="md"
                            showBadge={true}
                            showGlow={false}
                          />
                        ) : a.image_url ? (
                          <img
                            src={a.image_url}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[var(--hairline)]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[var(--surface-2)] border border-[var(--hairline)] flex items-center justify-center shrink-0">
                            <ImageIcon className="w-5 h-5 text-[var(--muted)]" />
                          </div>
                        )}

                        {/* Content details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-[var(--ink)] truncate">{a.title}</span>

                            {/* Themed Platform or Category Badge */}
                            {isConn ? (
                              <span
                                className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full text-white flex items-center gap-1 shadow-xs"
                                style={{ background: theme.gradient }}
                              >
                                <theme.Icon className="w-2.5 h-2.5" />
                                <span>{theme.name}</span>
                              </span>
                            ) : (
                              <span
                                className={cn(
                                  "text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full",
                                  a.type === "app"
                                    ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                                    : a.type === "photo"
                                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                    : a.type === "game"
                                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                    : "bg-[var(--surface-2)] text-[var(--muted)] border border-[var(--hairline)]"
                                )}
                              >
                                {a.type}
                              </span>
                            )}
                          </div>

                          {a.description && (
                            <div className="text-xs text-[var(--muted)] truncate mt-0.5">{a.description}</div>
                          )}
                          {a.url && (
                            <div className="text-[11px] text-[var(--accent)] truncate mt-0.5 flex items-center gap-1">
                              <span className="truncate">{a.url}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Controls: Show on Home Toggle + Permanent Delete */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Toggle Show on Home Button */}
                        <button
                          type="button"
                          onClick={() => toggleShowOnHome(a)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border",
                            isShownOnHome
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25"
                              : "bg-[var(--surface-2)] text-[var(--muted)] border-[var(--hairline)] hover:text-[var(--ink)]"
                          )}
                          title={isShownOnHome ? "Click to hide from Homepage" : "Click to show on Homepage"}
                        >
                          {isShownOnHome ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-500" />
                              <span>On Home</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => deleteAsset(a.id, a.title)}
                          disabled={isDeleting}
                          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors shrink-0 flex items-center gap-1 text-xs font-semibold border border-transparent hover:border-red-500/20"
                          title={`Permanently delete "${a.title}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isDeleting ? "…" : "Delete"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}

        {tab === "projects" && (
          <div className="space-y-4">
            <Projects isAdmin={true} />
          </div>
        )}

        {tab === "shortlinks" && (
          <div className="space-y-4">
            <Shortener isAdmin={true} />
          </div>
        )}

        {tab === "playlist" && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--muted)" }}>Search and tap to add — pulls title, artist, artwork, and a 30s preview clip automatically.</p>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
              <input
                placeholder="Search songs or artists"
                value={musicQuery}
                onChange={(e) => runMusicSearch(e.target.value)}
                className="field field-icon"
              />
            </div>
            {musicSearching && <p className="text-sm" style={{ color: "var(--muted)" }}>Searching…</p>}
            {musicResults.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {musicResults.map((t) => {
                  const already = playlist.some((p) => p.audio_url === t.previewUrl);
                  const art = upsizeArtwork(t.artworkUrl100, 200);
                  return (
                    <button
                      key={t.trackId}
                      onClick={() => addTrackFromSearch(t)}
                      disabled={already}
                      className={cn("text-left surface p-2 flex gap-2 items-center", already && "opacity-40")}
                    >
                      <div className="w-10 h-10 shrink-0 overflow-hidden rounded-lg" style={{ background: "var(--surface-2)" }}>
                        {art && <img src={art} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">{t.trackName}</div>
                        <div className="text-[10px] truncate" style={{ color: "var(--muted)" }}>{t.artistName}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: already ? "var(--muted)" : "var(--accent)" }}>
                          {already ? "Already added" : "Tap to add"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-2 space-y-2">
              <h3 className="font-semibold text-sm" style={{ color: "var(--muted)" }}>Playlist ({playlist.length})</h3>
              {playlist.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>No tracks yet — search above.</p>}
              {playlist.map((t) => (
                <div key={t.id} className="surface p-3 flex items-center gap-3">
                  {t.artwork_url && <img src={t.artwork_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1"><div className="font-semibold text-sm">{t.title}</div><div className="text-xs" style={{ color: "var(--muted)" }}>{t.artist}</div></div>
                  <button onClick={() => deleteTrack(t.id)} className="icon-btn" style={{ width: 32, height: 32 }}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "movies" && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--muted)" }}>Search TMDB and add movies to the Favourites tab on the public Movies page.</p>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
              <input
                placeholder="Search movies on TMDB"
                value={movieQuery}
                onChange={(e) => runMovieSearch(e.target.value)}
                className="field field-icon"
              />
            </div>
            {movieSearching && <p className="text-sm" style={{ color: "var(--muted)" }}>Searching…</p>}
            {movieResults.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {movieResults.map((m) => {
                  const already = favMovies.some((f) => f.tmdb_id === m.id);
                  const poster = posterUrl(m.poster_path, "w342");
                  return (
                    <button
                      key={m.id}
                      onClick={() => addFavoriteMovie(m)}
                      disabled={already}
                      className={cn("text-left surface p-2 flex gap-2 items-start", already && "opacity-40")}
                    >
                      <div className="w-10 h-14 shrink-0 overflow-hidden rounded-lg" style={{ background: "var(--surface-2)" }}>
                        {poster && <img src={poster} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">{m.title}</div>
                        <div className="text-[10px]" style={{ color: "var(--muted)" }}>{m.release_date?.slice(0, 4) || "TBA"}</div>
                        <div className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: "var(--muted)" }}>
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {m.vote_average?.toFixed(1) ?? "—"}
                        </div>
                        <div className="text-[10px] mt-1" style={{ color: already ? "var(--muted)" : "var(--accent)" }}>
                          {already ? "Already added" : "Tap to add"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-2 space-y-2">
              <h3 className="font-semibold text-sm" style={{ color: "var(--muted)" }}>Favourites ({favMovies.length})</h3>
              {favMovies.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>No favourites yet — search above to add some.</p>}
              {favMovies.map((f) => (
                <div key={f.id} className="surface p-3 flex items-center gap-3">
                  <div className="w-8 h-11 shrink-0 overflow-hidden rounded-lg" style={{ background: "var(--surface-2)" }}>
                    {posterUrl(f.poster_path, "w342") && (
                      <img src={posterUrl(f.poster_path, "w342")!} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1"><div className="font-semibold text-sm">{f.title}</div><div className="text-xs" style={{ color: "var(--muted)" }}>{f.release_date?.slice(0, 4)}</div></div>
                  <button onClick={() => deleteFavMovie(f.id)} className="icon-btn" style={{ width: 32, height: 32 }}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "bollywood" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold">Bollywood Word Game Database</h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Live pool of Bollywood movies used for solo play and multiplayer rooms. Stored in Supabase <code className="font-mono text-xs">bollywood_movies</code>.
              </p>
            </div>

            {/* Add movie form */}
            <form onSubmit={addBollywoodMovie} className="surface-elevated p-4 sm:p-5 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add Movie to Game Pool
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Movie Title *</label>
                  <input
                    placeholder="e.g. 3 Idiots"
                    value={newBollywood.title}
                    onChange={(e) => setNewBollywood({ ...newBollywood, title: e.target.value })}
                    className="field mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Year</label>
                  <input
                    placeholder="e.g. 2009"
                    value={newBollywood.year}
                    onChange={(e) => setNewBollywood({ ...newBollywood, year: e.target.value })}
                    className="field mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Lead Actor</label>
                  <input
                    placeholder="e.g. Aamir Khan"
                    value={newBollywood.lead_actor}
                    onChange={(e) => setNewBollywood({ ...newBollywood, lead_actor: e.target.value })}
                    className="field mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Director</label>
                  <input
                    placeholder="e.g. Rajkumar Hirani"
                    value={newBollywood.director}
                    onChange={(e) => setNewBollywood({ ...newBollywood, director: e.target.value })}
                    className="field mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Genres (comma separated)</label>
                  <input
                    placeholder="Comedy, Drama"
                    value={newBollywood.genres}
                    onChange={(e) => setNewBollywood({ ...newBollywood, genres: e.target.value })}
                    className="field mt-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Plot Hint / Overview</label>
                  <textarea
                    placeholder="Two friends embark on a quest for a lost buddy..."
                    value={newBollywood.overview}
                    onChange={(e) => setNewBollywood({ ...newBollywood, overview: e.target.value })}
                    className="field mt-1 resize-none"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button type="submit" className="btn btn-primary text-xs px-4 py-2">
                  <Plus className="w-3.5 h-3.5" /> Add Movie
                </button>
              </div>
            </form>

            {/* List */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm" style={{ color: "var(--muted)" }}>
                Movies in Database ({bollywoodList.length})
              </h3>
              {bollywoodList.length === 0 && (
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  No Bollywood movies in DB yet.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {bollywoodList.map((bm) => (
                  <div key={bm.id} className="surface p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{bm.title} <span className="font-normal text-xs" style={{ color: "var(--muted)" }}>({bm.year})</span></div>
                      {bm.lead_actor && <div className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>Actor: {bm.lead_actor}</div>}
                      {bm.director && <div className="text-xs truncate" style={{ color: "var(--muted)" }}>Dir: {bm.director}</div>}
                      {bm.overview && <div className="text-[11px] line-clamp-1 mt-1 opacity-80">{bm.overview}</div>}
                    </div>
                    <button
                      onClick={() => deleteBollywoodMovie(bm.id)}
                      className="icon-btn shrink-0 text-red-500 hover:text-red-600"
                      style={{ width: 32, height: 32 }}
                      title="Delete movie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Feedback Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[var(--ink)] text-[var(--bg)] text-xs font-semibold shadow-2xl border border-[var(--hairline)] transition-all animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
