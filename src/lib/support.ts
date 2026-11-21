// "Support DoonMeet" (buy-me-a-coffee) payments via Cashfree. SERVER ONLY.
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Support } from "@/models/Support";
import { User } from "@/models/User";
import { SITE_URL } from "@/lib/seo";
import { cashfreeMode, createCashfreeOrder, fetchCashfreeOrder, isCashfreeConfigured } from "@/lib/cashfree";
import { SUPPORT_MAX_RUPEES, SUPPORT_MIN_RUPEES } from "@/lib/supportPlans";

/** Support payments are live only with Cashfree keys AND SUPPORT_ENABLED=true. */
export function isSupportEnabled(): boolean {
  return isCashfreeConfigured() && process.env.SUPPORT_ENABLED?.trim().toLowerCase() === "true";
}

/** Indian mobile number → 10 digits, or null. Accepts +91 / 0 prefixes and spaces. */
export function normalizeIndianMobile(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

type StartResult =
  | { ok: true; orderId: string; paymentSessionId: string; mode: "sandbox" | "production" }
  | { ok: false; status: number; code: string; message: string };

export async function createSupportOrder(
  user: { _id: string; name: string; email?: string | null; phone?: string | null },
  input: { amount: number; message?: string | null; phone?: string | null }
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
  // Cashfree requires a phone number for every order.
  const phone = normalizeIndianMobile(input.phone) ?? normalizeIndianMobile(user.phone);
  if (!phone) {
    return { ok: false, status: 400, code: "PHONE_REQUIRED", message: "Please enter a valid 10-digit mobile number." };
  }

  await connectDB();
  const supportId = new mongoose.Types.ObjectId();
  const orderId = `dms_${supportId.toHexString()}`;
  const message = input.message?.trim().slice(0, 140) || null;

  await Support.create({ _id: supportId, user: user._id, amount, message, orderId });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || SITE_URL).replace(/\/+$/, "");
  const order = await createCashfreeOrder({
    orderId,
    amount,
    customer: { id: String(user._id), phone, email: user.email, name: user.name },
    returnUrl: `${appUrl}/support/thanks?order_id=${orderId}`,
    note: "Support DoonMeet",
    tags: { kind: "support", supportId: supportId.toHexString(), userId: String(user._id) },
  });

  await Support.updateOne({ _id: supportId }, { $set: { cfOrderId: String(order.cf_order_id) } });
  return { ok: true, orderId, paymentSessionId: order.payment_session_id, mode: cashfreeMode() };
}

export type SupportStatus = "paid" | "pending" | "failed" | "not_found";

/**
 * Asks Cashfree for the order's real status and records it. Safe to call any
 * number of times (browser, return page and webhook may all call it): the
 * support is marked paid once, and the badge is granted once.
 */
export async function settleSupportOrder(orderId: string, expectedUserId?: string): Promise<SupportStatus> {
  await connectDB();
  const support = await Support.findOne({ orderId }).select("user amount status").lean<{
    _id: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    amount: number;
    status: "created" | "paid" | "failed";
  }>();
  if (!support) return "not_found";
  if (expectedUserId && String(support.user) !== expectedUserId) return "not_found";
  if (support.status === "paid") return "paid";

  const order = await fetchCashfreeOrder(orderId);

  if (order.order_status === "PAID") {
    // Never trust anything but Cashfree's own record — and it must match what we asked for.
    if (Math.round(Number(order.order_amount)) !== support.amount || order.order_currency !== "INR") {
      console.error("[support] amount mismatch for", orderId);
      return "pending";
    }
    const paidAt = new Date();
    const updated = await Support.findOneAndUpdate(
      { _id: support._id, status: { $ne: "paid" } },
      { $set: { status: "paid", paidAt } },
      { new: true }
    );
    if (updated) {
      await User.updateOne({ _id: support.user, supporterSince: null }, { $set: { supporterSince: paidAt } });
    }
    return "paid";
  }

  if (order.order_status === "EXPIRED" || order.order_status === "TERMINATED") {
    await Support.updateOne({ _id: support._id, status: "created" }, { $set: { status: "failed" } });
    return "failed";
  }
  return "pending";
}
