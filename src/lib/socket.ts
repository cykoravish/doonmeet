import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { RoomMessage } from "@/models/RoomMessage";
import { DirectMessage } from "@/models/DirectMessage";
import { Conversation } from "@/models/Conversation";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { maybeSendDmNotificationEmail, maybeSendGlobalChatNotificationEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const GUEST_MESSAGE_LIMIT = 20;

interface AuthenticatedSocket extends Socket {
  userId: string;
  role: string;
  isGuest: boolean;
  name: string;
  avatar: string | null;
}

let io: SocketServer;

// Is this user currently connected with the given room joined? Used to
// avoid spamming a "new message" notification at someone who's already
// looking at that exact conversation in real time.
export function isUserActiveInRoom(server: SocketServer, room: string, userId: string): boolean {
  const socketIds = server.sockets.adapter.rooms.get(room);
  if (!socketIds) return false;
  for (const id of socketIds) {
    const s = server.sockets.sockets.get(id) as AuthenticatedSocket | undefined;
    if (s?.userId === userId) return true;
  }
  return false;
}

// How many live sockets does this user currently have open (multiple tabs/
// devices count separately)? Used to decide whether a single disconnect
// should actually flip them to "offline", or if another tab is still up.
function countUserSockets(server: SocketServer, userId: string): number {
  let count = 0;
  for (const s of server.sockets.sockets.values()) {
    if ((s as AuthenticatedSocket).userId === userId) count += 1;
  }
  return count;
}

export function initSocket(httpServer: HttpServer): SocketServer {
  if (io) return io; // singleton

  io = new SocketServer(httpServer, {
    cors: {
      origin: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 5000,
    pingInterval: 25000,
  });

  // -------------------------------------------------------
  // Auth middleware — runs before every connection
  // -------------------------------------------------------
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.cookie
          ?.split(";")
          .find((c) => c.trim().startsWith("access_token="))
          ?.split("=")[1];

      if (!token) return next(new Error("Authentication required"));

      const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as {
        userId: string;
        role: string;
      };

      await connectDB();
      const user = await User.findById(payload.userId)
        .select("name avatar role isGuest isActive guestExpiresAt guestMessageCount")
        .lean();

      if (!user) return next(new Error("User not found"));
      if (!user.isActive) return next(new Error("Account suspended"));

      if (user.isGuest && user.guestExpiresAt && new Date() > user.guestExpiresAt) {
        return next(new Error("Guest session expired"));
      }

      const s = socket as AuthenticatedSocket;
      s.userId = String(user._id);
      s.role = user.role;
      s.isGuest = user.isGuest ?? false;
      s.name = user.name;
      s.avatar = user.avatar ?? null;

      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  // -------------------------------------------------------
  // Connection handler
  // -------------------------------------------------------
  io.on("connection", (rawSocket: Socket) => {
    const socket = rawSocket as AuthenticatedSocket;

    console.log(`[socket] Connected: ${socket.name} (${socket.userId})`);

    // Each user joins their personal room for notifications
    socket.join(`user:${socket.userId}`);

    // -------------------------------------------------------
    // PRESENCE — flip real (non-guest) users online. Guests are excluded
    // from the members list entirely, so their presence isn't tracked.
    // -------------------------------------------------------
    if (!socket.isGuest) {
      User.updateOne({ _id: socket.userId }, { $set: { isOnline: true } })
        .then(() => {
          io.to("presence:room").emit("presence:update", {
            userId: socket.userId,
            isOnline: true,
            lastSeenAt: null,
          });
        })
        .catch((err) => console.error("[socket] Failed to mark user online:", err));
    }

    // -------------------------------------------------------
    // PUBLIC ROOM — join/leave
    // -------------------------------------------------------
    socket.on("room:join", () => {
      socket.join("room:global");
      console.log(`[socket] ${socket.name} joined global room`);
    });

    socket.on("room:leave", () => {
      socket.leave("room:global");
    });

    // -------------------------------------------------------
    // PUBLIC ROOM — send message
    // -------------------------------------------------------
    socket.on("room:message", async (data: { content: string }) => {
      try {
        if (!data?.content || typeof data.content !== "string") return;

        const content = data.content.replace(/<[^>]*>/g, "").trim();
        if (!content || content.length > 500) return;

        if (socket.isGuest) {
          const user = await User.findById(socket.userId).select("guestMessageCount").lean();

          if (!user || user.guestMessageCount >= GUEST_MESSAGE_LIMIT) {
            socket.emit("room:limit_reached", {
              message: `You've reached the ${GUEST_MESSAGE_LIMIT} message limit. Sign up to keep chatting!`,
              code: "GUEST_LIMIT_REACHED",
            });
            return;
          }

          await User.updateOne({ _id: socket.userId }, { $inc: { guestMessageCount: 1 } });
        }

        const message = await RoomMessage.create({
          sender: socket.userId,
          content,
          isGuest: socket.isGuest,
        });

        io.to("room:global").emit("room:message", {
          _id: message._id,
          content: message.content,
          isGuest: message.isGuest,
          createdAt: message.createdAt,
          sender: {
            _id: socket.userId,
            name: socket.name,
            avatar: socket.avatar,
            isGuest: socket.isGuest,
          },
        });

        // Fire-and-forget admin alert — internally throttled (see
        // maybeSendGlobalChatNotificationEmail), so this is safe to call on
        // every message without spamming the admin inbox.
        maybeSendGlobalChatNotificationEmail(socket.name, socket.isGuest, content).catch((err) =>
          console.error("[socket room:message] Admin notification email failed:", err)
        );
      } catch (error) {
        console.error("[socket room:message] Error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // -------------------------------------------------------
    // PRESENCE — join/leave the shared presence room. Only sockets that
    // currently have the "All members" panel open subscribe here, so we're
    // not broadcasting presence churn to every connected client all the time.
    // -------------------------------------------------------
    socket.on("presence:join", () => {
      socket.join("presence:room");
    });

    socket.on("presence:leave", () => {
      socket.leave("presence:room");
    });

    // -------------------------------------------------------
    // DMs — join conversation room
    // -------------------------------------------------------
    socket.on("dm:join", async (data: { conversationId: string }) => {
      if (socket.isGuest) return;
      if (!/^[a-f\d]{24}$/i.test(data?.conversationId)) return;

      try {
        const conversation = await Conversation.findOne({
          _id: data.conversationId,
          participants: socket.userId,
        }).lean();

        if (!conversation) return;

        socket.join(`dm:${data.conversationId}`);

        const now = new Date();
        await DirectMessage.updateMany(
          {
            conversationId: data.conversationId,
            sender: { $ne: socket.userId },
            "readBy.userId": { $ne: socket.userId },
          },
          { $push: { readBy: { userId: socket.userId, readAt: now } } }
        );

        await Conversation.updateOne(
          { _id: data.conversationId },
          { $set: { [`unreadCount.${socket.userId}`]: 0 } }
        );

        // Opening this conversation means its unread DM notifications have
        // effectively been seen — clear them so the bell/notifications page
        // stay consistent with the conversation's own read state.
        const otherParticipantId = conversation.participants.find(
          (p: unknown) => String(p) !== socket.userId
        );
        if (otherParticipantId) {
          const { modifiedCount } = await Notification.updateMany(
            {
              recipient: socket.userId,
              type: "new_dm",
              "actor.userId": otherParticipantId,
              isRead: false,
            },
            { $set: { isRead: true } }
          );
          if (modifiedCount > 0) {
            io.to(`user:${socket.userId}`).emit("notification:read_bulk", {
              count: modifiedCount,
            });
          }
        }

        socket.to(`dm:${data.conversationId}`).emit("dm:read", {
          conversationId: data.conversationId,
          readBy: socket.userId,
          readAt: now,
        });
      } catch (error) {
        console.error("[socket dm:join] Error:", error);
      }
    });

    // -------------------------------------------------------
    // DMs — send message
    // -------------------------------------------------------
    socket.on("dm:message", async (data: { conversationId: string; content: string }) => {
      if (socket.isGuest) {
        socket.emit("error", { message: "Guests cannot send direct messages." });
        return;
      }

      if (!/^[a-f\d]{24}$/i.test(data?.conversationId)) return;

      const content = data?.content?.replace(/<[^>]*>/g, "").trim();
      if (!content || content.length > 1000) return;

      try {
        const conversation = await Conversation.findOne({
          _id: data.conversationId,
          participants: socket.userId,
        });

        if (!conversation) return;

        const recipientId = conversation.participants.find(
          (p: unknown) => String(p) !== socket.userId
        );

        if (!recipientId) return;

        const dmRoom = `dm:${data.conversationId}`;
        // Is the recipient already looking at this exact conversation right
        // now? If so, treat the message as instantly read for them — both
        // the unread badge and any notification should reflect that they've
        // already seen it live, not that it's still waiting to be read.
        const recipientActive = isUserActiveInRoom(io, dmRoom, String(recipientId));

        const readBy = [{ userId: socket.userId, readAt: new Date() }];
        if (recipientActive) {
          readBy.push({ userId: recipientId, readAt: new Date() });
        }

        const message = await DirectMessage.create({
          conversationId: data.conversationId,
          sender: socket.userId,
          content,
          readBy,
        });

        const conversationUpdate: Record<string, unknown> = {
          $set: {
            lastMessage: {
              content: content.slice(0, 100),
              sentAt: message.createdAt,
              senderId: socket.userId,
            },
          },
        };
        if (!recipientActive) {
          conversationUpdate.$inc = { [`unreadCount.${String(recipientId)}`]: 1 };
        }
        await Conversation.updateOne({ _id: data.conversationId }, conversationUpdate);

        const messagePayload = {
          _id: message._id,
          conversationId: data.conversationId,
          content: message.content,
          createdAt: message.createdAt,
          sender: {
            _id: socket.userId,
            name: socket.name,
            avatar: socket.avatar,
          },
        };

        io.to(dmRoom).emit("dm:message", messagePayload);

        if (recipientActive) {
          // Let the sender's UI show an instant "read" state for this message.
          socket.emit("dm:read", {
            conversationId: data.conversationId,
            readBy: String(recipientId),
            readAt: readBy[1].readAt,
          });
        }

        // Skip the notification if the recipient already has this exact
        // conversation open — they're seeing the message live via
        // dm:message above, a notification would just be noise (and would
        // make the bell count drift out of sync with what's actually
        // unread).
        if (!recipientActive) {
          const notification = await Notification.create({
            recipient: recipientId,
            type: "new_dm",
            refModel: "DirectMessage",
            refId: message._id,
            preview: content.slice(0, 100),
            actor: {
              userId: socket.userId,
              name: socket.name,
              avatar: socket.avatar,
            },
          });

          io.to(`user:${String(recipientId)}`).emit("notification:new", {
            _id: notification._id,
            type: "new_dm",
            preview: notification.preview,
            actor: notification.actor,
            createdAt: notification.createdAt,
            isRead: false,
          });

          // Fire-and-forget — only actually sends if the recipient is
          // genuinely offline and not within the cooldown window (see
          // maybeSendDmNotificationEmail in src/lib/email.ts).
          maybeSendDmNotificationEmail(String(recipientId), socket.name, content).catch(() => {
            // Errors are already logged inside the helper.
          });

          sendPushToUser(String(recipientId), {
            title: socket.name,
            body: content.slice(0, 120),
            url: "/chat",
            tag: `dm-${data.conversationId}`,
          }).catch(() => {
            // Errors are already logged inside the helper.
          });
        }
      } catch (error) {
        console.error("[socket dm:message] Error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // -------------------------------------------------------
    // Typing indicators
    // -------------------------------------------------------
    socket.on("typing:start", (data: { conversationId: string }) => {
      if (socket.isGuest || !/^[a-f\d]{24}$/i.test(data?.conversationId)) return;
      socket.to(`dm:${data.conversationId}`).emit("typing:start", {
        userId: socket.userId,
        name: socket.name,
      });
    });

    socket.on("typing:stop", (data: { conversationId: string }) => {
      if (socket.isGuest || !/^[a-f\d]{24}$/i.test(data?.conversationId)) return;
      socket.to(`dm:${data.conversationId}`).emit("typing:stop", {
        userId: socket.userId,
      });
    });

    // -------------------------------------------------------
    // Disconnect
    // -------------------------------------------------------
    socket.on("disconnect", async () => {
      console.log(`[socket] Disconnected: ${socket.name} (${socket.userId})`);

      try {
        // Socket.io hasn't dropped this socket from the adapter yet at the
        // moment "disconnect" fires, so the count below still includes it —
        // <= 1 means this was the user's last open tab/device.
        const remaining = countUserSockets(io, socket.userId);
        const wasLastSocket = remaining <= 1;

        const update: Record<string, unknown> = { lastSeenAt: new Date() };
        if (!socket.isGuest && wasLastSocket) update.isOnline = false;

        await User.updateOne({ _id: socket.userId }, update);

        if (!socket.isGuest && wasLastSocket) {
          io.to("presence:room").emit("presence:update", {
            userId: socket.userId,
            isOnline: false,
            lastSeenAt: update.lastSeenAt,
          });
        }
      } catch (error) {
        console.error("[socket disconnect] Error updating presence:", error);
      }
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
