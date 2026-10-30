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
  Volume1,
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
} from "lucide-react";
import { extractYouTubeVideoId, formatVideoTime, getYouTubeThumbnailUrl } from "../lib/strategyData";
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

// Playback speed presets up to 4.0x
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
  const [loadedFraction, setLoadedFraction] = useState(0); // Buffer bar fraction (0 to 1)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiveOrRecorded, setIsLiveOrRecorded] = useState(false);
  const [streamNotice, setStreamNotice] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Subtitles / Closed Captions State & Menu
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [subtitleLang, setSubtitleLang] = useState("en");
  const [subtitleSize, setSubtitleSize] = useState<"small" | "normal" | "large">("normal");
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [subtitleToast, setSubtitleToast] = useState<string | null>(null);
  const subtitleToastTimerRef = useRef<any>(null);

  // Real YouTube-Style Scrubber Dragging & Hover State
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [isHoveringBar, setIsHoveringBar] = useState(false);
  const isScrubbingRef = useRef(false);

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
    if (isPlaying && !isScrubbingRef.current) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSubtitleMenu(false);
        setShowVolumeSlider(false);
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

  // Trigger toast for subtitles
  const triggerSubtitleToast = (text: string) => {
    setSubtitleToast(text);
    if (subtitleToastTimerRef.current) clearTimeout(subtitleToastTimerRef.current);
    subtitleToastTimerRef.current = setTimeout(() => {
      setSubtitleToast(null);
    }, 2200);
  };

  // FEATURE 4: Accumulating Skip (+10s, +20s, +30s...) with a 600ms debounce window
  const skipDebounceTimerRef = useRef<any>(null);
  const pendingSkipRef = useRef<{
    side: "left" | "right";
    seconds: number;
    baseTime: number;
  }>({
    side: "right",
    seconds: 0,
    baseTime: 0,
  });

  const handleAccumulatingSkip = useCallback(
    (direction: "left" | "right") => {
      sfxClick();
      resetHideControlsTimer();

      const isScrubbingNow = isScrubbingRef.current;
      const currentPos = isScrubbingNow ? scrubTime : currentTime;

      // If switching direction or starting fresh, initialize base
      if (pendingSkipRef.current.side !== direction || pendingSkipRef.current.seconds === 0) {
        pendingSkipRef.current = {
          side: direction,
          seconds: 10,
          baseTime: currentPos,
        };
      } else {
        // Accumulate: 1 tap = 10, 2 taps = 20, 3 taps = 30, and so on
        pendingSkipRef.current.seconds += 10;
      }

      const totalSec = pendingSkipRef.current.seconds;
      setDoubleTapFeedback({ side: direction, seconds: totalSec });

      // Clear debounce timer
      if (skipDebounceTimerRef.current) {
        clearTimeout(skipDebounceTimerRef.current);
      }

      // 600ms debounce window: apply single accumulated seek at the end
      skipDebounceTimerRef.current = setTimeout(() => {
        const offset = pendingSkipRef.current.side === "right" ? totalSec : -totalSec;
        const target = Math.max(0, Math.min(duration > 0 ? duration : 999999, pendingSkipRef.current.baseTime + offset));
        commitSeek(target);

        // Reset accumulator
        pendingSkipRef.current = { side: direction, seconds: 0, baseTime: target };

        // Hide on-screen running total badge
        setTimeout(() => {
          setDoubleTapFeedback(null);
        }, 400);
      }, 600);
    },
    [currentTime, duration, scrubTime, resetHideControlsTimer]
  );

  const triggerDoubleTapRewind = () => handleAccumulatingSkip("left");
  const triggerDoubleTapForward = () => handleAccumulatingSkip("right");

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
      const langName = SUBTITLE_LANGUAGES.find((l) => l.code === lang)?.label || lang;
      triggerSubtitleToast(`Subtitles ON (${langName})`);
    } else {
      try {
        if (playerRef.current && typeof playerRef.current.unloadModule === "function") {
          playerRef.current.unloadModule("captions");
        }
      } catch {}
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
  };

  // YouTube Keyboard Shortcuts
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
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        changeVolume(Math.min(100, volume + 10));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        changeVolume(Math.max(0, volume - 10));
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        toggleSubtitles();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key >= "0" && e.key <= "9" && duration > 0) {
        e.preventDefault();
        const percent = Number(e.key) * 0.1;
        commitSeek(percent * duration);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isPlaying, subtitlesEnabled, isMuted, subtitleLang, subtitleSize, duration, volume]);

  // Dual-Engine Playback Speed Controller:
  // For speeds > 2.0x, runs 2.0x native decode with smooth micro-advancement every 600ms
  useEffect(() => {
    if (turboIntervalRef.current) {
      clearInterval(turboIntervalRef.current);
      turboIntervalRef.current = null;
    }

    if (playbackSpeed > 2.0 && isPlaying) {
      const intervalMs = 600;
      const extraSeconds = (playbackSpeed - 2.0) * (intervalMs / 1000);

      turboIntervalRef.current = setInterval(() => {
        if (
          playerRef.current &&
          typeof playerRef.current.getCurrentTime === "function" &&
          typeof playerRef.current.getPlayerState === "function"
        ) {
          try {
            // Only advance if player is currently playing (state === 1)
            if (playerRef.current.getPlayerState() === 1) {
              const cur = playerRef.current.getCurrentTime();
              if (typeof cur === "number" && cur > 0) {
                const target = Math.min(duration || 999999, cur + extraSeconds);
                playerRef.current.seekTo(target, true);
                if (!isScrubbingRef.current) {
                  setCurrentTime(target);
                }
              }
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

  // SINGLE-SOURCE PLAYER INITIALIZATION (Eliminates double reload & recorded stream lag)
  useEffect(() => {
    if (!videoId) return;

    let destroyed = false;

    // Detect if the original URL was a live or recorded stream
    if (videoUrl && /youtube\.com\/live\//i.test(videoUrl)) {
      setIsLiveOrRecorded(true);
    }

    const initYT = () => {
      if (destroyed || !window.YT || !window.YT.Player) return;

      try {
        const embedId = `yt-player-embed-${videoId}`;
        const container = document.getElementById(embedId);
        if (!container) return;

        playerRef.current = new window.YT.Player(embedId, {
          videoId: videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            start: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (destroyed) return;
              setIsPlayerReady(true);
              try {
                // Ensure recorded stream begins at 0:00 as recorded lecture
                event.target.seekTo(0, true);
                event.target.playVideo();

                const dur = event.target.getDuration();
                if (dur && dur > 0) {
                  setDuration(dur);
                } else {
                  // Retry duration check after initial handshake
                  setTimeout(() => {
                    try {
                      const d2 = event.target.getDuration();
                      if (d2 && d2 > 0) setDuration(d2);
                    } catch {}
                  }, 1200);
                }

                // Initial playback rate (up to 2x native)
                const nativeRate = Math.min(2.0, playbackSpeed);
                event.target.setPlaybackRate(nativeRate);
              } catch {}
            },
            onStateChange: (event: any) => {
              if (destroyed) return;
              // 1 = playing, 2 = paused, 0 = ended, -1 = unstarted, 3 = buffering
              if (event.data === 1) {
                setIsPlaying(true);
                const dur = event.target.getDuration();
                if (dur && dur > 0) setDuration(dur);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                setIsPlaying(false);
              } else if (event.data === -1 || event.data === 3) {
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
        console.warn("YouTube Player initialization error:", err);
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

    // Polling interval to track smooth time progress and loaded buffer
    intervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        try {
          const cur = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          const frac = playerRef.current.getVideoLoadedFraction?.() || 0;

          if (typeof cur === "number" && !isScrubbingRef.current) {
            setCurrentTime(cur);
          }
          if (typeof dur === "number" && dur > 0) {
            setDuration(dur);
          }
          if (typeof frac === "number") {
            setLoadedFraction(Math.min(1, Math.max(0, frac)));
          }
        } catch {}
      }
    }, 250);

    return () => {
      destroyed = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (turboIntervalRef.current) clearInterval(turboIntervalRef.current);
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
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
  };

  const commitSeek = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(duration || 999999, targetSec));
    setCurrentTime(clamped);
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      try {
        playerRef.current.seekTo(clamped, true);
        if (isPlaying) {
          playerRef.current.playVideo();
        }
      } catch {}
    }
  };

  const seekRelative = (secondsOffset: number) => {
    sfxClick();
    const target = currentTime + secondsOffset;
    commitSeek(target);
  };

  // Speed change up to 4.0x
  const changeSpeed = (speed: number) => {
    sfxClick();
    const clamped = Math.max(0.5, Math.min(4.0, Math.round(speed * 100) / 100));
    setPlaybackSpeed(clamped);

    const nativeRate = Math.min(2.0, clamped);
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === "function") {
      try {
        playerRef.current.setPlaybackRate(nativeRate);
      } catch {}
    }
  };

  // Volume & Mute control
  const changeVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setVolume(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      try {
        playerRef.current?.unMute();
      } catch {}
    }
    if (playerRef.current && typeof playerRef.current.setVolume === "function") {
      try {
        playerRef.current.setVolume(clamped);
      } catch {}
    }
  };

  const toggleMute = () => {
    sfxClick();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (playerRef.current) {
      try {
        if (nextMuted) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
          playerRef.current.setVolume(volume || 100);
        }
      } catch {}
    }
  };

  // ==========================================
  // REAL YOUTUBE SCRUBBER SLIDER IMPLEMENTATION
  // ==========================================
  const calculateScrubTarget = (clientX: number): { time: number; percent: number; offsetX: number } => {
    if (!progressBarRef.current) return { time: 0, percent: 0, offsetX: 0 };
    const rect = progressBarRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const percent = rect.width > 0 ? offsetX / rect.width : 0;
    const time = percent * (duration || 0);
    return { time, percent, offsetX };
  };

  const handleProgressBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resetHideControlsTimer();
    const { time } = calculateScrubTarget(e.clientX);

    setIsScrubbing(true);
    isScrubbingRef.current = true;
    setScrubTime(time);
    setCurrentTime(time);

    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      const { time: newTime } = calculateScrubTarget(moveEvent.clientX);
      setScrubTime(newTime);
      setCurrentTime(newTime);
    };

    const handleWindowMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      const { time: finalTime } = calculateScrubTarget(upEvent.clientX);
      setIsScrubbing(false);
      isScrubbingRef.current = false;
      commitSeek(finalTime);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  };

  const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { time, offsetX } = calculateScrubTarget(e.clientX);
    setHoverTime(time);
    setHoverX(offsetX);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const { time } = calculateScrubTarget(e.touches[0].clientX);
      setIsScrubbing(true);
      isScrubbingRef.current = true;
      setScrubTime(time);
      setCurrentTime(time);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && isScrubbingRef.current) {
      const { time } = calculateScrubTarget(e.touches[0].clientX);
      setScrubTime(time);
      setCurrentTime(time);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isScrubbingRef.current) {
      setIsScrubbing(false);
      isScrubbingRef.current = false;
      const finalTime = scrubTime;
      commitSeek(finalTime);
    }
  };

  // Scrubber percentage calculations
  const displayCurrentTime = isScrubbing ? scrubTime : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (displayCurrentTime / duration) * 100)) : 0;
  const bufferPercent = Math.min(100, Math.max(0, loadedFraction * 100));

  // Remaining time calculation adjusted for playback speed
  const remainingSeconds = Math.max(0, duration - displayCurrentTime);
  const remainingAtSpeed = playbackSpeed > 0 ? remainingSeconds / playbackSpeed : remainingSeconds;

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
        className={`w-full bg-black/50 backdrop-blur-2xl border border-white/15 overflow-hidden shadow-2xl flex flex-col text-zinc-100 ring-1 ring-white/10 transform-gpu ${
          isFullscreen
            ? "h-screen w-screen max-w-none max-h-none rounded-none border-0"
            : "max-w-4xl rounded-3xl max-h-[96vh]"
        } ${!showControls && !isScrubbing ? "cursor-none" : "cursor-default"}`}
        onClick={(e) => {
          e.stopPropagation();
          resetHideControlsTimer();
        }}
      >
        {/* Minimal Header Bar - auto hides on inactivity with glassmorphism */}
        <div
          className={`flex items-center justify-between px-4 py-2.5 bg-black/40 backdrop-blur-xl border-b border-white/10 transition-all duration-300 ease-in-out ${
            showControls || isScrubbing
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4 pointer-events-none max-h-0 py-0 border-b-0 overflow-hidden"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {subjectName && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                {subjectName}
              </span>
            )}

            {/* YouTube Premium Status Badge */}
            {Boolean(localStorage.getItem("vk_strategy_yt_google_user")) && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 flex items-center gap-1" title="YouTube Premium Google account active">
                <Zap className="w-2.5 h-2.5 text-amber-400 fill-current" />
                <span>Premium Active</span>
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
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold backdrop-blur-md"
                title="Restart recorded stream from 0:00"
              >
                <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Play from 0:00</span>
              </button>
            )}

            {/* Subtitles Quick Toggle */}
            <button
              onClick={toggleSubtitles}
              className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center backdrop-blur-md ${
                subtitlesEnabled
                  ? "bg-red-600/80 text-white shadow-sm ring-1 ring-red-400 border border-red-500/40"
                  : "bg-white/10 hover:bg-white/20 border border-white/10 text-zinc-300 hover:text-white"
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
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer backdrop-blur-md"
                title="Open directly on YouTube"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer backdrop-blur-md"
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
              {/* YouTube IFrame Embed Container */}
              <div
                id={`yt-player-embed-${videoId}`}
                className="w-full h-full pointer-events-none"
              />

              {/* Instant Loading Poster if player is initializing */}
              {!isPlayerReady && (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-3 z-5">
                  <img
                    src={getYouTubeThumbnailUrl(videoId) || ""}
                    alt="Loading Lecture"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 filter blur-xs"
                  />
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full border-3 border-red-600 border-t-transparent animate-spin" />
                    <span className="text-xs font-bold text-zinc-300 drop-shadow">
                      {isLiveOrRecorded ? "Starting Recorded Stream..." : "Loading Lecture..."}
                    </span>
                  </div>
                </div>
              )}

              {/* Subtitle Toast Notification */}
              {subtitleToast && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                  <Captions className="w-3.5 h-3.5 text-red-500" />
                  <span>{subtitleToast}</span>
                </div>
              )}

              {/* Recorded stream notification */}
              {streamNotice && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-red-600/90 backdrop-blur-md text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                  <Radio className="w-3.5 h-3.5" />
                  <span>{streamNotice}</span>
                </div>
              )}

              {/* OFFICIAL YOUTUBE DOUBLE-TAP ACCUMULATING FEEDBACK: LEFT RIPPLE (-10s, -20s, -30s...) */}
              {doubleTapFeedback?.side === "left" && (
                <div className="absolute left-0 top-0 bottom-0 w-36 sm:w-52 bg-white/10 dark:bg-black/35 backdrop-blur-md border border-l-0 border-white/20 rounded-r-3xl flex flex-col items-center justify-center text-white pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-150 transform-gpu shadow-2xl">
                  <div className="flex items-center gap-0.5 text-white mb-1">
                    <ChevronsLeft className="w-9 h-9 animate-pulse drop-shadow" />
                  </div>
                  <span className="text-base sm:text-lg font-black tracking-wider drop-shadow-md text-white">
                    -{doubleTapFeedback.seconds}s
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 mt-0.5">
                    Rewind
                  </span>
                </div>
              )}

              {/* OFFICIAL YOUTUBE DOUBLE-TAP ACCUMULATING FEEDBACK: RIGHT RIPPLE (+10s, +20s, +30s...) */}
              {doubleTapFeedback?.side === "right" && (
                <div className="absolute right-0 top-0 bottom-0 w-36 sm:w-52 bg-white/10 dark:bg-black/35 backdrop-blur-md border border-r-0 border-white/20 rounded-l-3xl flex flex-col items-center justify-center text-white pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-150 transform-gpu shadow-2xl">
                  <div className="flex items-center gap-0.5 text-white mb-1">
                    <ChevronsRight className="w-9 h-9 animate-pulse drop-shadow" />
                  </div>
                  <span className="text-base sm:text-lg font-black tracking-wider drop-shadow-md text-white">
                    +{doubleTapFeedback.seconds}s
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 mt-0.5">
                    Fast Forward
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

        {/* Minimal Controller HUD - auto-hides after 4s without interaction (Translucent Glassmorphism) */}
        <div
          className={`p-2.5 sm:p-3 bg-black/40 backdrop-blur-2xl border-t border-white/10 space-y-2.5 transition-all duration-300 ease-in-out relative ${
            showControls || isScrubbing
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

          {/* REAL YOUTUBE INTERACTIVE SCRUBBER BAR WITH HOVER PREVIEW & BUFFER TRACK */}
          <div className="space-y-1.5">
            {/* Timestamp Header */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
                <Clock className="w-3.5 h-3.5 text-red-500" />
                <span>{formatVideoTime(displayCurrentTime)}</span>
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

            {/* Scrubber Track Container (Thickens on hover/scrub like official YouTube) */}
            <div
              ref={progressBarRef}
              onMouseDown={handleProgressBarMouseDown}
              onMouseEnter={() => setIsHoveringBar(true)}
              onMouseLeave={() => {
                setIsHoveringBar(false);
                setHoverTime(null);
                setHoverX(null);
              }}
              onMouseMove={handleProgressBarMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-full h-4 flex items-center cursor-pointer select-none group"
            >
              {/* YouTube Hover Timestamp Tooltip */}
              {isHoveringBar && hoverX !== null && hoverTime !== null && duration > 0 && (
                <div
                  className="absolute bottom-5 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 border border-zinc-700 text-white font-mono text-[10px] font-bold shadow-xl pointer-events-none z-30 animate-in fade-in zoom-in-95 duration-100"
                  style={{ left: `${hoverX}px` }}
                >
                  {formatVideoTime(hoverTime)}
                </div>
              )}

              {/* Background Track (Expands from 3px to 5px on hover/scrub like real YouTube) */}
              <div
                className={`w-full bg-zinc-800 rounded-full overflow-hidden relative transition-all duration-150 ${
                  isHoveringBar || isScrubbing ? "h-2" : "h-1.5"
                }`}
              >
                {/* 1. Loaded Buffer Bar */}
                {bufferPercent > 0 && (
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-zinc-600/60 rounded-full transition-all duration-300"
                    style={{ width: `${bufferPercent}%` }}
                  />
                )}

                {/* 2. Hover Ghost Bar */}
                {isHoveringBar && hoverX !== null && progressBarRef.current && (
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-white/20 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, (hoverX / progressBarRef.current.clientWidth) * 100))}%`,
                    }}
                  />
                )}

                {/* 3. SOLID RED VIEWED PART (100% solid YouTube Red #EF4444) */}
                <div
                  className={`h-full bg-red-600 rounded-full shadow-sm ${
                    isScrubbing ? "transition-none" : "transition-[width] duration-75 ease-linear"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* 4. Scrubber Thumb Circle (expands and centers exactly like YouTube) */}
              {(duration > 0 || isLiveOrRecorded) && (
                <div
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-red-600 ring-2 ring-white shadow-lg pointer-events-none transition-transform duration-100 ${
                    isHoveringBar || isScrubbing ? "w-3.5 h-3.5 scale-125" : "w-3 h-3 scale-100"
                  }`}
                  style={{ left: `${progressPercent}%` }}
                />
              )}
            </div>
          </div>

          {/* Minimal Controls Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Play/Pause, Jumps, Volume & Subtitles */}
            <div className="flex items-center gap-1">
              <button
                onClick={togglePlayPause}
                className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 border border-white/20 text-white font-bold flex items-center justify-center active:scale-95 transition-all cursor-pointer backdrop-blur-md"
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              <button
                onClick={() => handleAccumulatingSkip("left")}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md active:scale-95"
                title="Rewind 10s (Repeated taps accumulate: -10s, -20s, -30s...)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleAccumulatingSkip("right")}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md active:scale-95"
                title="Forward 10s (Repeated taps accumulate: +10s, +20s, +30s...)"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Interactive Volume Controller with Expandable Slider */}
              <div
                className="relative flex items-center"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md"
                  title={isMuted ? "Unmute (M)" : "Mute (M)"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                  ) : volume < 50 ? (
                    <Volume1 className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>

                {showVolumeSlider && (
                  <div className="flex items-center pl-1.5 pr-2 py-1 bg-zinc-850 rounded-xl animate-in fade-in slide-in-from-left-2 duration-150">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => changeVolume(Number(e.target.value))}
                      className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                      title={`Volume: ${isMuted ? 0 : volume}%`}
                    />
                  </div>
                )}
              </div>

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

            {/* Speed Controller: Supports speeds up to 4.0x */}
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
