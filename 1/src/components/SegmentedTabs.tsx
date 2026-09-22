import { sfxClick } from "../lib/sound";
import { cn } from "../lib/utils";

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="segmented-tabs">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => {
            sfxClick();
            onChange(opt.id);
          }}
          className={cn("segmented-tab", value === opt.id && "active")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
