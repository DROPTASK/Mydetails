import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, ChevronRight, ChevronLeft, Radio, AlertCircle } from "lucide-react";
import { sfxClick, sfxSend } from "../../lib/sound";

export interface StreamChatMessage {
  id?: string;
  nickname: string;
  text: string;
  ts: number;
  isSystem?: boolean;
}

interface LiveStreamChatProps {
  messages: StreamChatMessage[];
  currentNickname: string;
  onSendMessage: (text: string) => void;
  className?: string;
}

const RATE_LIMIT_MS = 1000; // 1s cooldown between messages to prevent spam

export function LiveStreamChat({
  messages,
  currentNickname,
  onSendMessage,
  className = "",
}: LiveStreamChatProps) {
  const [input, setInput] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [cooldownWarning, setCooldownWarning] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSendTimeRef = useRef<number>(0);
  const lastSentTextRef = useRef<string>("");
  const isNearBottomRef = useRef<boolean>(true);

  // Check if user is scrolled near bottom
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 60;
  };

  // Auto scroll to bottom only when near bottom or collapsed changes
  useEffect(() => {
    if (scrollRef.current && isNearBottomRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, collapsed]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = input.trim();
    if (!clean) return;

    const now = Date.now();
    // Anti-spam rate limiting
    if (now - lastSendTimeRef.current < RATE_LIMIT_MS) {
      setCooldownWarning("Slow down! Please wait a moment.");
      setTimeout(() => setCooldownWarning(null), 1500);
      return;
    }

    // Anti-spam duplicate check
    if (clean.toLowerCase() === lastSentTextRef.current.toLowerCase() && now - lastSendTimeRef.current < 4000) {
      setCooldownWarning("Duplicate message prevented.");
      setTimeout(() => setCooldownWarning(null), 1500);
      return;
    }

    lastSendTimeRef.current = now;
    lastSentTextRef.current = clean;
    setCooldownWarning(null);

    sfxSend();
    onSendMessage(clean);
    setInput("");

    // Force scroll to bottom on own message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Generate pleasant distinct username colors
  const getUserColor = (name: string) => {
    const colors = [
      "text-emerald-400 dark:text-emerald-400",
      "text-cyan-400 dark:text-cyan-400",
      "text-amber-400 dark:text-amber-400",
      "text-violet-400 dark:text-violet-400",
      "text-rose-400 dark:text-rose-400",
      "text-sky-400 dark:text-sky-400",
      "text-fuchsia-400 dark:text-fuchsia-400",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (collapsed) {
    return (
      <div className="fixed right-3 bottom-20 z-40 lg:static">
        <button
          onClick={() => {
            sfxClick();
            setCollapsed(false);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--surface)] text-[var(--ink)] border border-[var(--hairline)] shadow-lg hover:bg-[var(--surface-2)] transition-all text-xs font-bold cursor-pointer"
          title="Open Live Chat Stream"
        >
          <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Live Chat ({messages.length})</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-[460px] max-h-[75vh] rounded-3xl bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--hairline)] shadow-xl overflow-hidden transition-all ${className}`}
    >
      {/* Stream Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--surface-2)]/80 border-b border-[var(--hairline)] select-none shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-bold text-[10px] uppercase tracking-wider border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>Live Stream</span>
          </div>
          <span className="text-xs font-bold text-[var(--ink)]">Room Chat</span>
        </div>

        <button
          onClick={() => {
            sfxClick();
            setCollapsed(true);
          }}
          className="text-[var(--muted)] hover:text-[var(--ink)] p-1 rounded-md transition-colors cursor-pointer"
          title="Collapse Live Stream Chat"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Pure Text Live Stream Feed - Scrollable Body */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 p-3 overflow-y-auto overscroll-contain space-y-2 text-[13px] leading-relaxed font-sans"
        style={{ scrollbarWidth: "thin" }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[var(--muted)] py-6 space-y-1">
            <MessageSquare className="w-6 h-6 opacity-30" />
            <span>Stream chat ready. Send a message to chat live!</span>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isSelf = m.nickname.toLowerCase() === currentNickname.toLowerCase();
            if (m.isSystem) {
              return (
                <div
                  key={idx}
                  className="text-[11px] font-semibold text-[var(--accent)] italic px-2 py-1 rounded-lg bg-[var(--accent)]/5 border-l-2 border-[var(--accent)] select-none"
                >
                  ⚡ {m.text}
                </div>
              );
            }

            return (
              <div
                key={idx}
                className="group flex items-start gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 px-1.5 py-0.5 rounded-lg transition-colors"
              >
                {/* Timestamp */}
                <span className="text-[10px] font-mono text-[var(--muted)] opacity-60 shrink-0 pt-0.5 select-none">
                  {formatTime(m.ts)}
                </span>

                {/* Nickname and message body */}
                <div className="min-w-0 break-words flex-1">
                  <span
                    className={`font-black text-xs mr-1.5 font-mono ${getUserColor(
                      m.nickname
                    )} ${isSelf ? "underline decoration-dotted" : ""}`}
                  >
                    {m.nickname}:
                  </span>
                  <span className="text-[var(--ink)] font-medium text-[13px]">{m.text}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cooldown / Anti-spam Alert banner */}
      {cooldownWarning && (
        <div className="px-3 py-1 bg-amber-500/15 border-t border-amber-500/20 text-amber-500 text-[11px] font-semibold flex items-center gap-1 shrink-0 animate-in fade-in">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{cooldownWarning}</span>
        </div>
      )}

      {/* Stream Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-2.5 bg-[var(--surface-2)]/60 border-t border-[var(--hairline)] flex items-center gap-1.5 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Chat as ${currentNickname}...`}
          maxLength={140}
          className="flex-1 bg-[var(--surface)] text-[var(--ink)] placeholder-[var(--muted)] text-xs font-medium px-3 py-2 rounded-xl border border-[var(--hairline)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="btn btn-primary px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
