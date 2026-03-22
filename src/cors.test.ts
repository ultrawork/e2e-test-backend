import request from "supertest";
import { app } from "./app";

describe("CORS configuration", () => {
  it("returns CORS headers for localhost:3000 origin", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:3000");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000"
    );
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("returns CORS headers for localhost:3001 origin", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:3001");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3001"
    );
  });

  it("returns CORS headers for Android emulator origin", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://10.0.2.2:3000");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://10.0.2.2:3000"
    );
  });

  it("returns CORS headers for Expo origin", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:8081");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:8081"
    );
  });

  it("handles preflight OPTIONS request", async () => {
    const res = await request(app)
      .options("/api/health")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Content-Type,Authorization");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000"
    );
    expect(res.headers["access-control-allow-methods"]).toContain("GET");
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
    expect(res.headers["access-control-allow-headers"]).toContain(
      "Authorization"
    );
  });

  it("allows requests without origin (mobile native clients)", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
  });

  it("rejects disallowed origins", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://evil.com");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
