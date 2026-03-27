import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimit";
import { router } from "./routes";

const app = express();

app.use(helmet());
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowed = config.corsOrigins;

  if (allowed === "*") {
    return cors({ origin: true, credentials: true })(req, res, next);
  }

  if (requestOrigin && Array.isArray(allowed) && allowed.includes(requestOrigin)) {
    return cors({ origin: requestOrigin, credentials: true })(req, res, next);
  }

  // Disallowed or missing origin: no CORS headers, handle OPTIONS manually
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});
app.use(express.json());
if (config.nodeEnv !== "test") {
  app.use(apiLimiter);
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", router);

app.use(errorHandler);

export { app };
