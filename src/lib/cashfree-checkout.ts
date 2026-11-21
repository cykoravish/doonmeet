"use client";

// Loads Cashfree's JS SDK (v3) on demand — only when someone taps "Support",
// so ordinary page loads never download it (keeps low-end phones fast).

const SDK_SRC = "https://sdk.cashfree.com/js/v3/cashfree.js";

export interface CashfreeCheckoutResult {
  error?: { message?: string } | true;
  redirect?: boolean;
  paymentDetails?: { paymentMessage?: string };
}

interface CashfreeInstance {
  checkout(options: { paymentSessionId: string; redirectTarget?: "_modal" | "_self" }): Promise<CashfreeCheckoutResult>;
}

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => CashfreeInstance;
  }
}

let loading: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (window.Cashfree) return Promise.resolve();
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SDK_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loading = null;
        reject(new Error("Couldn't load the payment window. Check your connection and try again."));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

/** Opens Cashfree checkout as a popup over the page and resolves when it closes. */
export async function openCashfreeCheckout(
  paymentSessionId: string,
  mode: "sandbox" | "production"
): Promise<CashfreeCheckoutResult> {
  await loadSdk();
  if (!window.Cashfree) throw new Error("Payment window unavailable.");
  return window.Cashfree({ mode }).checkout({ paymentSessionId, redirectTarget: "_modal" });
}
