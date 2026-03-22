import request from "supertest";
import express, { Request, Response } from "express";
import { authMiddleware } from "./auth";

function createTestApp() {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(authMiddleware);
  testApp.get("/test", (req: Request, res: Response) => {
    res.json({ user: req.user });
  });
  return testApp;
}

describe("authMiddleware", () => {
  const originalEnv = process.env.DEV_API_TOKEN;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DEV_API_TOKEN;
    } else {
      process.env.DEV_API_TOKEN = originalEnv;
    }
  });

  it("authenticates with valid DEV_API_TOKEN", async () => {
    process.env.DEV_API_TOKEN = "test-dev-token";
    const testApp = createTestApp();

    const res = await request(testApp)
      .get("/test")
      .set("Authorization", "Bearer test-dev-token");

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      userId: "default-user-id",
      email: "dev@localhost",
    });
  });

  it("falls through to default user when no DEV_API_TOKEN env is set", async () => {
    delete process.env.DEV_API_TOKEN;
    const testApp = createTestApp();

    const res = await request(testApp).get("/test");

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      userId: "default-user-id",
      email: "dev@localhost",
    });
  });

  it("falls through to default user when token does not match", async () => {
    process.env.DEV_API_TOKEN = "test-dev-token";
    const testApp = createTestApp();

    const res = await request(testApp)
      .get("/test")
      .set("Authorization", "Bearer wrong-token");

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      userId: "default-user-id",
      email: "dev@localhost",
    });
  });
});
