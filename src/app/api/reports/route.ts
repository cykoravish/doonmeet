// POST /api/reports — report a user (optionally about a specific message/post)
// ============================================================
import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody } from "@/middleware/validate";
import { reportLimiter } from "@/middleware/rateLimit";
import { createReportSchema, type CreateReportInput } from "@/validations/report";
import { createReport } from "@/lib/safety";

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const limited = reportLimiter(req, String(req.user._id));
  if (limited) return limited;

  const result = await validateBody(req, createReportSchema);
  if (result instanceof NextResponse) return result;
  const data = result.data as CreateReportInput;

  try {
    const outcome = await createReport({
      reporterId: String(req.user._id),
      reporterName: req.user.name,
      reportedId: data.reportedUserId,
      context: data.context,
      refId: data.refId ?? null,
      reason: data.reason,
      details: data.details,
    });

    if (!outcome.ok) {
      return NextResponse.json({ success: false, message: outcome.message }, { status: outcome.status });
    }

    return NextResponse.json(
      { success: true, message: "Thanks for reporting. We'll review it soon." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /reports] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
