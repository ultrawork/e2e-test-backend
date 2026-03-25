import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

const TEST_SECRET = "test-secret-key";

const originalNodeEnv = config.nodeEnv;
const originalJwtSecret = config.jwtSecret;
const originalDevUserId = (config as Record<string, unknown>).devUserId;

function createApp() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { authRouter } = require("./auth.routes");
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
  return app;
}

afterEach(() => {
  Object.defineProperty(config, "nodeEnv", { value: originalNodeEnv, writable: true });
  Object.defineProperty(config, "jwtSecret", { value: originalJwtSecret, writable: true });
  Object.defineProperty(config, "devUserId", { value: originalDevUserId, writable: true });
});

describe("POST /api/auth/dev-token", () => {
  it("returns 404 in production mode", async () => {
    Object.defineProperty(config, "nodeEnv", { value: "production", writable: true });
    Object.defineProperty(config, "jwtSecret", { value: TEST_SECRET, writable: true });
    const app = createApp();

    const res = await request(app).post("/api/auth/dev-token");
    expect(res.status).toBe(404);
  });

  it("returns token with devUserId from config in development mode", async () => {
    Object.defineProperty(config, "nodeEnv", { value: "development", writable: true });
    Object.defineProperty(config, "jwtSecret", { value: TEST_SECRET, writable: true });
    Object.defineProperty(config, "devUserId", { value: "custom-dev-user", writable: true });
    const app = createApp();

    const res = await request(app).post("/api/auth/dev-token");
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();

    const payload = jwt.verify(res.body.token, TEST_SECRET) as { userId: string; email: string };
    expect(payload.userId).toBe("custom-dev-user");
    expect(payload.email).toBe("dev@localhost");
  });
});
