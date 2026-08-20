// GET  — get comments for an event (guests + users)
// POST — add a comment (logged in users only, not guests)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { EventComment } from "@/models/EventComment";
import { Notification } from "@/models/Notification";
import { withGuestAllowed, requireVerified, AuthenticatedRequest } from "@/middleware/auth";
import { validateBody, validateQuery } from "@/middleware/validate";
import { generalLimiter } from "@/middleware/rateLimit";
import { createCommentSchema, getCommentsSchema } from "@/validations/eventComment";
import { sendPushToUser } from "@/lib/push";

// GET /api/events/[eventId]/comments
export const GET = withGuestAllowed(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user?._id ?? "guest"));
    if (limited) return limited;

    const { slug } = await params;

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ success: false, message: "Invalid event slug" }, { status: 400 });
    }

    const queryResult = validateQuery(req, getCommentsSchema);
    if (queryResult instanceof NextResponse) return queryResult;
    const { cursor, limit } = queryResult.data;

    try {
      await connectDB();

      const eventDoc = await Event.findOne({ slug, status: "published" }).select("_id").lean();
      if (!eventDoc) {
        return NextResponse.json({ success: false, message: "Event not found." }, { status: 404 });
      }
      const query: Record<string, unknown> = {
        event: eventDoc._id,
        parentId: null,
      };

      if (cursor) {
        if (!/^[a-f\d]{24}$/i.test(cursor)) {
          return NextResponse.json({ success: false, message: "Invalid cursor" }, { status: 400 });
        }
        query._id = { $lt: cursor };
      }

      const comments = await EventComment.find(query)
        .sort({ _id: -1 })
        .limit(limit)
        .populate("author", "name avatar")
        .select("-__v")
        .lean();

      const ordered = comments.reverse();
      const nextCursor =
        comments.length === limit ? String(comments[comments.length - 1]._id) : null;

      return NextResponse.json(
        {
          success: true,
          comments: ordered,
          nextCursor,
          hasMore: !!nextCursor,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("[GET /events/[id]/comments] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);

// POST /api/events/[eventId]/comments
export const POST = requireVerified(
  async (req: AuthenticatedRequest, { params }: { params: Promise<Record<string, string>> }) => {
    const limited = generalLimiter(req, String(req.user._id));
    if (limited) return limited;

    const { slug } = await params;

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ success: false, message: "Invalid event slug" }, { status: 400 });
    }

    const result = await validateBody(req, createCommentSchema);
    if (result instanceof NextResponse) return result;
    const data = result.data as { content: string; parentId?: string | null };

    try {
      await connectDB();

      // Check event exists and is published
      const event = await Event.findOne({
        slug,
        status: "published",
      }).select("creator commentCount slug");

      if (!event) {
        return NextResponse.json({ success: false, message: "Event not found." }, { status: 404 });
      }

      // Create comment + increment commentCount atomically
      const [comment] = await Promise.all([
        EventComment.create({
          event: event._id,
          author: req.user._id,
          content: data.content,
          parentId: data.parentId ?? null,
        }),
        Event.updateOne({ _id: event._id }, { $inc: { commentCount: 1 } }),
      ]);

      await comment.populate("author", "name avatar");

      // Notify event creator if commenter is not the creator
      const isOwnEvent = String(event.creator) === String(req.user._id);
      if (!isOwnEvent) {
        await Notification.create({
          recipient: event.creator,
          type: "event_comment",
          refModel: "EventComment",
          refId: comment._id,
          preview: data.content.slice(0, 100),
          actor: {
            userId: req.user._id,
            name: req.user.name,
            avatar: req.user.avatar,
          },
        });

        sendPushToUser(String(event.creator), {
          title: `${req.user.name} commented on your event`,
          body: data.content.slice(0, 120),
          url: `/events/${event.slug}`,
          tag: `event-comment-${event._id}`,
        }).catch(() => {
          // Errors are already logged inside the helper.
        });
      }

      return NextResponse.json(
        { success: true, message: "Comment added", comment },
        { status: 201 }
      );
    } catch (error) {
      console.error("[POST /events/[id]/comments] Error:", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong." },
        { status: 500 }
      );
    }
  }
);
