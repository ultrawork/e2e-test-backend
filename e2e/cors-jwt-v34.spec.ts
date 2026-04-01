import { test, expect } from "@playwright/test";
import { mkdirSync } from "fs";

const API_URL = process.env.API_URL || "http://localhost:4000";

test.describe("CORS/JWT Verification v34", () => {
  test.beforeAll(() => {
    mkdirSync("screenshots", { recursive: true });
  });

  test("SC-1: GET /health returns 200 and status ok", async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });

  test("SC-2: GET /api/notes without token returns 401", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/notes`);
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("SC-3: dev-token + authorized access to /api/notes", async ({
    request,
  }) => {
    const tokenResponse = await request.post(
      `${API_URL}/api/auth/dev-token`,
    );
    expect(tokenResponse.status()).toBe(200);
    const tokenBody = await tokenResponse.json();
    expect(tokenBody).toHaveProperty("token");
    const token = tokenBody.token;
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const notesResponse = await request.get(`${API_URL}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(notesResponse.status()).toBe(200);
    const notes = await notesResponse.json();
    expect(Array.isArray(notes)).toBe(true);
  });

  test("SC-4: OPTIONS preflight with Origin http://localhost:3000 returns 204 and CORS headers", async ({
    page,
  }) => {
    const origin = "http://localhost:3000";
    const response = await fetch(`${API_URL}/api/notes`, {
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
    await page.screenshot({ path: "screenshots/SC-4-cors-localhost-3000.png" });
  });

  test("SC-5: OPTIONS preflight with Origin http://localhost:8081 returns 204 and CORS headers", async ({
    page,
  }) => {
    const origin = "http://localhost:8081";
    const response = await fetch(`${API_URL}/api/notes`, {
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
    await page.screenshot({ path: "screenshots/SC-5-cors-localhost-8081.png" });
  });

  test("SC-6: OPTIONS preflight with Origin http://localhost:19006 returns 204 and CORS headers", async ({
    page,
  }) => {
    const origin = "http://localhost:19006";
    const response = await fetch(`${API_URL}/api/notes`, {
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
    await page.screenshot({
      path: "screenshots/SC-6-cors-localhost-19006.png",
    });
  });

  test("SC-7: OPTIONS preflight with unknown Origin http://evil.example.com has no access-control-allow-origin", async ({
    page,
  }) => {
    const origin = "http://evil.example.com";
    const response = await fetch(`${API_URL}/api/notes`, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "GET",
      },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    await page.screenshot({
      path: "screenshots/SC-7-cors-evil-origin.png",
    });
  });

  test("SC-8: GET /api/notes with invalid Bearer token returns 401", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/notes`, {
      headers: { Authorization: "Bearer invalid.token.here" },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });
});
