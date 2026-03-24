import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { config } from "../config";

// Override config for tests
const originalJwtEnabled = config.jwtEnabled;
const TEST_SECRET = "test-secret-key";

function createTestApp() {
  // Re-import to pick up current config state
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { authMiddleware } = require("./auth");

  const app = express();
  app.use(express.json());
  app.use(authMiddleware);
  app.get("/test", (req: express.Request, res: express.Response) => {
    res.json({ user: req.user });
  });
  return app;
}

afterEach(() => {
  Object.defineProperty(config, "jwtEnabled", { value: originalJwtEnabled, writable: true });
  Object.defineProperty(config, "jwtSecret", { value: "", writable: true });
});

describe("authMiddleware", () => {
  describe("when JWT_ENABLED=true", () => {
    beforeEach(() => {
      Object.defineProperty(config, "jwtEnabled", { value: true, writable: true });
      Object.defineProperty(config, "jwtSecret", { value: TEST_SECRET, writable: true });
    });

    it("returns 401 when no token is provided", async () => {
      const app = createTestApp();
      const res = await request(app).get("/test");
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns 200 and sets req.user with a valid token", async () => {
      const token = jwt.sign(
        { userId: "test-user", email: "test@example.com" },
        TEST_SECRET
      );
      const app = createTestApp();
      const res = await request(app)
        .get("/test")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({
        userId: "test-user",
        email: "test@example.com",
      });
    });

    it("returns 401 with an invalid token", async () => {
      const app = createTestApp();
      const res = await request(app)
        .get("/test")
        .set("Authorization", "Bearer invalid-token");
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });
  });

  describe("when JWT_ENABLED=false", () => {
    beforeEach(() => {
      Object.defineProperty(config, "jwtEnabled", { value: false, writable: true });
    });

    it("sets default user and calls next()", async () => {
      const app = createTestApp();
      const res = await request(app).get("/test");
      expect(res.status).toBe(200);
      expect(res.body.user).toEqual({
        userId: "default-user-id",
        email: "dev@localhost",
      });
    });
  });
});
