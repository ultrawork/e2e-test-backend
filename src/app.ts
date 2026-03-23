import express from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimit";
import { router } from "./routes";

const app = express();

const corsOptions: CorsOptions = { origin: config.corsOrigins };

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(apiLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", router);

app.use(errorHandler);

export { app };
