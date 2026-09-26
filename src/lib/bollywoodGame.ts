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

/** A sentence hint unlocks once half the lives are used (or after 3 wrong guesses in unlimited mode) — once per game. */
export function hintAvailable(state: WordState): boolean {
  if (state.status !== "playing" || state.hintUsed) return false;

  if (state.maxLives >= 999) {
    const wrongCount = state.guessed.filter(
      (g) => !state.cells.some((c) => c.char.toLowerCase() === g)
    ).length;
    return wrongCount >= 3;
  }

  const usedLives = state.maxLives - state.livesLeft;
  return usedLives >= Math.ceil(state.maxLives / 2);
}

export function markHintUsed(state: WordState): WordState {
  return { ...state, hintUsed: true };
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

/** Applies a single letter guess and returns the next state. Supports unlimited lives. */
export function guessLetter(state: WordState, letterRaw: string): WordState {
  if (state.status !== "playing") return state;
  const letter = letterRaw.toLowerCase();
  if (state.guessed.includes(letter) || isVowel(letter)) return state;

  const present = state.cells.some((c) => c.char.toLowerCase() === letter && c.status !== "space");
  const cells = state.cells.map((c) =>
    c.char.toLowerCase() === letter && c.status === "hidden" ? { ...c, status: "revealed" as LetterStatus } : c
  );
  const guessed = [...state.guessed, letter];

  // If maxLives >= 999, lives are unlimited and never decrease
  const isUnlimited = state.maxLives >= 999;
  const livesLeft = isUnlimited ? state.livesLeft : present ? state.livesLeft : state.livesLeft - 1;

  const won = !cells.some((c) => c.status === "hidden");
  const status: WordState["status"] = won ? "won" : !isUnlimited && livesLeft <= 0 ? "lost" : "playing";

  return { ...state, cells, guessed, livesLeft, status };
}

/** Reveals all letters in the word (e.g. when round is won or lost) */
export function revealAllLetters(state: WordState): WordState {
  const cells = state.cells.map((c) =>
    c.status === "hidden" ? { ...c, status: "revealed" as LetterStatus } : c
  );
  return { ...state, cells };
}

/** Colour-only snapshot for showing an opponent's progress without revealing letters. */
export type OpponentSnapshot = { statuses: LetterStatus[]; livesLeft: number; status: WordState["status"] };

export function toOpponentSnapshot(state: WordState): OpponentSnapshot {
  return { statuses: state.cells.map((c) => c.status), livesLeft: state.livesLeft, status: state.status };
}

export const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
