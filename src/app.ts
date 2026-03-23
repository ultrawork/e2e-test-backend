import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimit";
import { corsOptions } from "./middleware/cors";
import { router } from "./routes";

const app = express();

app.use(helmet());
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());
app.use(apiLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", router);

app.use(errorHandler);

export { app };
