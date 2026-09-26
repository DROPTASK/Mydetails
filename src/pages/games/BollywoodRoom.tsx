import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Heart,
  Copy,
  Check,
  Loader2,
  Trophy,
  ArrowLeft,
  Users,
  Film,
  Sparkles,
  Crown,
  Eye,
  Skull,
  Infinity as InfinityIcon,
  RefreshCw,
} from "lucide-react";
import { supabase, type GameRoom } from "../../lib/supabase";
import {
  getCinemaMovie,
  findCinemaMovie,
  type CinemaIndustry,
  type CinemaMovie,
  getCinemaCategoryLabel,
} from "../../lib/cinemaMovies";
import {
  buildWordState,
  guessLetter,
  revealAllLetters,
  hintAvailable,
  markHintUsed,
  toOpponentSnapshot,
  type WordState,
  type OpponentSnapshot,
} from "../../lib/bollywoodGame";
import { getStoredGameUser, type GameUser } from "../../lib/userStore";
import {
  type WinnerPayload,
  type AllLostPayload,
  type NextRoundPayload,
  type RoomSyncPayload,
  type CachedRoomState,
  loadRoomFromDb,
  syncRoomStateToDb,
  getRoomLiveCache,
  setRoomLiveCache,
  isUnlimitedLives,
  UNLIMITED_LIVES,
} from "../../lib/roomRealtime";
import { WordBoard } from "../../components/games/WordBoard";
import { Keyboard } from "../../components/games/Keyboard";
import { HintPicker } from "../../components/games/HintPicker";
import { MovieResultModal } from "../../components/games/MovieResultModal";
import { PlayerBadge } from "../../components/games/PlayerBadge";
import { LiveStreamChat, type StreamChatMessage } from "../../components/games/LiveStreamChat";
import { sfxCoin, sfxPop, sfxSuccess, sfxClick } from "../../lib/sound";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface PeerPresenceState {
  nickname: string;
  userId: string;
  livesLeft: number;
  maxLives: number;
  score: number;
  status: "playing" | "spectating" | "won" | "lost";
  snapshot: OpponentSnapshot | null;
}

export function BollywoodRoom() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const cleanCode = (code || "").toUpperCase();
  const industryParam = (searchParams.get("cat") || "all") as CinemaIndustry;

  // Persistent User profile (includes unique 3-digit tag)
  const [user, setUser] = useState<GameUser>(getStoredGameUser);

  // Restore initial cached state if present
  const initialCache = useMemo(() => (cleanCode ? getRoomLiveCache(cleanCode) : null), [cleanCode]);

  const [loading, setLoading] = useState<boolean>(!initialCache);
  const [currentMovie, setCurrentMovie] = useState<CinemaMovie | null>(
    initialCache ? initialCache.movie : null
  );
  const [roundNumber, setRoundNumber] = useState<number>(initialCache ? initialCache.round : 1);
  const [scores, setScores] = useState<Record<string, number>>(initialCache ? initialCache.scores : {});
  const [winnerInfo, setWinnerInfo] = useState<WinnerPayload | null>(initialCache ? initialCache.winner : null);
  const [allLost, setAllLost] = useState<boolean>(initialCache ? initialCache.allLost : false);
  const [roomLives, setRoomLives] = useState<number>(initialCache ? initialCache.lives : 5);

  const [state, setState] = useState<WordState | null>(null);
  const [isSpectating, setIsSpectating] = useState<boolean>(false);
  const [peers, setPeers] = useState<Record<string, PeerPresenceState>>({});
  const [messages, setMessages] = useState<StreamChatMessage[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // Result popup & auto-countdown state
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const selfKeyRef = useRef<string>(crypto.randomUUID());
  const isAdvancingRef = useRef<boolean>(false);
  const advancingRoundRef = useRef<number>(initialCache ? initialCache.round : 1);
  const hasAnnouncedJoinRef = useRef<boolean>(false);

  // Fresh mutable refs for realtime callbacks
  const roundNumberRef = useRef(roundNumber);
  const currentMovieRef = useRef(currentMovie);
  const scoresRef = useRef(scores);
  const winnerInfoRef = useRef(winnerInfo);
  const allLostRef = useRef(allLost);
  const roomLivesRef = useRef(roomLives);

  useEffect(() => {
    roundNumberRef.current = roundNumber;
  }, [roundNumber]);

  useEffect(() => {
    currentMovieRef.current = currentMovie;
  }, [currentMovie]);

  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  useEffect(() => {
    winnerInfoRef.current = winnerInfo;
  }, [winnerInfo]);

  useEffect(() => {
    allLostRef.current = allLost;
  }, [allLost]);

  useEffect(() => {
    roomLivesRef.current = roomLives;
  }, [roomLives]);

  const unlimited = isUnlimitedLives(roomLives);

  // 1. Authoritative DB Sync: Load Room State on Mount / Refresh
  useEffect(() => {
    if (!cleanCode) return;

    let isMounted = true;

    async function initRoom() {
      try {
        const dbState = await loadRoomFromDb(cleanCode, industryParam);
        if (!isMounted) return;

        if (dbState && dbState.movie) {
          setCurrentMovie(dbState.movie);
          setRoundNumber(dbState.round);
          setScores(dbState.scores || {});
          setWinnerInfo(dbState.winner);
          setAllLost(dbState.allLost);
          setRoomLives(dbState.lives);

          // Build or refresh board
          const word = buildWordState(dbState.movie.title, dbState.lives);
          if (dbState.winner || dbState.allLost) {
            setState(revealAllLetters(word));
            setShowResultModal(true);
          } else {
            setState(word);
          }
        } else {
          // If room doesn't exist in DB, create initial state
          const newPick = await getCinemaMovie(industryParam);
          if (!isMounted) return;

          setCurrentMovie(newPick);
          setRoundNumber(1);
          setScores({});
          setWinnerInfo(null);
          setAllLost(false);
          setRoomLives(5);

          const word = buildWordState(newPick.title, 5);
          setState(word);

          // Sync initial room to DB
          await syncRoomStateToDb(cleanCode, {
            round: 1,
            movie: newPick,
            scores: {},
            winner: null,
            status: "playing",
            lives: 5,
          });
        }
      } catch (err) {
        console.error("Error loading room state:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initRoom();

    return () => {
      isMounted = false;
    };
  }, [cleanCode, industryParam]);

  // Handle incoming next round event
  const handleNextRound = useCallback(
    (payload: NextRoundPayload) => {
      advancingRoundRef.current = payload.round;
      setRoundNumber(payload.round);
      setCurrentMovie(payload.movie);
      setScores(payload.scores || {});
      setWinnerInfo(null);
      setAllLost(false);
      setIsSpectating(false);
      setShowResultModal(false);
      setCountdown(null);

      const lives = roomLivesRef.current;
      const nextWord = buildWordState(payload.movie.title, lives);
      setState(nextWord);

      channelRef.current?.track({
        nickname: user.displayName,
        userId: user.id,
        livesLeft: lives,
        maxLives: lives,
        score: (payload.scores || {})[user.displayName] || 0,
        status: "playing",
        snapshot: toOpponentSnapshot(nextWord),
      });

      // System chat broadcast
      setMessages((prev) => [
        ...prev,
        {
          nickname: "Game Bot",
          text: `🎬 Round ${payload.round} is live! Next movie ready for everyone.`,
          ts: Date.now(),
          isSystem: true,
        },
      ]);
    },
    [user.displayName, user.id]
  );

  // Handle Round Won event (One round, one winner rule)
  const handleRoundWon = useCallback(
    (payload: WinnerPayload) => {
      // Prevent duplicate winner declarations for the same round
      if (winnerInfoRef.current && winnerInfoRef.current.round === payload.round) {
        return;
      }

      setWinnerInfo(payload);
      setScores(payload.scores);
      setAllLost(false);
      setIsSpectating(false);

      // Reveal all letters on the board for everyone
      setState((prev) => (prev ? revealAllLetters(prev) : prev));

      const isSelf = payload.winner.toLowerCase() === user.displayName.toLowerCase();
      if (isSelf) {
        sfxSuccess();
      } else {
        sfxPop();
      }

      setShowResultModal(true);

      // System chat announcement
      setMessages((prev) => [
        ...prev,
        {
          nickname: "Game Bot",
          text: `🏆 ${payload.winner} cracked the movie "${payload.movieTitle}"!`,
          ts: Date.now(),
          isSystem: true,
        },
      ]);

      // 5-second countdown to next movie
      setCountdown(5);
    },
    [user.displayName]
  );

  // Handle All Players Lost event
  const handleAllPlayersLost = useCallback(
    (payload: AllLostPayload) => {
      if (allLostRef.current) return;
      setAllLost(true);
      setIsSpectating(false);

      setState((prev) => (prev ? revealAllLetters(prev) : prev));
      setShowResultModal(true);
      sfxPop();

      setMessages((prev) => [
        ...prev,
        {
          nickname: "Game Bot",
          text: `💀 All players ran out of lives! The movie was "${payload.movieTitle}".`,
          ts: Date.now(),
          isSystem: true,
        },
      ]);

      setCountdown(5);
    },
    []
  );

  // Authoritative advance to next movie
  const advanceToNextMovie = useCallback(async () => {
    if (isAdvancingRef.current || !channelRef.current) return;
    const targetRound = roundNumberRef.current + 1;
    if (advancingRoundRef.current >= targetRound) return;

    isAdvancingRef.current = true;
    advancingRoundRef.current = targetRound;

    try {
      // Pick next movie using TMDB API directly
      const nextPick = await getCinemaMovie(industryParam, currentMovieRef.current?.title);

      const nextRoundPayload: NextRoundPayload = {
        round: targetRound,
        movie: nextPick,
        scores: scoresRef.current,
      };

      // 1. Sync to Database first
      await syncRoomStateToDb(cleanCode, {
        round: targetRound,
        movie: nextPick,
        scores: scoresRef.current,
        winner: null,
        status: "playing",
        lives: roomLivesRef.current,
      });

      // 2. Broadcast to all peers in the room
      channelRef.current.send({
        type: "broadcast",
        event: "next_round",
        payload: nextRoundPayload,
      });

      // 3. Apply locally
      handleNextRound(nextRoundPayload);
    } catch (err) {
      console.error("Failed to advance to next movie:", err);
    } finally {
      setTimeout(() => {
        isAdvancingRef.current = false;
      }, 800);
    }
  }, [industryParam, cleanCode, handleNextRound]);

  // Auto-countdown timer
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      advanceToNextMovie();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, advanceToNextMovie]);

  // 2. Realtime Channel Subscription (Postgres Changes + Low-Latency Broadcasts)
  useEffect(() => {
    if (!cleanCode || !currentMovie) return;

    const lives = roomLivesRef.current;

    // Initialize state if not present
    if (!state) {
      const initial = buildWordState(currentMovie.title, lives);
      if (winnerInfo || allLost) {
        setState(revealAllLetters(initial));
      } else {
        setState(initial);
      }
    }

    const channel = supabase.channel(`bw-room-${cleanCode}`, {
      config: { presence: { key: selfKeyRef.current } },
    });
    channelRef.current = channel;

    // Listen to Supabase Database Postgres Changes on game_rooms table
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "game_rooms",
        filter: `room_code=eq.${cleanCode}`,
      },
      (payload) => {
        const row = payload.new as any;
        if (!row) return;

        // If DB indicates a new round
        if (row.round && row.round > roundNumberRef.current) {
          const movie = row.movie_data || findCinemaMovie(row.movie_id) || findCinemaMovie(row.movie_title);
          if (movie) {
            handleNextRound({
              round: row.round,
              movie,
              scores: row.scores || scoresRef.current,
            });
          }
        } else if (row.status === "won" && row.winner_name && !winnerInfoRef.current) {
          handleRoundWon({
            winner: row.winner_name,
            winnerId: row.winner_id || "",
            movieTitle: row.movie_title || currentMovieRef.current?.title || "",
            scores: row.scores || scoresRef.current,
            round: row.round || roundNumberRef.current,
          });
        }
      }
    );

    // Presence Sync: tracks live player roster and spectator status
    channel.on("presence", { event: "sync" }, () => {
      const raw = channel.presenceState<PeerPresenceState>();
      const next: Record<string, PeerPresenceState> = {};
      for (const key of Object.keys(raw)) {
        if (key === selfKeyRef.current) continue;
        if (raw[key]?.[0]) next[key] = raw[key][0];
      }
      setPeers(next);

      // Check if ALL players ran out of lives (only if lives are limited)
      if (!isUnlimitedLives(roomLivesRef.current)) {
        const peerArr = Object.values(next);
        if (peerArr.length > 0 && !winnerInfoRef.current && !allLostRef.current) {
          const selfLives = state?.livesLeft ?? roomLivesRef.current;
          const allPeersOut = peerArr.every((p) => (p.livesLeft ?? 0) <= 0);
          if (selfLives <= 0 && allPeersOut) {
            const payload: AllLostPayload = {
              round: roundNumberRef.current,
              movieTitle: currentMovieRef.current?.title || "",
            };
            channel.send({
              type: "broadcast",
              event: "all_lost",
              payload,
            });
            handleAllPlayersLost(payload);
          }
        }
      }
    });

    // Chat broadcast
    channel.on("broadcast", { event: "chat" }, ({ payload }) => {
      setMessages((prev) => [...prev, payload as StreamChatMessage]);
      sfxPop();
    });

    // Round Won broadcast
    channel.on("broadcast", { event: "round_won" }, ({ payload }) => {
      handleRoundWon(payload as WinnerPayload);
    });

    // All Lost broadcast
    channel.on("broadcast", { event: "all_lost" }, ({ payload }) => {
      handleAllPlayersLost(payload as AllLostPayload);
    });

    // Next Round broadcast
    channel.on("broadcast", { event: "next_round" }, ({ payload }) => {
      handleNextRound(payload as NextRoundPayload);
    });

    // Player out of lives notification
    channel.on("broadcast", { event: "player_out_of_lives" }, ({ payload }) => {
      setMessages((prev) => [
        ...prev,
        {
          nickname: "System",
          text: `💀 ${payload.nickname} ran out of lives and is now spectating live.`,
          ts: Date.now(),
          isSystem: true,
        },
      ]);
    });

    // Peer requests state sync
    channel.on("broadcast", { event: "req_sync" }, ({ payload }) => {
      if (payload?.requesterKey !== selfKeyRef.current && currentMovieRef.current) {
        channel.send({
          type: "broadcast",
          event: "sync_state",
          payload: {
            targetKey: payload.requesterKey,
            round: roundNumberRef.current,
            movie: currentMovieRef.current,
            scores: scoresRef.current,
            winner: winnerInfoRef.current,
            allLost: allLostRef.current,
            lives: roomLivesRef.current,
          } as RoomSyncPayload,
        });
      }
    });

    // State sync response
    channel.on("broadcast", { event: "sync_state" }, ({ payload }) => {
      const sync = payload as RoomSyncPayload;
      if (sync.targetKey && sync.targetKey !== selfKeyRef.current) return;

      const currR = roundNumberRef.current;
      if (sync.round > currR) {
        setRoundNumber(sync.round);
        setCurrentMovie(sync.movie);
        setScores(sync.scores || {});
        setWinnerInfo(sync.winner);
        setAllLost(sync.allLost);
        setIsSpectating(false);

        const newBoard = buildWordState(sync.movie.title, sync.lives || roomLivesRef.current);
        if (sync.winner || sync.allLost) {
          setState(revealAllLetters(newBoard));
          setShowResultModal(true);
        } else {
          setState(newBoard);
          setShowResultModal(false);
        }
      } else if (sync.round === currR) {
        if (sync.winner && !winnerInfoRef.current) {
          handleRoundWon(sync.winner);
        } else if (sync.allLost && !allLostRef.current) {
          handleAllPlayersLost({ round: currR, movieTitle: sync.movie.title });
        }
        if (Object.keys(sync.scores || {}).length > 0) {
          setScores(sync.scores);
        }
      }
    });

    // Subscribe to channel and announce presence
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        const initialSnap = state
          ? toOpponentSnapshot(state)
          : toOpponentSnapshot(buildWordState(currentMovie.title, lives));

        await channel.track({
          nickname: user.displayName,
          userId: user.id,
          livesLeft: state ? state.livesLeft : lives,
          maxLives: lives,
          score: scoresRef.current[user.displayName] || 0,
          status: isSpectating ? "spectating" : "playing",
          snapshot: initialSnap,
        });

        // Request live sync
        channel.send({
          type: "broadcast",
          event: "req_sync",
          payload: {
            requesterKey: selfKeyRef.current,
            nickname: user.displayName,
          },
        });

        // Send connection message only once
        if (!hasAnnouncedJoinRef.current) {
          hasAnnouncedJoinRef.current = true;
          setMessages((prev) => [
            ...prev,
            {
              nickname: "System",
              text: `${user.displayName} connected to room ${cleanCode}.`,
              ts: Date.now(),
              isSystem: true,
            },
          ]);
        }
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [cleanCode, currentMovie]);

  // Handle Nickname Change
  const handleUserChange = (updatedUser: GameUser) => {
    setUser(updatedUser);
    if (channelRef.current && state) {
      channelRef.current.track({
        nickname: updatedUser.displayName,
        userId: updatedUser.id,
        livesLeft: state.livesLeft,
        maxLives: state.maxLives,
        score: scores[updatedUser.displayName] || scores[user.displayName] || 0,
        status: isSpectating ? "spectating" : "playing",
        snapshot: toOpponentSnapshot(state),
      });

      const renameMsg: StreamChatMessage = {
        nickname: "System",
        text: `${user.displayName} is now known as ${updatedUser.displayName}`,
        ts: Date.now(),
        isSystem: true,
      };
      channelRef.current.send({ type: "broadcast", event: "chat", payload: renameMsg });
      setMessages((prev) => [...prev, renameMsg]);
    }
  };

  // Guess Handler: Multi-user live game logic
  const guess = async (letter: string) => {
    if (!state || winnerInfo || allLost || showResultModal || isSpectating) return;

    const next = guessLetter(state, letter);
    setState(next);

    const currentNick = user.displayName;

    if (next.status === "won") {
      // Enforce one winner per round
      if (winnerInfoRef.current !== null && winnerInfoRef.current.round === roundNumber) {
        return;
      }

      sfxCoin();
      const nextScores = {
        ...scores,
        [currentNick]: (scores[currentNick] || 0) + 1,
      };
      setScores(nextScores);

      const winPayload: WinnerPayload = {
        winner: currentNick,
        winnerId: user.id,
        movieTitle: currentMovie?.title || state.title,
        scores: nextScores,
        round: roundNumber,
      };

      // 1. Sync win to DB
      if (currentMovie) {
        await syncRoomStateToDb(cleanCode, {
          round: roundNumber,
          movie: currentMovie,
          scores: nextScores,
          winner: winPayload,
          status: "won",
          lives: roomLives,
        });
      }

      // 2. Broadcast round_won
      channelRef.current?.send({
        type: "broadcast",
        event: "round_won",
        payload: winPayload,
      });

      handleRoundWon(winPayload);

      channelRef.current?.track({
        nickname: currentNick,
        userId: user.id,
        livesLeft: next.livesLeft,
        maxLives: next.maxLives,
        score: nextScores[currentNick] || 0,
        status: "won",
        snapshot: toOpponentSnapshot(next),
      });
    } else if (next.status === "lost" && !unlimited) {
      // Player ran out of lives (only when not unlimited): Enter spectator mode
      sfxPop();
      const peerArr = Object.values(peers);

      if (peerArr.length > 0) {
        setIsSpectating(true);

        channelRef.current?.send({
          type: "broadcast",
          event: "player_out_of_lives",
          payload: {
            nickname: currentNick,
            userId: user.id,
          },
        });

        channelRef.current?.track({
          nickname: currentNick,
          userId: user.id,
          livesLeft: 0,
          maxLives: next.maxLives,
          score: scores[currentNick] || 0,
          status: "spectating",
          snapshot: toOpponentSnapshot(next),
        });

        // If everyone is now out of lives
        const allPeersOut = peerArr.every((p) => (p.livesLeft ?? 0) <= 0);
        if (allPeersOut) {
          const payload: AllLostPayload = {
            round: roundNumber,
            movieTitle: currentMovie?.title || state.title,
          };

          if (currentMovie) {
            await syncRoomStateToDb(cleanCode, {
              round: roundNumber,
              movie: currentMovie,
              scores,
              winner: null,
              status: "lost",
              lives: roomLives,
            });
          }

          channelRef.current?.send({
            type: "broadcast",
            event: "all_lost",
            payload,
          });
          handleAllPlayersLost(payload);
        }
      } else {
        // Solo in room: show defeat modal directly
        setTimeout(() => setShowResultModal(true), 300);
      }
    } else {
      // Normal ongoing guess
      channelRef.current?.track({
        nickname: currentNick,
        userId: user.id,
        livesLeft: next.livesLeft,
        maxLives: next.maxLives,
        score: scores[currentNick] || 0,
        status: "playing",
        snapshot: toOpponentSnapshot(next),
      });
    }
  };

  // Send Stream Chat Message
  const handleSendChatMessage = (text: string) => {
    if (!channelRef.current) return;
    const msg: StreamChatMessage = {
      nickname: user.displayName,
      text,
      ts: Date.now(),
    };
    channelRef.current.send({ type: "broadcast", event: "chat", payload: msg });
    setMessages((prev) => [...prev, msg]);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    sfxSuccess();
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading && !currentMovie) {
    return (
      <div className="grid place-items-center pt-24 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        <p className="text-xs font-semibold text-[var(--muted)]">Syncing game session from database...</p>
      </div>
    );
  }

  const peerList = Object.values(peers);
  const isSelfWinner = winnerInfo?.winner.toLowerCase() === user.displayName.toLowerCase();

  return (
    <div className="max-w-6xl mx-auto pt-2 pb-16 px-2 sm:px-4">
      {/* Top Navbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--hairline)] mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/games/bollywood")}
            className="icon-btn cursor-pointer"
            title="Leave Room"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[var(--muted)] uppercase tracking-wider">
                Room:
              </span>
              <span className="font-mono font-black text-sm tracking-widest px-2.5 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--hairline)]">
                {cleanCode}
              </span>
              <button
                onClick={copyLink}
                className="btn btn-secondary px-2.5 py-1 text-xs font-bold gap-1 cursor-pointer"
                title="Copy Invite Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center/Right: Category & User Profile Badge */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--accent)] border border-[var(--hairline)]">
            <Film className="w-3 h-3" />
            <span>{getCinemaCategoryLabel(industryParam)}</span>
          </span>

          <PlayerBadge user={user} onUserChange={handleUserChange} />
        </div>
      </div>

      {/* Main Grid: Game Board (8 cols) + Stream Chat (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Game Area */}
        <div className="lg:col-span-8 space-y-5">
          {/* Winner Banner */}
          {winnerInfo && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-between gap-3 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-3 min-w-0">
                <Crown className="w-5 h-5 text-emerald-500 shrink-0 animate-bounce" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-extrabold text-[var(--ink)] truncate">
                    {isSelfWinner ? (
                      <span className="text-emerald-500">🎉 You cracked the movie first! +1 pt</span>
                    ) : (
                      <span>
                        👑 <strong className="text-emerald-500 font-black">{winnerInfo.winner}</strong> guessed the movie!
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--muted)] truncate">
                    Movie: <span className="font-bold text-[var(--ink)]">{winnerInfo.movieTitle}</span>
                    {countdown !== null && countdown > 0 && (
                      <span className="ml-2 font-mono text-[var(--accent)]">
                        • Next movie in {countdown}s
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowResultModal(true)}
                  className="btn btn-secondary px-2.5 py-1 text-xs font-bold cursor-pointer"
                >
                  View Details
                </button>
                <button
                  onClick={advanceToNextMovie}
                  className="btn btn-primary px-3 py-1 text-xs font-extrabold cursor-pointer flex items-center gap-1"
                >
                  <span>Next</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Spectator Banner (WHEN ONE RUNS OUT OF LIVES HE WAITS FOR OTHERS TO PLAY LIVE) */}
          {isSpectating && !winnerInfo && !allLost && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-between gap-3 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-3 min-w-0">
                <Eye className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-extrabold text-[var(--ink)] truncate">
                    💀 Out of Lives • Spectating Live
                  </p>
                  <p className="text-xs text-[var(--muted)] truncate">
                    You ran out of lives! Waiting for other players to guess the movie...
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold font-mono shrink-0">
                Spectating
              </span>
            </div>
          )}

          {/* All Players Lost Banner */}
          {allLost && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-red-500/15 border border-red-500/35 flex items-center justify-between gap-3 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-3 min-w-0">
                <Skull className="w-5 h-5 text-red-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-extrabold text-[var(--ink)] truncate">
                    💀 All players ran out of lives!
                  </p>
                  <p className="text-xs text-[var(--muted)] truncate">
                    Movie was: <span className="font-bold text-[var(--ink)]">{currentMovie?.title}</span>
                    {countdown !== null && countdown > 0 && (
                      <span className="ml-2 font-mono text-[var(--accent)]">
                        • Next movie in {countdown}s
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={advanceToNextMovie}
                className="btn btn-primary px-3 py-1 text-xs font-extrabold cursor-pointer"
              >
                Next Movie
              </button>
            </div>
          )}

          {/* Active Game Board Card */}
          <div className="p-4 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--hairline)] shadow-sm space-y-5">
            {/* Round info & Lives */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--hairline)]">
                  Round {roundNumber}
                </span>

                <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
                  Lives:
                </span>

                {unlimited ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-black flex items-center gap-1 border border-emerald-500/20">
                    <InfinityIcon className="w-3.5 h-3.5" />
                    <span>Unlimited</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    {state &&
                      Array.from({ length: state.maxLives }).map((_, i) => (
                        <Heart
                          key={i}
                          className="w-4 h-4 transition-colors"
                          style={{
                            color: i < state.livesLeft ? "#e2795a" : "var(--surface-2)",
                          }}
                          fill={i < state.livesLeft ? "#e2795a" : "none"}
                        />
                      ))}
                  </div>
                )}
              </div>

              {/* Next Round Button */}
              <button
                onClick={advanceToNextMovie}
                className="btn btn-secondary px-3 py-1.5 text-xs font-bold cursor-pointer hover:text-[var(--accent)] flex items-center gap-1"
                title="Advance to next movie"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next Round</span>
              </button>
            </div>

            {/* Word Board */}
            {state && (
              <div className="py-2">
                <WordBoard cells={state.cells} />
              </div>
            )}

            {/* Hints & Keyboard: Enabled when actively playing */}
            {state && !winnerInfo && !allLost && !isSpectating && (
              <div className="space-y-4 pt-1">
                {(hintAvailable(state) || state.hintUsed) && currentMovie && (
                  <HintPicker
                    movieTitle={currentMovie.title}
                    hintData={{
                      overview: currentMovie.overview || "Classic cinema masterpiece.",
                      tagline: currentMovie.tagline || "",
                      genres: currentMovie.genres || [],
                      year: currentMovie.year || "",
                      leadActor: currentMovie.leadActor || null,
                      director: currentMovie.director || null,
                    }}
                    onUsed={() => setState((s) => (s ? markHintUsed(s) : s))}
                  />
                )}

                <Keyboard
                  guessed={state.guessed}
                  correctLetters={Array.from(
                    new Set<string>(
                      state.cells
                        .filter((c) => c.status === "revealed")
                        .map((c) => c.char.toLowerCase())
                    )
                  )}
                  onGuess={guess}
                />
              </div>
            )}

            {/* Spectating Message in place of keyboard */}
            {isSpectating && !winnerInfo && !allLost && (
              <div className="text-center py-6 px-4 rounded-2xl bg-[var(--surface-2)]/50 border border-[var(--hairline)] space-y-2">
                <Skull className="w-8 h-8 text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-[var(--ink)]">You are spectating</h4>
                <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
                  Your keyboard is paused. Watch the live cards below to see how other players perform!
                </p>
              </div>
            )}
          </div>

          {/* Opponents Live Cards */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1 text-xs font-black uppercase tracking-wider text-[var(--muted)]">
              <Users className="w-3.5 h-3.5" />
              <span>Players in Room ({peerList.length + 1})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Self Card */}
              <div className="p-3 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--accent)]/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[var(--ink)] flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSpectating ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                    />
                    <span>{user.displayName} (You)</span>
                    {isSpectating && (
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                        • Spectating
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-[var(--accent)]">
                    {scores[user.displayName] || 0} pts
                  </span>
                </div>
                {state && (
                  <div className="flex gap-1 overflow-x-auto py-1 no-scrollbar">
                    {state.cells.map((c, i) => (
                      <span
                        key={i}
                        className={`inline-block w-4 h-5 rounded text-[10px] text-center font-mono leading-5 font-bold ${
                          c.status === "space"
                            ? "bg-transparent"
                            : c.status === "hidden"
                            ? "bg-[var(--surface)] text-transparent"
                            : "bg-emerald-500 text-white"
                        }`}
                      >
                        {c.status === "hidden" ? "?" : c.char}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Peer Cards */}
              {peerList.map((p, idx) => {
                const peerSpectating = p.status === "spectating" || (p.livesLeft ?? 5) <= 0;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--ink)] truncate max-w-[150px] flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            peerSpectating ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                        <span className="truncate">{p.nickname}</span>
                        {peerSpectating && (
                          <span className="text-[10px] font-bold text-amber-500 shrink-0">
                            (Spectating)
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-bold text-[var(--accent)]">
                        {scores[p.nickname] || p.score || 0} pts
                      </span>
                    </div>

                    {p.snapshot && (
                      <div className="flex gap-1 overflow-x-auto py-1 no-scrollbar">
                        {p.snapshot.statuses.map((st, i) => (
                          <span
                            key={i}
                            className={`inline-block w-4 h-5 rounded text-[9px] text-center font-mono leading-5 ${
                              st === "space"
                                ? "bg-transparent"
                                : st === "revealed" || st === "vowel"
                                ? "bg-emerald-500 text-white"
                                : "bg-[var(--surface-2)]"
                            }`}
                          >
                            {st === "space" ? "" : "•"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Live Stream Chat (Contained height, non-expanding body, scrollable) */}
        <div className="lg:col-span-4 sticky top-20">
          <LiveStreamChat
            messages={messages}
            currentNickname={user.displayName}
            onSendMessage={handleSendChatMessage}
          />
        </div>
      </div>

      {/* Result Modal Popup */}
      {currentMovie && (
        <MovieResultModal
          isOpen={showResultModal}
          status={winnerInfo ? "won" : "lost"}
          movie={{
            title: currentMovie.title,
            poster_path: currentMovie.poster_path,
            overview: currentMovie.overview,
            tagline: currentMovie.tagline,
            leadActor: currentMovie.leadActor,
            director: currentMovie.director,
            genres: currentMovie.genres,
            year: currentMovie.year,
            industryLabel: currentMovie.industryLabel,
            vote_average: currentMovie.vote_average,
          }}
          winnerName={winnerInfo?.winner}
          isSelfWinner={isSelfWinner}
          isMultiplayer={true}
          round={roundNumber}
          countdownSeconds={countdown}
          scores={scores}
          onOk={() => {
            setShowResultModal(false);
            advanceToNextMovie();
          }}
        />
      )}
    </div>
  );
}
