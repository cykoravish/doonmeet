// POST /api/promotions — start a sponsored-post purchase for one of MY posts.
// Creates a Razorpay order and returns what Checkout.js needs.
// ============================================================
import { NextResponse } from "next/server";
import { requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { paymentLimiter } from "@/middleware/rateLimit";
import { createPromotionSchema } from "@/validations/promotion";
import { createPromotionOrder } from "@/lib/promotions";
import { RazorpayError } from "@/lib/razorpay";

export const POST = requireVerified(async (req: AuthenticatedRequest) => {
  const limited = paymentLimiter(req, String(req.user._id));
  if (limited) return limited;

  const result = await validateBody(req, createPromotionSchema);
  if (result instanceof NextResponse) return result;
  const { postId } = result.data as { postId: string };

  try {
    const outcome = await createPromotionOrder(
      { _id: String(req.user._id), name: req.user.name, email: req.user.email },
      postId
    );
    if (!outcome.ok) {
      return NextResponse.json(
        { success: false, code: outcome.code, message: outcome.message },
        { status: outcome.status }
      );
    }
    return NextResponse.json({ success: true, checkout: outcome.checkout }, { status: 201 });
  } catch (error) {
    // Never forward Razorpay's raw error text to the browser.
    console.error("[POST /promotions] Error:", error instanceof RazorpayError ? `${error.status} ${error.message}` : error);
    return NextResponse.json(
      { success: false, message: "Couldn't start the payment. Please try again in a moment." },
      { status: 502 }
    );
  }
});
