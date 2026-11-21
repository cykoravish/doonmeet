// POST /api/webhooks/cashfree — Cashfree payment webhooks.
// We only trust the signature to accept the call; the payment result itself is
// always re-read from Cashfree's API (settleSupportOrder), so a replayed or
// edited payload can't mark anything paid.
import { NextRequest, NextResponse } from "next/server";
import { isCashfreeConfigured, verifyCashfreeWebhook } from "@/lib/cashfree";
import { settleSupportOrder } from "@/lib/support";

interface CashfreeWebhook {
  type?: string;
  data?: { order?: { order_id?: string } };
}

export async function POST(req: NextRequest) {
  if (!isCashfreeConfigured()) {
    return NextResponse.json({ ok: false, message: "Webhook not configured" }, { status: 503 });
  }

  // Must hash the exact bytes Cashfree sent — read as text, never re-serialize.
  const rawBody = await req.text();
  const valid = verifyCashfreeWebhook(
    rawBody,
    req.headers.get("x-webhook-timestamp"),
    req.headers.get("x-webhook-signature")
  );
  if (!valid) {
    return NextResponse.json({ ok: false, message: "Invalid signature" }, { status: 400 });
  }

  let body: CashfreeWebhook;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const orderId = body.data?.order?.order_id;
  try {
    if (orderId && /^dms_[a-f0-9]{24}$/.test(orderId) && body.type?.startsWith("PAYMENT_")) {
      await settleSupportOrder(orderId);
    }
    // Other events / orders: acknowledge so Cashfree doesn't keep retrying.
    return NextResponse.json({ ok: true });
  } catch (error) {
    // 5xx → Cashfree retries later, which is what we want for transient errors.
    console.error("[cashfree webhook] Error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
