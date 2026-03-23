import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 2,
  reporter: [["junit", { outputFile: "test-results/results.xml" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:4000",
  },
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
});
