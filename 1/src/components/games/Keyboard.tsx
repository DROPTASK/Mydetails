import { KEYBOARD_ROWS, isVowel } from "../../lib/bollywoodGame";
import { cn } from "../../lib/utils";
import { sfxClick, sfxPop } from "../../lib/sound";

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
  return (
    <div className="flex flex-col items-center gap-1.5 w-full max-w-md mx-auto">
      {KEYBOARD_ROWS.map((row, i) => (
        <div key={i} className="flex gap-1 justify-center w-full">
          {[...row]
            .filter((letter) => !isVowel(letter))
            .map((letter) => {
              const used = guessed.includes(letter);
              const correct = correctLetters.includes(letter);
              return (
                <button
                  key={letter}
                  disabled={used || disabled}
                  onClick={() => {
                    correct ? sfxPop() : sfxClick();
                    onGuess(letter);
                  }}
                  className={cn("key-cap", used && "key-cap-used", correct && "key-cap-correct")}
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
