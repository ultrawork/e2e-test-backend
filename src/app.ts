import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimit";
import { router } from "./routes";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin:
      config.corsOrigins === "*"
        ? true
        : (origin, callback) => {
            const allowed = config.corsOrigins as string[];
            if (!origin || allowed.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error("Not allowed by CORS"));
            }
          },
    credentials: true,
  })
);
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
