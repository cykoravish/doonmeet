import mongoose, { Document, Schema } from "mongoose";

export type NotificationType = "new_dm" | "event_comment" | "comment_reply" | "new_event";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: NotificationType;
  refModel: "DirectMessage" | "EventComment" | "Event" | null;
  refId: mongoose.Types.ObjectId | null;
  preview: string | null;
  actor: {
    userId: mongoose.Types.ObjectId;
    name: string;
    avatar: string | null;
  };
  isRead: boolean;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["new_dm", "event_comment", "comment_reply", "new_event"],
      required: true,
    },
    refModel: {
      type: String,
      enum: ["DirectMessage", "EventComment", "Event"],
      default: null,
    },
    refId: { type: Schema.Types.ObjectId, default: null },
    // Snapshot of message preview — renders notification without extra DB call
    preview: { type: String, maxlength: 100, default: null },
    // Snapshot of who triggered — avoids populating User on every notification fetch
    actor: {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      avatar: { type: String, default: null },
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Primary query — fetch unread notifications for a user, latest first
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
// Auto-delete notifications older than 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const Notification =
  mongoose.models.Notification ?? mongoose.model<INotification>("Notification", NotificationSchema);
