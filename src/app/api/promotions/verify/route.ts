// POST /api/promotions/verify — called by Checkout's success handler.
// 1) checks the payment signature against OUR stored order id,
// 2) fetches the payment from Razorpay (never trust the browser's word),
// 3) captures it if needed and applies the sponsorship (idempotent).
// The webhook does the same thing as a backup if the browser never gets here.
// ============================================================
import { NextResponse } from "next/server";
import { requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { paymentLimiter } from "@/middleware/rateLimit";
import { verifyPromotionSchema, type VerifyPromotionInput } from "@/validations/promotion";
import { connectDB } from "@/lib/db";
import { Promotion } from "@/models/Promotion";
import { fetchPayment, RazorpayError, verifyPaymentSignature } from "@/lib/razorpay";
import { settlePromotionPayment } from "@/lib/promotions";

export const POST = requireVerified(async (req: AuthenticatedRequest) => {
  const limited = paymentLimiter(req, String(req.user._id));
  if (limited) return limited;

  const result = await validateBody(req, verifyPromotionSchema);
  if (result instanceof NextResponse) return result;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = result.data as VerifyPromotionInput;

  try {
    await connectDB();
    const promo = await Promotion.findOne({ razorpayOrderId: razorpay_order_id, user: req.user._id })
      .select("razorpayOrderId")
      .lean<{ razorpayOrderId: string }>();
    if (!promo) {
      return NextResponse.json({ success: false, message: "Payment not found." }, { status: 404 });
    }

    if (!verifyPaymentSignature(promo.razorpayOrderId, razorpay_payment_id, razorpay_signature)) {
      return NextResponse.json({ success: false, message: "Payment could not be verified." }, { status: 400 });
    }

    const payment = await fetchPayment(razorpay_payment_id);
    if (payment.order_id !== promo.razorpayOrderId) {
      return NextResponse.json({ success: false, message: "Payment could not be verified." }, { status: 400 });
    }

    const settled = await settlePromotionPayment(payment);

    switch (settled.status) {
      case "active":
        return NextResponse.json({ success: true, sponsoredUntil: settled.sponsoredUntil });
      case "pending":
        return NextResponse.json(
          {
            success: true,
            pending: true,
            message: "Payment received — your post will be sponsored within a few minutes.",
          },
          { status: 202 }
        );
      case "not_applied":
        return NextResponse.json(
          {
            success: false,
            message: "Payment received, but the post no longer exists. We'll refund you — please contact us.",
          },
          { status: 409 }
        );
      default:
        return NextResponse.json({ success: false, message: "Payment was not completed." }, { status: 400 });
    }
  } catch (error) {
    console.error(
      "[POST /promotions/verify] Error:",
      error instanceof RazorpayError ? `${error.status} ${error.message}` : error
    );
    // The webhook will still settle a genuine payment.
    return NextResponse.json(
      {
        success: false,
        message: "We couldn't confirm your payment yet. If money was deducted, your post will be sponsored automatically within a few minutes.",
      },
      { status: 502 }
    );
  }
});
