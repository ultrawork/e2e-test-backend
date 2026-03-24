function parseCorsOrigins(origins: string | undefined): string | string[] {
  if (!origins || origins.trim() === "") return "*";
  if (origins.trim() === "*") return "*";
  return origins
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtEnabled: process.env.JWT_ENABLED === "true",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  nodeEnv: process.env.NODE_ENV || "development",
} as const;
