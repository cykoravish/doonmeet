"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Loader2, Megaphone } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { loadRazorpayCheckout, type RazorpaySuccessResponse } from "@/lib/razorpay-checkout";
import { PROMOTION_DAYS, PROMOTION_PRICE_LABEL } from "@/lib/promotionPlans";

interface PromoteButtonProps {
  postId: string;
  /** True while a paid sponsorship is still running (decided by the server). */
  isSponsored: boolean;
  /** Pre-formatted end date, e.g. "Sat, 30 Nov" (server-formatted in IST). */
  sponsoredUntilLabel?: string | null;
  /** False when the site has no payment keys configured. */
  paymentsEnabled: boolean;
  /** "block" = full-width (detail page / promote page), "compact" = small. */
  variant?: "block" | "compact";
}

type Phase = "idle" | "starting" | "paying" | "confirming" | "done";

const BRAND_GREEN = "#1F6B47";

export default function PromoteButton({
  postId,
  isSponsored,
  sponsoredUntilLabel,
  paymentsEnabled,
  variant = "block",
}: PromoteButtonProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<{ tone: "error" | "info" | "success"; text: string } | null>(null);

  async function confirmPayment(response: RazorpaySuccessResponse) {
    setPhase("confirming");
    try {
      const res = await fetch("/api/promotions/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setPhase("done");
        setMessage({
          tone: "success",
          text: data.pending
            ? data.message
            : "Done! Your post is now sponsored and pinned at the top of the feed.",
        });
        router.refresh();
        return;
      }
      setPhase("idle");
      setMessage({ tone: "error", text: data.message ?? "We couldn't confirm the payment." });
    } catch {
      setPhase("idle");
      setMessage({
        tone: "info",
        text: "Payment done? It can take a few minutes to activate — refresh this page shortly.",
      });
    }
  }

  async function start() {
    setMessage(null);
    setPhase("starting");
    try {
      // Fetch the order and the Checkout script in parallel.
      const [res, loaded] = await Promise.all([
        fetch("/api/promotions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        }),
        loadRazorpayCheckout(),
      ]);
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setPhase("idle");
        setMessage({ tone: "error", text: data.message ?? "Couldn't start the payment." });
        return;
      }
      if (!loaded || !window.Razorpay) {
        setPhase("idle");
        setMessage({ tone: "error", text: "Couldn't load the payment window. Check your connection and try again." });
        return;
      }

      const c = data.checkout as {
        keyId: string;
        orderId: string;
        amount: number;
        currency: string;
        description: string;
        prefill: { name: string; email: string };
      };

      const rzp = new window.Razorpay({
        key: c.keyId,
        amount: c.amount,
        currency: c.currency,
        name: "DoonMeet",
        description: c.description,
        order_id: c.orderId,
        prefill: c.prefill,
        theme: { color: BRAND_GREEN },
        handler: (response) => {
          void confirmPayment(response);
        },
        modal: {
          ondismiss: () => setPhase((p) => (p === "paying" ? "idle" : p)),
        },
      });
      rzp.on("payment.failed", (response) => {
        setMessage({
          tone: "error",
          text: response.error?.description ?? "Payment failed. No money was taken — please try again.",
        });
      });
      setPhase("paying");
      rzp.open();
    } catch {
      setPhase("idle");
      setMessage({ tone: "error", text: "Network error. Please try again." });
    }
  }

  const busy = phase === "starting" || phase === "confirming";
  const label = isSponsored
    ? `Extend ${PROMOTION_DAYS} days · ${PROMOTION_PRICE_LABEL}`
    : `Promote · ${PROMOTION_PRICE_LABEL} for ${PROMOTION_DAYS} days`;

  return (
    <div className={variant === "block" ? "flex flex-col gap-2" : "flex flex-col items-start gap-1.5"}>
      {isSponsored && sponsoredUntilLabel && (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-fg">
          <CircleCheck size={16} aria-hidden="true" />
          Sponsored until {sponsoredUntilLabel}
        </p>
      )}

      {paymentsEnabled ? (
        <button
          type="button"
          onClick={start}
          disabled={busy || phase === "paying" || phase === "done"}
          className={buttonClasses(
            isSponsored ? "secondary" : "primary",
            variant === "block" ? "md" : "sm",
            variant === "block" ? "w-full" : ""
          )}
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : (
            <Megaphone size={18} aria-hidden="true" />
          )}
          {phase === "confirming" ? "Confirming payment…" : label}
        </button>
      ) : (
        <p className="text-sm text-muted">Promotions are coming soon.</p>
      )}

      {message && (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`text-sm ${
            message.tone === "error" ? "text-danger" : message.tone === "success" ? "text-primary-fg" : "text-muted"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
