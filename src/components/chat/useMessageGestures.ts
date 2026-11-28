"use client";

import { useRef } from "react";

// Touch gestures on a chat message, WhatsApp-style: swipe it right to reply,
// press and hold for more options. Mouse users get a right-click instead
// (plus hover buttons, drawn by the message itself). Shared by the public
// chat and DMs so both behave exactly the same.
const LONG_PRESS_MS = 450;
export const SWIPE_REPLY_PX = 56;
const SWIPE_MAX_PX = 72;
const MOVE_SLOP_PX = 10;
// Two taps this close in time and place make a double tap.
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP_PX = 30;

interface Gesture {
  x: number;
  y: number;
  px: number;
  swiping: boolean;
  done: boolean;
  /** Buzzed once when the swipe crosses the reply threshold. */
  armed: boolean;
  /** The long-press fired (its options sheet is now open). */
  longPressed: boolean;
  /** Started on a button / link inside the message (quote, reaction chip…). */
  onControl: boolean;
  timer: ReturnType<typeof setTimeout>;
}

const isControl = (target: EventTarget | null) =>
  target instanceof Element && !!target.closest("button, a, input, textarea, select");

/**
 * Lifting the finger after a long press still sends a "click" — and by then
 * the options sheet's backdrop is under the finger, so that click would shut
 * the sheet the moment it opened. Swallow that one click.
 */
function swallowNextClick() {
  const stop = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    cleanup();
  };
  const timer = setTimeout(() => cleanup(), 400);
  function cleanup() {
    clearTimeout(timer);
    window.removeEventListener("click", stop, true);
  }
  window.addEventListener("click", stop, true);
}

interface Options {
  onSwipeReply: () => void;
  onLongPress: () => void;
  /** Two quick taps (or a mouse double-click) on the message, not on a control in it. */
  onDoubleTap?: () => void;
}

/**
 * Returns refs for the part that slides (`columnRef`) and the reply arrow
 * that fades in behind it (`hintRef`), plus the pointer handlers to spread
 * on the message row. Moves happen straight on the DOM — no re-render per
 * pointer event, which keeps cheap phones smooth.
 */
export function useMessageGestures({ onSwipeReply, onLongPress, onDoubleTap }: Options) {
  const columnRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const lastPointerRef = useRef<string>("mouse");
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);

  function shift(px: number, animate = false) {
    const col = columnRef.current;
    const hint = hintRef.current;
    if (col) {
      col.style.transition = animate ? "transform 0.18s ease-out" : "none";
      col.style.transform = px ? `translateX(${px}px)` : "";
    }
    if (hint) hint.style.opacity = String(Math.min(px / SWIPE_REPLY_PX, 1));
  }

  function onPointerDown(e: React.PointerEvent) {
    lastPointerRef.current = e.pointerType;
    if (e.pointerType === "mouse") return;
    const g: Gesture = {
      x: e.clientX,
      y: e.clientY,
      px: 0,
      swiping: false,
      done: false,
      armed: false,
      longPressed: false,
      onControl: isControl(e.target),
      timer: setTimeout(() => {
        g.done = true;
        g.longPressed = true;
        navigator.vibrate?.(10);
        onLongPress();
      }, LONG_PRESS_MS),
    };
    gestureRef.current = g;
  }

  function onPointerMove(e: React.PointerEvent) {
    const g = gestureRef.current;
    if (!g || g.done) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.swiping) {
      if (Math.abs(dx) < MOVE_SLOP_PX && Math.abs(dy) < MOVE_SLOP_PX) return;
      clearTimeout(g.timer);
      // Only a rightward, mostly-horizontal drag is a reply swipe.
      if (dx > 0 && dx > Math.abs(dy)) {
        g.swiping = true;
      } else {
        g.done = true; // scrolling (or a left drag) — leave it to the browser
        return;
      }
    }
    g.px = Math.min(Math.max(dx, 0), SWIPE_MAX_PX);
    if (!g.armed && g.px >= SWIPE_REPLY_PX) {
      g.armed = true;
      navigator.vibrate?.(8);
    } else if (g.armed && g.px < SWIPE_REPLY_PX) {
      g.armed = false;
    }
    shift(g.px);
  }

  function endGesture(commit: boolean) {
    const g = gestureRef.current;
    gestureRef.current = null;
    if (!g) return;
    clearTimeout(g.timer);
    if (g.longPressed && commit) swallowNextClick();
    if (g.swiping) {
      if (commit && g.px >= SWIPE_REPLY_PX) onSwipeReply();
      shift(0, true);
      return;
    }
    // A plain tap (no swipe, scroll or long press) — maybe the 2nd of a double tap.
    if (commit && !g.done && !g.onControl && onDoubleTap) {
      const now = Date.now();
      const last = lastTapRef.current;
      if (
        last &&
        now - last.t < DOUBLE_TAP_MS &&
        Math.hypot(g.x - last.x, g.y - last.y) < DOUBLE_TAP_SLOP_PX
      ) {
        lastTapRef.current = null;
        onDoubleTap();
      } else {
        lastTapRef.current = { t: now, x: g.x, y: g.y };
      }
    }
  }

  function onContextMenu(e: React.MouseEvent) {
    // No browser menu on a long press; right-click opens our options.
    e.preventDefault();
    if (lastPointerRef.current === "mouse") onLongPress();
  }

  function onDoubleClick(e: React.MouseEvent) {
    // Touch double taps are handled above (phones may also send a dblclick).
    if (!onDoubleTap || lastPointerRef.current !== "mouse" || isControl(e.target)) return;
    window.getSelection()?.removeAllRanges(); // a double-click also selects a word
    onDoubleTap();
  }

  return {
    columnRef,
    hintRef,
    rowHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: () => endGesture(true),
      onPointerCancel: () => endGesture(false),
      onContextMenu,
      onDoubleClick,
    },
  };
}
