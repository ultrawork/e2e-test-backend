import type { CorsOptions } from "cors";

/** Parses CORS_ORIGINS env variable into a cors-compatible origin option. */
export function parseCorsOrigins(
  value: string | undefined
): CorsOptions["origin"] {
  if (!value || value.trim() === "") return false;
  if (value.trim() === "*") return "*";
  const origins = value
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return [...new Set(origins)];
}

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
} as const;
