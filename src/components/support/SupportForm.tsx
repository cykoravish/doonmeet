"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Coffee, Loader2, Minus, Plus } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { openCashfreeCheckout } from "@/lib/cashfree-checkout";
import {
  SUPPORT_DEFAULT_RUPEES,
  SUPPORT_MAX_RUPEES,
  SUPPORT_MIN_RUPEES,
  SUPPORT_PRESETS,
  SUPPORT_STEP_RUPEES,
} from "@/lib/supportPlans";

type Phase = "idle" | "starting" | "paying" | "confirming" | "done";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clamp = (n: number) => Math.min(SUPPORT_MAX_RUPEES, Math.max(SUPPORT_MIN_RUPEES, n));

export default function SupportForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  // One source of truth: the amount box. Presets just fill it.
  const [amountText, setAmountText] = useState(String(SUPPORT_DEFAULT_RUPEES));
  const [note, setNote] = useState("");
  const [anonymous, setAnonymous] = useState(!isLoggedIn);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [gotBadge, setGotBadge] = useState(false);

  const amount = Number(amountText);
  const amountValid = Number.isInteger(amount) && amount >= SUPPORT_MIN_RUPEES && amount <= SUPPORT_MAX_RUPEES;
  const busy = phase === "starting" || phase === "paying" || phase === "confirming";

  function step(delta: number) {
    const base = Number.isFinite(amount) && amount > 0 ? amount : SUPPORT_DEFAULT_RUPEES;
    setAmountText(String(clamp(base + delta)));
  }

  // The popup closing doesn't tell us the truth — ask our server (which asks Cashfree).
  async function confirm(orderId: string) {
    setPhase("confirming");
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const res = await fetch(`/api/support/status?order_id=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (data.status === "paid") {
          setGotBadge(!!data.badge);
          setPhase("done");
          router.refresh();
          return;
        }
        if (data.status === "failed") break;
      } catch {
        // network blip — try again
      }
      await wait(2000);
    }
    setPhase("idle");
    setMessage({
      tone: "info",
      text: "The payment wasn't completed. If money was deducted, it will be confirmed within a few minutes — no need to pay again.",
    });
  }

  async function start() {
    if (!amountValid || busy) return;
    setMessage(null);
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
      setPhase("paying");
      const result = await openCashfreeCheckout(data.paymentSessionId, data.mode);
      if (result.redirect) return; // opened in a new window / UPI app — the return page confirms it
      await confirm(data.orderId);
    } catch (e) {
      setPhase("idle");
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "Something went wrong. Please try again." });
    }
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center rounded-[20px] bg-primary-soft p-6 text-center">
        <CircleCheck size={40} className="text-primary-fg" aria-hidden="true" />
        <p className="mt-2 text-lg font-bold">Thank you! Your ₹{amount} keeps DoonMeet running ☕</p>
        <p className="mt-1 text-[15px] text-muted">
          {gotBadge ? "A ☕ Supporter badge now shows on your profile." : "You supported anonymously — thank you, whoever you are 💚"}
        </p>
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
            {phase === "confirming" ? "Confirming…" : "Opening payment…"}
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
