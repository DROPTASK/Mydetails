import { useState } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import type { MovieHintData } from "../../lib/tmdb";
import { pickHintChoices, resolveHint, type HintCategory } from "../../lib/movieHints";
import { sfxPop } from "../../lib/sound";

export function HintPicker({
  movieTitle,
  hintData,
  onUsed,
}: {
  movieTitle: string;
  hintData: MovieHintData | null;
  onUsed: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState<HintCategory | null>(null);
  const [sentence, setSentence] = useState<string | null>(null);

  if (sentence) {
    return (
      <div className="hint-card">
        <Lightbulb className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} />
        <span>{sentence}</span>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={!hintData}
        className="btn btn-secondary text-sm px-4 py-2 mx-auto"
      >
        <Lightbulb className="w-4 h-4" /> {hintData ? "Get a hint" : "Loading hint…"}
      </button>
    );
  }

  const choices = hintData ? pickHintChoices(hintData) : [];

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Pick one hint</p>
      <div className="flex flex-wrap justify-center gap-2">
        {choices.map((c) => (
          <button
            key={c.category}
            disabled={!!resolving}
            onClick={async () => {
              if (!hintData) return;
              setResolving(c.category);
              const text = await resolveHint(c.category, hintData, movieTitle);
              setSentence(text);
              setResolving(null);
              onUsed();
              sfxPop();
            }}
            className="pill"
          >
            {resolving === c.category ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
