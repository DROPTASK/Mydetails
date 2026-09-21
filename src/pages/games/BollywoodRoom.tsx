import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Heart, Copy, Check, Send, Loader2 } from "lucide-react";
import { supabase, type GameRoom } from "../../lib/supabase";
import { getMovieHintData, type MovieHintData } from "../../lib/tmdb";
import { buildWordState, guessLetter, hintAvailable, markHintUsed, toOpponentSnapshot, type WordState, type OpponentSnapshot } from "../../lib/bollywoodGame";
import { WordBoard } from "../../components/games/WordBoard";
import { Keyboard } from "../../components/games/Keyboard";
import { HintPicker } from "../../components/games/HintPicker";
import { sfxCoin, sfxPop, sfxSend } from "../../lib/sound";
import type { RealtimeChannel } from "@supabase/supabase-js";

type ChatMsg = { nickname: string; text: string; ts: number };
type PeerInfo = { nickname: string; snapshot: OpponentSnapshot | null };

export function BollywoodRoom() {
  const { code } = useParams<{ code: string }>();
  const [room, setRoom] = useState<GameRoom | null | "not_found">(null);
  const [nickname, setNickname] = useState("");
  const [joined, setJoined] = useState(false);
  const [state, setState] = useState<WordState | null>(null);
  const [hintData, setHintData] = useState<MovieHintData | null>(null);
  const [peers, setPeers] = useState<Record<string, PeerInfo>>({});
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const selfKeyRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    if (!code) return;
    supabase
      .from("game_rooms")
      .select("*")
      .eq("room_code", code.toUpperCase())
      .maybeSingle()
      .then(({ data }) => setRoom((data as GameRoom) || "not_found"));
  }, [code]);

  const join = () => {
    if (!room || room === "not_found" || !nickname.trim()) return;
    const initial = buildWordState(room.movie_title, room.lives);
    setState(initial);
    setJoined(true);
    getMovieHintData(room.movie_id, "").then(setHintData).catch(() => setHintData(null));

    const channel = supabase.channel(`bw-room-${room.room_code}`, { config: { presence: { key: selfKeyRef.current } } });
    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const raw = channel.presenceState<PeerInfo>();
      const next: Record<string, PeerInfo> = {};
      for (const key of Object.keys(raw)) {
        if (key === selfKeyRef.current) continue; // never show yourself in the "opponents" list
        if (raw[key]?.[0]) next[key] = raw[key][0];
      }
      setPeers(next);
    });

    channel.on("broadcast", { event: "chat" }, ({ payload }) => {
      setMessages((prev) => [...prev, payload as ChatMsg]);
      sfxPop();
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ nickname: nickname.trim(), snapshot: toOpponentSnapshot(initial) });
      }
    });
  };

  useEffect(() => {
    return () => {
      channelRef.current?.unsubscribe();
    };
  }, []);

  const guess = (letter: string) => {
    if (!state) return;
    const next = guessLetter(state, letter);
    setState(next);
    if (next.status === "won") sfxCoin();
    else if (next.status === "lost") sfxPop();
    channelRef.current?.track({ nickname: nickname.trim(), snapshot: toOpponentSnapshot(next) });
  };

  const sendChat = () => {
    if (!chatInput.trim() || !channelRef.current) return;
    const msg: ChatMsg = { nickname: nickname.trim(), text: chatInput.trim(), ts: Date.now() };
    channelRef.current.send({ type: "broadcast", event: "chat", payload: msg });
    setMessages((prev) => [...prev, msg]);
    setChatInput("");
    sfxSend();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (room === null) {
    return (
      <div className="grid place-items-center pt-16">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--muted)" }} />
      </div>
    );
  }
  if (room === "not_found") {
    return <p className="text-center pt-10 text-sm" style={{ color: "var(--muted)" }}>Room not found — check the link.</p>;
  }

  if (!joined) {
    return (
      <div className="max-w-sm mx-auto text-center space-y-4 pt-8">
        <h2 className="text-xl font-bold">Join room {room.room_code}</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>{room.lives} lives · Everyone plays the same movie</p>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && join()}
          placeholder="Your name"
          className="field text-center"
          autoFocus
        />
        <button onClick={join} disabled={!nickname.trim()} className="btn btn-primary px-6 py-3 mx-auto">
          Join game
        </button>
      </div>
    );
  }

  if (!state) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">Room {room.room_code}</div>
        <button onClick={copyLink} className="btn btn-secondary text-xs px-3 py-1.5">
          {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy invite link</>}
        </button>
      </div>

      {/* Your board */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: state.maxLives }).map((_, i) => (
            <Heart key={i} className="w-4 h-4" style={{ color: i < state.livesLeft ? "#e2795a" : "var(--surface-2)" }} fill={i < state.livesLeft ? "#e2795a" : "none"} />
          ))}
        </div>
        <WordBoard cells={state.cells} />
        {state.status === "playing" ? (
          <>
            {(hintAvailable(state) || state.hintUsed) && (
              <HintPicker movieTitle={room.movie_title} hintData={hintData} onUsed={() => setState((s) => (s ? markHintUsed(s) : s))} />
            )}
            <Keyboard
              guessed={state.guessed}
              correctLetters={Array.from(new Set<string>(state.cells.filter((c) => c.status === "revealed").map((c) => c.char.toLowerCase())))}
              onGuess={guess}
            />
          </>
        ) : (
          <p className="text-lg font-bold">
            {state.status === "won" ? `🎉 ${room.movie_title}` : `😅 It was ${room.movie_title}`}
          </p>
        )}
      </div>

      {/* Opponents */}
      {Object.keys(peers).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-center" style={{ color: "var(--muted)" }}>
            Playing with you
          </h3>
          {Object.entries(peers).map(([key, p]) => (
            <div key={key} className="surface p-3 space-y-2 text-center">
              <div className="text-xs font-semibold flex items-center justify-center gap-2">
                {p.nickname}
                {p.snapshot && (
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: room.lives }).map((_, i) => (
                      <Heart key={i} className="w-3 h-3" style={{ color: p.snapshot && i < p.snapshot.livesLeft ? "#e2795a" : "var(--surface-2)" }} fill={p.snapshot && i < p.snapshot.livesLeft ? "#e2795a" : "none"} />
                    ))}
                  </span>
                )}
                {p.snapshot?.status === "won" && <span>🎉</span>}
              </div>
              {p.snapshot && <WordBoard statuses={p.snapshot.statuses} self={false} />}
            </div>
          ))}
        </div>
      )}

      {/* Chat */}
      <div className="surface p-3 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Chat</h3>
        <div className="h-32 overflow-y-auto space-y-1 text-sm">
          {messages.map((m, i) => (
            <div key={i}><span className="font-semibold">{m.nickname}: </span>{m.text}</div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="Say something…"
            className="field flex-1"
          />
          <button onClick={sendChat} className="icon-btn"><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
