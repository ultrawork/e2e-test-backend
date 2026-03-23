import request from "supertest";

describe("CORS configuration", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("allows request without Origin header (e2e/mobile clients)", async () => {
    process.env.CORS_ORIGINS = "http://localhost:3001";
    const { app } = await import("./app");
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });

  it("allows request from allowed origin", async () => {
    process.env.CORS_ORIGINS = "http://localhost:3001,http://localhost:3000";
    const { app } = await import("./app");
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:3001");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3001");
  });

  it("blocks request from disallowed origin", async () => {
    process.env.CORS_ORIGINS = "http://localhost:3001";
    const { app } = await import("./app");
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://evil.example.com");
    expect(res.status).toBe(500);
  });

  it("blocks all browser origins when CORS_ORIGINS is empty", async () => {
    process.env.CORS_ORIGINS = "";
    const { app } = await import("./app");
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:3001");
    expect(res.status).toBe(500);
  });
});
