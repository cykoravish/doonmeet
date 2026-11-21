// "Support DoonMeet" (buy-me-a-coffee) payments via Cashfree. SERVER ONLY.
//
// Privacy: we never ask supporters for a phone number, and anyone can support
// anonymously (no account, or logged in but "don't show my name"). Cashfree
// insists on a phone for every order, so we always send a fixed placeholder
// number instead of the supporter's.
import crypto from "crypto";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Support } from "@/models/Support";
import { User } from "@/models/User";
import { SITE_URL } from "@/lib/seo";
import { cashfreeMode, createCashfreeOrder, fetchCashfreeOrder, isCashfreeConfigured } from "@/lib/cashfree";
import { SUPPORT_MAX_RUPEES, SUPPORT_MIN_RUPEES } from "@/lib/supportPlans";

/** Sent to Cashfree in place of the supporter's phone (Cashfree requires one). */
const PLACEHOLDER_PHONE = "9999999999";

/** Support payments are live only with Cashfree keys AND SUPPORT_ENABLED=true. */
export function isSupportEnabled(): boolean {
  return isCashfreeConfigured() && process.env.SUPPORT_ENABLED?.trim().toLowerCase() === "true";
}

type StartResult =
  | { ok: true; orderId: string; paymentSessionId: string; mode: "sandbox" | "production" }
  | { ok: false; status: number; code: string; message: string };

export async function createSupportOrder(
  user: { _id: string; name: string; email?: string | null } | null,
  input: { amount: number; message?: string | null; anonymous?: boolean }
): Promise<StartResult> {
  if (!isSupportEnabled()) {
    return { ok: false, status: 503, code: "SUPPORT_UNAVAILABLE", message: "Support payments aren't available right now." };
  }
  const amount = Math.round(input.amount);
  if (!Number.isFinite(amount) || amount < SUPPORT_MIN_RUPEES || amount > SUPPORT_MAX_RUPEES) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_AMOUNT",
      message: `Choose an amount between ₹${SUPPORT_MIN_RUPEES} and ₹${SUPPORT_MAX_RUPEES}.`,
    };
  }

  // Linked to an account only when logged in AND not anonymous.
  const identified = !!user && !input.anonymous;

  await connectDB();
  const supportId = new mongoose.Types.ObjectId();
  const orderId = `dms_${supportId.toHexString()}`;
  const message = input.message?.trim().slice(0, 140) || null;

  await Support.create({
    _id: supportId,
    user: identified ? user!._id : null,
    anonymous: !identified,
    amount,
    message,
    orderId,
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || SITE_URL).replace(/\/+$/, "");
  const order = await createCashfreeOrder({
    orderId,
    amount,
    customer: identified
      ? { id: String(user!._id), phone: PLACEHOLDER_PHONE, email: user!.email, name: user!.name }
      : // Nothing that identifies the person goes to Cashfree for anonymous support.
        { id: `anon${crypto.randomBytes(8).toString("hex")}`, phone: PLACEHOLDER_PHONE },
    returnUrl: `${appUrl}/support/thanks?order_id=${orderId}`,
    note: "Support DoonMeet",
    tags: { kind: "support", supportId: supportId.toHexString() },
  });

  await Support.updateOne({ _id: supportId }, { $set: { cfOrderId: String(order.cf_order_id) } });
  return { ok: true, orderId, paymentSessionId: order.payment_session_id, mode: cashfreeMode() };
}

export type SupportStatus = "paid" | "pending" | "failed" | "not_found";

/**
 * Asks Cashfree for the order's real status and records it. Safe to call any
 * number of times (browser, return page and webhook may all call it): the
 * support is marked paid once, and the badge is granted once. Reveals only a
 * status — no personal data — so it doesn't need a login.
 */
export async function settleSupportOrder(orderId: string): Promise<{ status: SupportStatus; badge: boolean }> {
  await connectDB();
  const support = await Support.findOne({ orderId }).select("user amount status").lean<{
    _id: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId | null;
    amount: number;
    status: "created" | "paid" | "failed";
  }>();
  if (!support) return { status: "not_found", badge: false };
  const badge = !!support.user;
  if (support.status === "paid") return { status: "paid", badge };

  const order = await fetchCashfreeOrder(orderId);

  if (order.order_status === "PAID") {
    // Never trust anything but Cashfree's own record — and it must match what we asked for.
    if (Math.round(Number(order.order_amount)) !== support.amount || order.order_currency !== "INR") {
      console.error("[support] amount mismatch for", orderId);
      return { status: "pending", badge };
    }
    const paidAt = new Date();
    const updated = await Support.findOneAndUpdate(
      { _id: support._id, status: { $ne: "paid" } },
      { $set: { status: "paid", paidAt } },
      { new: true }
    );
    if (updated && support.user) {
      await User.updateOne({ _id: support.user, supporterSince: null }, { $set: { supporterSince: paidAt } });
    }
    return { status: "paid", badge };
  }

  if (order.order_status === "EXPIRED" || order.order_status === "TERMINATED") {
    await Support.updateOne({ _id: support._id, status: "created" }, { $set: { status: "failed" } });
    return { status: "failed", badge };
  }
  return { status: "pending", badge };
}
