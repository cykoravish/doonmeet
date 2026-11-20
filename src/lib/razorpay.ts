// Minimal server-side Razorpay client (REST over fetch — no SDK dependency).
// SERVER ONLY: uses RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET.
//
// Docs: Orders API (POST /v1/orders), Payments API (GET /v1/payments/:id,
// POST /v1/payments/:id/capture), Standard Checkout signature check
// (HMAC-SHA256 of "order_id|payment_id" with the key secret) and webhook
// signature (HMAC-SHA256 of the RAW body with the webhook secret, sent in
// the X-Razorpay-Signature header).
import crypto from "crypto";

const API_BASE = "https://api.razorpay.com/v1";
const REQUEST_TIMEOUT_MS = 10_000;

export interface RazorpayOrder {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: "created" | "attempted" | "paid";
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayPayment {
  id: string;
  entity: "payment";
  amount: number;
  currency: string;
  /** created | authorized | captured | refunded | failed (pending for COD only) */
  status: string;
  captured: boolean;
  order_id: string | null;
  method?: string;
  email?: string;
  contact?: string;
  error_code?: string | null;
  error_description?: string | null;
}

export class RazorpayError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "RazorpayError";
    this.status = status;
    this.code = code;
  }
}

function getKeys(): { keyId: string; keySecret: string } | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  return keyId && keySecret ? { keyId, keySecret } : null;
}

/** True when API keys are configured (payments can be taken). */
export function isPaymentsConfigured(): boolean {
  return getKeys() !== null;
}

/** The PUBLIC key id handed to Checkout.js. */
export function getPublicKeyId(): string | null {
  return getKeys()?.keyId ?? null;
}

async function rzpFetch<T>(path: string, init: { method: "GET" | "POST"; body?: unknown }): Promise<T> {
  const keys = getKeys();
  if (!keys) throw new RazorpayError("Payments are not configured", 503, "NOT_CONFIGURED");

  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString("base64")}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => null)) as
    | (T & { error?: { code?: string; description?: string } })
    | null;

  if (!res.ok || !data) {
    const description = data?.error?.description ?? `Razorpay request failed (${res.status})`;
    throw new RazorpayError(description, res.status, data?.error?.code);
  }
  return data;
}

export function createOrder(params: {
  amount: number;
  currency: string;
  /** ASCII, max 40 chars, must be unique per order. */
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  return rzpFetch<RazorpayOrder>("/orders", { method: "POST", body: params });
}

export function fetchPayment(paymentId: string): Promise<RazorpayPayment> {
  return rzpFetch<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`, { method: "GET" });
}

/** Captures an `authorized` payment (needed when the account isn't on auto-capture). */
export function capturePayment(paymentId: string, amount: number, currency: string): Promise<RazorpayPayment> {
  return rzpFetch<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}/capture`, {
    method: "POST",
    body: { amount, currency },
  });
}

function hmacHex(secret: string, message: string): string {
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

/** Constant-time comparison of two hex strings. */
function safeEqualHex(a: string, b: string): boolean {
  if (!/^[a-f0-9]+$/i.test(a) || !/^[a-f0-9]+$/i.test(b) || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

/**
 * Checkout success signature: HMAC-SHA256("<order_id>|<payment_id>", key_secret).
 * Always pass the order id from OUR database, not the one the browser sent.
 */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const keys = getKeys();
  if (!keys || !orderId || !paymentId || !signature) return false;
  return safeEqualHex(hmacHex(keys.keySecret, `${orderId}|${paymentId}`), signature);
}

/** True when the webhook secret is set (the webhook endpoint is usable). */
export function isWebhookConfigured(): boolean {
  return !!process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
}

/** Webhook signature: HMAC-SHA256(raw request body, webhook secret). Use the RAW body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) return false;
  return safeEqualHex(hmacHex(secret, rawBody), signature);
}
