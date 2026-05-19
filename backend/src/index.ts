import { createServer } from "http";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { connectDB } from "./lib/db.js";
import { initSocket } from "./sockets/index.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);
initSocket(server);

connectDB()
  .then(() => {
    server.listen(port, () => {
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to connect to MongoDB");
    process.exit(1);
  });
