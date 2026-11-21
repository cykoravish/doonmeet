import { z } from "zod";
import { SUPPORT_MAX_RUPEES, SUPPORT_MIN_RUPEES } from "@/lib/supportPlans";

export const createSupportSchema = z.object({
  amount: z
    .number()
    .int("Use a whole rupee amount")
    .min(SUPPORT_MIN_RUPEES, `Minimum is ₹${SUPPORT_MIN_RUPEES}`)
    .max(SUPPORT_MAX_RUPEES, `Maximum is ₹${SUPPORT_MAX_RUPEES}`),
  message: z.string().trim().max(140, "Keep the message under 140 characters").optional(),
  /** Logged-in supporters can still choose not to be linked (no badge). */
  anonymous: z.boolean().optional(),
});

export const supportOrderIdSchema = z.string().regex(/^dms_[a-f0-9]{24}$/, "Invalid order id");
