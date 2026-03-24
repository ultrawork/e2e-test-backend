import request from "supertest";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./auth";
import { config } from "../config";

const TEST_SECRET = "test-jwt-secret";

jest.mock("../config", () => ({
  config: {
    jwtEnabled: true,
    jwtSecret: "test-jwt-secret",
    nodeEnv: "development",
  },
}));

const mutableConfig = config as { jwtEnabled: boolean; jwtSecret: string };

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(authMiddleware);
  app.get("/protected", (req: Request, res: Response) => {
    res.json({ user: req.user });
  });
  return app;
}

beforeEach(() => {
  mutableConfig.jwtEnabled = true;
  mutableConfig.jwtSecret = TEST_SECRET;
});

describe("authMiddleware", () => {
  describe("when JWT_ENABLED=false", () => {
    it("passes through with dev user without token", async () => {
      mutableConfig.jwtEnabled = false;

      const res = await request(createApp()).get("/protected");

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual({
        userId: "dev-user-id",
        email: "dev@localhost",
      });
    });
  });

  describe("when JWT_ENABLED=true", () => {
    it("returns 401 when no Authorization header", async () => {
      const res = await request(createApp()).get("/protected");

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns 401 when Authorization header is not Bearer", async () => {
      const res = await request(createApp())
        .get("/protected")
        .set("Authorization", "Basic abc123");

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns 401 when token has invalid signature", async () => {
      const token = jwt.sign(
        { userId: "user-1", email: "test@test.com" },
        "wrong-secret"
      );

      const res = await request(createApp())
        .get("/protected")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("returns 401 when token is expired", async () => {
      const token = jwt.sign(
        { userId: "user-1", email: "test@test.com" },
        TEST_SECRET,
        { expiresIn: "-1s" }
      );

      const res = await request(createApp())
        .get("/protected")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    it("sets req.user and calls next with valid token", async () => {
      const payload = { userId: "user-1", email: "test@test.com" };
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: "1h" });

      const res = await request(createApp())
        .get("/protected")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject(payload);
    });
  });
});
