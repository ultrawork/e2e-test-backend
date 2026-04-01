import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  timeout: 30000,
  retries: 2,
  reporter: [["junit", { outputFile: "test-results/results.xml" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:4000",
    screenshot: "on",
  },
});
