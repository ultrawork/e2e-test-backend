import express from "express";
import request from "supertest";

const mockUpsert = jest.fn();
jest.mock("../lib/prisma", () => ({
  prisma: {
    user: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}));

import { ensureUser } from "./ensureUser";

function createApp(user?: { userId: string; email: string }) {
  const app = express();
  app.use((req, _res, next) => {
    if (user) req.user = user;
    next();
  });
  app.use(ensureUser);
  app.get("/test", (req: express.Request, res: express.Response) => {
    res.json({ user: req.user ?? null });
  });
  return app;
}

afterEach(() => {
  mockUpsert.mockReset();
});

describe("ensureUser", () => {
  it("calls prisma.user.upsert with correct data when user is set", async () => {
    mockUpsert.mockResolvedValue({});
    const app = createApp({ userId: "u1", email: "a@b.com" });
    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { id: "u1" },
      update: {},
      create: { id: "u1", email: "a@b.com", password: "no-password" },
    });
  });

  it("passes through when no user is set", async () => {
    const app = createApp();
    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns 500 when upsert fails", async () => {
    mockUpsert.mockRejectedValue(new Error("DB error"));
    const app = createApp({ userId: "u1", email: "a@b.com" });
    const res = await request(app).get("/test");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
  });
});
