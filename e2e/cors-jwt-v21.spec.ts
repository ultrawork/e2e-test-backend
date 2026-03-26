import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

test.describe("CORS/JWT Verification v21", () => {
  test("SC-1: GET /health returns 200 and status ok", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });

  test("SC-2: GET /api/notes without token returns 401", async ({
    request,
  }) => {
    const response = await request.get(`${BASE_URL}/api/notes`);
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  test("SC-3: dev-token + authorized access to /api/notes", async ({
    request,
  }) => {
    const tokenResponse = await request.post(
      `${BASE_URL}/api/auth/dev-token`,
    );
    expect(tokenResponse.status()).toBe(200);
    const { token } = await tokenResponse.json();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const notesResponse = await request.get(`${BASE_URL}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(notesResponse.status()).toBe(200);
    const notes = await notesResponse.json();
    expect(Array.isArray(notes)).toBe(true);
  });

  test("SC-4: OPTIONS /api/notes with Origin http://localhost:3000 returns 204 and CORS headers", async () => {
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

  test("SC-5: OPTIONS /api/notes with Origin http://localhost:8081 returns 204 and CORS headers", async () => {
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

  test("SC-6: OPTIONS /api/notes with Origin http://localhost:19006 returns 204 and CORS headers", async () => {
    const origin = "http://localhost:19006";
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
});
