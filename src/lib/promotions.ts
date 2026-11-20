// Sponsored-post purchases — SERVER ONLY.
//
// Flow: createPromotionOrder() → Razorpay Checkout in the browser →
// /api/promotions/verify (signature + server-side payment fetch) and/or the
// Razorpay webhook → settlePromotionPayment().
//
// settlePromotionPayment() is safe to call any number of times, from either
// path, concurrently: a purchase is marked paid at most once, and its days
// are added to the post at most once (tracked in Post.sponsorPromotionIds).
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Post } from "@/models/Post";
import { Promotion, type IPromotion } from "@/models/Promotion";
import {
  capturePayment,
  createOrder,
  fetchPayment,
  getPublicKeyId,
  type RazorpayPayment,
} from "@/lib/razorpay";
import {
  PROMOTION_CURRENCY,
  PROMOTION_DAYS,
  PROMOTION_MAX_QUEUE_DAYS,
  PROMOTION_PRICE_PAISE,
} from "@/lib/promotionPlans";

const DAY_MS = 24 * 60 * 60 * 1000;

// -------------------------------------------------------
// Create an order
// -------------------------------------------------------

export type CreateOrderResult =
  | {
      ok: true;
      checkout: {
        keyId: string;
        orderId: string;
        amount: number;
        currency: string;
        description: string;
        prefill: { name: string; email: string };
      };
    }
  | { ok: false; status: number; code: string; message: string };

export async function createPromotionOrder(
  user: { _id: string; name: string; email?: string | null },
  postId: string
): Promise<CreateOrderResult> {
  const keyId = getPublicKeyId();
  if (!keyId) {
    return { ok: false, status: 503, code: "PAYMENTS_UNAVAILABLE", message: "Payments aren't available right now." };
  }

  await connectDB();
  const post = await Post.findById(postId).select("author sponsoredUntil").lean<{
    author: mongoose.Types.ObjectId;
    sponsoredUntil?: Date | null;
  }>();
  if (!post) return { ok: false, status: 404, code: "NOT_FOUND", message: "Post not found." };
  if (String(post.author) !== String(user._id)) {
    return { ok: false, status: 403, code: "FORBIDDEN", message: "You can only promote your own posts." };
  }

  // Already sponsored far ahead? Stop accidental repeat purchases.
  const until = post.sponsoredUntil ? new Date(post.sponsoredUntil).getTime() : 0;
  if (until > Date.now() + (PROMOTION_MAX_QUEUE_DAYS - PROMOTION_DAYS) * DAY_MS) {
    return {
      ok: false,
      status: 400,
      code: "ALREADY_SPONSORED",
      message: `This post is already sponsored for the next ${PROMOTION_MAX_QUEUE_DAYS / 7} weeks.`,
    };
  }

  // Our id first, so the Razorpay receipt can reference it (receipt: ASCII, ≤40 chars, unique).
  const promotionId = new mongoose.Types.ObjectId();
  const order = await createOrder({
    amount: PROMOTION_PRICE_PAISE,
    currency: PROMOTION_CURRENCY,
    receipt: `dm_promo_${promotionId.toHexString()}`,
    notes: { promotionId: promotionId.toHexString(), postId, userId: String(user._id) },
  });

  await Promotion.create({
    _id: promotionId,
    user: user._id,
    post: postId,
    amount: PROMOTION_PRICE_PAISE,
    currency: PROMOTION_CURRENCY,
    days: PROMOTION_DAYS,
    status: "created",
    razorpayOrderId: order.id,
  });

  return {
    ok: true,
    checkout: {
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      description: `Sponsored post · ${PROMOTION_DAYS} days`,
      prefill: { name: user.name, email: user.email ?? "" },
    },
  };
}

// -------------------------------------------------------
// Settle a payment (verify endpoint + webhook)
// -------------------------------------------------------

export type SettleResult =
  | { status: "active"; sponsoredUntil: Date | null }
  | { status: "pending" } // not captured yet — the webhook will finish it
  | { status: "not_applied"; reason: string } // paid, but couldn't be applied (needs a manual refund)
  | { status: "ignored"; reason: string }; // not one of our orders / mismatch / failed payment

/**
 * Adds the purchase's days to the post exactly once (idempotent per promotion),
 * extending from the current sponsorship end if one is still running.
 */
async function applyToPost(promo: IPromotion): Promise<{ startsAt: Date; endsAt: Date } | "missing" | "already"> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const post = await Post.findById(promo.post)
      .select("+sponsorPromotionIds sponsoredUntil")
      .lean<{ sponsoredUntil?: Date | null; sponsorPromotionIds?: mongoose.Types.ObjectId[] }>();
    if (!post) return "missing";
    if (post.sponsorPromotionIds?.some((id) => String(id) === String(promo._id))) return "already";

    const current = post.sponsoredUntil ? new Date(post.sponsoredUntil) : null;
    const base = current && current.getTime() > Date.now() ? current.getTime() : Date.now();
    const startsAt = new Date(base);
    const endsAt = new Date(base + promo.days * DAY_MS);

    // Optimistic concurrency: only succeeds if nobody changed sponsoredUntil
    // since we read it, and this promotion hasn't been applied yet.
    const res = await Post.updateOne(
      { _id: promo.post, sponsoredUntil: current, sponsorPromotionIds: { $ne: promo._id } },
      { $set: { sponsoredUntil: endsAt }, $addToSet: { sponsorPromotionIds: promo._id } }
    );
    if (res.modifiedCount === 1) return { startsAt, endsAt };
  }
  throw new Error(`[promotions] could not apply promotion ${promo._id} (contention)`);
}

export async function settlePromotionPayment(payment: RazorpayPayment): Promise<SettleResult> {
  if (!payment.order_id) return { status: "ignored", reason: "payment has no order" };

  await connectDB();
  const promo = await Promotion.findOne({ razorpayOrderId: payment.order_id });
  if (!promo) return { status: "ignored", reason: "unknown order" };

  if (payment.amount !== promo.amount || payment.currency !== promo.currency) {
    console.error(
      `[promotions] amount mismatch for ${promo._id}: got ${payment.amount} ${payment.currency}, expected ${promo.amount} ${promo.currency}`
    );
    return { status: "ignored", reason: "amount mismatch" };
  }

  // Already fully applied — nothing to do (repeat webhook / double verify).
  if (promo.status === "paid" && promo.endsAt) {
    return { status: "active", sponsoredUntil: promo.endsAt };
  }

  // Make sure the money is actually captured (accounts without auto-capture
  // leave payments "authorized" — those auto-refund if never captured).
  let p = payment;
  if (p.status === "authorized") {
    try {
      p = await capturePayment(p.id, promo.amount, promo.currency);
    } catch {
      // Possibly captured concurrently by the other path — re-check.
      p = await fetchPayment(p.id);
    }
  }
  if (p.status !== "captured") {
    return p.status === "failed" ? { status: "ignored", reason: "payment failed" } : { status: "pending" };
  }

  // Mark paid once (created/failed → paid). A failed event can be followed
  // by a captured one for the same order, so "failed" may flip to "paid".
  await Promotion.updateOne(
    { _id: promo._id, status: { $ne: "paid" } },
    { $set: { status: "paid", razorpayPaymentId: p.id, paidAt: new Date() } }
  );

  const applied = await applyToPost(promo);

  if (applied === "missing") {
    const reason = "Post was deleted before the sponsorship could be applied — refund manually.";
    await Promotion.updateOne({ _id: promo._id }, { $set: { issue: reason } });
    console.error(`[promotions] ${promo._id}: ${reason}`);
    return { status: "not_applied", reason };
  }

  if (applied === "already") {
    const post = await Post.findById(promo.post).select("sponsoredUntil").lean<{ sponsoredUntil?: Date | null }>();
    const endsAt = post?.sponsoredUntil ?? null;
    await Promotion.updateOne({ _id: promo._id, endsAt: null }, { $set: { endsAt } });
    return { status: "active", sponsoredUntil: endsAt };
  }

  await Promotion.updateOne(
    { _id: promo._id },
    { $set: { startsAt: applied.startsAt, endsAt: applied.endsAt } }
  );
  return { status: "active", sponsoredUntil: applied.endsAt };
}

/** payment.failed webhook — only marks orders that were never paid. */
export async function markPromotionFailed(orderId: string | null | undefined): Promise<void> {
  if (!orderId) return;
  await connectDB();
  await Promotion.updateOne({ razorpayOrderId: orderId, status: "created" }, { $set: { status: "failed" } });
}
