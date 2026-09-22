import type { LetterCell, LetterStatus } from "../../lib/bollywoodGame";
import { cn } from "../../lib/utils";

const COLORS: Record<LetterStatus, string> = {
  space: "transparent",
  vowel: "var(--accent)",
  hidden: "var(--surface-2)",
  revealed: "#34c759",
};

/** self=true shows letters; self=false (an opponent's board) shows colour only. */
export function WordBoard({
  cells,
  statuses,
  self = true,
}: {
  cells?: LetterCell[];
  statuses?: LetterStatus[];
  self?: boolean;
}) {
  const list: { char?: string; status: LetterStatus }[] = cells
    ? cells.map((c) => ({ char: c.char, status: c.status }))
    : (statuses || []).map((s) => ({ status: s }));

  const words: { char?: string; status: LetterStatus }[][] = [[]];
  for (const cell of list) {
    if (cell.status === "space") words.push([]);
    else words[words.length - 1].push(cell);
  }

  return (
    <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-2">
      {words.map((word, wi) =>
        word.length === 0 ? null : (
          <div key={wi} className="flex gap-1">
            {word.map((cell, i) => (
              <div
                key={i}
                className={cn(
                  "w-7 h-9 sm:w-8 sm:h-10 rounded-md flex items-center justify-center font-extrabold text-sm sm:text-base uppercase",
                  cell.status === "revealed" && "letter-pop"
                )}
                style={{
                  background: self ? "var(--surface)" : COLORS[cell.status],
                  border: `2px solid ${self ? COLORS[cell.status] : "transparent"}`,
                  color: self ? "var(--ink)" : "transparent",
                }}
              >
                {self ? (cell.status !== "hidden" ? cell.char : "") : ""}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
