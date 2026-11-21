"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SUPPORT_PENDING_KEY } from "@/lib/supportPlans";

const REFRESH_EVERY_MS = 4000;
const REFRESH_FOR_MS = 5 * 60 * 1000;

/**
 * On the thank-you page: while the payment is still "confirming", re-checks it
 * every few seconds (the server page asks Cashfree). Once it has ended, forgets
 * the in-progress payment so /support doesn't show the waiting screen again.
 */
export default function ThanksAutoCheck({ orderId, pending }: { orderId: string; pending: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!pending) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(SUPPORT_PENDING_KEY) ?? "null") as { orderId?: string } | null;
        if (saved?.orderId === orderId) sessionStorage.removeItem(SUPPORT_PENDING_KEY);
      } catch {
        // storage blocked — nothing to clean up
      }
      return;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - startedAt > REFRESH_FOR_MS) {
        clearInterval(timer);
        return;
      }
      router.refresh();
    }, REFRESH_EVERY_MS);
    return () => clearInterval(timer);
  }, [orderId, pending, router]);

  return null;
}
