import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  RotateCcw,
  Info,
  Sparkles,
  Gamepad2,
  Smartphone,
  ShieldAlert,
  Trophy,
} from "lucide-react";
import { sfxClick } from "../../lib/sound";

export function SonicGame() {
  const [fullscreen, setFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    sfxClick();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setFullscreen(false))
        .catch(() => {});
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
              <span className="text-xl">🦔</span>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--ink)] tracking-tight">
                Sonic HTML5
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Green Hill Zone
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sfxClick();
              setShowHelp((p) => !p);
            }}
            className="btn btn-secondary px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            title="How to play"
          >
            <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline">Guide &amp; Controls</span>
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
        className={`relative w-full rounded-3xl overflow-hidden bg-[#0d1117] border border-[var(--hairline)] shadow-xl transition-all flex flex-col items-center justify-center ${
          fullscreen ? "h-screen w-screen rounded-none border-none p-0" : "min-h-[500px] sm:min-h-[540px] h-[540px]"
        }`}
      >
        <iframe
          key={iframeKey}
          src="/games/sonic/index.html"
          title="Sonic the Hedgehog HTML5"
          className="w-full h-full min-h-[500px] sm:min-h-[540px] border-0 select-none block"
          allow="autoplay; fullscreen"
        />

        {/* Floating In-Game Fullscreen Shortcut */}
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
              <h3 className="font-bold text-base text-[var(--ink)]">How to Play Sonic HTML5</h3>
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
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span>Mobile Touch Controls</span>
              </div>
              <p className="text-[var(--muted)] leading-relaxed">
                Use the on-screen tactile buttons: tap or hold <strong>◀ LEFT</strong> and <strong>▶ RIGHT</strong> to sprint across Green Hill Zone. Tap <strong>▲ JUMP</strong> to leap into the air.
              </p>
            </div>

            <div className="surface p-4 rounded-2xl border border-[var(--hairline)] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
                <Gamepad2 className="w-4 h-4 text-blue-500" />
                <span>Desktop Keyboard</span>
              </div>
              <p className="text-[var(--muted)] leading-relaxed">
                Use <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border text-[10px]">Arrow Keys</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border text-[10px]">A</kbd>/<kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border text-[10px]">D</kbd> to run. Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border text-[10px]">Up</kbd>, <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border text-[10px]">W</kbd>, or <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border text-[10px]">Space</kbd> to jump. Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border text-[10px]">R</kbd> to restart.
              </p>
            </div>

            <div className="surface p-4 rounded-2xl border border-[var(--hairline)] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Collect 50 Rings &amp; Win</span>
              </div>
              <p className="text-[var(--muted)] leading-relaxed">
                Collect all 50 rings scattered along the ground and in the air. Watch out for dangerous spike traps—jumping at the right moment lets you clear obstacles and catch Dr. Eggman!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
