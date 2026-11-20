"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { onConnected, useSocket } from "@/lib/socket-client";
import { X, Search, Users, Loader2, UserX } from "lucide-react";
import UserListItem, { type MemberUser } from "./UserListItem";
import IconButton from "@/components/ui/IconButton";
import { buttonClasses } from "@/components/ui/Button";
import { getChatUsersState, setChatUsersState, resetChatUsersState } from "@/lib/chatUsersStore";

interface AllUsersPanelProps {
  open: boolean;
  onClose: () => void;
  /** Logged-in viewer's id — enables live presence over the shared socket. */
  currentUserId?: string | null;
  /** Logged-in viewers get a one-tap Message button on each member. */
  canMessage?: boolean;
}

interface PresenceUpdate {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export default function AllUsersPanel({ open, onClose, currentUserId = null, canMessage = false }: AllUsersPanelProps) {
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
  // Shared socket; only taken while the panel is open (null otherwise).
  const socket = useSocket(open ? currentUserId : null);

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
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
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
    // Subscribe now (if connected) and again after any reconnect.
    const stopRejoining = onConnected(socket, () => socket.emit("presence:join"));

    return () => {
      stopRejoining();
      socket.off("presence:update", handlePresenceUpdate);
      socket.emit("presence:leave");
    };
  }, [open, socket]);

  // Scroll lock + Escape key + focus management — same pattern as MobileDrawer.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Restore the previous value on close — ChatViewportShell keeps body
    // locked for the whole chat page, so resetting to "" would unlock it.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  const onlineUsers = useMemo(() => users.filter((u) => u.isOnline), [users]);
  const offlineUsers = useMemo(() => users.filter((u) => !u.isOnline), [users]);

  function handleClose() {
    resetChatUsersState();
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay — plain dim, no blur (expensive on low-end GPUs) */}
      <div
        className="composer-backdrop fixed inset-0 z-[60] bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel — full screen on phones, right-hand sheet on desktop */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="members-panel-title"
        tabIndex={-1}
        className="fixed top-0 right-0 z-[60] flex h-dvh w-full flex-col bg-surface outline-none md:top-16 md:h-[calc(100dvh-4rem)] md:w-96 md:border-l md:border-border"
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 px-4 md:h-16">
          <div className="min-w-0">
            <h2 id="members-panel-title" className="text-lg leading-tight font-extrabold">
              People in Doon
            </h2>
            <p className="text-[13px] leading-tight text-muted">
              {onlineUsers.length > 0 ? `${onlineUsers.length} online now` : "See who's around"}
            </p>
          </div>
          <IconButton label="Close members list" onClick={handleClose}>
            <X size={20} />
          </IconButton>
        </div>

        {/* Search */}
        <div className="shrink-0 px-4 pb-3">
          <label htmlFor="members-search" className="sr-only">
            Search members
          </label>
          <div className="flex h-12 items-center gap-2 rounded-[14px] border-[1.5px] border-transparent bg-surface-2 px-3.5 focus-within:border-primary focus-within:bg-surface">
            <Search size={18} className="shrink-0 text-muted" aria-hidden="true" />
            <input
              id="members-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name…"
              className="w-full bg-transparent text-base text-text outline-none placeholder:text-muted"
              maxLength={50}
              autoComplete="off"
            />
          </div>
        </div>

        {/* List */}
        <div
          ref={listRef}
          onScroll={handleListScroll}
          className="flex-1 overflow-y-auto overscroll-contain border-t border-border px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
        >
          {loading ? (
            // Static skeleton rows — no pulse animation
            <div className="flex flex-col gap-1 px-1 py-1" aria-label="Loading members">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="h-[46px] w-[46px] shrink-0 rounded-full bg-surface-2" />
                  <div className="flex-1">
                    <div className="h-3.5 w-2/3 rounded bg-surface-2" />
                    <div className="mt-2 h-3 w-1/3 rounded bg-surface-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <UserX size={28} className="mb-2 text-muted" aria-hidden="true" />
              <p className="font-bold">Couldn&apos;t load members</p>
              <p className="mt-1 text-sm text-muted">Check your connection and try again.</p>
              <button
                type="button"
                onClick={() => fetchUsers(1, search, true)}
                className={buttonClasses("primary", "sm", "mt-4")}
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <Users size={28} className="mb-2 text-muted" aria-hidden="true" />
              <p className="font-bold">{search ? "No one matches that name" : "No members yet"}</p>
              <p className="mt-1 text-sm text-muted">
                {search ? "Try a different spelling." : "Be part of the first wave on DoonMeet."}
              </p>
            </div>
          ) : (
            <>
              {onlineUsers.length > 0 && (
                <section aria-label="Online now">
                  <p className="px-3 pt-3 pb-1 text-xs font-bold tracking-wider text-primary-fg uppercase">
                    Online now
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {onlineUsers.map((u) => (
                      <li key={u._id}>
                        <UserListItem user={u} canMessage={canMessage} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {offlineUsers.length > 0 && (
                <section aria-label="All members">
                  <p className="px-3 pt-4 pb-1 text-xs font-bold tracking-wider text-muted uppercase">
                    All members
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {offlineUsers.map((u) => (
                      <li key={u._id}>
                        <UserListItem user={u} canMessage={canMessage} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="flex h-10 items-center justify-center">
                {loadingMore && <Loader2 size={18} className="animate-spin text-muted" aria-hidden="true" />}
              </div>

              {!hasMore && users.length > 0 && (
                <p className="pt-1 pb-2 text-center text-sm text-muted">
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
