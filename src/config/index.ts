/** Parses CORS_ORIGINS env variable into a list of origins or wildcard. */
function parseCorsOrigins(raw: string): string[] | "*" {
  if (!raw || raw.trim() === "*") {
    return "*";
  }
  return raw.split(",").map((origin) => origin.trim()).filter(Boolean);
}

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  nodeEnv: process.env.NODE_ENV || "development",
  jwtEnabled: process.env.JWT_ENABLED === "true",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS || ""),
  devUserId: process.env.DEV_USER_ID || "dev-user-id",
} as const;
