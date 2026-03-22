import rateLimit from "express-rate-limit";

const isProduction = process.env.NODE_ENV === "production";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProduction ? 100 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
});
