const VOWELS = new Set(["a", "e", "i", "o", "u"]);

export type LetterStatus = "space" | "vowel" | "hidden" | "revealed";

export type LetterCell = { char: string; status: LetterStatus };

export type WordState = {
  title: string;
  cells: LetterCell[];
  guessed: string[]; // letters the player has tried (lowercase)
  livesLeft: number;
  maxLives: number;
  hintUsed: boolean;
  status: "playing" | "won" | "lost";
};

export function isVowel(ch: string) {
  return VOWELS.has(ch.toLowerCase());
}

export function buildWordState(title: string, maxLives: number): WordState {
  const cells: LetterCell[] = [...title].map((ch) => {
    if (!/[a-zA-Z]/.test(ch)) return { char: ch, status: "space" };
    if (isVowel(ch)) return { char: ch, status: "vowel" };
    return { char: ch, status: "hidden" };
  });
  return {
    title,
    cells,
    guessed: [],
    livesLeft: maxLives,
    maxLives,
    hintUsed: false,
    status: cells.some((c) => c.status === "hidden") ? "playing" : "won",
  };
}

/** Applies a single letter guess and returns the next state. Pure function. */
export function guessLetter(state: WordState, letterRaw: string): WordState {
  if (state.status !== "playing") return state;
  const letter = letterRaw.toLowerCase();
  if (state.guessed.includes(letter) || isVowel(letter)) return state;

  const present = state.cells.some((c) => c.char.toLowerCase() === letter && c.status !== "space");
  const cells = state.cells.map((c) =>
    c.char.toLowerCase() === letter && c.status === "hidden" ? { ...c, status: "revealed" as LetterStatus } : c
  );
  const guessed = [...state.guessed, letter];
  const livesLeft = present ? state.livesLeft : state.livesLeft - 1;

  let hintUsed = state.hintUsed;
  let finalCells = cells;
  const usedLives = state.maxLives - livesLeft;
  if (!hintUsed && usedLives >= Math.ceil(state.maxLives / 2) && livesLeft > 0) {
    const hiddenIdx = finalCells.findIndex((c) => c.status === "hidden");
    if (hiddenIdx !== -1) {
      finalCells = finalCells.map((c, i) => (i === hiddenIdx ? { ...c, status: "revealed" as LetterStatus } : c));
      hintUsed = true;
    }
  }

  const won = !finalCells.some((c) => c.status === "hidden");
  const status: WordState["status"] = won ? "won" : livesLeft <= 0 ? "lost" : "playing";

  return { ...state, cells: finalCells, guessed, livesLeft, hintUsed, status };
}

/** Colour-only snapshot for showing an opponent's progress without revealing letters. */
export type OpponentSnapshot = { statuses: LetterStatus[]; livesLeft: number; status: WordState["status"] };

export function toOpponentSnapshot(state: WordState): OpponentSnapshot {
  return { statuses: state.cells.map((c) => c.status), livesLeft: state.livesLeft, status: state.status };
}

export const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
