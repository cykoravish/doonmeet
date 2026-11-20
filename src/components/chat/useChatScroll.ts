"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

interface Options {
  messages: { _id: string; sender: { _id: string } }[];
  /** True once the first page of history has loaded. */
  ready: boolean;
  currentUserId?: string;
}

// How close to the bottom (px) still counts as "reading the latest messages".
const NEAR_BOTTOM_PX = 120;

/**
 * Scroll behaviour for a chat list:
 * - first history batch lands at the bottom instantly (no visible scroll)
 * - a new message scrolls down only if you were already near the bottom, or
 *   it's your own — otherwise you keep your reading position and get an
 *   "N new messages" counter instead of being yanked down
 * - loading older messages keeps the viewport steady
 */
export function useChatScroll({ messages, ready, currentUserId }: Options) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const initialDoneRef = useRef(false);
  const lastIdRef = useRef<string | null>(null);
  // Set right before older messages are prepended: the scroll metrics to
  // restore so the message the user was reading doesn't jump.
  const prependAnchorRef = useRef<{ height: number; top: number } | null>(null);
  const [unseenCount, setUnseenCount] = useState(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll the list container directly — scrollIntoView can walk up and
    // scroll an unintended ancestor.
    el.scrollTo({ top: el.scrollHeight, behavior });
    setUnseenCount(0);
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    nearBottomRef.current = near;
    if (near) setUnseenCount((n) => (n === 0 ? n : 0));
  }, []);

  /** Call right before prepending an older page of messages. */
  const beginPrepend = useCallback(() => {
    const el = scrollRef.current;
    if (el) prependAnchorRef.current = { height: el.scrollHeight, top: el.scrollTop };
  }, []);

  // Layout effect = runs before paint, so the jump to bottom / scroll
  // restoration never shows as a visible flicker.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !ready || messages.length === 0) return;

    const anchor = prependAnchorRef.current;
    if (anchor) {
      prependAnchorRef.current = null;
      el.scrollTop = el.scrollHeight - anchor.height + anchor.top;
      return;
    }

    const last = messages[messages.length - 1];
    const lastChanged = last._id !== lastIdRef.current;
    lastIdRef.current = last._id;

    if (!initialDoneRef.current) {
      initialDoneRef.current = true;
      el.scrollTop = el.scrollHeight;
      nearBottomRef.current = true;
      return;
    }

    // Some other update (e.g. read receipts) — not a new message.
    if (!lastChanged) return;

    if (nearBottomRef.current || last.sender._id === currentUserId) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      setUnseenCount((n) => n + 1);
    }
  }, [messages, ready, currentUserId]);

  return { scrollRef, onScroll, scrollToBottom, beginPrepend, unseenCount };
}
