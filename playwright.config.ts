import { defineConfig } from "@playwright/test";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load .env file if present so test process shares the same env vars
// that Docker Compose reads (e.g. JWT_SECRET, CORS_ORIGINS)
const envPath = resolve(__dirname, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2];
    }
  }
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 2,
  reporter: [["junit", { outputFile: "test-results/results.xml" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:4000",
  },
});
