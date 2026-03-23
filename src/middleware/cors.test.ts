import express from "express";
import cors from "cors";
import request from "supertest";

function buildApp(corsOriginsEnv: string) {
  jest.resetModules();
  process.env.CORS_ORIGINS = corsOriginsEnv;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { corsOptions } = require("./cors");

  const app = express();
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.get("/test", (_req, res) => res.json({ ok: true }));
  return app;
}

afterEach(() => {
  delete process.env.CORS_ORIGINS;
});

describe("CORS middleware", () => {
  it("allows request from whitelisted origin", async () => {
    const app = buildApp("http://good.com");
    const res = await request(app)
      .get("/test")
      .set("Origin", "http://good.com");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://good.com");
  });

  it("does not set ACAO header for non-whitelisted origin", async () => {
    const app = buildApp("http://good.com");
    const res = await request(app)
      .get("/test")
      .set("Origin", "http://bad.com");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("handles preflight OPTIONS for whitelisted origin with 204", async () => {
    const app = buildApp("http://good.com");
    const res = await request(app)
      .options("/test")
      .set("Origin", "http://good.com")
      .set("Access-Control-Request-Method", "POST");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("http://good.com");
  });

  it("allows request without Origin header (SSR / mobile)", async () => {
    const app = buildApp("http://good.com");
    const res = await request(app).get("/test");

    expect(res.status).toBe(200);
  });
});
