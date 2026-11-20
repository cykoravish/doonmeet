// POST /api/webhooks/razorpay — Razorpay → us (no user session).
// Backup path that settles sponsored-post payments even if the buyer closed
// the tab before /api/promotions/verify ran. Configure in the Razorpay
// Dashboard → Webhooks: URL https://doonmeet.in/api/webhooks/razorpay,
// events payment.authorized, payment.captured, payment.failed, order.paid,
// and put the same secret in RAZORPAY_WEBHOOK_SECRET.
//
// Signature = HMAC-SHA256 of the RAW body with the webhook secret
// (X-Razorpay-Signature). Events can repeat and arrive out of order —
// settlePromotionPayment() is idempotent, so that's fine.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { isWebhookConfigured, verifyWebhookSignature, type RazorpayPayment } from "@/lib/razorpay";
import { markPromotionFailed, settlePromotionPayment } from "@/lib/promotions";

interface WebhookEvent {
  event?: string;
  payload?: { payment?: { entity?: RazorpayPayment } };
}

export async function POST(req: NextRequest) {
  if (!isWebhookConfigured()) {
    return NextResponse.json({ ok: false, message: "Webhook not configured" }, { status: 503 });
  }

  // Must hash the exact bytes Razorpay sent — read as text, never re-serialize.
  const rawBody = await req.text();
  if (!verifyWebhookSignature(rawBody, req.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ ok: false, message: "Invalid signature" }, { status: 400 });
  }

  let body: WebhookEvent;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  const payment = body.payload?.payment?.entity;

  try {
    switch (body.event) {
      case "payment.authorized":
      case "payment.captured":
      case "order.paid":
        if (payment) await settlePromotionPayment(payment);
        break;
      case "payment.failed":
        await markPromotionFailed(payment?.order_id);
        break;
      default:
        // Not an event we use — acknowledge so Razorpay doesn't retry it.
        break;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    // 5xx → Razorpay retries later, which is what we want for transient errors.
    console.error("[razorpay webhook] Error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
