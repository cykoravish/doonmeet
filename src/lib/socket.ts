import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { RoomMessage } from "@/models/RoomMessage";
import { DirectMessage } from "@/models/DirectMessage";
import { Conversation } from "@/models/Conversation";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";

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
      } catch (error) {
        console.error("[socket room:message] Error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
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

        const message = await DirectMessage.create({
          conversationId: data.conversationId,
          sender: socket.userId,
          content,
          readBy: [{ userId: socket.userId, readAt: new Date() }],
        });

        const recipientId = conversation.participants.find(
          (p: unknown) => String(p) !== socket.userId
        );

        if (!recipientId) return;

        await Conversation.updateOne(
          { _id: data.conversationId },
          {
            $set: {
              lastMessage: {
                content: content.slice(0, 100),
                sentAt: message.createdAt,
                senderId: socket.userId,
              },
            },
            $inc: { [`unreadCount.${String(recipientId)}`]: 1 },
          }
        );

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

        io.to(`dm:${data.conversationId}`).emit("dm:message", messagePayload);

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
        });
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
      await User.updateOne({ _id: socket.userId }, { lastSeenAt: new Date() }).catch(() => {});
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
