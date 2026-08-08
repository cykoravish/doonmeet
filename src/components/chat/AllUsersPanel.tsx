"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { Socket } from "socket.io-client";
import { X, Search, Users, Loader2, UserX } from "lucide-react";
import UserListItem, { type MemberUser } from "./UserListItem";
import { getChatUsersState, setChatUsersState, resetChatUsersState } from "@/lib/chatUsersStore";

interface AllUsersPanelProps {
  open: boolean;
  onClose: () => void;
  socket: Socket | null;
}

interface PresenceUpdate {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export default function AllUsersPanel({ open, onClose, socket }: AllUsersPanelProps) {
  // Read fresh from the store on every render (cheap — just an object read).
  // Capturing this once at module scope would freeze it at whatever the
  // store held on first import, breaking restoration on later navigations.
  const cached = getChatUsersState();

  const [users, setUsers] = useState<MemberUser[]>(cached.users);
  const [page, setPage] = useState(cached.page);
  const [hasMore, setHasMore] = useState(cached.hasMore);
  const [search, setSearch] = useState(cached.search);
  const [searchInput, setSearchInput] = useState(cached.search);
  const [loading, setLoading] = useState(cached.users.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  // -------------------------------------------------------
  // Fetch a page of members. `replace` is true for a fresh search/first
  // load, false when appending via infinite scroll.
  // -------------------------------------------------------
  const fetchUsers = useCallback(async (pageNum: number, searchTerm: string, replace: boolean) => {
    const requestId = ++requestIdRef.current;

    if (replace) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(false);

    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: "20" });
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();

      // A newer request has already started (search changed mid-flight) —
      // discard this stale response instead of letting it clobber state.
      if (requestId !== requestIdRef.current) return;

      if (!data.success) throw new Error(data.message ?? "Failed to load members");

      setUsers((prev) => (replace ? data.users : [...prev, ...data.users]));
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError(true);
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load — skip if we already have a cached page from before
  // navigating away to a profile.
  useEffect(() => {
    if (!open) return;
    if (cached.users.length > 0) return;
    Promise.resolve().then(() => fetchUsers(1, "", true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Debounced search — resets pagination and refetches from page 1.
  useEffect(() => {
    if (!open) return;
    if (searchInput === search) return;

    const timeout = setTimeout(() => {
      setSearch(searchInput);
      fetchUsers(1, searchInput, true);
    }, 350);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, open]);

  // Keep the external store in sync so it's ready if the user navigates
  // to a profile and comes back.
  useEffect(() => {
    setChatUsersState({ users, page, hasMore, search });
  }, [users, page, hasMore, search]);

  // Infinite scroll — IntersectionObserver on a sentinel at the list's end
  // is cheaper and smoother than a scroll event listener.
  useEffect(() => {
    if (!open || !hasMore || loading) return;
    const sentinel = sentinelRef.current;
    const root = listRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          fetchUsers(page + 1, search, false);
        }
      },
      { root, rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, hasMore, loading, loadingMore, page, search, fetchUsers]);

  // Restore scroll position once the list has content again.
  useEffect(() => {
    if (open && listRef.current && cached.scrollTop) {
      listRef.current.scrollTop = cached.scrollTop;
    }
    // Only on the open transition — not on every users update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleListScroll() {
    if (listRef.current) setChatUsersState({ scrollTop: listRef.current.scrollTop });
  }

  // -------------------------------------------------------
  // Live presence — subscribe only while the panel is actually open.
  // -------------------------------------------------------
  useEffect(() => {
    if (!open || !socket) return;

    socket.emit("presence:join");

    function handlePresenceUpdate(update: PresenceUpdate) {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === update.userId
            ? { ...u, isOnline: update.isOnline, lastSeenAt: update.lastSeenAt ?? u.lastSeenAt }
            : u
        )
      );
    }

    socket.on("presence:update", handlePresenceUpdate);

    return () => {
      socket.emit("presence:leave");
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, [open, socket]);

  // Scroll lock + Escape key + focus management — same pattern as MobileDrawer.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  const onlineCount = useMemo(() => users.filter((u) => u.isOnline).length, [users]);
  const onlineUsers = useMemo(() => users.filter((u) => u.isOnline), [users]);
  const offlineUsers = useMemo(() => users.filter((u) => !u.isOnline), [users]);

  function handleClose() {
    resetChatUsersState();
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="All community members"
        tabIndex={-1}
        className="fixed right-0 top-0 z-[60] flex h-[100dvh] w-full flex-col border-l border-border bg-surface outline-none sm:top-16 sm:h-[calc(100dvh-4rem)] sm:w-96"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Users size={17} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Doon Community</p>
              <p className="text-xs leading-tight text-muted">
                {onlineCount > 0 ? `${onlineCount} online now` : "See who's around"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-border"
            aria-label="Close members panel"
          >
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <Search size={14} className="shrink-0 text-muted" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search members..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              maxLength={50}
            />
          </div>
        </div>

        {/* List */}
        <div ref={listRef} onScroll={handleListScroll} className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="space-y-1 px-1 py-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-border" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-border" />
                    <div className="h-2.5 w-1/3 animate-pulse rounded bg-border" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <UserX size={28} className="mb-2 text-muted" />
              <p className="text-sm font-bold">Couldn&apos;t load members</p>
              <p className="mt-1 text-xs text-muted">Check your connection and try again.</p>
              <button
                onClick={() => fetchUsers(1, search, true)}
                className="mt-3 rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <Users size={28} className="mb-2 text-muted" />
              <p className="text-sm font-bold">
                {search ? "No members match that search" : "No members yet"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {search ? "Try a different name." : "Be part of the first wave on DoonMeet."}
              </p>
            </div>
          ) : (
            <>
              {onlineUsers.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
                    Online now
                  </p>
                  <div className="space-y-0.5">
                    {onlineUsers.map((u) => (
                      <UserListItem key={u._id} user={u} />
                    ))}
                  </div>
                </>
              )}

              {offlineUsers.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
                    All members
                  </p>
                  <div className="space-y-0.5">
                    {offlineUsers.map((u) => (
                      <UserListItem key={u._id} user={u} />
                    ))}
                  </div>
                </>
              )}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="flex h-10 items-center justify-center">
                {loadingMore && <Loader2 size={16} className="animate-spin text-muted" />}
              </div>

              {!hasMore && users.length > 0 && (
                <p className="pb-2 pt-1 text-center text-xs text-muted">
                  That&apos;s everyone — {users.length} member{users.length === 1 ? "" : "s"}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
