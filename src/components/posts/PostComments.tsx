"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, Reply, Send, X } from "lucide-react";
import UserLink from "@/components/shared/UserLink";
import Avatar from "@/components/ui/Avatar";
import { buttonClasses } from "@/components/ui/Button";
import { useToast } from "@/providers/toast-provider";
import type { CommentDTO } from "@/lib/postComments";
import { timeAgo } from "./PostCard";
import { announceCommentCount } from "./commentEvents";

// Comments + Instagram-style replies.
// • Top-level comments in reading order; "View earlier comments" pages back.
// • Each thread's replies load on demand ("View 3 replies").
// • Reply to a comment OR to any reply — it joins the same thread with "@Name".
// • Edit / delete your own; the post's owner can delete any comment on it.

interface Viewer {
  _id: string;
  name: string;
  avatar: string | null;
}

interface PostCommentsProps {
  postId: string;
  /** null when the post author's account is gone. */
  postAuthorId: string | null;
  initialComments: CommentDTO[];
  initialNextCursor: string | null;
  initialCommentCount: number;
  currentUser: Viewer | null;
  /** Open + highlight this comment/reply (from a notification link). */
  focusCommentId?: string | null;
}

interface Thread {
  replies: CommentDTO[];
  /** Cursor for the next page of replies (after the last fetched one). */
  cursor: string | null;
  open: boolean;
  loading: boolean;
  /** Fetched from the start. False = only replies added on this screen. */
  loaded: boolean;
}

const EMPTY_THREAD: Thread = { replies: [], cursor: null, open: false, loading: false, loaded: false };
const nameOf = (c: CommentDTO) => c.author?.name ?? "Deleted User";
const mergeById = (a: CommentDTO[], b: CommentDTO[]) => {
  const seen = new Set(a.map((c) => c._id));
  return [...a, ...b.filter((c) => !seen.has(c._id))];
};

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T & { message?: string; code?: string } }> {
  try {
    const res = await fetch(url, init);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { message: "No internet connection. Please try again." } as T & { message: string } };
  }
}

export default function PostComments({
  postId,
  postAuthorId,
  initialComments,
  initialNextCursor,
  initialCommentCount,
  currentUser,
  focusCommentId = null,
}: PostCommentsProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [comments, setComments] = useState<CommentDTO[]>(initialComments);
  const [olderCursor, setOlderCursor] = useState<string | null>(initialNextCursor);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [count, setCount] = useState(Math.max(0, initialCommentCount));
  const [threads, setThreads] = useState<Record<string, Thread>>({});

  const [replyTarget, setReplyTarget] = useState<{ commentId: string; rootId: string; name: string } | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [composerError, setComposerError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [editing, setEditing] = useState<{ id: string; text: string; saving: boolean; error: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  const viewerId = currentUser?._id ?? null;
  const isPostOwner = !!viewerId && viewerId === postAuthorId;
  const loginHref = `/login?redirect=${encodeURIComponent(`/posts/${postId}`)}`;

  // Keep the 💬 number in the post's action row in step.
  const firstCount = useRef(true);
  useEffect(() => {
    if (firstCount.current) {
      firstCount.current = false;
      return;
    }
    announceCommentCount(postId, count);
  }, [postId, count]);

  const flash = useCallback((id: string) => {
    setFlashId(id);
    // After React paints the new row.
    setTimeout(() => {
      document.getElementById(`comment-${id}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 60);
    setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 2500);
  }, []);

  const patchThread = useCallback((rootId: string, patch: Partial<Thread> | ((t: Thread) => Partial<Thread>)) => {
    setThreads((prev) => {
      const current = prev[rootId] ?? EMPTY_THREAD;
      const next = typeof patch === "function" ? patch(current) : patch;
      return { ...prev, [rootId]: { ...current, ...next } };
    });
  }, []);

  /** Fetch replies: from the start (reset) or the next page. */
  const loadReplies = useCallback(
    async (rootId: string, cursor: string | null) => {
      patchThread(rootId, { loading: true, open: true });
      const qs = cursor ? `?cursor=${cursor}` : "";
      const { ok, data } = await api<{ replies?: CommentDTO[]; nextCursor?: string | null }>(
        `/api/posts/${postId}/comments/${rootId}/replies${qs}`
      );
      if (!ok) {
        patchThread(rootId, { loading: false });
        showToast(data.message || "Couldn't load replies.", "error");
        return;
      }
      const fetched = data.replies ?? [];
      patchThread(rootId, (t) => ({
        loading: false,
        loaded: true,
        cursor: data.nextCursor ?? null,
        // From the start: fetched first, then anything added here that the
        // page didn't include. Next page: append.
        replies: cursor ? mergeById(t.replies, fetched) : mergeById(fetched, t.replies),
      }));
    },
    [postId, patchThread, showToast]
  );

  async function loadOlder() {
    if (!olderCursor || loadingOlder) return;
    setLoadingOlder(true);
    const { ok, data } = await api<{ comments?: CommentDTO[]; nextCursor?: string | null }>(
      `/api/posts/${postId}/comments?cursor=${olderCursor}`
    );
    setLoadingOlder(false);
    if (!ok) {
      showToast(data.message || "Couldn't load earlier comments.", "error");
      return;
    }
    setComments((prev) => mergeById(data.comments ?? [], prev));
    setOlderCursor(data.nextCursor ?? null);
  }

  function toggleThread(root: CommentDTO) {
    const t = threads[root._id];
    if (t?.open) {
      patchThread(root._id, { open: false });
    } else if (t?.loaded || (t && t.replies.length >= root.replyCount)) {
      patchThread(root._id, { open: true });
    } else {
      loadReplies(root._id, null);
    }
  }

  function startReply(c: CommentDTO) {
    if (!currentUser) {
      router.push(loginHref);
      return;
    }
    setReplyTarget({ commentId: c._id, rootId: c.parentId ?? c._id, name: nameOf(c) });
    setComposerError("");
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setComposerError("");

    const { ok, data } = await api<{ comment?: CommentDTO }>(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId: replyTarget?.commentId ?? null }),
    });
    setSending(false);

    if (!ok || !data.comment) {
      const message = data.message || "Couldn't post your comment. Please try again.";
      setComposerError(message);
      if (data.code === "COMMENT_GONE") setReplyTarget(null);
      return;
    }

    const c = data.comment;
    if (c.parentId) {
      const rootId = c.parentId;
      setComments((prev) => prev.map((x) => (x._id === rootId ? { ...x, replyCount: x.replyCount + 1 } : x)));
      patchThread(rootId, (t) => ({ open: true, replies: mergeById(t.replies, [c]) }));
    } else {
      setComments((prev) => mergeById(prev, [c]));
    }
    setCount((n) => n + 1);
    setText("");
    setReplyTarget(null);
    if (inputRef.current) inputRef.current.style.height = "";
    flash(c._id);
  }

  async function saveEdit() {
    if (!editing) return;
    const content = editing.text.trim();
    if (!content) {
      setEditing({ ...editing, error: "Comment cannot be empty." });
      return;
    }
    setEditing({ ...editing, saving: true, error: "" });
    const { ok, data } = await api<{ comment?: CommentDTO }>(`/api/posts/${postId}/comments/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!ok || !data.comment) {
      setEditing((cur) => (cur ? { ...cur, saving: false, error: data.message || "Couldn't save. Please try again." } : cur));
      return;
    }
    const updated = data.comment;
    const replace = (list: CommentDTO[]) => list.map((x) => (x._id === updated._id ? { ...x, ...updated } : x));
    if (updated.parentId) {
      patchThread(updated.parentId, (t) => ({ replies: replace(t.replies) }));
    } else {
      setComments(replace);
    }
    setEditing(null);
    showToast("Comment updated", "success");
  }

  async function remove(c: CommentDTO) {
    setDeletingId(c._id);
    const { ok, data } = await api<{ removed?: number }>(`/api/posts/${postId}/comments/${c._id}`, {
      method: "DELETE",
    });
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (!ok && data.code !== "COMMENT_GONE") {
      showToast(data.message || "Couldn't delete the comment.", "error");
      return;
    }
    // Already gone on the server counts as deleted here too.
    const removed = ok ? Math.max(1, data.removed ?? 1) : 0;

    if (c.parentId) {
      const rootId = c.parentId;
      patchThread(rootId, (t) => ({ replies: t.replies.filter((x) => x._id !== c._id) }));
      if (ok) {
        setComments((prev) =>
          prev.map((x) => (x._id === rootId ? { ...x, replyCount: Math.max(0, x.replyCount - 1) } : x))
        );
      }
    } else {
      setComments((prev) => prev.filter((x) => x._id !== c._id));
      setThreads((prev) => {
        const next = { ...prev };
        delete next[c._id];
        return next;
      });
    }
    setCount((n) => Math.max(0, n - removed));
    // Replying to something that just disappeared → stop.
    setReplyTarget((rt) =>
      rt && (rt.commentId === c._id || (!c.parentId && rt.rootId === c._id)) ? null : rt
    );
    if (editing?.id === c._id) setEditing(null);
    showToast("Comment deleted", "success");
  }

  // Opened from a notification: bring that comment (and its thread) on screen.
  const focusedOnce = useRef(false);
  useEffect(() => {
    if (!focusCommentId || focusedOnce.current) return;
    focusedOnce.current = true;

    (async () => {
      const getOne = (id: string) =>
        api<{ comment?: CommentDTO }>(`/api/posts/${postId}/comments/${id}`).then((r) => (r.ok ? r.data.comment ?? null : null));

      const target = await getOne(focusCommentId);
      if (!target) {
        showToast("That comment was deleted.", "info");
        return;
      }
      if (!target.parentId) {
        setComments((prev) => (prev.some((x) => x._id === target._id) ? prev : [target, ...prev]));
        flash(target._id);
        return;
      }

      const rootId = target.parentId;
      const root = await getOne(rootId);
      if (!root) {
        showToast("That conversation was deleted.", "info");
        return;
      }
      setComments((prev) => (prev.some((x) => x._id === rootId) ? prev : [root, ...prev]));

      // Page through the thread until the reply shows up (bounded).
      let replies: CommentDTO[] = [];
      let cursor: string | null = null;
      for (let page = 0; page < 10; page++) {
        const qs: string = cursor ? `?cursor=${cursor}` : "";
        const { ok, data } = await api<{ replies?: CommentDTO[]; nextCursor?: string | null }>(
          `/api/posts/${postId}/comments/${rootId}/replies${qs}`
        );
        if (!ok) break;
        replies = mergeById(replies, data.replies ?? []);
        cursor = data.nextCursor ?? null;
        if (replies.some((r) => r._id === target._id) || !cursor) break;
      }
      if (!replies.some((r) => r._id === target._id)) replies = mergeById(replies, [target]);
      patchThread(rootId, { replies, cursor, open: true, loading: false, loaded: true });
      flash(target._id);
    })();
  }, [focusCommentId, postId, flash, patchThread, showToast]);

  function renderComment(c: CommentDTO, isReply: boolean) {
    const name = nameOf(c);
    const mine = !!viewerId && c.author?._id === viewerId;
    const canDelete = mine || isPostOwner;
    const isEditing = editing?.id === c._id;
    const threadSize = !isReply ? c.replyCount : 0;

    return (
      <div
        id={`comment-${c._id}`}
        className={`-mx-2 flex scroll-mt-24 gap-2.5 rounded-[16px] px-2 py-1 ${flashId === c._id ? "comment-flash" : ""}`}
      >
        <UserLink userId={c.author?._id ?? ""} className="shrink-0">
          <Avatar name={name} src={c.author?.avatar} size={isReply ? 28 : 36} />
        </UserLink>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] leading-tight font-bold text-text">
            <UserLink userId={c.author?._id ?? ""}>{name}</UserLink>
          </p>

          {isEditing ? (
            <div className="mt-1.5">
              <label htmlFor={`edit-${c._id}`} className="sr-only">
                Edit your comment
              </label>
              <textarea
                id={`edit-${c._id}`}
                value={editing.text}
                onChange={(e) => setEditing({ ...editing, text: e.target.value, error: "" })}
                maxLength={500}
                rows={3}
                autoFocus
                // Caret at the end, so people can carry on typing.
                onFocus={(e) => {
                  const end = e.currentTarget.value.length;
                  e.currentTarget.setSelectionRange(end, end);
                }}
                className="w-full scroll-mb-32 resize-none rounded-[14px] border-[1.5px] border-primary bg-surface px-3 py-2 text-base leading-snug text-text outline-none"
              />
              {editing.error && (
                <p role="alert" className="mt-1 text-sm text-danger">
                  {editing.error}
                </p>
              )}
              <div className="mt-1.5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="h-10 rounded-[12px] px-3.5 text-sm font-semibold text-muted hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={editing.saving || !editing.text.trim()}
                  className="flex h-10 items-center gap-1.5 rounded-[12px] bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-60"
                >
                  {editing.saving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 text-[15px] leading-relaxed wrap-anywhere whitespace-pre-line text-text">
              {c.replyTo && (
                <>
                  <UserLink userId={c.replyTo.user?._id ?? ""} className="font-semibold text-primary-fg">
                    @{c.replyTo.user?.name ?? "Deleted User"}
                  </UserLink>{" "}
                </>
              )}
              {c.content}
            </p>
          )}

          {/* Time + actions — 40px-tall tap targets, text-only to stay light. */}
          {!isEditing && (
            <div className="-ml-2 flex flex-wrap items-center text-[13px] font-semibold text-muted">
              <span className="px-2 font-normal">
                <time dateTime={c.createdAt}>{timeAgo(c.createdAt)}</time>
                {c.editedAt && " · edited"}
              </span>
              <button type="button" onClick={() => startReply(c)} className="h-10 px-2 hover:text-text">
                Reply
              </button>
              {mine && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDeleteId(null);
                    setEditing({ id: c._id, text: c.content, saving: false, error: "" });
                  }}
                  className="h-10 px-2 hover:text-text"
                >
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setConfirmDeleteId(c._id);
                    // Keep the confirm box clear of the sticky comment bar.
                    setTimeout(() => {
                      document
                        .getElementById(`confirm-${c._id}`)
                        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                    }, 30);
                  }}
                  className="h-10 px-2 hover:text-danger"
                >
                  Delete
                </button>
              )}
            </div>
          )}

          {confirmDeleteId === c._id && (
            <div
              id={`confirm-${c._id}`}
              role="alert"
              className="mt-1 flex scroll-mb-32 flex-wrap items-center gap-2 rounded-[14px] bg-danger/10 p-2.5"
            >
              <span className="min-w-[8rem] flex-1 text-sm font-medium text-text">
                {isReply
                  ? "Delete this reply?"
                  : threadSize > 0
                    ? `Delete this comment and its ${threadSize} ${threadSize === 1 ? "reply" : "replies"}?`
                    : "Delete this comment?"}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="h-10 rounded-[12px] px-3 text-sm font-semibold text-text hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => remove(c)}
                  disabled={deletingId === c._id}
                  className="flex h-10 items-center gap-1.5 rounded-[12px] bg-danger px-3.5 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {deletingId === c._id && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderThread(root: CommentDTO) {
    const t = threads[root._id];
    const shown = t?.replies.length ?? 0;
    if (root.replyCount <= 0 && shown === 0) return null;
    const replyWord = (n: number) => `${n} ${n === 1 ? "reply" : "replies"}`;

    // Lines up with the parent's text (36px avatar + 10px gap).
    return (
      <div className="mt-0.5 pl-[46px]">
        {!t?.open ? (
          <button
            type="button"
            onClick={() => toggleThread(root)}
            className="flex h-10 items-center gap-2 text-[13px] font-semibold text-muted hover:text-text"
          >
            <span className="h-px w-6 bg-border" aria-hidden="true" />
            {t?.loading ? "Loading…" : `View ${replyWord(Math.max(root.replyCount, shown))}`}
          </button>
        ) : (
          <>
            {!t.loaded && shown < root.replyCount && (
              <button
                type="button"
                onClick={() => loadReplies(root._id, null)}
                className="flex h-10 items-center gap-2 text-[13px] font-semibold text-muted hover:text-text"
              >
                <span className="h-px w-6 bg-border" aria-hidden="true" />
                View {replyWord(root.replyCount - shown)} more
              </button>
            )}
            <ul className="mt-1 flex flex-col gap-1.5">
              {t.replies.map((r) => (
                <li key={r._id}>{renderComment(r, true)}</li>
              ))}
            </ul>
            {t.loading && (
              <p className="flex h-10 items-center text-muted">
                <Loader2 size={16} className="animate-spin" aria-label="Loading replies" />
              </p>
            )}
            <div className="flex flex-wrap gap-x-4">
              {t.loaded && t.cursor && !t.loading && (
                <button
                  type="button"
                  onClick={() => loadReplies(root._id, t.cursor)}
                  className="flex h-10 items-center gap-2 text-[13px] font-semibold text-muted hover:text-text"
                >
                  <span className="h-px w-6 bg-border" aria-hidden="true" />
                  View more replies
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleThread(root)}
                className="flex h-10 items-center gap-2 text-[13px] font-semibold text-muted hover:text-text"
              >
                <span className="h-px w-6 bg-border" aria-hidden="true" />
                Hide replies
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  const replyFirstName = replyTarget?.name.split(" ")[0] ?? "";

  return (
    <section id="comments" aria-labelledby="comments-title" className="mt-6 scroll-mt-20">
      <h2 id="comments-title" className="mb-3 font-display text-lg font-extrabold">
        Comments{count > 0 && <span className="font-semibold text-muted"> · {count}</span>}
      </h2>

      {olderCursor && (
        <button
          type="button"
          onClick={loadOlder}
          disabled={loadingOlder}
          className="mb-3 flex h-10 items-center gap-2 text-sm font-semibold text-primary-fg hover:underline disabled:opacity-60"
        >
          {loadingOlder && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
          View earlier comments
        </button>
      )}

      {comments.length === 0 ? (
        <div className="flex flex-col items-center rounded-[20px] border border-dashed border-border px-4 py-8 text-center">
          <MessageCircle size={26} className="mb-2 text-muted" aria-hidden="true" />
          <p className="text-[15px] text-muted">No comments yet. Start the conversation 👋</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c._id}>
              {renderComment(c, false)}
              {renderThread(c)}
            </li>
          ))}
        </ul>
      )}

      {/* Composer — stays at the bottom of the screen (above the mobile nav)
          while the comments are on screen, like Instagram. Solid background,
          no blur, so it stays cheap on low-end phones. */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 -mx-4 mt-4 border-t border-border bg-background px-4 py-2.5 sm:-mx-6 sm:px-6 md:bottom-3 md:mx-0 md:rounded-[18px] md:border md:bg-surface md:px-3">
        {currentUser ? (
          <>
            {replyTarget && (
              <div className="mb-1.5 flex items-center gap-2 text-[13px] text-muted">
                <Reply size={14} className="shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">
                  Replying to <span className="font-semibold text-text">@{replyTarget.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  aria-label="Cancel reply"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-surface-2"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            )}
            <form onSubmit={send} className="flex items-end gap-2">
              <Avatar name={currentUser.name} src={currentUser.avatar} size={32} className="mb-1.5 hidden sm:inline-flex" />
              <label htmlFor="comment-composer" className="sr-only">
                {replyTarget ? `Reply to ${replyTarget.name}` : "Add a comment"}
              </label>
              <textarea
                id="comment-composer"
                ref={inputRef}
                rows={1}
                value={text}
                maxLength={500}
                onChange={(e) => {
                  setText(e.target.value);
                  if (composerError) setComposerError("");
                  autoGrow(e.target);
                }}
                onKeyDown={(e) => {
                  // Desktop: Enter sends, Shift+Enter = new line. Phones keep
                  // Enter as a new line (the send button is right there).
                  if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: fine)").matches) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={replyTarget ? `Reply to ${replyFirstName}…` : "Add a comment…"}
                className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-[14px] border-[1.5px] border-transparent bg-surface-2 px-4 py-2.5 text-base leading-snug text-text outline-none placeholder:text-muted focus:border-primary focus:bg-surface"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                aria-label={replyTarget ? "Send reply" : "Post comment"}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Send size={18} aria-hidden="true" />
                )}
              </button>
            </form>
            {text.length > 450 && <p className="mt-1 text-right text-xs text-muted">{text.length}/500</p>}
            {composerError && (
              <p role="alert" className="mt-1.5 text-sm text-danger">
                {composerError}
              </p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 text-[15px] text-text">Log in to join the conversation.</p>
            <Link href={loginHref} className={buttonClasses("primary", "sm", "shrink-0")}>
              Log in
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
