import { test, expect } from "@playwright/test";
import * as fs from "fs";

const API_URL = process.env.API_URL || "http://localhost:4000";

test.describe("CORS/JWT Verification v28", () => {
  test.beforeAll(() => {
    if (!fs.existsSync("screenshots")) {
      fs.mkdirSync("screenshots", { recursive: true });
    }
  });

  test("SC-1: GET /health returns 200 and status ok", async ({
    request,
    page,
  }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
    await page.screenshot({ path: "screenshots/SC-01-health-check.png" });
  });

  test("SC-2: GET /api/notes without token returns 401", async ({
    request,
    page,
  }) => {
    const response = await request.get(`${API_URL}/api/notes`);
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty("error");
    await page.screenshot({ path: "screenshots/SC-02-unauthorized.png" });
  });

  test("SC-3: dev-token + authorized access to /api/notes", async ({
    request,
    page,
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
    await page.screenshot({ path: "screenshots/SC-03-dev-token-auth.png" });
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
    await page.screenshot({ path: "screenshots/SC-04-cors-3000.png" });
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
    await page.screenshot({ path: "screenshots/SC-05-cors-8081.png" });
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
    await page.screenshot({ path: "screenshots/SC-06-cors-19006.png" });
  });

  test("SC-7: OPTIONS preflight with disallowed Origin does not return CORS headers", async ({
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
    const allowOrigin = response.headers.get("access-control-allow-origin");
    expect(allowOrigin).not.toBe(origin);
    await page.screenshot({
      path: "screenshots/SC-07-cors-disallowed.png",
    });
  });
});
