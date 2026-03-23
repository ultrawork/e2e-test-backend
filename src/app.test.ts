/* eslint-disable @typescript-eslint/no-require-imports */
import request from "supertest";

jest.mock("./lib/prisma", () => ({
  prisma: {},
}));

describe("CORS middleware", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("sets Access-Control-Allow-Origin for allowed origin", async () => {
    process.env.CORS_ORIGINS = "http://localhost:3000,http://localhost:3001";
    const { app } = require("./app");

    const res = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:3000");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
  });

  it("does not set Access-Control-Allow-Origin for disallowed origin", async () => {
    process.env.CORS_ORIGINS = "http://localhost:3000";
    const { app } = require("./app");

    const res = await request(app)
      .get("/health")
      .set("Origin", "http://evil.com");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("responds to preflight OPTIONS request for allowed origin", async () => {
    process.env.CORS_ORIGINS = "http://localhost:3000";
    const { app } = require("./app");

    const res = await request(app)
      .options("/api/notes")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "POST");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
  });
});
