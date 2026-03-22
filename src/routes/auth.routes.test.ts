import request from "supertest";
import express, { Request, Response, NextFunction } from "express";

jest.mock("../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
  compare: jest.fn(),
}));

jest.mock("../middleware/auth", () => ({
  authMiddleware: (req: Request, _res: Response, next: NextFunction) => {
    req.user = { userId: "user-1", email: "test@test.com" };
    next();
  },
}));

import { authRouter } from "./auth.routes";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";

const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockCreate = prisma.user.create as jest.Mock;
const mockDelete = prisma.user.delete as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;

const app = express();
app.use(express.json());
app.use("/auth", authRouter);

beforeEach(() => jest.clearAllMocks());

describe("POST /auth/register", () => {
  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "test@test.com" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("returns 201 on successful registration", async () => {
    const user = { id: "user-1", email: "test@test.com", password: "hashed" };
    mockCreate.mockResolvedValue(user);

    const res = await request(app)
      .post("/auth/register")
      .send({ email: "test@test.com", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body.userId).toBe("user-1");
    expect(res.body.email).toBe("test@test.com");
    expect(res.body.token).toBeTruthy();
  });

  it("returns 400 when email already exists", async () => {
    const err = Object.assign(new Error("Unique constraint"), { code: "P2002" });
    mockCreate.mockRejectedValue(err);

    const res = await request(app)
      .post("/auth/register")
      .send({ email: "test@test.com", password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });
});

describe("POST /auth/login", () => {
  it("returns 400 when fields are missing", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@test.com" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("returns 401 when user not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "no@no.com", password: "pass" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBeTruthy();
  });

  it("returns 401 when password is wrong", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", email: "t@t.com", password: "hashed" });
    mockCompare.mockResolvedValue(false);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "t@t.com", password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBeTruthy();
  });

  it("returns 200 with token on valid credentials", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", email: "t@t.com", password: "hashed" });
    mockCompare.mockResolvedValue(true);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "t@t.com", password: "pass" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });
});

describe("POST /auth/logout", () => {
  it("returns 200", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.status).toBe(200);
  });
});

describe("DELETE /auth/account", () => {
  it("returns 204 on success", async () => {
    mockDelete.mockResolvedValue({});

    const res = await request(app).delete("/auth/account");
    expect(res.status).toBe(204);
  });
});
