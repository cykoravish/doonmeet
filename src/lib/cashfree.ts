// Minimal server-side Cashfree Payment Gateway client (REST over fetch — no SDK).
// SERVER ONLY: uses CASHFREE_SECRET_KEY.
//
// Docs (checked 2026-11-21):
//  - Create / Get order: POST|GET {base}/orders[/{order_id}]
//  - Headers: x-client-id, x-client-secret, x-api-version
//  - Webhook signature: Base64(HMAC-SHA256(x-webhook-timestamp + rawBody, secret key))
import crypto from "crypto";

const API_VERSION = "2025-01-01";
const REQUEST_TIMEOUT_MS = 10_000;

export type CashfreeMode = "sandbox" | "production";

export type CashfreeOrderStatus = "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED";

export interface CashfreeOrder {
  cf_order_id: string | number;
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: CashfreeOrderStatus;
  payment_session_id: string;
  order_expiry_time?: string;
  created_at?: string;
}

export class CashfreeError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "CashfreeError";
  }
}

export function cashfreeMode(): CashfreeMode {
  return process.env.CASHFREE_ENV?.trim().toLowerCase() === "production" ? "production" : "sandbox";
}

function apiBase(): string {
  return cashfreeMode() === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
}

function getKeys(): { appId: string; secret: string } | null {
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secret = process.env.CASHFREE_SECRET_KEY?.trim();
  return appId && secret ? { appId, secret } : null;
}

export function isCashfreeConfigured(): boolean {
  return getKeys() !== null;
}

async function cfFetch<T>(path: string, init: { method: "GET" | "POST"; body?: unknown }): Promise<T> {
  const keys = getKeys();
  if (!keys) throw new CashfreeError("Cashfree is not configured", 503, "NOT_CONFIGURED");

  const res = await fetch(`${apiBase()}${path}`, {
    method: init.method,
    headers: {
      "x-client-id": keys.appId,
      "x-client-secret": keys.secret,
      "x-api-version": API_VERSION,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as T & { message?: string; code?: string };
  if (!res.ok) {
    throw new CashfreeError(data?.message || `Cashfree request failed (${res.status})`, res.status, data?.code);
  }
  return data;
}

export async function createCashfreeOrder(input: {
  orderId: string;
  amount: number;
  customer: { id: string; phone: string; email?: string | null; name?: string | null };
  returnUrl: string;
  note?: string;
  tags?: Record<string, string>;
}): Promise<CashfreeOrder> {
  return cfFetch<CashfreeOrder>("/orders", {
    method: "POST",
    body: {
      order_id: input.orderId,
      order_amount: input.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: input.customer.id,
        customer_phone: input.customer.phone,
        ...(input.customer.email ? { customer_email: input.customer.email } : {}),
        ...(input.customer.name && input.customer.name.length >= 3 ? { customer_name: input.customer.name.slice(0, 100) } : {}),
      },
      order_meta: { return_url: input.returnUrl },
      ...(input.note ? { order_note: input.note.slice(0, 200) } : {}),
      ...(input.tags ? { order_tags: input.tags } : {}),
    },
  });
}

export async function fetchCashfreeOrder(orderId: string): Promise<CashfreeOrder> {
  return cfFetch<CashfreeOrder>(`/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/**
 * Verifies a webhook. Signature = Base64(HMAC-SHA256(timestamp + rawBody, secret key)).
 * One Cashfree page writes "timestamp.body", so that form is accepted too — both
 * still require the secret. Rejects timestamps older than 24 hours — Cashfree retries
 * a failed delivery up to 30 minutes later, and a replay can do no harm anyway: the
 * payment result is always re-read from Cashfree's API, never taken from the payload.
 */
export function verifyCashfreeWebhook(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
  now = Date.now()
): boolean {
  const keys = getKeys();
  if (!keys || !timestamp || !signature) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const tsMs = ts < 1e12 ? ts * 1000 : ts; // seconds or milliseconds
  if (Math.abs(now - tsMs) > 24 * 60 * 60 * 1000) return false;

  const sign = (payload: string) => crypto.createHmac("sha256", keys.secret).update(payload).digest("base64");
  return safeEqual(sign(timestamp + rawBody), signature) || safeEqual(sign(`${timestamp}.${rawBody}`), signature);
}
