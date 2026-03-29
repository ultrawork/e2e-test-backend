import { test, expect } from "@playwright/test";
import * as fs from "fs";

const BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

test.describe("CORS/JWT Verification v26", () => {
  test("SC-001: GET /health returns 200 and status ok", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });

  test("SC-002: GET /api/notes without token returns 401", async ({
    request,
  }) => {
    const response = await request.get(`${BASE_URL}/api/notes`);
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("SC-003: dev-token + authorized access to /api/notes", async ({
    request,
  }) => {
    const tokenResponse = await request.post(
      `${BASE_URL}/api/auth/dev-token`,
    );
    expect(tokenResponse.status()).toBe(200);
    const tokenBody = await tokenResponse.json();
    expect(tokenBody).toHaveProperty("token");
    const token = tokenBody.token;
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const notesResponse = await request.get(`${BASE_URL}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(notesResponse.status()).toBe(200);
    const notes = await notesResponse.json();
    expect(Array.isArray(notes)).toBe(true);
  });

  test("SC-004: OPTIONS preflight with Origin http://localhost:3000 returns 204 and CORS headers", async () => {
    const origin = "http://localhost:3000";
    const response = await fetch(`${BASE_URL}/api/notes`, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "GET",
      },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true",
    );
  });

  test("SC-005: OPTIONS preflight with Origin http://localhost:8081 returns 204 and CORS headers", async () => {
    const origin = "http://localhost:8081";
    const response = await fetch(`${BASE_URL}/api/notes`, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "GET",
      },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true",
    );
  });

  test("SC-006: OPTIONS preflight with Origin exp://127.0.0.1:19006 returns 204 and CORS headers", async () => {
    const origin = "exp://127.0.0.1:19006";
    const response = await fetch(`${BASE_URL}/api/notes`, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "GET",
      },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true",
    );
  });

  test("SC-007: dev-token endpoint has production guard in source", async () => {
    const source = fs.readFileSync("src/routes/auth.routes.ts", "utf-8");
    expect(source).toContain("production");
  });

  test("SC-008: POST /api/auth/dev-token in test env returns valid JWT", async ({
    request,
  }) => {
    const response = await request.post(`${BASE_URL}/api/auth/dev-token`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("token");
    const token = body.token;
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);
  });

  test("SC-009: OPTIONS preflight with disallowed Origin http://evil.example.com is rejected", async () => {
    const origin = "http://evil.example.com";
    const response = await fetch(`${BASE_URL}/api/notes`, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "GET",
      },
    });
    const allowOrigin = response.headers.get("access-control-allow-origin");
    expect(allowOrigin).not.toBe(origin);
  });
});
