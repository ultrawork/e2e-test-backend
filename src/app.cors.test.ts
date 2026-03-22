import request from "supertest";
import { app } from "./app";

describe("CORS middleware", () => {
  describe("when CORS_ORIGIN is not set (default wildcard)", () => {
    beforeAll(() => {
      delete process.env.CORS_ORIGIN;
    });

    it("allows any origin when CORS_ORIGIN is not set", async () => {
      const res = await request(app)
        .get("/health")
        .set("Origin", "http://example.com");

      // Callback-based origin reflects the actual request origin (not "*")
      // when CORS_ORIGIN is unset, all origins are allowed
      expect(res.headers["access-control-allow-origin"]).toBe(
        "http://example.com"
      );
    });

    it("handles preflight OPTIONS returning 204", async () => {
      const res = await request(app)
        .options("/api/notes")
        .set("Origin", "http://example.com")
        .set("Access-Control-Request-Method", "GET");

      expect(res.status).toBe(204);
      expect(res.headers["access-control-allow-origin"]).toBeDefined();
    });

    it("allows requests without Origin header (CLI/mobile)", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
    });
  });

  describe("when CORS_ORIGIN is set to a single origin", () => {
    beforeAll(() => {
      process.env.CORS_ORIGIN = "http://localhost:3000";
    });

    afterAll(() => {
      delete process.env.CORS_ORIGIN;
    });

    it("reflects allowed origin in response", async () => {
      const res = await request(app)
        .get("/health")
        .set("Origin", "http://localhost:3000");

      expect(res.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000"
      );
    });

    it("blocks disallowed origin", async () => {
      const res = await request(app)
        .get("/health")
        .set("Origin", "http://evil.com");

      expect(res.status).toBe(500);
    });

    it("allows requests without Origin header", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
    });

    it("handles preflight for allowed origin returning 204", async () => {
      const res = await request(app)
        .options("/api/notes")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "GET");

      expect(res.status).toBe(204);
      expect(res.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000"
      );
    });
  });

  describe("when CORS_ORIGIN is a comma-separated list", () => {
    beforeAll(() => {
      process.env.CORS_ORIGIN =
        "http://localhost:3000,http://localhost:3001,http://10.0.2.2:3000";
    });

    afterAll(() => {
      delete process.env.CORS_ORIGIN;
    });

    it("allows first origin in list", async () => {
      const res = await request(app)
        .get("/health")
        .set("Origin", "http://localhost:3000");

      expect(res.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000"
      );
    });

    it("allows second origin in list", async () => {
      const res = await request(app)
        .get("/health")
        .set("Origin", "http://localhost:3001");

      expect(res.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3001"
      );
    });

    it("allows Android emulator origin from list", async () => {
      const res = await request(app)
        .get("/health")
        .set("Origin", "http://10.0.2.2:3000");

      expect(res.headers["access-control-allow-origin"]).toBe(
        "http://10.0.2.2:3000"
      );
    });

    it("blocks origin not in list", async () => {
      const res = await request(app)
        .get("/health")
        .set("Origin", "http://evil.com");

      expect(res.status).toBe(500);
    });
  });
});
