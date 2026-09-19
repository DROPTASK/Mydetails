import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, LogOut, Lock, Mail } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useChatSession } from "../hooks/useChatSession";
import { supabase, type Message } from "../lib/supabase";
import { getAIReply } from "../lib/groq";
import { sendEmail } from "../lib/email";
import { cn } from "../lib/utils";

function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center py-2">
      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ color: "var(--muted)", background: "color-mix(in srgb, var(--ink) 5%, transparent)" }}>
        {date}
      </span>
    </div>
  );
}

function Bubble({ message, grouped }: { message: Message; grouped: boolean }) {
  const mine = message.sender_type === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn("flex flex-col max-w-[78%]", mine ? "items-end self-end" : "items-start self-start")}
    >
      <div
        className={cn("px-4 py-2.5 text-[15px] leading-snug", mine ? "rounded-[20px] rounded-br-[6px]" : "rounded-[20px] rounded-bl-[6px]")}
        style={
          mine
            ? { background: "var(--accent)", color: "#fff" }
            : { background: "color-mix(in srgb, var(--ink) 6%, transparent)", color: "var(--ink)" }
        }
      >
        {message.content}
      </div>
      {!grouped && (
        <span className="text-[10.5px] mt-1 px-1" style={{ color: "var(--muted)" }}>
          {format(new Date(message.created_at), "HH:mm")}
        </span>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 rounded-[20px] rounded-bl-[6px] w-fit" style={{ background: "color-mix(in srgb, var(--ink) 6%, transparent)" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--muted)", animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export function Chat() {
  const { credentials, isLoading, error, register, login, logout } = useChatSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!credentials?.dbId) return;
    supabase
      .from("messages")
      .select("*")
      .eq("chat_user_id", credentials.dbId)
      .order("created_at", { ascending: true })
      .then(({ data }) => data && setMessages(data));

    const channel = supabase
      .channel(`messages:${credentials.dbId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_user_id=eq.${credentials.dbId}` },
        (payload) => {
          setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new as Message]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [credentials?.dbId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiThinking]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !credentials || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      const { data: userMsg } = await supabase
        .from("messages")
        .insert({ sender_type: "user", content: text, chat_user_id: credentials.dbId })
        .select()
        .single();
      if (userMsg) setMessages((prev) => (prev.some((m) => m.id === userMsg.id) ? prev : [...prev, userMsg]));

      // Best-effort admin email notification — never blocks the chat flow.
      supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "notifications")
        .single()
        .then(({ data: settings }) => {
          const cfg = settings?.value as { admin_email?: string; notify_admin_on_message?: boolean } | undefined;
          if (cfg?.notify_admin_on_message && cfg.admin_email) {
            sendEmail({
              to: cfg.admin_email,
              subject: `New message from ${credentials.userId}`,
              text: `${credentials.userId} says:\n\n${text}`,
            });
          }
        }, () => {});

      let isOnline = false;
      try {
        const { data: settings } = await supabase.from("admin_settings").select("value").eq("key", "online_status").single();
        isOnline = settings?.value?.is_online === true;
      } catch {
        /* ignore */
      }

      if (!isOnline) {
        setAiThinking(true);
        const history = messages
          .filter((m) => m.sender_type === "user" || m.sender_type === "ai")
          .map((m) => ({
            role: (m.sender_type === "user" ? "user" : "assistant") as "user" | "assistant",
            content: m.content,
          }));
        const reply = await getAIReply(text, history);
        const { data: aiMsg } = await supabase
          .from("messages")
          .insert({ sender_type: "ai", content: reply, chat_user_id: credentials.dbId })
          .select()
          .single();
        if (aiMsg) setMessages((prev) => (prev.some((m) => m.id === aiMsg.id) ? prev : [...prev, aiMsg]));
        setAiThinking(false);
      }
    } catch {
      setAiThinking(false);
    } finally {
      setSending(false);
    }
  }, [input, credentials, sending, messages]);

  if (isLoading) {
    return (
      <div className="space-y-3 max-w-md">
        <div className="skeleton h-10 w-40" />
        <div className="skeleton h-32" />
      </div>
    );
  }

  if (!credentials) {
    return (
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">Chat</h1>
          <p style={{ color: "var(--muted)" }}>Sign in with your email and a password — we'll only use it to let you know when Vansh replies.</p>
        </div>

        <div className="flex gap-1 p-1 rounded-full w-fit" style={{ background: "color-mix(in srgb, var(--ink) 5%, transparent)" }}>
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn("pill", mode === m && "active")}
            >
              {m === "login" ? "Sign in" : "Create"}
            </button>
          ))}
        </div>

        <motion.div layout className="surface-elevated p-6 space-y-3">
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
            <input
              type="email"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Email"
              className="field field-icon"
            />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              onKeyDown={(e) => e.key === "Enter" && (mode === "register" ? register(userId, password) : login(userId, password))}
              className="field field-icon"
            />
          </div>
          <button
            className="btn btn-primary w-full py-3"
            onClick={() => (mode === "register" ? register(userId, password) : login(userId, password))}
          >
            {mode === "register" ? "Create conversation" : "Open conversation"}
          </button>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm"
                style={{ color: "var(--danger)" }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-11.5rem)] md:h-[calc(100dvh-13rem)]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Chat</h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{credentials.userId}</p>
        </div>
        <button onClick={logout} className="icon-btn" aria-label="Sign out">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 surface p-4 min-h-0">
        {messages.length === 0 && (
          <p className="text-sm m-auto" style={{ color: "var(--muted)" }}>
            No messages yet — say hi.
          </p>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const showDivider = !prev || !isSameDay(new Date(prev.created_at), new Date(m.created_at));
          const grouped = !!next && next.sender_type === m.sender_type && new Date(next.created_at).getTime() - new Date(m.created_at).getTime() < 60_000;
          return (
            <div key={m.id} className="flex flex-col">
              {showDivider && <DateDivider date={format(new Date(m.created_at), "EEEE, MMM d")} />}
              <Bubble message={m} grouped={grouped} />
            </div>
          );
        })}
        <AnimatePresence>
          {aiThinking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="self-start">
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 pt-3 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Message"
          className="field flex-1"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="btn btn-primary w-12 h-12 shrink-0"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
