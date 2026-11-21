// POST /api/support — start a "Support DoonMeet" payment (Cashfree order).
// Login is optional: guests (and anyone who ticks "anonymous") support anonymously.
import { NextResponse } from "next/server";
import { withGuestAllowed, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { paymentLimiter } from "@/middleware/rateLimit";
import { createSupportSchema } from "@/validations/support";
import { createSupportOrder } from "@/lib/support";
import { CashfreeError } from "@/lib/cashfree";

export const POST = withGuestAllowed(async (req: AuthenticatedRequest) => {
  const user = req.user ?? null;
  const limited = paymentLimiter(req, user ? String(user._id) : undefined);
  if (limited) return limited;

  const result = await validateBody(req, createSupportSchema);
  if (result instanceof NextResponse) return result;

  try {
    const outcome = await createSupportOrder(
      user ? { _id: String(user._id), name: user.name, email: user.email } : null,
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
