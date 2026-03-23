type CorsOrigins = true | string | string[];

function parseCorsOrigins(input?: string): CorsOrigins {
  if (!input || input.trim() === "") return true;
  const val = input.trim();
  if (val === "*") return "*";
  const list = val.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length <= 1 ? (list[0] ?? true) : list;
}

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
} as const;
