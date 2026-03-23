const DEFAULT_CORS_ORIGINS = [
  "http://localhost:3001",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const rawCorsOrigins =
  process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "";

const corsOrigins = rawCorsOrigins
  ? rawCorsOrigins
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : DEFAULT_CORS_ORIGINS;

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins,
};
