import { createServer } from "http";
import next from "next";
import { initSocket } from "./src/lib/socket";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  initSocket(httpServer);
  httpServer.listen(3000, () => {
    console.log("DoonMeet running on http://localhost:3000");
  });
});
