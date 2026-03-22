import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
});
