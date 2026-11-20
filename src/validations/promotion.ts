import { z } from "zod";
import { objectId } from "./shared";

export const createPromotionSchema = z.object({
  postId: objectId,
});

// Exactly what Razorpay Checkout's success handler returns.
export const verifyPromotionSchema = z.object({
  razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/, "Invalid order id"),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/, "Invalid payment id"),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i, "Invalid signature"),
});

export type VerifyPromotionInput = z.infer<typeof verifyPromotionSchema>;
