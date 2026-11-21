// Shared (client + server) settings for "Support DoonMeet" payments.
export const SUPPORT_PRESETS = [
  { amount: 20, emoji: "☕", label: "A chai" },
  { amount: 50, emoji: "☕", label: "A coffee" },
  { amount: 100, emoji: "🍜", label: "Maggi + chai" },
  { amount: 250, emoji: "🎉", label: "Party time" },
] as const;
export const SUPPORT_DEFAULT_RUPEES = 50;
export const SUPPORT_MIN_RUPEES = 10;
export const SUPPORT_MAX_RUPEES = 5000;
/** − / + buttons on the custom amount move by this much. */
export const SUPPORT_STEP_RUPEES = 10;
