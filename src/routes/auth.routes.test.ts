/* eslint-disable @typescript-eslint/no-require-imports */
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";

function createApp(nodeEnv: string) {
  let authRouter: express.Router;

  jest.isolateModules(() => {
    jest.doMock("../config", () => ({
      config: {
        jwtSecret: "test-jwt-secret",
        jwtEnabled: true,
        nodeEnv,
      },
    }));
    authRouter = require("./auth.routes").authRouter;
  });

  const app = express();
  app.use(express.json());
  app.use("/auth", authRouter!);
  return app;
}

describe("POST /auth/dev-token", () => {
  it("returns 200 with valid JWT in development", async () => {
    const app = createApp("development");

    const res = await request(app).post("/auth/dev-token");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
  });

  it("returned token contains correct payload", async () => {
    const app = createApp("development");

    const res = await request(app).post("/auth/dev-token");
    const decoded = jwt.decode(res.body.token) as Record<string, unknown>;

    expect(decoded.userId).toBe("dev-user-id");
    expect(decoded.email).toBe("dev@localhost");
  });

  it("returns 404 in production", async () => {
    const app = createApp("production");

    const res = await request(app).post("/auth/dev-token");

    expect(res.status).toBe(404);
  });
});
