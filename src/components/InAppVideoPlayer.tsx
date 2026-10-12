import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Gauge,
  Clock,
  CheckCircle2,
  Circle,
  Volume2,
  VolumeX,
  Zap,
  Maximize,
  Minimize,
  ExternalLink,
  Captions,
  CaptionsOff,
  Radio,
  RefreshCw,
  ChevronsLeft,
  ChevronsRight,
  Settings,
} from "lucide-react";
import { extractYouTubeVideoId, formatVideoTime } from "../lib/strategyData";
import { sfxClick, sfxSuccess } from "../lib/sound";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface InAppVideoPlayerProps {
  videoUrl: string;
  videoTitle?: string;
  taskName?: string;
  subjectName?: string;
  isCompleted?: boolean;
  onToggleCompleted?: () => void;
  onClose: () => void;
}

// Playback speed presets up to 4x (user requested > 2x speed)
const SPEED_PRESETS = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];

// Subtitle language options
const SUBTITLE_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi (हिंदी)" },
  { code: "default", label: "Auto / Default" },
];

export function InAppVideoPlayer({
  videoUrl,
  videoTitle,
  taskName,
  subjectName,
  isCompleted,
  onToggleCompleted,
  onClose,
}: InAppVideoPlayerProps) {
  const videoId = extractYouTubeVideoId(videoUrl);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiveOrRecorded, setIsLiveOrRecorded] = useState(false);
  const [streamNotice, setStreamNotice] = useState<string | null>(null);

  // Subtitles / Closed Captions State & Menu
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [subtitleLang, setSubtitleLang] = useState("en");
  const [subtitleSize, setSubtitleSize] = useState<"small" | "normal" | "large">("normal");
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [subtitleToast, setSubtitleToast] = useState<string | null>(null);
  const subtitleToastTimerRef = useRef<any>(null);

  // Side Double-Click Feedback State (-10s / +10s YouTube style)
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<{
    side: "left" | "right";
    seconds: number;
  } | null>(null);
  const doubleTapTimerRef = useRef<any>(null);
  const accumulatedSkipRef = useRef<{ side: "left" | "right"; seconds: number }>({
    side: "left",
    seconds: 0,
  });

  // Single vs Double Click Dispatcher Refs for YouTube-style side double tap
  const clickTimerRef = useRef<any>(null);
  const lastClickRef = useRef<{ time: number; zone: "left" | "center" | "right" }>({
    time: 0,
    zone: "center",
  });

  // Controls visibility state
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimerRef = useRef<any>(null);

  const resetHideControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSubtitleMenu(false);
      }, 4000);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetHideControlsTimer();
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [isPlaying, resetHideControlsTimer]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const turboIntervalRef = useRef<any>(null);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    sfxClick();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  // Sync fullscreen state
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  // PostMessage helper for IFrame communication
  const sendCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
      );
    }
  };

  // Trigger toast for subtitles
  const triggerSubtitleToast = (text: string) => {
    setSubtitleToast(text);
    if (subtitleToastTimerRef.current) clearTimeout(subtitleToastTimerRef.current);
    subtitleToastTimerRef.current = setTimeout(() => {
      setSubtitleToast(null);
    }, 2200);
  };

  // Double-tap rewind 10s with official YouTube ripple animation and accumulation
  const triggerDoubleTapRewind = () => {
    sfxClick();
    const now = Date.now();
    let nextSec = 10;
    if (
      doubleTapFeedback?.side === "left" &&
      now - lastClickRef.current.time < 800
    ) {
      nextSec = (accumulatedSkipRef.current.seconds || 10) + 10;
    }
    accumulatedSkipRef.current = { side: "left", seconds: nextSec };
    seekRelative(-10);
    setDoubleTapFeedback({ side: "left", seconds: nextSec });

    if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
    doubleTapTimerRef.current = setTimeout(() => {
      setDoubleTapFeedback(null);
      accumulatedSkipRef.current = { side: "left", seconds: 0 };
    }, 850);
  };

  // Double-tap forward 10s with official YouTube ripple animation and accumulation
  const triggerDoubleTapForward = () => {
    sfxClick();
    const now = Date.now();
    let nextSec = 10;
    if (
      doubleTapFeedback?.side === "right" &&
      now - lastClickRef.current.time < 800
    ) {
      nextSec = (accumulatedSkipRef.current.seconds || 10) + 10;
    }
    accumulatedSkipRef.current = { side: "right", seconds: nextSec };
    seekRelative(10);
    setDoubleTapFeedback({ side: "right", seconds: nextSec });

    if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
    doubleTapTimerRef.current = setTimeout(() => {
      setDoubleTapFeedback(null);
      accumulatedSkipRef.current = { side: "right", seconds: 0 };
    }, 850);
  };

  // Surface click handler: handles single click (play/pause) vs double click (side rewind/forward)
  const handleZoneClick = (
    e: React.MouseEvent<HTMLDivElement>,
    zone: "left" | "center" | "right"
  ) => {
    e.stopPropagation();
    resetHideControlsTimer();
    const now = Date.now();
    const isDouble =
      now - lastClickRef.current.time < 320 && lastClickRef.current.zone === zone;

    if (isDouble) {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      lastClickRef.current = { time: now, zone };

      if (zone === "left") {
        triggerDoubleTapRewind();
      } else if (zone === "right") {
        triggerDoubleTapForward();
      } else {
        togglePlayPause();
      }
    } else {
      lastClickRef.current = { time: now, zone };
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

      if (zone === "center") {
        togglePlayPause();
      } else {
        clickTimerRef.current = setTimeout(() => {
          togglePlayPause();
          clickTimerRef.current = null;
        }, 260);
      }
    }
  };

  // Subtitles Toggle & Configuration
  const applySubtitleSettings = (enabled: boolean, lang: string, size: "small" | "normal" | "large") => {
    const fontSizeMap = { small: 0.75, normal: 1, large: 1.5 };
    if (enabled) {
      try {
        if (playerRef.current && typeof playerRef.current.loadModule === "function") {
          playerRef.current.loadModule("captions");
          if (lang !== "default") {
            playerRef.current.setOption("captions", "track", { languageCode: lang });
          }
          playerRef.current.setOption("captions", "fontSize", fontSizeMap[size]);
          playerRef.current.setOption("captions", "reload", true);
        }
      } catch {}
      sendCommand("loadModule", ["captions"]);
      if (lang !== "default") {
        sendCommand("setOption", ["captions", "track", { languageCode: lang }]);
      }
      sendCommand("setOption", ["captions", "fontSize", fontSizeMap[size]]);
      sendCommand("setOption", ["captions", "reload", true]);
      const langName = SUBTITLE_LANGUAGES.find((l) => l.code === lang)?.label || lang;
      triggerSubtitleToast(`Subtitles ON (${langName})`);
    } else {
      try {
        if (playerRef.current && typeof playerRef.current.unloadModule === "function") {
          playerRef.current.unloadModule("captions");
        }
      } catch {}
      sendCommand("unloadModule", ["captions"]);
      sendCommand("setOption", ["captions", "track", {}]);
      triggerSubtitleToast("Subtitles Turned OFF");
    }
  };

  const toggleSubtitles = () => {
    sfxClick();
    const nextState = !subtitlesEnabled;
    setSubtitlesEnabled(nextState);
    applySubtitleSettings(nextState, subtitleLang, subtitleSize);
  };

  const setSubtitlesLanguage = (lang: string) => {
    sfxClick();
    setSubtitleLang(lang);
    setSubtitlesEnabled(true);
    applySubtitleSettings(true, lang, subtitleSize);
  };

  const setSubtitlesFontSize = (size: "small" | "normal" | "large") => {
    sfxClick();
    setSubtitleSize(size);
    if (subtitlesEnabled) {
      applySubtitleSettings(true, subtitleLang, size);
    }
  };

  // Force play as recorded lecture from 0:00 (for live/recorded streams)
  const handleForcePlayRecorded = () => {
    sfxClick();
    setCurrentTime(0);
    setIsPlaying(true);
    setStreamNotice("Playing as recorded lecture from 0:00");
    setTimeout(() => setStreamNotice(null), 3000);

    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      try {
        playerRef.current.seekTo(0, true);
        playerRef.current.playVideo();
      } catch {}
    }
    sendCommand("seekTo", [0, true]);
    sendCommand("playVideo");
  };

  // Keyboard Shortcuts (Space/K = Play/Pause, Left/J = -10s, Right/L = +10s, C = CC, M = Mute, F = Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "Escape" && !document.fullscreenElement) {
        onClose();
      } else if (e.key === " " || e.key === "k" || e.key === "K") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "ArrowLeft" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        triggerDoubleTapRewind();
      } else if (e.key === "ArrowRight" || e.key === "l" || e.key === "L") {
        e.preventDefault();
        triggerDoubleTapForward();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        toggleSubtitles();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isPlaying, subtitlesEnabled, isMuted, subtitleLang, subtitleSize]);

  // Dual-Engine Playback Speed Controller: Supports speeds up to 4x!
  // YouTube natively clamps playbackRate to 2.0x.
  // For speeds > 2.0x, we play at 2.0x native rate + high-precision smooth micro-leap ticker.
  useEffect(() => {
    if (turboIntervalRef.current) {
      clearInterval(turboIntervalRef.current);
      turboIntervalRef.current = null;
    }

    if (playbackSpeed > 2.0 && isPlaying) {
      // 250ms interval advances video by the difference: (playbackSpeed - 2.0) * 0.25s
      const intervalMs = 250;
      const extraAdvancePerTick = (playbackSpeed - 2.0) * (intervalMs / 1000);

      turboIntervalRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
          try {
            const cur = playerRef.current.getCurrentTime();
            if (typeof cur === "number" && cur > 0) {
              const target = Math.min(duration || 999999, cur + extraAdvancePerTick);
              playerRef.current.seekTo(target, true);
              setCurrentTime(target);
            }
          } catch {}
        }
      }, intervalMs);
    }

    return () => {
      if (turboIntervalRef.current) {
        clearInterval(turboIntervalRef.current);
        turboIntervalRef.current = null;
      }
    };
  }, [playbackSpeed, isPlaying, duration]);

  // Initialize YouTube Iframe Player
  useEffect(() => {
    if (!videoId) return;

    let destroyed = false;

    // Detect if the original URL was a live stream
    if (videoUrl && /youtube\.com\/live\//i.test(videoUrl)) {
      setIsLiveOrRecorded(true);
    }

    const initYT = () => {
      if (destroyed || !window.YT || !window.YT.Player) return;

      try {
        const containerId = `yt-player-${videoId}`;
        const container = document.getElementById(containerId);
        if (!container) return;

        playerRef.current = new window.YT.Player(containerId, {
          events: {
            onReady: (event: any) => {
              if (destroyed) return;
              try {
                // Ensure recorded live streams start from 0:00 as recorded lecture
                event.target.seekTo(0, true);
                event.target.playVideo();

                const dur = event.target.getDuration();
                if (dur && dur > 0) {
                  setDuration(dur);
                } else {
                  // If live/recorded stream manifest is still settling, check again in 1s
                  setTimeout(() => {
                    try {
                      const d2 = event.target.getDuration();
                      if (d2 && d2 > 0) setDuration(d2);
                    } catch {}
                  }, 1200);
                }

                // Apply initial playback speed
                const nativeRate = Math.min(2.0, playbackSpeed);
                event.target.setPlaybackRate(nativeRate);
              } catch {}
            },
            onStateChange: (event: any) => {
              if (destroyed) return;
              // 1 = playing, 2 = paused, 0 = ended, -1 = unstarted, 3 = buffering
              if (event.data === 1) {
                setIsPlaying(true);
                // When playback begins, fetch duration if not yet loaded
                const dur = event.target.getDuration();
                if (dur && dur > 0) setDuration(dur);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                setIsPlaying(false);
              } else if (event.data === -1 || event.data === 3) {
                // For recorded live streams, ensure play triggers cleanly
                try {
                  event.target.playVideo();
                } catch {}
              }
            },
            onPlaybackRateChange: (event: any) => {
              if (!destroyed && event.data && playbackSpeed <= 2) {
                setPlaybackSpeed(event.data);
              }
            },
          },
        });
      } catch (err) {
        console.warn("YouTube Player initialization fallback:", err);
      }
    };

    // Load YT API script if not present
    if (!window.YT) {
      const existingScript = document.getElementById("yt-iframe-api-script");
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
      window.onYouTubeIframeAPIReady = () => {
        initYT();
      };
    } else if (window.YT.Player) {
      initYT();
    }

    // Message listener for YouTube postMessage infoDelivery
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === "onReady" || data.event === "initialDelivery") {
          sendCommand("seekTo", [0, true]);
          sendCommand("playVideo");
          sendCommand("getDuration");
        }
        if (data.event === "infoDelivery" && data.info) {
          if (typeof data.info.currentTime === "number") {
            setCurrentTime(data.info.currentTime);
          }
          if (typeof data.info.duration === "number" && data.info.duration > 0) {
            setDuration(data.info.duration);
          }
          if (typeof data.info.playerState === "number") {
            setIsPlaying(data.info.playerState === 1);
          }
        }
      } catch {}
    };
    window.addEventListener("message", handleMessage);

    // Polling interval to track smooth time progress and catch duration updates
    intervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        try {
          const cur = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (typeof cur === "number") setCurrentTime(cur);
          if (typeof dur === "number" && dur > 0) setDuration(dur);
        } catch {}
      } else {
        sendCommand("getCurrentTime");
        sendCommand("getDuration");
      }
    }, 350);

    return () => {
      destroyed = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (turboIntervalRef.current) clearInterval(turboIntervalRef.current);
      window.removeEventListener("message", handleMessage);
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, [videoId, videoUrl]);

  // Controller Actions
  const togglePlayPause = () => {
    sfxClick();
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    setShowCenterIcon(true);
    setTimeout(() => setShowCenterIcon(false), 500);

    if (playerRef.current && typeof playerRef.current.playVideo === "function") {
      try {
        if (!nextState) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
      } catch {}
    }
    sendCommand(nextState ? "playVideo" : "pauseVideo");
  };

  const seekRelative = (secondsOffset: number) => {
    sfxClick();
    const maxBound = duration > 0 ? duration : 999999;
    const newTarget = Math.max(0, Math.min(maxBound, currentTime + secondsOffset));
    setCurrentTime(newTarget);
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      try {
        playerRef.current.seekTo(newTarget, true);
      } catch {}
    }
    sendCommand("seekTo", [newTarget, true]);
  };

  const handleSeekSlider = (targetSec: number) => {
    setCurrentTime(targetSec);
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      try {
        playerRef.current.seekTo(targetSec, true);
      } catch {}
    }
    sendCommand("seekTo", [targetSec, true]);
  };

  // Speed change up to 4.0x
  const changeSpeed = (speed: number) => {
    sfxClick();
    const clamped = Math.max(0.5, Math.min(4.0, Math.round(speed * 100) / 100));
    setPlaybackSpeed(clamped);

    // YouTube native setPlaybackRate accepts up to 2.0
    const nativeRate = Math.min(2.0, clamped);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === "function") {
      try {
        playerRef.current.setPlaybackRate(nativeRate);
      } catch {}
    }
    sendCommand("setPlaybackRate", [nativeRate]);
  };

  const toggleMute = () => {
    sfxClick();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    const func = nextMuted ? "mute" : "unMute";
    if (playerRef.current && typeof playerRef.current[func] === "function") {
      try {
        playerRef.current[func]();
      } catch {}
    }
    sendCommand(func);
  };

  // Remaining time calculation adjusted for playback speed (even > 2x)
  const remainingSeconds = Math.max(0, duration - currentTime);
  const remainingAtSpeed = playbackSpeed > 0 ? remainingSeconds / playbackSpeed : remainingSeconds;

  // Solid progress bar viewed percentage calculation
  const progressPercent =
    duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center ${
        isFullscreen ? "p-0" : "p-2 sm:p-4"
      } animate-in fade-in duration-150`}
      onClick={isFullscreen ? undefined : onClose}
    >
      <div
        ref={containerRef}
        onMouseMove={resetHideControlsTimer}
        onMouseDown={resetHideControlsTimer}
        onTouchStart={resetHideControlsTimer}
        onKeyDown={resetHideControlsTimer}
        className={`w-full bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl flex flex-col text-zinc-100 ring-1 ring-white/10 ${
          isFullscreen
            ? "h-screen w-screen max-w-none max-h-none rounded-none border-0"
            : "max-w-4xl rounded-3xl max-h-[96vh]"
        } ${!showControls ? "cursor-none" : "cursor-default"}`}
        onClick={(e) => {
          e.stopPropagation();
          resetHideControlsTimer();
        }}
      >
        {/* Minimal Header Bar - auto hides on inactivity */}
        <div
          className={`flex items-center justify-between px-4 py-2.5 bg-zinc-900/95 border-b border-zinc-800/80 transition-all duration-300 ease-in-out ${
            showControls
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4 pointer-events-none max-h-0 py-0 border-b-0 overflow-hidden"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {subjectName && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                {subjectName}
              </span>
            )}

            {/* Recorded Live Stream Badge */}
            {isLiveOrRecorded && (
              <button
                onClick={handleForcePlayRecorded}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 shrink-0 flex items-center gap-1 hover:bg-red-500/30 transition-colors cursor-pointer"
                title="Recorded Live Stream: Click to play from 0:00 as recorded lecture"
              >
                <Radio className="w-2.5 h-2.5 text-red-400 animate-pulse" />
                <span>Recorded Lecture</span>
              </button>
            )}

            <h3 className="text-xs sm:text-sm font-bold text-zinc-100 truncate max-w-[200px] sm:max-w-md">
              {videoTitle || taskName || "Chapter Lecture"}
            </h3>

            {playbackSpeed !== 1 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5 ${
                  playbackSpeed > 2
                    ? "bg-amber-500/25 text-amber-300 border border-amber-500/40"
                    : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                }`}
                title={playbackSpeed > 2 ? `Ultra Speed: ${playbackSpeed}x active` : `Speed: ${playbackSpeed}x`}
              >
                <Zap className="w-2.5 h-2.5 fill-current" />
                <span>{playbackSpeed}x</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Play from 0:00 Button for Recorded Live streams */}
            {isLiveOrRecorded && (
              <button
                onClick={handleForcePlayRecorded}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                title="Restart recorded stream from 0:00"
              >
                <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Play from 0:00</span>
              </button>
            )}

            {/* Subtitles Quick Toggle */}
            <button
              onClick={toggleSubtitles}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
                subtitlesEnabled
                  ? "bg-red-600 text-white shadow-sm ring-1 ring-red-400"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              }`}
              title={subtitlesEnabled ? "Subtitles: ON (Click to turn OFF, or press C)" : "Subtitles: OFF (Click to turn ON, or press C)"}
            >
              {subtitlesEnabled ? <Captions className="w-4 h-4" /> : <CaptionsOff className="w-4 h-4" />}
            </button>

            {/* Open on YouTube */}
            {videoId && (
              <a
                href={videoUrl || `https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Open directly on YouTube"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {onToggleCompleted && (
              <button
                onClick={() => {
                  sfxSuccess();
                  onToggleCompleted();
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isCompleted
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isCompleted ? "Done" : "Mark Done"}</span>
              </button>
            )}

            <button
              onClick={() => {
                sfxClick();
                if (isFullscreen) {
                  toggleFullscreen();
                } else {
                  onClose();
                }
              }}
              className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player Display Container */}
        <div
          className={`relative bg-black w-full flex items-center justify-center overflow-hidden select-none ${
            isFullscreen ? "flex-1" : "aspect-video"
          }`}
        >
          {videoId ? (
            <>
              {/* YouTube IFrame Embed (start=0 ensures recorded live stream starts at beginning) */}
              <iframe
                ref={iframeRef}
                id={`yt-player-${videoId}`}
                src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&autoplay=1&start=0&controls=0&disablekb=1&fs=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
                title={videoTitle || taskName || "Study Lecture"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                className="w-full h-full border-0 pointer-events-none"
                onLoad={() => {
                  sendCommand("listening");
                  sendCommand("seekTo", [0, true]);
                  sendCommand("playVideo");
                  sendCommand("getDuration");
                }}
              />

              {/* Subtitle Toast Notification */}
              {subtitleToast && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
                  <Captions className="w-3.5 h-3.5 text-red-500" />
                  <span>{subtitleToast}</span>
                </div>
              )}

              {/* Recorded stream notification */}
              {streamNotice && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-red-600/90 backdrop-blur-md text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
                  <Radio className="w-3.5 h-3.5" />
                  <span>{streamNotice}</span>
                </div>
              )}

              {/* OFFICIAL YOUTUBE DOUBLE-TAP FEEDBACK: LEFT RIPPLE (-10s) */}
              {doubleTapFeedback?.side === "left" && (
                <div className="absolute left-0 top-0 bottom-0 w-36 sm:w-48 bg-white/20 backdrop-blur-xs rounded-r-full flex flex-col items-center justify-center text-white pointer-events-none z-20 animate-in fade-in zoom-in-90 duration-150">
                  <div className="flex items-center gap-0.5 text-white mb-1">
                    <ChevronsLeft className="w-8 h-8 animate-pulse" />
                  </div>
                  <span className="text-xs sm:text-sm font-black tracking-wide drop-shadow">
                    {doubleTapFeedback.seconds} seconds
                  </span>
                </div>
              )}

              {/* OFFICIAL YOUTUBE DOUBLE-TAP FEEDBACK: RIGHT RIPPLE (+10s) */}
              {doubleTapFeedback?.side === "right" && (
                <div className="absolute right-0 top-0 bottom-0 w-36 sm:w-48 bg-white/20 backdrop-blur-xs rounded-l-full flex flex-col items-center justify-center text-white pointer-events-none z-20 animate-in fade-in zoom-in-90 duration-150">
                  <div className="flex items-center gap-0.5 text-white mb-1">
                    <ChevronsRight className="w-8 h-8 animate-pulse" />
                  </div>
                  <span className="text-xs sm:text-sm font-black tracking-wide drop-shadow">
                    {doubleTapFeedback.seconds} seconds
                  </span>
                </div>
              )}

              {/* 3-ZONE TOUCH/CLICK SURFACE (Left: Double-click -10s | Center: Play/Pause | Right: Double-click +10s) */}
              <div className="absolute inset-0 flex z-10">
                {/* Left Zone (35%) -> Double Click = -10s */}
                <div
                  onClick={(e) => handleZoneClick(e, "left")}
                  className="w-[35%] h-full cursor-pointer relative"
                  title="Double click: Rewind 10s | Click: Play/Pause"
                />

                {/* Center Zone (30%) -> Click = Play/Pause */}
                <div
                  onClick={(e) => handleZoneClick(e, "center")}
                  className="w-[30%] h-full cursor-pointer flex items-center justify-center relative"
                  title="Click: Play/Pause"
                >
                  {showCenterIcon && (
                    <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-2xl animate-in zoom-in-75 duration-200">
                      {isPlaying ? <Play className="w-8 h-8 fill-white ml-1" /> : <Pause className="w-8 h-8 fill-white" />}
                    </div>
                  )}
                  {!isPlaying && !showCenterIcon && (
                    <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 fill-white ml-1" />
                    </div>
                  )}
                </div>

                {/* Right Zone (35%) -> Double Click = +10s */}
                <div
                  onClick={(e) => handleZoneClick(e, "right")}
                  className="w-[35%] h-full cursor-pointer relative"
                  title="Double click: Forward 10s | Click: Play/Pause"
                />
              </div>
            </>
          ) : (
            <div className="text-center p-6 space-y-1.5 text-zinc-400">
              <p className="text-sm font-semibold text-rose-400">Invalid YouTube video URL</p>
              <p className="text-xs">Please provide a valid YouTube link</p>
            </div>
          )}
        </div>

        {/* Minimal Controller HUD - auto-hides after 4s without interaction */}
        <div
          className={`p-2.5 sm:p-3 bg-zinc-900/95 border-t border-zinc-800/80 space-y-2 transition-all duration-300 ease-in-out relative ${
            showControls
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none max-h-0 py-0 border-t-0 overflow-hidden"
          }`}
        >
          {/* Subtitle Controls Popover Menu */}
          {showSubtitleMenu && (
            <div
              className="absolute bottom-16 right-4 z-40 bg-zinc-900 border border-zinc-700/80 rounded-2xl p-3 shadow-2xl w-64 space-y-2.5 text-zinc-200 animate-in fade-in slide-in-from-bottom-2 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Captions className="w-4 h-4 text-red-500" />
                  <span>Subtitle Controls</span>
                </span>
                <button
                  onClick={() => setShowSubtitleMenu(false)}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* CC Master Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Subtitles:</span>
                <button
                  onClick={toggleSubtitles}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    subtitlesEnabled
                      ? "bg-red-600 text-white shadow"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {subtitlesEnabled ? "ON" : "OFF"}
                </button>
              </div>

              {/* Language Selector */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-zinc-400">Language:</span>
                <div className="grid grid-cols-1 gap-1">
                  {SUBTITLE_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setSubtitlesLanguage(lang.code)}
                      className={`px-2 py-1 rounded-lg text-left text-xs transition-colors flex items-center justify-between ${
                        subtitleLang === lang.code && subtitlesEnabled
                          ? "bg-red-600/20 text-red-400 font-bold border border-red-500/30"
                          : "hover:bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      <span>{lang.label}</span>
                      {subtitleLang === lang.code && subtitlesEnabled && (
                        <CheckCircle2 className="w-3 h-3 text-red-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Selector */}
              <div className="space-y-1 pt-1 border-t border-zinc-800">
                <span className="text-[11px] font-bold text-zinc-400">Subtitle Size:</span>
                <div className="flex items-center gap-1">
                  {(["small", "normal", "large"] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSubtitlesFontSize(sz)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors ${
                        subtitleSize === sz
                          ? "bg-zinc-700 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Progress Slider & Timestamps with SOLID Red Viewed Portion */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                <Clock className="w-3.5 h-3.5 text-red-500" />
                <span>{formatVideoTime(currentTime)}</span>
                <span className="text-zinc-600">/</span>
                <span>{duration > 0 ? formatVideoTime(duration) : isLiveOrRecorded ? "Recorded Lecture" : "--:--"}</span>
              </div>

              {duration > 0 ? (
                <div className="text-[11px] text-zinc-400 font-sans">
                  ⏱️ <strong className="text-zinc-200">{formatVideoTime(remainingAtSpeed)}</strong> left
                  {playbackSpeed !== 1 && (
                    <span
                      className={`font-bold ml-1 ${
                        playbackSpeed > 2 ? "text-amber-400" : "text-purple-400"
                      }`}
                    >
                      ({playbackSpeed}x)
                    </span>
                  )}
                </div>
              ) : (
                isLiveOrRecorded && (
                  <button
                    onClick={handleForcePlayRecorded}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync as Recorded</span>
                  </button>
                )
              )}
            </div>

            {/* Custom Progress Bar with 100% SOLID Viewed Part */}
            <div className="relative w-full h-3 group flex items-center cursor-pointer select-none">
              {/* Unviewed Solid Background Track */}
              <div className="w-full h-1.5 group-hover:h-2 bg-zinc-800 rounded-full overflow-hidden transition-all relative">
                {/* SOLID VIBRANT RED VIEWED PART (100% solid opacity) */}
                <div
                  className="h-full bg-red-600 rounded-full transition-[width] duration-75 ease-linear shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Scrubber thumb circle */}
              {duration > 0 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-red-600 pointer-events-none transition-transform group-hover:scale-125"
                  style={{ left: `calc(${progressPercent}% - 7px)` }}
                />
              )}

              {/* Accessible Range Input Over the Track */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => handleSeekSlider(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Seek Video"
              />
            </div>
          </div>

          {/* Minimal Controls Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Play/Pause & Jumps */}
            <div className="flex items-center gap-1">
              <button
                onClick={togglePlayPause}
                className="w-8 h-8 rounded-xl bg-white text-black font-bold flex items-center justify-center hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
              </button>

              <button
                onClick={() => seekRelative(-10)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Rewind 10s (Left Arrow or Double-Click Left Side)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => seekRelative(10)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Forward 10s (Right Arrow or Double-Click Right Side)"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={toggleMute}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors ml-0.5 cursor-pointer"
                title={isMuted ? "Unmute (M)" : "Mute (M)"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Subtitle Controls Button in Bar */}
              <div className="relative">
                <button
                  onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    subtitlesEnabled
                      ? "bg-red-600 text-white shadow-sm ring-1 ring-red-400"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                  }`}
                  title="Subtitle / Caption Controls (C)"
                >
                  <Captions className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Speed Controller: Supports speeds up to 4x (Presets & Slider) */}
            <div className="relative flex items-center gap-1 bg-zinc-950 border border-zinc-800/80 px-1 py-0.5 rounded-xl">
              <span className="text-[10px] font-bold text-zinc-400 px-1 uppercase tracking-wider flex items-center gap-1">
                <Gauge className={`w-3 h-3 ${playbackSpeed > 2 ? "text-amber-400" : "text-purple-400"}`} />
                <span>Speed</span>
              </span>

              {/* Preset Buttons up to 4.0x */}
              <div className="flex items-center gap-0.5 overflow-x-auto max-w-[280px] sm:max-w-none">
                {SPEED_PRESETS.map((rate) => {
                  const isActive = playbackSpeed === rate;
                  const isUltra = rate > 2;
                  return (
                    <button
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? isUltra
                            ? "bg-amber-500 text-black shadow-sm font-black"
                            : "bg-purple-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                      }`}
                      title={isUltra ? `${rate}x Ultra Acceleration` : `${rate}x`}
                    >
                      {rate}x
                    </button>
                  );
                })}
              </div>

              {/* Custom Speed Slider (0.5x - 4.0x) */}
              <div className="hidden lg:flex items-center gap-1 pl-1 border-l border-zinc-800">
                <input
                  type="range"
                  min={0.5}
                  max={4.0}
                  step={0.25}
                  value={playbackSpeed}
                  onChange={(e) => changeSpeed(Number(e.target.value))}
                  className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  title={`Speed: ${playbackSpeed}x (Up to 4.0x)`}
                />
                <span
                  className={`text-[10px] font-mono font-bold w-7 text-right ${
                    playbackSpeed > 2 ? "text-amber-400" : "text-purple-400"
                  }`}
                >
                  {playbackSpeed}x
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
