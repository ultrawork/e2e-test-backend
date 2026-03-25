import request from "supertest";
import express from "express";

let mockNodeEnv = "development";
let mockJwtSecret = "test-secret";

jest.mock("../config", () => ({
  get config() {
    return {
      nodeEnv: mockNodeEnv,
      jwtSecret: mockJwtSecret,
    };
  },
}));

import { authRouter } from "./auth.routes";

const app = express();
app.use(express.json());
app.use("/auth", authRouter);

beforeEach(() => {
  mockNodeEnv = "development";
  mockJwtSecret = "test-secret";
});

describe("POST /auth/dev-token", () => {
  it("returns 200 with token in development", async () => {
    const res = await request(app).post("/auth/dev-token");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
  });

  it("returns 200 with token in test environment", async () => {
    mockNodeEnv = "test";
    const res = await request(app).post("/auth/dev-token");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("returns 404 in production", async () => {
    mockNodeEnv = "production";
    const res = await request(app).post("/auth/dev-token");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });

  it("returns 500 when JWT_SECRET is not set", async () => {
    mockJwtSecret = "";
    const res = await request(app).post("/auth/dev-token");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "JWT_SECRET is not configured" });
  });
});
