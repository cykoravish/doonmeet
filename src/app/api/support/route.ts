// POST /api/support — start a "Support DoonMeet" payment (Cashfree order).
import { NextResponse } from "next/server";
import { requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { paymentLimiter } from "@/middleware/rateLimit";
import { createSupportSchema } from "@/validations/support";
import { createSupportOrder } from "@/lib/support";
import { CashfreeError } from "@/lib/cashfree";

export const POST = requireVerified(async (req: AuthenticatedRequest) => {
  const limited = paymentLimiter(req, String(req.user._id));
  if (limited) return limited;

  const result = await validateBody(req, createSupportSchema);
  if (result instanceof NextResponse) return result;

  try {
    const outcome = await createSupportOrder(
      { _id: String(req.user._id), name: req.user.name, email: req.user.email, phone: req.user.phone },
      result.data
    );
    if (!outcome.ok) {
      return NextResponse.json(
        { success: false, code: outcome.code, message: outcome.message },
        { status: outcome.status }
      );
    }
    return NextResponse.json(
      { success: true, orderId: outcome.orderId, paymentSessionId: outcome.paymentSessionId, mode: outcome.mode },
      { status: 201 }
    );
  } catch (error) {
    // Never forward Cashfree's raw error text to the browser.
    console.error("[POST /support] Error:", error instanceof CashfreeError ? `${error.status} ${error.message}` : error);
    return NextResponse.json(
      { success: false, message: "Couldn't start the payment. Please try again in a moment." },
      { status: 502 }
    );
  }
});
