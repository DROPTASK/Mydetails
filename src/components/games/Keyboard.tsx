import { useEffect } from "react";
import { isVowel } from "../../lib/bollywoodGame";
import { cn } from "../../lib/utils";
import { sfxClick, sfxPop } from "../../lib/sound";

// Standard standardized 3-row QWERTY keyboard layout
const QWERTY_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export function Keyboard({
  guessed,
  correctLetters,
  disabled,
  onGuess,
}: {
  guessed: string[];
  correctLetters: string[];
  disabled?: boolean;
  onGuess: (letter: string) => void;
}) {
  const normalizedGuessed = guessed.map((g) => g.toLowerCase());
  const normalizedCorrect = correctLetters.map((c) => c.toLowerCase());

  // Listen to physical keyboard presses for seamless rapid typing
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        const letter = e.key.toLowerCase();
        if (isVowel(letter)) {
          // Vowels are pre-revealed
          sfxClick();
          return;
        }
        if (!normalizedGuessed.includes(letter)) {
          sfxClick();
          onGuess(letter);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, normalizedGuessed, onGuess]);

  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-2 w-full max-w-lg mx-auto select-none touch-manipulation px-1">
      {QWERTY_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 sm:gap-1.5 justify-center w-full">
          {row.map((letter) => {
            const lower = letter.toLowerCase();
            const vowel = isVowel(lower);
            const isUsed = normalizedGuessed.includes(lower);
            const isCorrect = normalizedCorrect.includes(lower);

            if (vowel) {
              return (
                <button
                  key={letter}
                  type="button"
                  title="Vowels are free in this puzzle!"
                  onClick={() => sfxClick()}
                  className="key-cap key-cap-vowel flex-1 max-w-[42px] sm:max-w-[48px] h-10 sm:h-12 rounded-xl text-xs sm:text-sm font-bold font-mono transition-all flex flex-col items-center justify-center relative cursor-default"
                >
                  <span>{letter}</span>
                  <span className="text-[8px] font-sans font-extrabold uppercase text-[var(--accent)] tracking-tighter -mt-0.5 opacity-80">
                    free
                  </span>
                </button>
              );
            }

            return (
              <button
                key={letter}
                type="button"
                disabled={isUsed || disabled}
                onClick={() => {
                  if (isCorrect) {
                    sfxPop();
                  } else {
                    sfxClick();
                  }
                  onGuess(lower);
                }}
                className={cn(
                  "key-cap flex-1 max-w-[42px] sm:max-w-[48px] h-10 sm:h-12 rounded-xl text-sm sm:text-base font-bold font-mono transition-all flex items-center justify-center",
                  isCorrect && "key-cap-correct scale-105 shadow-md",
                  isUsed && !isCorrect && "key-cap-used cursor-not-allowed opacity-30 line-through"
                )}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
