// GET /api/support/status?order_id=dms_… — confirm a support payment with Cashfree.
// No login needed (anonymous supporters too); it only reveals paid/pending/failed.
import { NextRequest, NextResponse } from "next/server";
import { paymentLimiter } from "@/middleware/rateLimit";
import { supportOrderIdSchema } from "@/validations/support";
import { settleSupportOrder } from "@/lib/support";
import { CashfreeError } from "@/lib/cashfree";

export async function GET(req: NextRequest) {
  const limited = paymentLimiter(req);
  if (limited) return limited;

  const parsed = supportOrderIdSchema.safeParse(new URL(req.url).searchParams.get("order_id"));
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid order id" }, { status: 400 });
  }

  try {
    const { status, badge } = await settleSupportOrder(parsed.data);
    if (status === "not_found") {
      return NextResponse.json({ success: false, message: "Payment not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, status, badge });
  } catch (error) {
    console.error("[GET /support/status] Error:", error instanceof CashfreeError ? `${error.status} ${error.message}` : error);
    return NextResponse.json({ success: false, message: "Couldn't check the payment yet." }, { status: 502 });
  }
}
