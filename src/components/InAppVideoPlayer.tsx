import { useState, useEffect, useRef } from "react";
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

// Preset speeds up to 10x
const SPEED_PRESETS = [1, 1.5, 2, 3, 5, 10];

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
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-hide controls when user is inactive for 4 seconds
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimerRef = useRef<any>(null);

  const resetHideControlsTimer = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    // Only auto-hide if video is playing
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
  };

  useEffect(() => {
    resetHideControlsTimer();
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [isPlaying]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // PostMessage helper for IFrame communication
  const sendCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
      );
    }
  };

  // Initialize YouTube Iframe Player (controls=0)
  useEffect(() => {
    if (!videoId) return;

    let destroyed = false;

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
                const dur = event.target.getDuration();
                if (dur && dur > 0) setDuration(dur);
                event.target.playVideo();
                // Apply desired playback speed up to 10x
                if (playbackSpeed !== 1) {
                  event.target.setPlaybackRate(playbackSpeed);
                }
              } catch {}
            },
            onStateChange: (event: any) => {
              if (destroyed) return;
              // 1 = playing, 2 = paused, 0 = ended
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                setIsPlaying(false);
              }
            },
            onPlaybackRateChange: (event: any) => {
              if (!destroyed && event.data) {
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
          if (typeof data.info.playbackRate === "number") {
            setPlaybackSpeed(data.info.playbackRate);
          }
        }
      } catch {}
    };
    window.addEventListener("message", handleMessage);

    // Polling interval to track smooth time progress
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
    }, 400);

    return () => {
      destroyed = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("message", handleMessage);
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, [videoId]);

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
    const newTarget = Math.max(0, Math.min(duration || 999999, currentTime + secondsOffset));
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

  // Speed change up to 10x
  const changeSpeed = (speed: number) => {
    sfxClick();
    const clamped = Math.max(0.25, Math.min(10, Math.round(speed * 100) / 100));
    setPlaybackSpeed(clamped);

    if (playerRef.current && typeof playerRef.current.setPlaybackRate === "function") {
      try {
        playerRef.current.setPlaybackRate(clamped);
      } catch {}
    }
    sendCommand("setPlaybackRate", [clamped]);
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

  // Remaining time calculation adjusted for playback speed (up to 10x)
  const remainingSeconds = Math.max(0, duration - currentTime);
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
          className={`flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800/80 transition-all duration-300 ease-in-out ${
            showControls
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4 pointer-events-none max-h-0 py-0 border-b-0 overflow-hidden"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {subjectName && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                {subjectName}
              </span>
            )}
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100 truncate max-w-[240px] sm:max-w-md">
              {videoTitle || taskName || "Chapter Lecture"}
            </h3>
            {playbackSpeed !== 1 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 fill-purple-300" />
                <span>{playbackSpeed}x</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
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

        {/* Video Player Display Container (controls=0 hides default YT controls) */}
        <div
          className={`relative bg-black w-full flex items-center justify-center overflow-hidden select-none ${
            isFullscreen ? "flex-1" : "aspect-video"
          }`}
        >
          {videoId ? (
            <>
              <iframe
                ref={iframeRef}
                id={`yt-player-${videoId}`}
                src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&autoplay=1&controls=0&disablekb=1&fs=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
                title={videoTitle || taskName || "Study Lecture"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full border-0 pointer-events-none"
              />

              {/* Click Overlay on Video to Toggle Play/Pause smoothly */}
              <div
                onClick={togglePlayPause}
                className="absolute inset-0 cursor-pointer flex items-center justify-center z-10"
              >
                {showCenterIcon && (
                  <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-2xl animate-in zoom-in-75 duration-200">
                    {isPlaying ? <Play className="w-8 h-8 fill-white ml-1" /> : <Pause className="w-8 h-8 fill-white" />}
                  </div>
                )}
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
          className={`p-2.5 sm:p-3 bg-zinc-900/95 border-t border-zinc-800/80 space-y-2 transition-all duration-300 ease-in-out ${
            showControls
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none max-h-0 py-0 border-t-0 overflow-hidden"
          }`}
        >
          {/* Progress Slider & Timestamps */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <div className="flex items-center gap-1 font-semibold text-zinc-200">
                <Clock className="w-3 h-3 text-[var(--accent)]" />
                <span>{formatVideoTime(currentTime)}</span>
                <span className="text-zinc-500">/</span>
                <span>{formatVideoTime(duration)}</span>
              </div>

              {duration > 0 && (
                <div className="text-[11px] text-zinc-400 font-sans">
                  ⏱️ <strong className="text-zinc-200">{formatVideoTime(remainingAtSpeed)}</strong> left
                  {playbackSpeed !== 1 && (
                    <span className="text-purple-400 font-bold ml-1">
                      ({playbackSpeed}x)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Scrub Slider */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeekSlider(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--accent)] hover:h-1.5 transition-all"
            />
          </div>

          {/* Minimal Controls Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Play/Pause & Jumps */}
            <div className="flex items-center gap-1">
              <button
                onClick={togglePlayPause}
                className="w-8 h-8 rounded-xl bg-white text-black font-bold flex items-center justify-center hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
              </button>

              <button
                onClick={() => seekRelative(-10)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Rewind 10s"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => seekRelative(10)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Forward 10s"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={toggleMute}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors ml-0.5 cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Speed Controller (Up to 10x speed!) */}
            <div className="relative flex items-center gap-1 bg-zinc-950 border border-zinc-800/80 px-1 py-0.5 rounded-xl">
              <span className="text-[10px] font-bold text-zinc-400 px-1 uppercase tracking-wider flex items-center gap-1">
                <Gauge className="w-3 h-3 text-purple-400" />
                <span>Speed</span>
              </span>

              {/* Preset Buttons up to 10x */}
              <div className="flex items-center gap-0.5">
                {SPEED_PRESETS.map((rate) => {
                  const isActive = playbackSpeed === rate;
                  return (
                    <button
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                      }`}
                    >
                      {rate}x
                    </button>
                  );
                })}
              </div>

              {/* Custom Speed Slider / Quick Fine-Tune (0.25x - 10.0x) */}
              <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-zinc-800">
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.25}
                  value={playbackSpeed}
                  onChange={(e) => changeSpeed(Number(e.target.value))}
                  className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  title={`Speed: ${playbackSpeed}x (Up to 10x)`}
                />
                <span className="text-[10px] font-mono font-bold text-purple-400 w-8 text-right">
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
