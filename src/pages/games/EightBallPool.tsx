import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  RotateCcw,
  Volume2,
  Info,
  Sparkles,
  Gamepad2,
  Users,
  Bot,
  CircleDot,
  Trophy,
} from "lucide-react";
import { sfxClick } from "../../lib/sound";

export function EightBallPool() {
  const [fullscreen, setFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    sfxClick();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  const handleRestart = () => {
    sfxClick();
    setIframeKey((k) => k + 1);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/games"
            onClick={sfxClick}
            className="btn btn-secondary px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Games</span>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎱</span>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--ink)] tracking-tight">
                8-Ball Pool
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                HTML5 Canvas
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp((p) => !p)}
            className="btn btn-secondary px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            title="How to play"
          >
            <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline">Rules &amp; Controls</span>
          </button>

          <button
            onClick={handleRestart}
            className="btn btn-secondary px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            title="Restart Game"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="btn btn-primary px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            title="Toggle Fullscreen"
          >
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{fullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>
        </div>
      </div>

      {/* Game Window Container */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-3xl overflow-hidden bg-black border border-[var(--hairline)] shadow-xl transition-all flex flex-col items-center justify-center ${
          fullscreen ? "h-screen w-screen rounded-none border-none p-0" : "aspect-16/9 min-h-[480px] max-h-[82vh]"
        }`}
      >
        <iframe
          key={iframeKey}
          src="/games/8ball-pool/index.html"
          title="8-Ball Pool Game"
          className="w-full h-full border-0 select-none block"
          allow="autoplay; fullscreen"
        />

        {/* Floating In-Game Fullscreen Shortcut (Visible in fullscreen) */}
        {fullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-50 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-bold border border-white/20 backdrop-blur-md flex items-center gap-1.5"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Fullscreen</span>
          </button>
        )}
      </div>

      {/* Rules / Guide Dropdown / Modal */}
      {showHelp && (
        <div className="surface-elevated rounded-3xl p-5 sm:p-6 border border-[var(--hairline)] shadow-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="font-bold text-base text-[var(--ink)]">How to Play 8-Ball Pool</h3>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="text-xs text-[var(--muted)] hover:text-[var(--ink)] font-semibold"
            >
              Close
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div className="surface p-4 rounded-2xl border border-[var(--hairline)] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
                <CircleDot className="w-4 h-4 text-[var(--accent)]" />
                <span>Aim &amp; Cue Control</span>
              </div>
              <p className="text-[var(--muted)] leading-relaxed">
                Click and drag your mouse or finger around the cue ball to rotate and align your aiming line. Adjust cue ball spin on the bottom right ball widget.
              </p>
            </div>

            <div className="surface p-4 rounded-2xl border border-[var(--hairline)] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
                <Bot className="w-4 h-4 text-emerald-500" />
                <span>Game Modes</span>
              </div>
              <p className="text-[var(--muted)] leading-relaxed">
                Choose <strong>Player vs AI</strong> (select Easy, Medium, or Hard bot difficulty) or pass-and-play in <strong>Player vs Player</strong> on the same device.
              </p>
            </div>

            <div className="surface p-4 rounded-2xl border border-[var(--hairline)] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Winning Rules</span>
              </div>
              <p className="text-[var(--muted)] leading-relaxed">
                Pocket all 7 of your assigned balls (either <strong>Solids 1-7</strong> or <strong>Stripes 9-15</strong>), then pot the black <strong>8-Ball</strong> into a called pocket to win!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feature Highlights Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="surface-elevated p-3.5 rounded-2xl border border-[var(--hairline)] text-center space-y-1">
          <div className="text-xs font-bold text-[var(--ink)] flex items-center justify-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Intelligent AI</span>
          </div>
          <div className="text-[11px] text-[var(--muted)]">3 bot difficulty levels</div>
        </div>

        <div className="surface-elevated p-3.5 rounded-2xl border border-[var(--hairline)] text-center space-y-1">
          <div className="text-xs font-bold text-[var(--ink)] flex items-center justify-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span>Local 2-Player</span>
          </div>
          <div className="text-[11px] text-[var(--muted)]">Pass &amp; play with friends</div>
        </div>

        <div className="surface-elevated p-3.5 rounded-2xl border border-[var(--hairline)] text-center space-y-1">
          <div className="text-xs font-bold text-[var(--ink)] flex items-center justify-center gap-1.5">
            <CircleDot className="w-3.5 h-3.5 text-amber-500" />
            <span>Spin &amp; English</span>
          </div>
          <div className="text-[11px] text-[var(--muted)]">Top, back &amp; side spin</div>
        </div>

        <div className="surface-elevated p-3.5 rounded-2xl border border-[var(--hairline)] text-center space-y-1">
          <div className="text-xs font-bold text-[var(--ink)] flex items-center justify-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-purple-500" />
            <span>Billiard Audio</span>
          </div>
          <div className="text-[11px] text-[var(--muted)]">Realistic ball collision sfx</div>
        </div>
      </div>
    </div>
  );
}
