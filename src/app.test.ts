import request from "supertest";
import type { Express } from "express";

describe("CORS middleware", () => {
  let app: Express;

  beforeAll(() => {
    process.env.CORS_ORIGINS =
      "http://localhost:3000,http://localhost:8081,http://localhost:19006";
    process.env.JWT_ENABLED = "false";
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    app = require("./app").app;
  });

  afterAll(() => {
    delete process.env.CORS_ORIGINS;
    delete process.env.JWT_ENABLED;
  });

  it("returns Access-Control-Allow-Origin for an allowed origin", async () => {
    const res = await request(app)
      .options("/api/notes")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("does NOT return Access-Control-Allow-Origin for a disallowed origin", async () => {
    const res = await request(app)
      .options("/api/notes")
      .set("Origin", "http://evil.com")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
