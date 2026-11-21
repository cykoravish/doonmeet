// GET /api/support/status?order_id=dms_… — confirm MY support payment with Cashfree.
import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { paymentLimiter } from "@/middleware/rateLimit";
import { supportOrderIdSchema } from "@/validations/support";
import { settleSupportOrder } from "@/lib/support";
import { CashfreeError } from "@/lib/cashfree";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const limited = paymentLimiter(req, String(req.user._id));
  if (limited) return limited;

  const parsed = supportOrderIdSchema.safeParse(new URL(req.url).searchParams.get("order_id"));
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid order id" }, { status: 400 });
  }

  try {
    const status = await settleSupportOrder(parsed.data, String(req.user._id));
    if (status === "not_found") {
      return NextResponse.json({ success: false, message: "Payment not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("[GET /support/status] Error:", error instanceof CashfreeError ? `${error.status} ${error.message}` : error);
    return NextResponse.json({ success: false, message: "Couldn't check the payment yet." }, { status: 502 });
  }
});
