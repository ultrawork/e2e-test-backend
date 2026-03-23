import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimit";
import { router } from "./routes";
import { config } from "./config";

const corsOrigin: cors.CorsOptions["origin"] = Array.isArray(config.corsOrigins)
  ? ((allowedList: string[]) =>
      (requestOrigin: string | undefined, callback: (err: Error | null, origin?: boolean) => void) => {
        callback(null, !requestOrigin || allowedList.indexOf(requestOrigin) !== -1);
      })(config.corsOrigins as string[])
  : config.corsOrigins;

const app = express();

app.use(helmet());
app.options("*", cors({ origin: corsOrigin }));
app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use(apiLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", router);

app.use(errorHandler);

export { app };
