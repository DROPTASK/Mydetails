import { Link } from "react-router-dom";
import { Terminal, HardDrive, Gamepad2, ArrowRight, Sparkles, Code2 } from "lucide-react";
import { AssetList } from "./AssetList";
import { sfxClick } from "../lib/sound";

export function Apps() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Featured Core Built-in Applications */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Built-in Web Utilities &amp; Systems
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Sonic HTML5 Card */}
          <Link
            to="/games/sonic"
            onClick={sfxClick}
            className="surface-elevated p-4 rounded-2xl border border-[var(--hairline)] hover:border-[var(--accent)]/40 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-lg">
                🦔
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                    Sonic HTML5
                  </h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    Mobile &amp; PC
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2 leading-snug">
                  Classic Green Hill Zone arcade sprint with on-screen mobile touch gamepad and 50 rings challenge.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-2 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-semibold text-[var(--accent)]">
              <span>Play Now</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Python Interpreter Card */}
          <Link
            to="/apps/python"
            onClick={sfxClick}
            className="surface-elevated p-4 rounded-2xl border border-[var(--hairline)] hover:border-[var(--accent)]/40 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg">
                🐍
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                    Python Interpreter
                  </h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    CPython WASM
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2 leading-snug">
                  In-browser Python 3.12 runner with script editor, interactive REPL shell, and math algorithms.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-2 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-semibold text-[var(--accent)]">
              <span>Launch IDE</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Projects File Explorer Card */}
          <Link
            to="/projects"
            onClick={sfxClick}
            className="surface-elevated p-4 rounded-2xl border border-[var(--hairline)] hover:border-[var(--accent)]/40 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg">
                📁
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                    Projects Explorer
                  </h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Filesystem
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2 leading-snug">
                  Computer path virtual file system. Browse source repositories, code samples, notes, and uploaded files.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-2 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-semibold text-[var(--accent)]">
              <span>Browse Path</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* 8-Ball Pool Card */}
          <Link
            to="/games/8ball-pool"
            onClick={sfxClick}
            className="surface-elevated p-4 rounded-2xl border border-[var(--hairline)] hover:border-[var(--accent)]/40 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-lg">
                🎱
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                    8-Ball Pool
                  </h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    Canvas Physics
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2 leading-snug">
                  Classic billiards simulation with realistic ball collisions, spin control, and Player vs AI.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-2 border-t border-[var(--hairline)] flex items-center justify-between text-xs font-semibold text-[var(--accent)]">
              <span>Play Now</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Published Portfolio Web Applications */}
      <AssetList type="app" title="Curated Applications" empty="No additional external apps published yet. Add them in admin." />
    </div>
  );
}
