import type { Server as SocketServer } from "socket.io";
import { connectDB } from "@/lib/db";
import { RoomMessage } from "@/models/RoomMessage";

// When a public-chat message is deleted — e.g. by an admin in the dashboard,
// which writes straight to the database — tell everyone in the room so it
// disappears from screens that are already open, without a refresh.
// Uses a MongoDB change stream (Atlas replica set), so no extra secret or
// endpoint is needed between the dashboard and this server.

const MAX_RETRY_DELAY_MS = 60_000;

export function watchRoomMessageDeletes(io: SocketServer): void {
  let attempt = 0;

  async function start() {
    let restarting = false;
    const restart = (reason: unknown) => {
      if (restarting) return;
      restarting = true;
      const delay = Math.min(MAX_RETRY_DELAY_MS, 2000 * 2 ** attempt++);
      console.error(`[room deletes] stream stopped (${String(reason)}); retrying in ${delay / 1000}s`);
      setTimeout(start, delay);
    };

    try {
      await connectDB();
      const stream = RoomMessage.collection.watch([{ $match: { operationType: "delete" } }]);

      stream.on("change", (change) => {
        attempt = 0; // the stream is healthy
        if (change.operationType !== "delete") return;
        const messageId = String(change.documentKey._id);
        io.to("room:global").emit("room:message_deleted", { messageId });
      });
      stream.on("error", (err) => {
        stream.close().catch(() => {});
        restart(err instanceof Error ? err.message : err);
      });
      stream.on("close", () => restart("closed"));
    } catch (err) {
      restart(err instanceof Error ? err.message : err);
    }
  }

  void start();
}
