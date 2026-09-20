import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { sfxClick, sfxCoin, sfxPop } from "../../lib/sound";

const CHOICES = [
  { id: "rock", emoji: "🪨", label: "Rock" },
  { id: "paper", emoji: "📄", label: "Paper" },
  { id: "scissors", emoji: "✂️", label: "Scissors" },
] as const;
type Choice = (typeof CHOICES)[number]["id"];

function beats(a: Choice, b: Choice) {
  return (a === "rock" && b === "scissors") || (a === "paper" && b === "rock") || (a === "scissors" && b === "paper");
}

export function RockPaperScissors() {
  const [you, setYou] = useState<Choice | null>(null);
  const [cpu, setCpu] = useState<Choice | null>(null);
  const [scores, setScores] = useState({ you: 0, cpu: 0 });
  const [result, setResult] = useState<"win" | "lose" | "draw" | null>(null);

  const play = (choice: Choice) => {
    sfxClick();
    const cpuChoice = CHOICES[Math.floor(Math.random() * 3)].id;
    setYou(choice);
    setCpu(cpuChoice);
    if (choice === cpuChoice) {
      setResult("draw");
    } else if (beats(choice, cpuChoice)) {
      setResult("win");
      setScores((s) => ({ ...s, you: s.you + 1 }));
      sfxCoin();
    } else {
      setResult("lose");
      setScores((s) => ({ ...s, cpu: s.cpu + 1 }));
      sfxPop();
    }
  };

  const reset = () => {
    setYou(null);
    setCpu(null);
    setResult(null);
  };

  const emoji = (id: Choice | null) => CHOICES.find((c) => c.id === id)?.emoji ?? "❔";

  return (
    <div className="max-w-xs mx-auto text-center space-y-6 pt-6">
      <h2 className="text-2xl font-extrabold">✊ Rock · Paper · Scissors</h2>
      <div className="flex justify-center gap-6 text-sm font-semibold">
        <span style={{ color: "var(--accent)" }}>You · {scores.you}</span>
        <span style={{ color: "var(--muted)" }}>CPU · {scores.cpu}</span>
      </div>

      <div className="flex items-center justify-center gap-6 text-5xl">
        <span>{emoji(you)}</span>
        <span className="text-lg font-bold" style={{ color: "var(--muted)" }}>vs</span>
        <span>{emoji(cpu)}</span>
      </div>

      {result && (
        <p className="text-lg font-extrabold">
          {result === "draw" ? "Draw!" : result === "win" ? "You win! 🎉" : "CPU wins 😅"}
        </p>
      )}

      <div className="flex justify-center gap-3">
        {CHOICES.map((c) => (
          <button key={c.id} onClick={() => play(c.id)} className="w-16 h-16 rounded-2xl surface text-3xl flex items-center justify-center active:scale-95 transition-transform">
            {c.emoji}
          </button>
        ))}
      </div>

      {result && (
        <button onClick={reset} className="btn btn-secondary px-5 py-2.5 mx-auto">
          <RotateCcw className="w-4 h-4" /> Play again
        </button>
      )}
    </div>
  );
}
