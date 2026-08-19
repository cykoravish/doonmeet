import "dotenv/config";
import { createServer } from "http";
import next from "next";
import cron from "node-cron";
import { initSocket } from "./src/lib/socket";
import { runInactivityReminderJob } from "./src/lib/jobs/inactivityReminder";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  initSocket(httpServer);
  httpServer.listen(3000, () => {
    console.log("DoonMeet running on http://localhost:3000");
  });

  // Inactivity re-engagement emails — runs once a day at 10:00 AM IST.
  // Skipped in dev by default so local development doesn't fire real emails
  // on every restart; set RUN_CRON_IN_DEV=true to test it locally.
  if (!dev || process.env.RUN_CRON_IN_DEV === "true") {
    cron.schedule("0 10 * * *", () => {
      runInactivityReminderJob();
    }, { timezone: "Asia/Kolkata" });
    console.log("[cron] Inactivity reminder job scheduled — daily at 10:00 AM IST.");
  }
});
