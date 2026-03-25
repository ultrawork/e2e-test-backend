import request from "supertest";

jest.mock("./lib/prisma", () => ({
  prisma: {
    user: { upsert: jest.fn().mockResolvedValue({}) },
    note: { findMany: jest.fn().mockResolvedValue([]) },
    category: { findMany: jest.fn().mockResolvedValue([]) },
  },
}));

import { app } from "./app";

describe("GET /api/health", () => {
  it("returns 200 with status ok and timestamp", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });
});

describe("GET /health (legacy)", () => {
  it("still returns 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
