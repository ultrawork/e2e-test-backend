import request from "supertest";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";

jest.mock("../lib/prisma", () => ({
  prisma: {
    user: {
      upsert: jest.fn().mockResolvedValue({}),
    },
  },
}));

import { authMiddleware } from "./auth";

const TEST_SECRET = "test-secret";

const testApp = express();
testApp.use(express.json());
testApp.get("/test", authMiddleware, (req: Request, res: Response) => {
  res.json({ userId: req.user!.userId, email: req.user!.email });
});

describe("authMiddleware", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await request(testApp).get("/test");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("returns 401 when token is invalid", async () => {
    const res = await request(testApp)
      .get("/test")
      .set("Authorization", "Bearer invalid-token");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("returns 401 when Authorization header lacks Bearer prefix", async () => {
    const token = jwt.sign({ userId: "u1", email: "t@t.com" }, TEST_SECRET);
    const res = await request(testApp)
      .get("/test")
      .set("Authorization", token);
    expect(res.status).toBe(401);
  });

  it("sets req.user and calls next for valid token", async () => {
    const token = jwt.sign({ userId: "u1", email: "t@t.com" }, TEST_SECRET);
    const res = await request(testApp)
      .get("/test")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe("u1");
    expect(res.body.email).toBe("t@t.com");
  });
});
