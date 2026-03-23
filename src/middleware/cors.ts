import { CorsOptions } from "cors";
import { config } from "../config";

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow requests without Origin (SSR, mobile clients, server-to-server)
    if (!origin) return callback(null, true);
    if (config.corsOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
