// Direct-message shapes and constants shared by the server (socket + REST)
// and the browser. Keep this file free of server-only imports (no models,
// no "next/…") — the chat UI imports it too.

/** Quick reactions, WhatsApp-style. One reaction per person per message. */
export const DM_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;
export type DmReaction = (typeof DM_REACTIONS)[number];

export function isDmReaction(value: unknown): value is DmReaction {
  return typeof value === "string" && (DM_REACTIONS as readonly string[]).includes(value);
}

/** Snapshot of the message being replied to — survives even if it's not loaded. */
export interface DmReplyTo {
  messageId: string;
  senderId: string;
  preview: string;
}

/** A profile card sent in the chat. */
export interface DmSharedProfile {
  userId: string;
  name: string;
  avatar: string | null;
}

export interface DmReactionEntry {
  userId: string;
  emoji: string;
}

export type DmMessageType = "text" | "profile";

/** Longest quoted text kept with a reply. */
export const DM_REPLY_PREVIEW_MAX = 120;

/** The plain-text body stored for a profile card (shown in previews, notifications, admin). */
export function sharedProfileText(name: string): string {
  return `Shared a profile: ${name}`;
}

/** Text for a reply quote: one line, trimmed. */
export function replyPreviewText(content: string): string {
  const oneLine = content.replace(/\s+/g, " ").trim();
  return oneLine.length > DM_REPLY_PREVIEW_MAX ? `${oneLine.slice(0, DM_REPLY_PREVIEW_MAX - 1)}…` : oneLine;
}
