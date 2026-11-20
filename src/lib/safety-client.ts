// Client-side helpers for block / unblock / block status.

export interface BlockStatus {
  blockedByMe: boolean;
  blockedMe: boolean;
}

export async function fetchBlockStatus(userId: string): Promise<BlockStatus | null> {
  try {
    const res = await fetch(`/api/users/${userId}/block`);
    const d = await res.json();
    return d.success ? { blockedByMe: !!d.blockedByMe, blockedMe: !!d.blockedMe } : null;
  } catch {
    return null;
  }
}

/** Returns true on success. */
export async function setBlocked(userId: string, block: boolean): Promise<boolean> {
  try {
    const res = await fetch(`/api/users/${userId}/block`, { method: block ? "POST" : "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}
