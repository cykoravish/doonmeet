// GET  — list published events (paginated, filterable)
// POST — create a new event (logged in users only)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import slugify from "slugify";
import {
  withAuth,
  withGuestAllowed,
  AuthenticatedRequest,
  requireVerified,
} from "@/middleware/auth";
import { validateBody, validateQuery } from "@/middleware/validate";
import { generalLimiter, eventLimiter } from "@/middleware/rateLimit";
import { createEventSchema, getEventsSchema } from "@/validations/event";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_BANNER_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// GET /api/events
export const GET = withGuestAllowed(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
  if (limited) return limited;

  const queryResult = validateQuery(req, getEventsSchema);
  if (queryResult instanceof NextResponse) return queryResult;
  const { cursor, limit, status, tag, search } = queryResult.data;

  try {
    await connectDB();

    const query: Record<string, unknown> = { status };

    // Cursor pagination
    if (cursor) {
      if (!/^[a-f\d]{24}$/i.test(cursor)) {
        return NextResponse.json({ success: false, message: "Invalid cursor" }, { status: 400 });
      }
      query._id = { $lt: cursor };
    }

    // Filter by tag
    if (tag) query.tags = tag;

    // Full-text search on title + description
    if (search) query.$text = { $search: search };

    const events = await Event.find(query)
      .sort({ date: 1 }) // upcoming first
      .limit(limit)
      .populate("creator", "name avatar")
      .select("-bannerPublicId -__v")
      .lean();

    const nextCursor = events.length === limit ? String(events[events.length - 1]._id) : null;

    return NextResponse.json(
      {
        success: true,
        events,
        nextCursor,
        hasMore: !!nextCursor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /events] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});

// POST /api/events
// requireVerified = withAuth (verified, logged-in users only)
export const POST = requireVerified(async (req: AuthenticatedRequest) => {
  const limited = eventLimiter(req, String(req.user._id));
  if (limited) return limited;

  try {
    const formData = await req.formData();

    // Parse JSON fields from formData
    const rawData: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (key === "banner") continue; // handle separately
      try {
        rawData[key] = JSON.parse(value as string);
      } catch {
        rawData[key] = value; // keep as string if not JSON
      }
    }

    // Validate fields
    const result = await validateBody(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rawData),
      }) as unknown as NextRequest,
      createEventSchema
    );
    if (result instanceof NextResponse) return result;

    await connectDB();

    let bannerUrl: string | null = null;
    let bannerPublicId: string | null = null;

    // Handle optional banner upload
    const bannerFile = formData.get("banner") as File | null;
    if (bannerFile) {
      if (!ALLOWED_TYPES.includes(bannerFile.type)) {
        return NextResponse.json(
          { success: false, message: "Only JPEG, PNG and WebP images are allowed for banner" },
          { status: 400 }
        );
      }
      if (bannerFile.size > MAX_BANNER_SIZE) {
        return NextResponse.json(
          { success: false, message: "Banner image must be smaller than 5MB" },
          { status: 400 }
        );
      }

      const bytes = await bannerFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "doonmeet/events",
                transformation: [
                  { width: 1200, height: 630, crop: "fill" }, // OG image ratio
                  { quality: "auto", fetch_format: "auto" },
                ],
              },
              (error, result) => {
                if (error || !result) return reject(error);
                resolve(result);
              }
            )
            .end(buffer);
        }
      );

      bannerUrl = uploadResult.secure_url;
      bannerPublicId = uploadResult.public_id;
    }
    // If a community was selected, verify the user is actually a member
    const communityId = (result.data as { community?: string | null }).community;
    if (communityId) {
      const { CommunityMember } = await import("@/models/CommunityMember");
      const isMember = await CommunityMember.exists({
        community: communityId,
        user: req.user._id,
      });
      if (!isMember) {
        return NextResponse.json(
          {
            success: false,
            message: "You can only link events to communities you're a member of.",
          },
          { status: 403 }
        );
      }
    }

    // Auto-generate slug from title
    const baseSlug = slugify(result.data.title, { lower: true, strict: true });
    const uniqueSlug = `${baseSlug}-${Date.now()}`;
    const event = await Event.create({
      ...(result.data as object),
      creator: req.user._id,
      banner: bannerUrl,
      bannerPublicId,
      slug: uniqueSlug,
    });

    await event.populate("creator", "name avatar");

    return NextResponse.json(
      { success: true, message: "Event created successfully", event },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /events] Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
});
