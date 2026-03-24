import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";

const TEST_SECRET = "test-secret";

jest.mock("../config", () => ({
  config: { jwtEnabled: true, jwtSecret: TEST_SECRET },
}));

jest.mock("../lib/prisma", () => ({
  prisma: {
    user: {
      upsert: jest.fn().mockResolvedValue({}),
    },
  },
}));

import { authMiddleware } from "./auth";

const app = express();
app.use(authMiddleware);
app.get("/test", (req, res) => res.json({ user: req.user }));

describe("authMiddleware (JWT_ENABLED=true)", () => {
  it("401 without token", async () => {
    const res = await request(app).get("/test");
    expect(res.status).toBe(401);
  });

  it("200 with valid token", async () => {
    const token = jwt.sign(
      { userId: "u1", email: "test@test.com" },
      TEST_SECRET
    );
    const res = await request(app)
      .get("/test")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ userId: "u1", email: "test@test.com" });
  });

  it("401 with invalid token", async () => {
    const res = await request(app)
      .get("/test")
      .set("Authorization", "Bearer bad.token");
    expect(res.status).toBe(401);
  });
});
