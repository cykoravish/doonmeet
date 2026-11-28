// Public-chat ("Doon" room) shapes shared by the server (socket + REST) and
// the browser. Keep this file free of server-only imports — the chat UI
// imports it too.

/** The quote shown on a reply in the public chat. */
export interface RoomReplyTo {
  messageId: string;
  senderId: string;
  /** Looked up live, so a renamed or deleted account shows its current name. */
  senderName: string;
  /** Empty when `removed` — a moderated message's text is never re-shown. */
  preview: string;
  /** The quoted message was deleted (e.g. by a moderator). */
  removed?: boolean;
}
