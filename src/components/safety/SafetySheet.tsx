"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ban, CircleCheck, Flag, Loader2, X } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { setBlocked } from "@/lib/safety-client";

export type ReportContext = "room_message" | "direct_message" | "profile" | "post";

const REASONS = [
  { value: "harassment", label: "Harassment or bullying", hint: "Abusive, threatening or won't stop messaging" },
  { value: "inappropriate", label: "Inappropriate or sexual content", hint: "Vulgar messages, unwanted advances" },
  { value: "spam", label: "Spam or scam", hint: "Ads, fake offers, asking for money" },
  { value: "fake_profile", label: "Fake profile", hint: "Pretending to be someone else" },
  { value: "other", label: "Something else", hint: "Tell us in the details below" },
] as const;

interface SafetySheetProps {
  mode: "report" | "block";
  user: { _id: string; name: string };
  context?: ReportContext;
  /** The specific message/post being reported, if any. */
  refId?: string | null;
  /** Already blocked by me — the report success screen then skips the "Block" offer. */
  alreadyBlocked?: boolean;
  onClose: () => void;
  onBlocked?: () => void;
}

// Bottom sheet (centred dialog on desktop) for reporting or blocking a user.
// Rendered in a portal so it's never clipped by a scrolling chat list.
export default function SafetySheet({
  mode,
  user,
  context = "profile",
  refId = null,
  alreadyBlocked = false,
  onClose,
  onBlocked,
}: SafetySheetProps) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState("");
  const [reported, setReported] = useState(false);
  const [blockedNow, setBlockedNow] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const firstName = user.name.split(" ")[0];

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError("Please choose a reason.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportedUserId: user._id, context, refId: refId ?? null, reason, details: details.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.errors?.[0]?.message ?? data.message ?? "Couldn't send the report. Please try again.");
        return;
      }
      setReported(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function block() {
    setBlocking(true);
    setError("");
    const ok = await setBlocked(user._id, true);
    setBlocking(false);
    if (!ok) {
      setError("Couldn't block right now. Please try again.");
      return;
    }
    setBlockedNow(true);
    onBlocked?.();
  }

  const title =
    mode === "block"
      ? blockedNow
        ? `${firstName} is blocked`
        : `Block ${firstName}?`
      : reported
        ? "Thanks for telling us"
        : `Report ${firstName}`;

  const content = (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <div className="composer-backdrop absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="safety-sheet-title"
        tabIndex={-1}
        className="composer-sheet relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-surface px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] outline-none sm:max-w-md sm:rounded-[28px] sm:pb-5"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 id="safety-sheet-title" className="text-xl font-extrabold">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>

        {error && (
          <div className="mb-3">
            <Alert type="error" message={error} />
          </div>
        )}

        {/* ---------- Block ---------- */}
        {mode === "block" &&
          (blockedNow ? (
            <div className="flex flex-col gap-4">
              <p className="text-[15px] text-muted">
                {firstName} can&apos;t message you now, and you can&apos;t message them. You can unblock anytime from
                Profile → Privacy.
              </p>
              <Button size="lg" onClick={onClose}>
                Done
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <ul className="flex flex-col gap-2 text-[15px] text-text">
                <li className="flex gap-2.5">
                  <Ban size={19} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                  Neither of you can send direct messages to the other.
                </li>
                <li className="flex gap-2.5">
                  <CircleCheck size={19} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                  They won&apos;t be told that you blocked them.
                </li>
              </ul>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={onClose} disabled={blocking}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={block} loading={blocking}>
                  Block
                </Button>
              </div>
            </div>
          ))}

        {/* ---------- Report: done ---------- */}
        {mode === "report" && reported && (
          <div className="flex flex-col gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary-soft text-primary-fg">
              <CircleCheck size={28} aria-hidden="true" />
            </span>
            <p className="text-[15px] text-muted">
              Your report is private — {firstName} won&apos;t know it was you. Our team will review it. If several
              people report someone, they&apos;re muted from the public chat automatically.
            </p>
            {!alreadyBlocked && !blockedNow && (
              <Button variant="danger" size="lg" onClick={block} loading={blocking}>
                <Ban size={18} aria-hidden="true" />
                Also block {firstName}
              </Button>
            )}
            {blockedNow && <Alert type="success" message={`${firstName} is blocked.`} />}
            <Button variant="secondary" size="lg" onClick={onClose}>
              Done
            </Button>
          </div>
        )}

        {/* ---------- Report: form ---------- */}
        {mode === "report" && !reported && (
          <form onSubmit={submitReport} className="flex flex-col gap-4">
            <p className="text-[15px] text-muted">
              Reports are private. Tell us what&apos;s wrong — we&apos;ll look into it.
            </p>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-text">What&apos;s the problem?</legend>
              <div className="flex flex-col gap-2">
                {REASONS.map((r) => {
                  const checked = reason === r.value;
                  return (
                    <label
                      key={r.value}
                      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-[16px] border-[1.5px] px-3.5 py-2.5 transition-colors ${
                        checked ? "border-primary bg-primary-soft" : "border-border hover:bg-surface-2"
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={r.value}
                        checked={checked}
                        onChange={() => setReason(r.value)}
                        className="h-5 w-5 shrink-0 accent-primary"
                      />
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold text-text">{r.label}</span>
                        <span className="block text-sm text-muted">{r.hint}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="report-details" className="text-sm font-semibold text-text">
                Anything else? <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                id="report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="What happened?"
                className="w-full resize-none rounded-[14px] border-[1.5px] border-transparent bg-surface-2 px-4 py-3 text-base text-text outline-none placeholder:text-muted focus:border-primary focus:bg-surface"
              />
            </div>

            <Button type="submit" variant="danger" size="lg" disabled={submitting}>
              {submitting ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Flag size={18} aria-hidden="true" />}
              Send report
            </Button>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
