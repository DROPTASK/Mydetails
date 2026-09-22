import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, LogOut, Lock, Mail, Sparkles, MessageSquare, Bot, UserCheck } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useChatSession } from "../hooks/useChatSession";
import { supabase, type Message } from "../lib/supabase";
import { getAIReply } from "../lib/groq";
import { sendEmail } from "../lib/email";
import { sfxSend, sfxPop, sfxClick } from "../lib/sound";
import { cn } from "../lib/utils";

const QUICK_PROMPTS = [
  "What projects are you currently working on?",
  "Tell me about AnonRoom and how it works.",
  "How are you balancing JEE prep with web development?",
  "Can we collaborate on a project?",
];

function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center py-2.5">
      <span
        className="text-[11px] font-semibold px-3 py-1 rounded-full border border-[var(--hairline)]"
        style={{ color: "var(--muted)", background: "var(--surface-2)" }}
      >
        {date}
      </span>
    </div>
  );
}

function Bubble({ message, grouped }: { message: Message; grouped: boolean }) {
  const mine = message.sender_type === "user";
  const isAi = message.sender_type === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("flex flex-col max-w-[82%] sm:max-w-[75%]", mine ? "items-end self-end" : "items-start self-start")}
    >
      {!mine && !grouped && (
        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] font-semibold text-[var(--muted)]">
          {isAi ? <Bot className="w-3.5 h-3.5 text-[var(--accent)]" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-500" />}
          <span>{isAi ? "Vansh's AI Assistant" : "Vansh Kumar"}</span>
        </div>
      )}
      <div
        className={cn(
          "px-4 py-2.5 text-[14.5px] leading-relaxed shadow-xs",
          mine
            ? "rounded-[20px] rounded-br-[4px] bg-[var(--accent)] text-white"
            : "rounded-[20px] rounded-bl-[4px] bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--hairline)]"
        )}
      >
        {message.content}
      </div>
      {!grouped && (
        <span className="text-[10px] font-medium mt-1 px-1.5" style={{ color: "var(--muted)" }}>
          {format(new Date(message.created_at), "HH:mm")}
        </span>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 px-4 py-3 rounded-[20px] rounded-bl-[4px] w-fit border border-[var(--hairline)]"
      style={{ background: "var(--surface-2)" }}
    >
      <Bot className="w-3.5 h-3.5 text-[var(--accent)] mr-1" />
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
          const incoming = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            if (incoming.sender_type !== "user") sfxPop();
            return [...prev, incoming];
          });
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

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText || input).trim();
      if (!text || !credentials || sending) return;
      if (!overrideText) setInput("");
      setSending(true);
      sfxSend();
      try {
        const { data: userMsg } = await supabase
          .from("messages")
          .insert({ sender_type: "user", content: text, chat_user_id: credentials.dbId })
          .select()
          .single();
        if (userMsg) setMessages((prev) => (prev.some((m) => m.id === userMsg.id) ? prev : [...prev, userMsg]));

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
    },
    [input, credentials, sending, messages]
  );

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-md mx-auto pt-4">
        <div className="skeleton h-10 w-44 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!credentials) {
    return (
      <div className="max-w-md mx-auto space-y-6 pt-2">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--accent)] border border-[var(--hairline)]">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Interactive Guestbook</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">
            Leave a Message
          </h1>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Chat directly with Vansh or the AI representative. Use your email and a password to preserve your chat history.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="flex gap-1 p-1 rounded-full border border-[var(--hairline)] bg-[var(--surface-2)]">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  sfxClick();
                  setMode(m);
                }}
                className={cn("pill text-xs font-bold px-4 py-1.5", mode === m && "active shadow-xs")}
              >
                {m === "login" ? "Sign In" : "New Account"}
              </button>
            ))}
          </div>
        </div>

        <motion.div layout className="surface-elevated p-6 rounded-2xl border border-[var(--hairline)] space-y-3.5 shadow-md">
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="email"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Your email address"
              className="field field-icon"
            />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              onKeyDown={(e) => e.key === "Enter" && (mode === "register" ? register(userId, password) : login(userId, password))}
              className="field field-icon"
            />
          </div>
          <button
            className="btn btn-primary w-full py-3 text-sm font-bold rounded-xl"
            onClick={() => (mode === "register" ? register(userId, password) : login(userId, password))}
          >
            {mode === "register" ? "Start Conversation" : "Open My Conversation"}
          </button>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs font-semibold text-center text-rose-500"
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
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100dvh-12rem)] md:h-[calc(100dvh-13.5rem)]">
      {/* Header with user status and signout */}
      <div className="flex items-center justify-between mb-3 shrink-0 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] border border-[var(--hairline)]">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--ink)] leading-tight">Live Chat</h1>
            <p className="text-[11px] text-[var(--muted)] truncate max-w-[200px] sm:max-w-xs">
              Logged in as {credentials.userId}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sfxClick();
            logout();
          }}
          className="icon-btn text-[var(--muted)] hover:text-rose-500 transition-colors"
          aria-label="Sign out"
          title="Sign out of chat"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 surface-elevated p-4 sm:p-5 rounded-2xl border border-[var(--hairline)] min-h-0 shadow-inner">
        {messages.length === 0 && (
          <div className="m-auto text-center space-y-4 max-w-sm py-6">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--accent)] mx-auto border border-[var(--hairline)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-[var(--ink)]">No messages yet</div>
              <p className="text-xs text-[var(--muted)] mt-1">
                Say hello or pick a quick starter prompt below:
              </p>
            </div>

            <div className="flex flex-col gap-1.5 pt-2 text-left">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    sfxClick();
                    sendMessage(prompt);
                  }}
                  className="text-xs px-3 py-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] text-[var(--ink)] border border-[var(--hairline)] transition-colors text-left"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const showDivider = !prev || !isSameDay(new Date(prev.created_at), new Date(m.created_at));
          const grouped =
            !!next &&
            next.sender_type === m.sender_type &&
            new Date(next.created_at).getTime() - new Date(m.created_at).getTime() < 60_000;
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

      {/* Message input field */}
      <div className="flex gap-2 pt-3 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          className="field flex-1 text-sm py-2.5 rounded-xl"
        />
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => sendMessage()}
          disabled={!input.trim() || sending}
          className="btn btn-primary w-11 h-11 shrink-0 rounded-xl flex items-center justify-center disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
