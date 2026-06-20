// Zod validation wrapper for API route handlers.
// Validates and sanitizes request body before hitting DB.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

// Strips HTML tags to prevent XSS — applied to all string fields
export function sanitizeString(value: string): string {
  return value
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/javascript:/gi, "") // strip JS protocol
    .trim();
}

// Recursively sanitize all string values in an object
export function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? sanitizeString(item) : item
      );
    } else if (value !== null && typeof value === "object") {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// -------------------------
// validateBody — parses + validates + sanitizes request body
// Returns { data } on success or NextResponse 400 on failure
// -------------------------
export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T } | NextResponse<unknown>> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  // Sanitize before validation
  if (body !== null && typeof body === "object" && !Array.isArray(body)) {
    body = sanitizeObject(body as Record<string, unknown>);
  }

  try {
    const data = schema.parse(body);
    return { data };
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: (error as ZodError).issues.map((e) => ({
            field: e.path.map(String).join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    throw error;
  }
}

// -------------------------
// validateQuery — validates URL search params
// -------------------------
export function validateQuery<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): { data: T } | NextResponse {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  try {
    const data = schema.parse(params);
    return { data };
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid query parameters",
          errors: (error as ZodError).issues.map((e) => ({
            field: e.path.map(String).join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    throw error;
  }
}
