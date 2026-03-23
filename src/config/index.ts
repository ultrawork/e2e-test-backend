const rawOrigins = process.env.CORS_ORIGINS?.split(",") ?? [];
const parsedOrigins = rawOrigins.map((s) => s.trim()).filter(Boolean);

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins: parsedOrigins.length
    ? parsedOrigins
    : ["http://localhost:3000", "http://localhost:3001"],
};
