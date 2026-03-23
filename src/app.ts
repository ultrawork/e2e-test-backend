import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimit";
import { router } from "./routes";
import { config } from "./config";

const app = express();

app.use(helmet());
app.options("*", cors({ origin: config.corsOrigins }));
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());
app.use(apiLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", router);

app.use(errorHandler);

export { app };
