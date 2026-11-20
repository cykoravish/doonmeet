import { z } from "zod";
import { objectId } from "./shared";
import { REPORT_CONTEXTS, REPORT_REASONS } from "@/models/Report";

export const createReportSchema = z.object({
  reportedUserId: objectId,
  context: z.enum(REPORT_CONTEXTS),
  refId: objectId.optional().nullable(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(500, "Keep it under 500 characters").optional().default(""),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
