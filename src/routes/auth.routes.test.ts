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

jest.mock("../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));

import { authRouter } from "./auth.routes";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";

const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockBcryptCompare = bcrypt.compare as jest.Mock;

const app = express();
app.use(express.json());
app.use("/auth", authRouter);

beforeEach(() => {
  mockNodeEnv = "development";
  mockJwtSecret = "test-secret";
  jest.clearAllMocks();
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

describe("POST /auth/login", () => {
  it("returns 200 with token on valid credentials", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      password: "hashed-password",
    });
    mockBcryptCompare.mockResolvedValue(true);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "P@ssw0rd" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
  });

  it("returns 401 on invalid password", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      password: "hashed-password",
    });
    mockBcryptCompare.mockResolvedValue(false);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid credentials" });
  });

  it("returns 401 when user not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "P@ssw0rd" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Invalid credentials" });
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ password: "P@ssw0rd" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 500 when JWT_SECRET is not set", async () => {
    mockJwtSecret = "";
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      password: "hashed-password",
    });
    mockBcryptCompare.mockResolvedValue(true);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "P@ssw0rd" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "JWT_SECRET is not configured" });
  });
});
