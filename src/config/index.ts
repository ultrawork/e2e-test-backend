export type CorsOrigins = true | string | string[];

export function parseCorsOrigins(input?: string): CorsOrigins {
  if (input === undefined) return true;
  const trimmed = input.trim();
  if (trimmed === "") return true;
  if (trimmed === "*") return "*";
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((s) => s.trim()).filter((s) => s !== "");
    if (parts.length === 0) return true;
    return parts;
  }
  return trimmed;
}

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
} as const;
