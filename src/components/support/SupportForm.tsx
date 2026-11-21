"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Coffee, Loader2, Minus, Plus, Smartphone } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { openCashfreeCheckout } from "@/lib/cashfree-checkout";
import {
  SUPPORT_DEFAULT_RUPEES,
  SUPPORT_MAX_RUPEES,
  SUPPORT_MIN_RUPEES,
  SUPPORT_PENDING_KEY as PENDING_KEY,
  SUPPORT_PRESETS,
  SUPPORT_STEP_RUPEES,
} from "@/lib/supportPlans";

type Phase = "idle" | "starting" | "paying" | "done";

interface PendingPayment {
  orderId: string;
  amount: number;
  startedAt: number;
}

// A payment in progress is remembered for the tab (PENDING_KEY), so if the
// phone reloads the page after the UPI app, we still find out how it ended.
const PENDING_MAX_AGE_MS = 30 * 60 * 1000;
const POLL_EVERY_MS = 3000;
const POLL_FOR_MS = 10 * 60 * 1000;

const clamp = (n: number) => Math.min(SUPPORT_MAX_RUPEES, Math.max(SUPPORT_MIN_RUPEES, n));

function savePending(p: PendingPayment | null) {
  try {
    if (p) sessionStorage.setItem(PENDING_KEY, JSON.stringify(p));
    else sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // private mode / storage blocked — polling still works while the page stays open
  }
}

function loadPending(): PendingPayment | null {
  try {
    const p = JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? "null") as PendingPayment | null;
    return p && Date.now() - p.startedAt < PENDING_MAX_AGE_MS ? p : null;
  } catch {
    return null;
  }
}

/** Our server asks Cashfree — the popup/UPI app's own signal is never trusted. */
async function fetchStatus(orderId: string): Promise<{ status: string; badge: boolean }> {
  try {
    const res = await fetch(`/api/support/status?order_id=${encodeURIComponent(orderId)}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return { status: typeof data.status === "string" ? data.status : "pending", badge: !!data.badge };
  } catch {
    return { status: "pending", badge: false };
  }
}

export default function SupportForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  // One source of truth: the amount box. Presets just fill it.
  const [amountText, setAmountText] = useState(String(SUPPORT_DEFAULT_RUPEES));
  const [note, setNote] = useState("");
  const [anonymous, setAnonymous] = useState(!isLoggedIn);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [gotBadge, setGotBadge] = useState(false);
  // Automatic checks stopped (POLL_FOR_MS passed) — only manual / on-return checks now.
  const [timedOut, setTimedOut] = useState(false);
  const finishedRef = useRef(false);
  // Blocks a quick double tap from creating two orders before the button disables.
  const startingRef = useRef(false);

  const amount = Number(amountText);
  const amountValid = Number.isInteger(amount) && amount >= SUPPORT_MIN_RUPEES && amount <= SUPPORT_MAX_RUPEES;
  const busy = phase === "starting" || phase === "paying";

  function step(delta: number) {
    const base = Number.isFinite(amount) && amount > 0 ? amount : SUPPORT_DEFAULT_RUPEES;
    setAmountText(String(clamp(base + delta)));
  }

  const finish = useCallback(
    (p: PendingPayment, result: { status: string; badge: boolean }) => {
      if (finishedRef.current) return;
      if (result.status === "paid") {
        finishedRef.current = true;
        savePending(null);
        setPending(null);
        setPaidAmount(p.amount);
        setGotBadge(result.badge);
        setPhase("done");
        router.refresh();
      } else if (result.status === "failed" || result.status === "not_found") {
        finishedRef.current = true;
        savePending(null);
        setPending(null);
        setPhase("idle");
        setMessage({ tone: "info", text: "The payment wasn't completed — nothing was charged. You can try again." });
      }
    },
    [router]
  );

  // Came back to this page with a payment still in progress (e.g. the phone
  // reloaded it after the UPI app) — pick it up again.
  useEffect(() => {
    const p = loadPending();
    if (!p) return;
    finishedRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resume a payment remembered in sessionStorage
    setPending(p);
    setPhase("paying");
  }, []);

  // While paying: ask every few seconds, and right away when the person returns
  // from their UPI app / the Cashfree window. Works even if the popup never
  // reports back (it doesn't when a UPI app takes over on phones).
  useEffect(() => {
    if (phase !== "paying" || !pending) return;
    let stopped = false;
    const check = async () => {
      if (stopped || finishedRef.current) return;
      finish(pending, await fetchStatus(pending.orderId));
    };
    const timer = setInterval(() => {
      if (Date.now() - pending.startedAt > POLL_FOR_MS) {
        clearInterval(timer);
        setTimedOut(true);
        return;
      }
      void check();
    }, POLL_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    void check();
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [phase, pending, finish]);

  async function checkNow() {
    if (!pending) return;
    setChecking(true);
    const result = await fetchStatus(pending.orderId);
    setChecking(false);
    finish(pending, result);
    if (result.status === "pending") {
      setMessage({
        tone: "info",
        text: "Not confirmed yet. If you've paid, it usually shows up within a minute — this page keeps checking.",
      });
    }
  }

  function cancelWaiting() {
    savePending(null);
    setPending(null);
    setTimedOut(false);
    setPhase("idle");
    setMessage({
      tone: "info",
      text: "Stopped waiting. If you did pay, it will still be recorded — no need to pay again.",
    });
  }

  async function start() {
    if (!amountValid || busy || startingRef.current) return;
    startingRef.current = true;
    setMessage(null);
    setTimedOut(false);
    setPhase("starting");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, message: note.trim() || undefined, anonymous }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setPhase("idle");
        setMessage({ tone: "error", text: data.message ?? "Couldn't start the payment. Please try again." });
        return;
      }
      const p: PendingPayment = { orderId: data.orderId, amount, startedAt: Date.now() };
      finishedRef.current = false;
      savePending(p);
      setPending(p);
      setPhase("paying");
      // Don't wait on the popup: on phones it may never report back after a UPI
      // app. Polling (above) decides; this just triggers an early check.
      openCashfreeCheckout(data.paymentSessionId, data.mode)
        .then(async (result) => {
          const status = await fetchStatus(p.orderId);
          finish(p, status);
          if (status.status === "pending" && result?.error) {
            setMessage({
              tone: "info",
              text: "The payment window was closed. If you paid in your UPI app, it will be confirmed here automatically — otherwise tap Cancel.",
            });
          }
        })
        .catch((e) => {
          savePending(null);
          setPending(null);
          setPhase("idle");
          setMessage({ tone: "error", text: e instanceof Error ? e.message : "Couldn't open the payment window." });
        });
    } catch (e) {
      setPhase("idle");
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "Something went wrong. Please try again." });
    } finally {
      startingRef.current = false;
    }
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center rounded-[20px] bg-primary-soft p-6 text-center">
        <CircleCheck size={40} className="text-primary-fg" aria-hidden="true" />
        <p className="mt-2 text-lg font-bold">Thank you! Your ₹{paidAmount} keeps DoonMeet running ☕</p>
        <p className="mt-1 text-[15px] text-muted">
          {gotBadge ? "A ☕ Supporter badge now shows on your profile." : "You supported anonymously — thank you, whoever you are 💚"}
        </p>
      </div>
    );
  }

  if (phase === "paying" && pending) {
    return (
      <div className="flex flex-col items-center rounded-[20px] bg-surface-2 p-6 text-center" role="status">
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary-fg">
          <Smartphone size={26} aria-hidden="true" />
        </span>
        <p className="mt-3 text-lg font-bold">Waiting for your ₹{pending.amount} payment…</p>
        <p className="mt-1 max-w-sm text-[15px] text-muted">
          Finish paying in the Cashfree window or your UPI app. This page updates by itself as soon as the payment
          goes through.
        </p>
        {timedOut ? (
          <p className="mt-3 max-w-sm text-sm text-muted">
            Not confirmed yet. If money was deducted, tap &ldquo;I&apos;ve paid — check now&rdquo;. It&apos;s recorded
            either way — no need to pay again.
          </p>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Checking…
          </p>
        )}
        {message && <p className="mt-3 rounded-[14px] bg-surface px-4 py-3 text-[15px] text-text">{message.text}</p>}
        <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={checkNow}
            disabled={checking}
            className={buttonClasses("primary", "md", "sm:w-auto")}
          >
            {checking ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
            I&apos;ve paid — check now
          </button>
          <button type="button" onClick={cancelWaiting} className={buttonClasses("ghost", "md", "sm:w-auto")}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start();
      }}
      className="flex flex-col gap-5"
    >
      <fieldset>
        <legend className="mb-2 text-[15px] font-semibold">Pick a treat</legend>
        <div className="grid grid-cols-2 gap-2">
          {SUPPORT_PRESETS.map((p) => {
            const active = amount === p.amount;
            return (
              <button
                key={p.amount}
                type="button"
                onClick={() => setAmountText(String(p.amount))}
                aria-pressed={active}
                className={`flex flex-col items-start rounded-[16px] border p-3.5 text-left transition-colors ${
                  active ? "border-primary bg-primary-soft" : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                <span className="text-2xl leading-none" aria-hidden="true">
                  {p.emoji}
                </span>
                <span className="mt-1.5 text-[18px] font-extrabold text-text">₹{p.amount}</span>
                <span className="text-sm text-muted">{p.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="support-amount" className="mb-2 block text-[15px] font-semibold">
          Or choose your own amount
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => step(-SUPPORT_STEP_RUPEES)}
            aria-label={`₹${SUPPORT_STEP_RUPEES} less`}
            disabled={amountValid && amount <= SUPPORT_MIN_RUPEES}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-surface-2 text-text transition-colors hover:bg-border disabled:opacity-40"
          >
            <Minus size={20} aria-hidden="true" />
          </button>
          <div className="flex h-14 min-w-0 flex-1 items-center rounded-[14px] border border-border bg-surface px-4 focus-within:border-primary">
            <span className="mr-1 text-2xl font-extrabold text-muted" aria-hidden="true">
              ₹
            </span>
            <input
              id="support-amount"
              inputMode="numeric"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full min-w-0 bg-transparent text-center text-2xl font-extrabold outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => step(SUPPORT_STEP_RUPEES)}
            aria-label={`₹${SUPPORT_STEP_RUPEES} more`}
            disabled={amountValid && amount >= SUPPORT_MAX_RUPEES}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-surface-2 text-text transition-colors hover:bg-border disabled:opacity-40"
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        </div>
        {!amountValid && (
          <p className="mt-1.5 text-sm text-danger">
            Enter an amount between ₹{SUPPORT_MIN_RUPEES} and ₹{SUPPORT_MAX_RUPEES}.
          </p>
        )}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[15px] font-semibold">Say something (optional)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 140))}
          placeholder="Keep it up! 💚"
          className="h-12 w-full rounded-[14px] border border-border bg-surface-2 px-4 text-[16px] outline-none focus:border-primary"
        />
      </label>

      {isLoggedIn ? (
        <label className="flex items-start gap-3 rounded-[14px] bg-surface-2 p-3.5">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
          />
          <span>
            <span className="block text-[15px] font-semibold">Support anonymously</span>
            <span className="block text-sm text-muted">
              Not linked to your account — no badge, and your name isn&apos;t shared.
            </span>
          </span>
        </label>
      ) : (
        <p className="rounded-[14px] bg-surface-2 p-3.5 text-sm text-muted">
          No account needed — you&apos;re supporting anonymously. Log in first if you&apos;d like a ☕ Supporter badge.
        </p>
      )}

      {message && (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`rounded-[14px] px-4 py-3 text-[15px] ${
            message.tone === "error" ? "bg-danger/10 text-danger" : "bg-surface-2 text-text"
          }`}
        >
          {message.text}
        </p>
      )}

      <button type="submit" disabled={!amountValid || busy} className={buttonClasses("primary", "lg", "w-full")}>
        {busy ? (
          <>
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            Opening payment…
          </>
        ) : (
          <>
            <Coffee size={18} aria-hidden="true" />
            Support with ₹{amountValid ? amount : "…"}
          </>
        )}
      </button>
      <p className="text-center text-sm text-muted">
        UPI, cards and netbanking · Secured by Cashfree · We never ask for your phone number
      </p>
    </form>
  );
}
