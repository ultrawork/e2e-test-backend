import rateLimit from "express-rate-limit";

const isTestOrDev =
  process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTestOrDev ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ error: "Too many requests" });
  },
});
