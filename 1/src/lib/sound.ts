// Tiny synthesized sound-effect engine — no audio files to fetch or host.
// Uses the Web Audio API to generate short, soft tones per interaction.
// Respects a localStorage on/off flag so it can be muted.

const SFX_KEY = "vk_sfx_enabled";

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isSfxEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SFX_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function setSfxEnabled(on: boolean) {
  try {
    localStorage.setItem(SFX_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function tone(freq: number, duration: number, opts: { type?: OscillatorType; gain?: number; glideTo?: number } = {}) {
  if (!isSfxEnabled()) return;
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const { type = "sine", gain = 0.05, glideTo } = opts;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, audioCtx.currentTime + duration);

  gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(gain, audioCtx.currentTime + 0.012);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

  osc.connect(gainNode).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration + 0.02);
}

/** Soft UI tap — nav clicks, buttons. */
export function sfxClick() {
  tone(720, 0.05, { type: "sine", gain: 0.04 });
}

/** Two-note coin flip — profile swap. */
export function sfxCoin() {
  tone(660, 0.09, { type: "triangle", gain: 0.06, glideTo: 990 });
  setTimeout(() => tone(990, 0.12, { type: "triangle", gain: 0.05, glideTo: 1320 }), 70);
}

/** Message sent. */
export function sfxSend() {
  tone(520, 0.08, { type: "sine", gain: 0.05, glideTo: 780 });
}

/** Message received / new notification. */
export function sfxPop() {
  tone(880, 0.07, { type: "sine", gain: 0.05 });
}

/** Toggle switches (theme, online status). */
export function sfxToggle() {
  tone(440, 0.06, { type: "square", gain: 0.025 });
}

/** Success chime — e.g. copied, action completed. */
export function sfxSuccess() {
  tone(587.33, 0.08, { type: "sine", gain: 0.04 });
  setTimeout(() => tone(880, 0.12, { type: "sine", gain: 0.04 }), 70);
}

/** Subtle error / cancellation tone. */
export function sfxError() {
  tone(320, 0.1, { type: "triangle", gain: 0.05, glideTo: 220 });
}
