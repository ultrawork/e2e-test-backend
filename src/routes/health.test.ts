import request from "supertest";
import { app } from "../app";

describe("GET /api/health", () => {
  it("returns 200 with status ok and timestamp", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("timestamp");
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });
});
