import type { DmMessageType, DmReactionEntry, DmReplyTo, DmSharedProfile } from "@/lib/dmShared";

/** A direct message as the chat UI sees it (history API and live socket payloads). */
export interface DMMessage {
  _id: string;
  conversationId: string;
  content: string;
  createdAt: string;
  type?: DmMessageType;
  replyTo?: DmReplyTo | null;
  sharedProfile?: DmSharedProfile | null;
  reactions?: DmReactionEntry[];
  sender: {
    _id: string;
    name: string;
    avatar: string | null;
  };
  // Present on messages loaded from history; live socket payloads omit it.
  readBy?: { userId: string; readAt: string }[];
}

export interface PresenceInfo {
  isOnline: boolean;
  lastSeenAt: string | null;
}
