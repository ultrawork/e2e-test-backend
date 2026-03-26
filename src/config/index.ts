const DEFAULT_ORIGINS = [
  "http://localhost:3001",
  "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:19006",
];

/** Parses CORS_ORIGINS env variable into a concrete list of allowed origins. */
function parseCorsOrigins(raw: string): string[] {
  if (!raw.trim() || raw.trim() === "*") {
    return DEFAULT_ORIGINS;
  }
  const origins = raw.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (origins.length === 0) {
    return DEFAULT_ORIGINS;
  }
  return origins;
}

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  nodeEnv: process.env.NODE_ENV || "development",
  jwtEnabled: process.env.JWT_ENABLED === "true",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS || ""),
};
