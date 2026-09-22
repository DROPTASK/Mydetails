import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { sfxClick, sfxCoin } from "../../lib/sound";

type Cell = "X" | "O" | null;
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winnerOf(board: Cell[]): { winner: Cell; line: number[] } | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line };
  }
  return null;
}

export function TicTacToe() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [scores, setScores] = useState({ X: 0, O: 0 });

  const result = winnerOf(board);
  const draw = !result && board.every(Boolean);

  const play = (i: number) => {
    if (board[i] || result || draw) return;
    sfxClick();
    const next = [...board];
    next[i] = turn;
    setBoard(next);
    const win = winnerOf(next);
    if (win) {
      sfxCoin();
      setScores((s) => ({ ...s, [win.winner as "X" | "O"]: s[win.winner as "X" | "O"] + 1 }));
    }
    setTurn(turn === "X" ? "O" : "X");
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setTurn("X");
  };

  return (
    <div className="max-w-xs mx-auto text-center space-y-5 pt-6">
      <h2 className="text-2xl font-extrabold">⭕ Tic-Tac-Toe</h2>
      <div className="flex justify-center gap-6 text-sm font-semibold">
        <span style={{ color: "var(--accent)" }}>X · {scores.X}</span>
        <span style={{ color: "var(--muted)" }}>O · {scores.O}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mx-auto" style={{ width: 216 }}>
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => play(i)}
            className="w-16 h-16 rounded-2xl surface flex items-center justify-center text-3xl font-extrabold"
            style={{
              color: cell === "X" ? "var(--accent)" : "var(--ink)",
              outline: result?.line.includes(i) ? "2px solid #34c759" : "none",
            }}
          >
            {cell}
          </button>
        ))}
      </div>
      <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
        {result ? `${result.winner} wins!` : draw ? "Draw!" : `${turn}'s turn`}
      </p>
      <button onClick={reset} className="btn btn-secondary px-5 py-2.5 mx-auto">
        <RotateCcw className="w-4 h-4" /> New round
      </button>
    </div>
  );
}
