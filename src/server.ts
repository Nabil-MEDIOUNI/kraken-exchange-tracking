import "dotenv/config";
import express from "express";
import { requireAuth } from "./middleware/auth.ts";
import { requestLogger } from "./middleware/logging.ts";
import { createFuturesRouter } from "./routes/futures.ts";
import { createSpotRouter } from "./routes/spot.ts";
import { createSyncRouter } from "./routes/sync.ts";
import { refreshEurUsdRate } from "./views/view-utils.ts";
import { buildDashboardHTML } from "./views/dashboard-view.ts";
import { logger } from "./utils/logger.ts";
import type { Request, Response, NextFunction } from "express";
const REQUIRED_ENV = ["KRAKEN_FUTURES_PUBLIC_KEY", "KRAKEN_FUTURES_PRIVATE_KEY", "KRAKEN_SPOT_API_KEY", "KRAKEN_SPOT_API_SECRET"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    logger.fatal({ key }, "Missing required env var");
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 8000;

app.use(requireAuth);
app.use(requestLogger);

// Serve local asset icons
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use("/assets", express.static(resolve(__dirname, "assets")));

app.get("/", (_req: Request, res: Response) => {
  res.type("html").send(buildDashboardHTML());
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/futures", createFuturesRouter());
app.use("/spots", createSpotRouter());
app.use("/sync", createSyncRouter());

app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, method: req.method, path: req.path }, "Request failed");
  const status = err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" && status === 500 ? "Internal server error" : err.message;
  res.status(status).json({ error: message });
});

const server = app.listen(PORT, async () => {
  await refreshEurUsdRate();
  logger.info({ port: PORT }, "Kraken Portfolio API started");
  logger.info("Dashboard: GET /");
  logger.info("Futures:   GET /futures/balances, /futures/positions, /futures/transactions");
  logger.info("Spot:      GET /spots/balances, /spots/positions, /spots/transactions");
  logger.info("Sync:      GET /sync (SSE)");
});

function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down gracefully");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
