"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

interface Member {
  _id: string;
  name: string;
  avatar: string | null;
}

interface ShareProfileSheetProps {
  currentUser: Member;
  /** Who the chat is with — sharing their own profile back to them is pointless. */
  excludeUserId: string;
  onShare: (userId: string) => void;
  onClose: () => void;
}

const SEARCH_DELAY_MS = 300;

// Bottom sheet: share your own profile in one tap, or search members.
export default function ShareProfileSheet({ currentUser, excludeUserId, onShare, onClose }: ShareProfileSheetProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Debounced member search (same endpoint as the "All members" panel).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the query is cleared
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/users?search=${encodeURIComponent(q)}&limit=8`, { signal: controller.signal })
        .then((r) => r.json())
        .then((d) => {
          const users: Member[] = (d.users ?? []).filter((u: Member) => u._id !== excludeUserId);
          setResults(users);
          setSearched(true);
        })
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, excludeUserId]);

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Share a profile">
      <button type="button" aria-label="Close" onClick={onClose} className="composer-backdrop absolute inset-0 bg-black/40" />
      <div className="composer-sheet relative flex max-h-[80%] w-full max-w-md flex-col rounded-t-[24px] border border-border bg-surface pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg sm:mb-4 sm:rounded-[24px]">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg font-extrabold">Share a profile</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="px-4">
          <button
            type="button"
            onClick={() => onShare(currentUser._id)}
            className="flex min-h-14 w-full items-center gap-3 rounded-[16px] bg-primary-soft px-3 text-left hover:bg-primary-soft/80"
          >
            <Avatar name={currentUser.name} src={currentUser.avatar} size={40} />
            <span className="min-w-0">
              <span className="block font-bold text-text">Share my profile</span>
              <span className="block truncate text-sm text-muted">{currentUser.name}</span>
            </span>
          </button>

          <label htmlFor="share-profile-search" className="mt-4 mb-1.5 block text-sm font-semibold text-muted">
            Or share someone else&apos;s
          </label>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="share-profile-search"
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members by name"
              autoComplete="off"
              maxLength={50}
              className="h-12 w-full rounded-[14px] border-[1.5px] border-transparent bg-surface-2 pr-4 pl-10 text-base text-text outline-none placeholder:text-muted focus:border-primary focus:bg-surface"
            />
          </div>
        </div>

        <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-muted" aria-label="Searching" />
            </div>
          ) : results.length > 0 ? (
            <ul className="flex flex-col">
              {results.map((u) => (
                <li key={u._id}>
                  <button
                    type="button"
                    onClick={() => onShare(u._id)}
                    className="flex min-h-14 w-full items-center gap-3 rounded-[14px] px-2 text-left hover:bg-surface-2"
                  >
                    <Avatar name={u.name} src={u.avatar} size={40} />
                    <span className="min-w-0 flex-1 truncate font-semibold text-text">{u.name}</span>
                    <span className="shrink-0 text-sm font-semibold text-primary-fg">Share</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : searched ? (
            <p className="px-2 py-6 text-center text-sm text-muted">No members found for &ldquo;{query.trim()}&rdquo;.</p>
          ) : (
            <p className="px-2 py-4 text-center text-sm text-muted">Type at least 2 letters to search.</p>
          )}
        </div>
      </div>
    </div>
  );
}
