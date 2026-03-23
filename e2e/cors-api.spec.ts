import { test, expect } from "@playwright/test";

const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

test.describe("CORS origin whitelist", () => {
  test("SC-101: Allowed origin receives CORS headers", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/categories`, {
      headers: {
        Origin: "http://localhost:3001",
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()["access-control-allow-origin"]).toBe(
      "http://localhost:3001"
    );
  });

  test("SC-102: Disallowed origin does not receive CORS headers", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/api/categories`, {
      headers: {
        Origin: "http://evil.example.com",
      },
    });
    expect(res.status()).toBe(200);
    expect(
      res.headers()["access-control-allow-origin"]
    ).toBeUndefined();
  });

  test("SC-103: Preflight OPTIONS for allowed origin returns 204 with CORS headers", async ({
    request,
  }) => {
    const res = await request.fetch(`${API_URL}/api/notes`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });
    expect(res.status()).toBe(204);
    expect(res.headers()["access-control-allow-origin"]).toBe(
      "http://localhost:5173"
    );
    const allowMethods = res.headers()["access-control-allow-methods"] || "";
    expect(allowMethods).toContain("POST");
  });

  test("SC-104: Request without Origin header is allowed (mobile/SSR)", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/api/categories`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
