import { useEffect, useMemo, useState } from "react";
import {
  Lock, Image, Trash2, Plus, LogOut, Wifi, WifiOff, Music, Clapperboard,
  Search, Star, MessageSquare, Send, ArrowLeft, Mail, Bell,
} from "lucide-react";
import { supabase, type Message, type PortfolioAsset, type FavoriteMovie, type ChatUser } from "../lib/supabase";
import type { PlaylistTrack } from "../lib/musicStore";
import { searchMovies, posterUrl, type Movie } from "../lib/tmdb";
import { searchTracks, upsizeArtwork, type ItunesTrack } from "../lib/itunes";
import { sendEmail, isEmail } from "../lib/email";

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

export function Admin() {
  const [hostnameOk, setHostnameOk] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"chats" | "assets" | "playlist" | "movies" | "status">("chats");

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);

  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistTrack[]>([]);
  const [favMovies, setFavMovies] = useState<FavoriteMovie[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [notif, setNotif] = useState<NotificationSettings>({
    admin_email: "",
    notify_admin_on_message: true,
    notify_user_on_reply: true,
  });
  const [notifSaved, setNotifSaved] = useState(false);

  const [newAsset, setNewAsset] = useState({ type: "photo", title: "", url: "", image_url: "", description: "" });

  const [movieQuery, setMovieQuery] = useState("");
  const [movieResults, setMovieResults] = useState<Movie[]>([]);
  const [movieSearching, setMovieSearching] = useState(false);

  const [musicQuery, setMusicQuery] = useState("");
  const [musicResults, setMusicResults] = useState<ItunesTrack[]>([]);
  const [musicSearching, setMusicSearching] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    if (host === "administrator.vanshkumar.in" || host === "localhost" || host === "127.0.0.1") setHostnameOk(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
      setAuthed(true);
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
    const { data: assts } = await supabase.from("portfolio_assets").select("*").order("sort_order");
    if (assts) setAssets(assts);
    const { data: tracks } = await supabase.from("playlist").select("*").order("sort_order");
    if (tracks) setPlaylist(tracks as PlaylistTrack[]);
    const { data: favs } = await supabase.from("favorite_movies").select("*").order("sort_order");
    if (favs) setFavMovies(favs as FavoriteMovie[]);
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
  };

  const toggleOnline = async () => {
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

  const addAsset = async () => {
    if (!newAsset.title) return;
    const { data } = await supabase.from("portfolio_assets").insert({
      type: newAsset.type,
      title: newAsset.title,
      url: newAsset.url || null,
      image_url: newAsset.image_url || null,
      description: newAsset.description || null,
    }).select().single();
    if (data) {
      setAssets((p) => [...p, data]);
      setNewAsset({ type: "photo", title: "", url: "", image_url: "", description: "" });
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

  const deleteAsset = (id: string) => {
    supabase.from("portfolio_assets").delete().eq("id", id);
    setAssets((p) => p.filter((x) => x.id !== id));
  };
  const deleteTrack = (id: string) => {
    supabase.from("playlist").delete().eq("id", id);
    setPlaylist((p) => p.filter((x) => x.id !== id));
  };
  const deleteFavMovie = (id: string) => {
    supabase.from("favorite_movies").delete().eq("id", id);
    setFavMovies((p) => p.filter((x) => x.id !== id));
  };

  if (!hostnameOk) {
    return <div className="min-h-dvh grid place-items-center bg-black text-white"><div><h1 className="text-2xl font-black">404</h1></div></div>;
  }

  if (!authed) {
    return (
      <div className="min-h-dvh grid place-items-center bg-[#111] p-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 text-white">
          <Lock className="w-6 h-6" />
          <h1 className="text-xl font-black">Admin</h1>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoFocus
            className="w-full px-3 py-3 bg-black border-2 border-white text-white outline-none" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="w-full py-3 bg-white text-black font-bold">Unlock</button>
        </form>
      </div>
    );
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="min-h-dvh bg-[#111] text-[#f3f3f3] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-black">Admin</h1>
          <button onClick={() => setAuthed(false)} className="flex items-center gap-2 text-sm opacity-70"><LogOut className="w-4 h-4" /> Lock</button>
        </header>
        <div className="flex flex-wrap gap-2 border-b-2 border-white/20 pb-2">
          {([
            { id: "chats" as const, label: "Chats", icon: MessageSquare, badge: totalUnread },
            { id: "assets" as const, label: "Content", icon: Image },
            { id: "playlist" as const, label: "Playlist", icon: Music },
            { id: "movies" as const, label: "Movies", icon: Clapperboard },
            { id: "status" as const, label: "Status", icon: Wifi },
          ]).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-3 py-2 text-sm font-bold border-2 ${tab === t.id ? "border-white bg-white text-black" : "border-transparent text-white/60"}`}>
              <t.icon className="w-4 h-4" />{t.label}
              {!!t.badge && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "status" && (
          <div className="space-y-6 max-w-lg">
            <button onClick={toggleOnline} className="flex items-center gap-2 px-4 py-3 border-2 border-white font-bold">
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              {isOnline ? "Online — AI off" : "Offline — AI on"}
            </button>

            <div className="border-2 border-white/20 p-4 space-y-3">
              <h3 className="font-bold flex items-center gap-2"><Bell className="w-4 h-4" /> Email notifications</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Requires SMTP secrets set on the server (SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, etc — see .env.example).
                Credentials are never stored here, only on the server.
              </p>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  placeholder="Your email (gets notified on new messages)"
                  value={notif.admin_email}
                  onChange={(e) => setNotif((p) => ({ ...p, admin_email: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 bg-black border-2 border-white/40 text-white"
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
              <button onClick={saveNotifications} className="px-4 py-2 bg-white text-black font-bold text-sm">
                {notifSaved ? "Saved ✓" : "Save"}
              </button>
            </div>
          </div>
        )}

        {tab === "chats" && (
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[70vh]">
            <div className={`border-2 border-white/20 overflow-y-auto ${selectedChatId ? "hidden md:block" : ""}`}>
              {conversations.length === 0 && <p className="text-white/50 text-sm p-4">No conversations yet.</p>}
              {conversations.map((c) => (
                <button
                  key={c.user.id}
                  onClick={() => openConversation(c.user.id)}
                  className={`w-full text-left p-3 border-b border-white/10 flex items-start gap-2 ${selectedChatId === c.user.id ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  <div className="w-8 h-8 rounded-full bg-white/15 shrink-0 flex items-center justify-center text-xs font-black uppercase">
                    {c.user.generated_user_id.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold truncate">{c.user.generated_user_id}</div>
                    <div className="text-xs text-white/50 truncate">{c.lastMessage.content}</div>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className={`border-2 border-white/20 flex flex-col ${selectedChatId ? "" : "hidden md:flex"}`}>
              {!selectedConvo ? (
                <p className="text-white/50 text-sm p-4 m-auto">Select a conversation.</p>
              ) : (
                <>
                  <div className="border-b border-white/10 p-3 flex items-center gap-2">
                    <button onClick={() => setSelectedChatId(null)} className="md:hidden"><ArrowLeft className="w-4 h-4" /></button>
                    <div className="font-bold text-sm">{selectedConvo.user.generated_user_id}</div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {selectedConvo.messages.map((m) => {
                      const fromUser = m.sender_type === "user";
                      const fromAdmin = m.sender_type === "admin";
                      return (
                        <div key={m.id} className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] px-3 py-2 text-sm rounded-lg ${
                              fromAdmin ? "bg-white text-black" : fromUser ? "bg-white/10" : "bg-white/5 italic text-white/70"
                            }`}
                          >
                            {!fromAdmin && !fromUser && <div className="text-[10px] uppercase tracking-wide mb-0.5 opacity-60">AI</div>}
                            {m.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-white/10 p-3 flex gap-2">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendReply()}
                      placeholder="Reply…"
                      className="flex-1 px-3 py-2 bg-black border-2 border-white/40 text-white text-sm"
                    />
                    <button onClick={sendReply} disabled={!replyText.trim() || replySending} className="px-4 py-2 bg-white text-black font-bold disabled:opacity-40">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === "assets" && (
          <div className="space-y-4">
            <div className="border-2 border-white p-4 space-y-2">
              <h3 className="font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Add content</h3>
              <select value={newAsset.type} onChange={(e) => setNewAsset((p) => ({ ...p, type: e.target.value }))} className="w-full px-3 py-2 bg-black border-2 border-white/40">
                <option value="photo">Photo (gallery)</option>
                <option value="app">App</option>
                <option value="connection">Link / contact</option>
                <option value="link">Interest</option>
              </select>
              <input placeholder="Title" value={newAsset.title} onChange={(e) => setNewAsset((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 bg-black border-2 border-white/40" />
              <input placeholder="Description" value={newAsset.description} onChange={(e) => setNewAsset((p) => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 bg-black border-2 border-white/40" />
              <input placeholder="URL" value={newAsset.url} onChange={(e) => setNewAsset((p) => ({ ...p, url: e.target.value }))} className="w-full px-3 py-2 bg-black border-2 border-white/40" />
              <input placeholder="Image URL" value={newAsset.image_url} onChange={(e) => setNewAsset((p) => ({ ...p, image_url: e.target.value }))} className="w-full px-3 py-2 bg-black border-2 border-white/40" />
              <button onClick={addAsset} className="px-4 py-2 bg-white text-black font-bold">Add</button>
            </div>
            {assets.map((a) => (
              <div key={a.id} className="border-2 border-white/20 p-3 flex items-center gap-3">
                <div className="flex-1"><div className="font-bold">{a.title}</div><div className="text-xs text-white/50">{a.type}</div></div>
                <button onClick={() => deleteAsset(a.id)}><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}

        {tab === "playlist" && (
          <div className="space-y-4">
            <p className="text-sm text-white/60">Search and tap to add — pulls title, artist, artwork, and a 30s preview clip automatically. No manual entry needed.</p>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search songs or artists"
                value={musicQuery}
                onChange={(e) => runMusicSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-black border-2 border-white/40 text-white"
              />
            </div>
            {musicSearching && <p className="text-sm text-white/50">Searching…</p>}
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
                      className={`text-left border-2 p-2 flex gap-2 items-center ${already ? "border-white/10 opacity-40" : "border-white/20 hover:border-white"}`}
                    >
                      <div className="w-10 h-10 bg-white/10 shrink-0 overflow-hidden rounded">
                        {art && <img src={art} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{t.trackName}</div>
                        <div className="text-[10px] text-white/50 truncate">{t.artistName}</div>
                        {!already && <div className="text-[10px] text-white/70 mt-0.5">Tap to add</div>}
                        {already && <div className="text-[10px] text-white/40 mt-0.5">Already added</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-2 space-y-2">
              <h3 className="font-bold text-sm text-white/70">Playlist ({playlist.length})</h3>
              {playlist.length === 0 && <p className="text-white/50 text-sm">No tracks yet — search above.</p>}
              {playlist.map((t) => (
                <div key={t.id} className="border-2 border-white/20 p-3 flex items-center gap-3">
                  <div className="flex-1"><div className="font-bold">{t.title}</div><div className="text-xs text-white/50">{t.artist}</div></div>
                  <button onClick={() => deleteTrack(t.id)}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "movies" && (
          <div className="space-y-4">
            <p className="text-sm text-white/60">Search TMDB and add movies to the Favourites tab on the public Movies page.</p>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search movies on TMDB"
                value={movieQuery}
                onChange={(e) => runMovieSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-black border-2 border-white/40 text-white"
              />
            </div>
            {movieSearching && <p className="text-sm text-white/50">Searching…</p>}
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
                      className={`text-left border-2 p-2 flex gap-2 items-start ${already ? "border-white/10 opacity-40" : "border-white/20 hover:border-white"}`}
                    >
                      <div className="w-10 h-14 bg-white/10 shrink-0 overflow-hidden">
                        {poster && <img src={poster} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{m.title}</div>
                        <div className="text-[10px] text-white/50">{m.release_date?.slice(0, 4) || "TBA"}</div>
                        <div className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {m.vote_average?.toFixed(1) ?? "—"}
                        </div>
                        {!already && <div className="text-[10px] text-white/70 mt-1">Tap to add</div>}
                        {already && <div className="text-[10px] text-white/40 mt-1">Already added</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-2 space-y-2">
              <h3 className="font-bold text-sm text-white/70">Favourites ({favMovies.length})</h3>
              {favMovies.length === 0 && <p className="text-white/50 text-sm">No favourites yet — search above to add some.</p>}
              {favMovies.map((f) => (
                <div key={f.id} className="border-2 border-white/20 p-3 flex items-center gap-3">
                  <div className="w-8 h-11 bg-white/10 shrink-0 overflow-hidden">
                    {posterUrl(f.poster_path, "w342") && (
                      <img src={posterUrl(f.poster_path, "w342")!} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1"><div className="font-bold">{f.title}</div><div className="text-xs text-white/50">{f.release_date?.slice(0, 4)}</div></div>
                  <button onClick={() => deleteFavMovie(f.id)}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
