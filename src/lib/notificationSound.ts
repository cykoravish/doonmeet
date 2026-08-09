// Plays a short two-tone chime for incoming personal (DM) messages.
// Synthesized with the Web Audio API instead of an audio file — no asset
// to host/download, and it's tiny/instant to "load".
// ============================================================

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }

  // Browsers suspend AudioContext until a user gesture has happened
  // somewhere on the page — by the time a DM notification arrives the
  // person has almost certainly already clicked/tapped, so this just
  // resumes a context that's likely already unlocked.
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

function tone(ctx: AudioContext, freq: number, startTime: number, duration: number, peak: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = freq;

  // Quick fade in/out avoids a click/pop at the start and end of the tone.
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peak, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

/**
 * Plays a soft "new message" chime. Safe to call even if audio can't
 * play for some reason (unsupported browser, context blocked, etc) —
 * fails silently since a missed sound should never break the UI.
 */
export function playMessageSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Two-note rising chime: a gentle "ding-ding" rather than a single beep.
    tone(ctx, 740, now, 0.18, 0.18);
    tone(ctx, 988, now + 0.11, 0.22, 0.16);
  } catch {
    // Never let a sound failure surface to the user.
  }
}
