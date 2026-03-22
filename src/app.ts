import express from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimit";
import { router } from "./routes";

const app = express();

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const corsEnv = process.env.CORS_ORIGIN;
    const corsList =
      corsEnv && corsEnv !== "*"
        ? corsEnv
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean)
        : null;

    if (!corsList) return callback(null, true);
    if (!origin) return callback(null, true);
    if (corsList.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  optionsSuccessStatus: 204,
};

app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(apiLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", router);

app.use(errorHandler);

export { app };
