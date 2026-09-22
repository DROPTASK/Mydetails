import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, Copy, Check, Send, Loader2, Trophy, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase, type GameRoom } from "../../lib/supabase";
import { getMovieHintData, getBollywoodMovies, type MovieHintData } from "../../lib/tmdb";
import {
  buildWordState,
  guessLetter,
  hintAvailable,
  markHintUsed,
  toOpponentSnapshot,
  type WordState,
  type OpponentSnapshot,
} from "../../lib/bollywoodGame";
import { WordBoard } from "../../components/games/WordBoard";
import { Keyboard } from "../../components/games/Keyboard";
import { HintPicker } from "../../components/games/HintPicker";
import { sfxCoin, sfxPop, sfxSend, sfxSuccess, sfxError, sfxClick } from "../../lib/sound";
import type { RealtimeChannel } from "@supabase/supabase-js";

type ChatMsg = { nickname: string; text: string; ts: number };
type PeerInfo = { nickname: string; snapshot: OpponentSnapshot | null; score?: number };

interface WinnerBroadcast {
  winner: string;
  movieTitle: string;
  scores: Record<string, number>;
}

interface NextRoundBroadcast {
  round: number;
  movie_id: number;
  movie_title: string;
  poster_path: string | null;
  release_date?: string;
  scores: Record<string, number>;
}

export function BollywoodRoom() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<GameRoom | null | "not_found">(null);
  const [nickname, setNickname] = useState(() => localStorage.getItem("bw_nickname") || "");
  const [joined, setJoined] = useState(false);
  const [currentMovie, setCurrentMovie] = useState<{ id: number; title: string; poster_path: string | null } | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [state, setState] = useState<WordState | null>(null);
  const [hintData, setHintData] = useState<MovieHintData | null>(null);
  const [peers, setPeers] = useState<Record<string, PeerInfo>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);

  // Round completion state
  const [winnerInfo, setWinnerInfo] = useState<{ winner: string; movieTitle: string; isSelf: boolean } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const selfKeyRef = useRef<string>(crypto.randomUUID());
  const countdownTimerRef = useRef<number | null>(null);
  const isAdvancingRef = useRef<boolean>(false);

  // Load Room Details
  useEffect(() => {
    if (!code) return;
    supabase
      .from("game_rooms")
      .select("*")
      .eq("room_code", code.toUpperCase())
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setRoom("not_found");
        } else {
          const rm = data as GameRoom;
          setRoom(rm);
          setCurrentMovie({
            id: rm.movie_id,
            title: rm.movie_title,
            poster_path: rm.poster_path,
          });
        }
      });
  }, [code]);

  // Advance to next movie
  const advanceToNextMovie = useCallback(async () => {
    if (isAdvancingRef.current || !channelRef.current || !room || room === "not_found") return;
    isAdvancingRef.current = true;

    try {
      const movies = await getBollywoodMovies(1 + Math.floor(Math.random() * 5));
      const pool = movies.filter((m) => m.title.toLowerCase() !== currentMovie?.title.toLowerCase());
      const nextPick = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : movies[0];

      const nextRoundPayload: NextRoundBroadcast = {
        round: roundNumber + 1,
        movie_id: nextPick.id,
        movie_title: nextPick.title,
        poster_path: nextPick.poster_path,
        release_date: nextPick.release_date,
        scores,
      };

      channelRef.current.send({
        type: "broadcast",
        event: "next_round",
        payload: nextRoundPayload,
      });

      // Also trigger locally
      handleNextRound(nextRoundPayload);
    } catch (err) {
      console.error("Failed to advance to next movie:", err);
    } finally {
      setTimeout(() => {
        isAdvancingRef.current = false;
      }, 1000);
    }
  }, [room, currentMovie, roundNumber, scores]);

  // Handle incoming next round event
  const handleNextRound = useCallback(
    (payload: NextRoundBroadcast) => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      setRoundNumber(payload.round);
      setCurrentMovie({
        id: payload.movie_id,
        title: payload.movie_title,
        poster_path: payload.poster_path,
      });
      setScores(payload.scores || {});
      setWinnerInfo(null);
      setCountdown(null);

      if (room && room !== "not_found") {
        const nextState = buildWordState(payload.movie_title, room.lives);
        setState(nextState);
        channelRef.current?.track({
          nickname: nickname.trim(),
          snapshot: toOpponentSnapshot(nextState),
          score: scores[nickname.trim()] || 0,
        });
      }

      getMovieHintData(payload.movie_id, payload.release_date || "")
        .then(setHintData)
        .catch(() => setHintData(null));
    },
    [room, nickname, scores]
  );

  // Handle round won event
  const handleRoundWon = useCallback(
    (payload: WinnerBroadcast) => {
      const isSelf = payload.winner.toLowerCase() === nickname.trim().toLowerCase();
      setWinnerInfo({
        winner: payload.winner,
        movieTitle: payload.movieTitle,
        isSelf,
      });

      setScores(payload.scores);

      if (isSelf) {
        sfxSuccess();
      } else {
        sfxError();
      }

      // Start 5-second countdown to next movie
      let left = 5;
      setCountdown(left);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      countdownTimerRef.current = window.setInterval(() => {
        left -= 1;
        setCountdown(left);
        if (left <= 0) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          // The winner or first node advances the movie
          if (isSelf) {
            advanceToNextMovie();
          }
        }
      }, 1000);
    },
    [nickname, advanceToNextMovie]
  );

  const join = () => {
    if (!room || room === "not_found" || !nickname.trim()) return;
    const trimmedNick = nickname.trim();
    localStorage.setItem("bw_nickname", trimmedNick);

    const initial = buildWordState(currentMovie?.title || room.movie_title, room.lives);
    setState(initial);
    setJoined(true);

    getMovieHintData(currentMovie?.id || room.movie_id, "")
      .then(setHintData)
      .catch(() => setHintData(null));

    const channel = supabase.channel(`bw-room-${room.room_code}`, {
      config: { presence: { key: selfKeyRef.current } },
    });
    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const raw = channel.presenceState<PeerInfo>();
      const next: Record<string, PeerInfo> = {};
      for (const key of Object.keys(raw)) {
        if (key === selfKeyRef.current) continue;
        if (raw[key]?.[0]) next[key] = raw[key][0];
      }
      setPeers(next);
    });

    channel.on("broadcast", { event: "chat" }, ({ payload }) => {
      setMessages((prev) => [...prev, payload as ChatMsg]);
      sfxPop();
    });

    channel.on("broadcast", { event: "round_won" }, ({ payload }) => {
      handleRoundWon(payload as WinnerBroadcast);
    });

    channel.on("broadcast", { event: "next_round" }, ({ payload }) => {
      handleNextRound(payload as NextRoundBroadcast);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          nickname: trimmedNick,
          snapshot: toOpponentSnapshot(initial),
          score: scores[trimmedNick] || 0,
        });
      }
    });
  };

  // Guess Handler
  const guess = (letter: string) => {
    if (!state || winnerInfo) return;
    const next = guessLetter(state, letter);
    setState(next);

    const currentNick = nickname.trim();

    if (next.status === "won") {
      sfxCoin();
      // Winner scores a point!
      const nextScores = {
        ...scores,
        [currentNick]: (scores[currentNick] || 0) + 1,
      };
      setScores(nextScores);

      const winPayload: WinnerBroadcast = {
        winner: currentNick,
        movieTitle: currentMovie?.title || state.title,
        scores: nextScores,
      };

      channelRef.current?.send({
        type: "broadcast",
        event: "round_won",
        payload: winPayload,
      });

      handleRoundWon(winPayload);
    } else if (next.status === "lost") {
      sfxPop();
    }

    channelRef.current?.track({
      nickname: currentNick,
      snapshot: toOpponentSnapshot(next),
      score: scores[currentNick] || 0,
    });
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

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      channelRef.current?.unsubscribe();
    };
  }, []);

  if (room === null) {
    return (
      <div className="grid place-items-center pt-16">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (room === "not_found") {
    return (
      <div className="max-w-sm mx-auto text-center space-y-4 pt-12">
        <div className="text-4xl">🔍</div>
        <h2 className="text-xl font-bold">Room not found</h2>
        <p className="text-sm text-[var(--muted)]">
          The code <span className="font-mono font-bold text-[var(--ink)]">{code}</span> doesn't exist or expired.
        </p>
        <button onClick={() => navigate("/games/bollywood")} className="btn btn-secondary px-5 py-2.5 mx-auto">
          <ArrowLeft className="w-4 h-4" /> Back to Bollywood Hub
        </button>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="max-w-sm mx-auto text-center space-y-5 pt-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--accent)] border border-[var(--hairline)]">
          <span>Room {room.room_code}</span>
        </div>
        <h2 className="text-2xl font-black text-[var(--ink)]">Join Multiplayer Battle</h2>
        <p className="text-sm text-[var(--muted)]">
          {room.lives} lives per player · Compete live to guess Bollywood movies first!
        </p>
        <div className="space-y-3 pt-2">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && join()}
            placeholder="Enter your nickname"
            maxLength={18}
            className="field text-center font-bold text-base"
            autoFocus
          />
          <button
            onClick={join}
            disabled={!nickname.trim()}
            className="btn btn-primary w-full py-3 text-sm font-bold shadow-md"
          >
            Enter Arena
          </button>
        </div>
      </div>
    );
  }

  if (!state || !currentMovie) return null;

  // Build ranking list
  const allPlayerNames = Array.from(
    new Set([nickname.trim(), ...Object.values(peers).map((p) => p.nickname).filter(Boolean)])
  );
  const rankedPlayers = allPlayerNames
    .map((name) => ({ name, points: scores[name] || 0 }))
    .sort((a, b) => b.points - a.points);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-2 pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sfxClick();
              navigate("/games/bollywood");
            }}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--muted)]"
            title="Exit room"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
              Round {roundNumber}
            </div>
            <div className="text-sm font-extrabold text-[var(--ink)]">
              Room {room.room_code}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="btn btn-secondary text-xs px-3 py-1.5 gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Invite link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Round Won / Lost Announcement Banner */}
      {winnerInfo && (
        <div
          className={`p-6 rounded-2xl text-center space-y-3 shadow-lg border transition-all animate-in fade-in zoom-in-95 ${
            winnerInfo.isSelf
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
          }`}
        >
          <div className="text-4xl">{winnerInfo.isSelf ? "🎉" : "❌"}</div>
          <h3 className="text-2xl font-black tracking-tight">
            {winnerInfo.isSelf ? "YOU WON THIS ROUND!" : "YOU LOST!"}
          </h3>
          <p className="text-sm font-semibold text-[var(--ink)]">
            {winnerInfo.isSelf ? (
              <span>You solved the movie first! +1 point awarded.</span>
            ) : (
              <span>
                <strong className="text-[var(--accent)]">{winnerInfo.winner}</strong> solved it first!
                Better luck on the next one.
              </span>
            )}
          </p>
          <div className="inline-block px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--hairline)] text-xs font-bold text-[var(--ink)]">
            Film: {winnerInfo.movieTitle}
          </div>

          {countdown !== null && (
            <div className="pt-2 flex flex-col items-center gap-2">
              <span className="text-xs font-mono font-bold text-[var(--accent)]">
                Next movie in {countdown}s...
              </span>
              <button
                onClick={advanceToNextMovie}
                className="btn btn-primary text-xs px-4 py-2 gap-1.5 shadow-sm"
              >
                <span>Next Movie Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Live Scoreboard */}
      <div className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--muted)] uppercase tracking-wider px-1">
          <div className="flex items-center gap-1.5 text-[var(--accent)]">
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </div>
          <span>Points</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {rankedPlayers.map((p, idx) => {
            const isMe = p.name.toLowerCase() === nickname.trim().toLowerCase();
            return (
              <div
                key={p.name}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  isMe
                    ? "bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)] font-bold"
                    : "bg-[var(--surface-2)] border-[var(--hairline)] text-[var(--ink)]"
                }`}
              >
                <span>{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "👤"}</span>
                <span>{p.name} {isMe ? "(You)" : ""}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-[var(--surface)] font-mono text-[11px] font-bold">
                  {p.points}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Your Play Board */}
      <div className="text-center space-y-4 p-5 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] shadow-xs">
        <div className="flex items-center justify-between px-2">
          <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
            Your Board
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: state.maxLives }).map((_, i) => (
              <Heart
                key={i}
                className="w-4 h-4 transition-colors"
                style={{ color: i < state.livesLeft ? "#e2795a" : "var(--surface-2)" }}
                fill={i < state.livesLeft ? "#e2795a" : "none"}
              />
            ))}
          </div>
        </div>

        <WordBoard cells={state.cells} />

        {!winnerInfo && state.status === "playing" && (
          <div className="space-y-4 pt-2">
            {(hintAvailable(state) || state.hintUsed) && (
              <HintPicker
                movieTitle={currentMovie.title}
                hintData={hintData}
                onUsed={() => setState((s) => (s ? markHintUsed(s) : s))}
              />
            )}
            <Keyboard
              guessed={state.guessed}
              correctLetters={Array.from(
                new Set<string>(
                  state.cells.filter((c) => c.status === "revealed").map((c) => c.char.toLowerCase())
                )
              )}
              onGuess={guess}
            />
          </div>
        )}

        {!winnerInfo && state.status === "lost" && (
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-sm font-semibold text-orange-600 dark:text-orange-400">
            You ran out of lives! Spectating opponents until round ends...
          </div>
        )}
      </div>

      {/* Opponent Live Spectator Boards */}
      {Object.keys(peers).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] px-1">
            Opponents Live Progress
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(peers).map(([key, p]) => (
              <div
                key={key}
                className="p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] space-y-2 text-center"
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span className="text-[var(--ink)]">{p.nickname}</span>
                  {p.snapshot && (
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: room.lives }).map((_, i) => (
                        <Heart
                          key={i}
                          className="w-3 h-3"
                          style={{
                            color:
                              p.snapshot && i < p.snapshot.livesLeft ? "#e2795a" : "var(--surface-2)",
                          }}
                          fill={p.snapshot && i < p.snapshot.livesLeft ? "#e2795a" : "none"}
                        />
                      ))}
                    </span>
                  )}
                </div>
                {p.snapshot && <WordBoard statuses={p.snapshot.statuses} self={false} />}
                {p.snapshot?.status === "won" && (
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Solved! 🎉
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live In-Room Chat */}
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Room Chat
        </h3>
        <div className="h-28 overflow-y-auto space-y-1.5 text-xs pr-1">
          {messages.length === 0 ? (
            <p className="text-[var(--muted)] italic pt-2">No messages yet. Say hello!</p>
          ) : (
            messages.map((m, i) => (
              <div key={i} className="leading-relaxed">
                <span className="font-bold text-[var(--accent)]">{m.nickname}: </span>
                <span className="text-[var(--ink)]">{m.text}</span>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="Send a message to the room…"
            className="field flex-1 text-xs"
          />
          <button
            onClick={sendChat}
            className="btn btn-primary px-3 py-2 text-xs"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
