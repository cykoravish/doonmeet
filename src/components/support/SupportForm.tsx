"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Coffee, Loader2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { openCashfreeCheckout } from "@/lib/cashfree-checkout";
import {
  SUPPORT_DEFAULT_RUPEES,
  SUPPORT_MAX_RUPEES,
  SUPPORT_MIN_RUPEES,
  SUPPORT_PRESETS_RUPEES,
} from "@/lib/supportPlans";

type Phase = "idle" | "starting" | "paying" | "confirming" | "done";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function SupportForm({ needsPhone }: { needsPhone: boolean }) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(SUPPORT_DEFAULT_RUPEES);
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<{ tone: "error" | "info" | "success"; text: string } | null>(null);

  const finalAmount = custom ? Number(custom) : amount;
  const amountValid =
    Number.isInteger(finalAmount) && finalAmount >= SUPPORT_MIN_RUPEES && finalAmount <= SUPPORT_MAX_RUPEES;
  const phoneValid = !needsPhone || /^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").slice(-10));
  const busy = phase === "starting" || phase === "paying" || phase === "confirming";

  // The popup closing doesn't tell us the truth — ask our server (which asks Cashfree).
  async function confirm(orderId: string) {
    setPhase("confirming");
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const res = await fetch(`/api/support/status?order_id=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (data.status === "paid") {
          setPhase("done");
          setMessage({ tone: "success", text: `Thank you! Your ₹${finalAmount} keeps DoonMeet running. ☕` });
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
      text: "The payment wasn't completed. If money was deducted, it will show up here within a few minutes — no need to pay again.",
    });
  }

  async function start() {
    if (!amountValid || !phoneValid || busy) return;
    setMessage(null);
    setPhase("starting");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          message: note.trim() || undefined,
          phone: needsPhone ? phone : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setPhase("idle");
        setMessage({ tone: "error", text: data.message ?? "Couldn't start the payment. Please try again." });
        return;
      }
      setPhase("paying");
      const result = await openCashfreeCheckout(data.paymentSessionId, data.mode);
      if (result.redirect) return; // opened in a new window / in-app browser — the return page confirms it
      await confirm(data.orderId);
    } catch (e) {
      setPhase("idle");
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "Something went wrong. Please try again." });
    }
  }

  if (phase === "done" && message) {
    return (
      <div className="flex flex-col items-center rounded-[20px] bg-primary-soft p-6 text-center">
        <CircleCheck size={40} className="text-primary-fg" aria-hidden="true" />
        <p className="mt-2 text-lg font-bold">{message.text}</p>
        <p className="mt-1 text-[15px] text-muted">A ☕ Supporter badge now shows on your profile.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start();
      }}
      className="flex flex-col gap-4"
    >
      <fieldset>
        <legend className="mb-2 text-[15px] font-semibold">Choose an amount</legend>
        <div className="grid grid-cols-3 gap-2">
          {SUPPORT_PRESETS_RUPEES.map((v) => {
            const active = !custom && amount === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setAmount(v);
                  setCustom("");
                }}
                aria-pressed={active}
                className={`h-12 rounded-[14px] border text-[17px] font-bold transition-colors ${
                  active ? "border-primary bg-primary text-on-primary" : "border-border bg-surface text-text hover:bg-surface-2"
                }`}
              >
                ₹{v}
              </button>
            );
          })}
        </div>
        <label className="mt-2 block">
          <span className="sr-only">Other amount in rupees</span>
          <input
            inputMode="numeric"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder={`Other amount (₹${SUPPORT_MIN_RUPEES}–₹${SUPPORT_MAX_RUPEES})`}
            className="h-12 w-full rounded-[14px] border border-border bg-surface-2 px-4 text-[16px] outline-none focus:border-primary"
          />
        </label>
        {custom && !amountValid && (
          <p className="mt-1 text-sm text-danger">
            Enter between ₹{SUPPORT_MIN_RUPEES} and ₹{SUPPORT_MAX_RUPEES}.
          </p>
        )}
      </fieldset>

      <label className="block">
        <span className="mb-1.5 block text-[15px] font-semibold">Message (optional)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 140))}
          placeholder="Keep it up! 💚"
          className="h-12 w-full rounded-[14px] border border-border bg-surface-2 px-4 text-[16px] outline-none focus:border-primary"
        />
      </label>

      {needsPhone && (
        <label className="block">
          <span className="mb-1.5 block text-[15px] font-semibold">Mobile number</span>
          <input
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.slice(0, 14))}
            placeholder="10-digit mobile number"
            className="h-12 w-full rounded-[14px] border border-border bg-surface-2 px-4 text-[16px] outline-none focus:border-primary"
          />
          <span className="mt-1 block text-sm text-muted">Our payment partner Cashfree needs it for the receipt.</span>
        </label>
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

      <button
        type="submit"
        disabled={!amountValid || !phoneValid || busy}
        className={buttonClasses("primary", "lg", "w-full")}
      >
        {busy ? (
          <>
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            {phase === "confirming" ? "Confirming…" : "Opening payment…"}
          </>
        ) : (
          <>
            <Coffee size={18} aria-hidden="true" />
            Support with ₹{amountValid ? finalAmount : "…"}
          </>
        )}
      </button>
      <p className="text-center text-sm text-muted">UPI, cards and netbanking · Secured by Cashfree</p>
    </form>
  );
}
