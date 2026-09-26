import { useState } from "react";
import { User, Edit2, Check, X } from "lucide-react";
import { getStoredGameUser, saveStoredGameUser, type GameUser } from "../../lib/userStore";
import { sfxClick, sfxSuccess } from "../../lib/sound";

export function PlayerBadge({
  user,
  onUserChange,
}: {
  user: GameUser;
  onUserChange: (user: GameUser) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(user.name);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const updated = saveStoredGameUser(newName.trim(), user.id);
    onUserChange(updated);
    setEditing(false);
    sfxSuccess();
  };

  const handleCancel = () => {
    setNewName(user.name);
    setEditing(false);
    sfxClick();
  };

  if (editing) {
    return (
      <form onSubmit={handleSave} className="inline-flex items-center gap-1.5 p-1 rounded-full bg-[var(--surface-2)] border border-[var(--accent)] shadow-sm">
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--accent)]">
          #{user.id}
        </span>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={18}
          autoFocus
          className="bg-transparent text-xs font-bold text-[var(--ink)] w-28 px-1 py-0.5 outline-none"
        />
        <button
          type="submit"
          className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:opacity-90 cursor-pointer"
          title="Save name"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="w-6 h-6 rounded-full bg-[var(--surface)] text-[var(--muted)] flex items-center justify-center hover:text-[var(--ink)] cursor-pointer"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </form>
    );
  }

  return (
    <div
      onClick={() => {
        sfxClick();
        setNewName(user.name);
        setEditing(true);
      }}
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--hairline)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--ink)] transition-all cursor-pointer group shadow-2xs"
      title="Click to edit your nickname"
    >
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="font-bold">{user.name}</span>
      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[var(--surface)] text-[var(--accent)] font-bold">
        #{user.id}
      </span>
      <Edit2 className="w-3 h-3 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors opacity-70 group-hover:opacity-100" />
    </div>
  );
}
