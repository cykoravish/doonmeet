// Persists the "All members" panel's loaded list, pagination cursor, and
// scroll offset across a client-side navigation to a profile page and back.
// A plain module-level object survives as long as the SPA doesn't do a full
// page reload — no localStorage/sessionStorage plumbing needed for what is
// essentially "remember where I was for this tab session".
import type { MemberUser } from "@/components/chat/UserListItem";

interface ChatUsersState {
  users: MemberUser[];
  page: number;
  hasMore: boolean;
  search: string;
  scrollTop: number;
}

function createEmptyState(): ChatUsersState {
  return { users: [], page: 1, hasMore: true, search: "", scrollTop: 0 };
}

let state: ChatUsersState = createEmptyState();

export function getChatUsersState(): ChatUsersState {
  return state;
}

export function setChatUsersState(partial: Partial<ChatUsersState>): void {
  state = { ...state, ...partial };
}

export function resetChatUsersState(): void {
  state = createEmptyState();
}
