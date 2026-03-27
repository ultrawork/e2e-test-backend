import { test, expect } from "@playwright/test";

const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:3000";

test.describe("CORS & JWT Verification v23", () => {
  test("SC-001: GET /health returns 200", async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });

  test("SC-002: GET /api/notes without token returns 401", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/notes`);
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty("error", "Unauthorized");
  });

  test("SC-003: POST /api/auth/dev-token issues JWT in dev/test", async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/api/auth/dev-token`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("token");
    expect(typeof body.token).toBe("string");
    // JWT format: three dot-separated parts
    expect(body.token.split(".").length).toBe(3);
  });

  test("SC-004: GET /api/notes with valid Bearer token returns 200", async ({
    request,
  }) => {
    const tokenRes = await request.post(`${API_URL}/api/auth/dev-token`);
    expect(tokenRes.status()).toBe(200);
    const { token } = await tokenRes.json();

    const response = await request.get(`${API_URL}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const notes = await response.json();
    expect(Array.isArray(notes)).toBe(true);
  });

  // SC-005, SC-006, SC-007: CORS preflight for each allowed origin.
  // Uses global fetch() because Playwright's request API does not support
  // the OPTIONS method directly.
  for (const [id, origin] of [
    ["SC-005", "http://localhost:3000"],
    ["SC-006", "http://localhost:8081"],
    ["SC-007", "http://localhost:19006"],
  ] as const) {
    test(`${id}: CORS preflight for ${origin} returns 204`, async () => {
      const response = await fetch(`${API_URL}/api/notes`, {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "Authorization",
        },
      });
      expect(response.status).toBe(204);
      expect(response.headers.get("access-control-allow-origin")).toBe(origin);
      expect(response.headers.get("access-control-allow-credentials")).toBe(
        "true",
      );
    });
  }

  // SC-008a requires the server to be running with NODE_ENV=production,
  // which cannot be controlled within a single Playwright test run.
  // This scenario is verified via curl in e2e/reports/backend-v23.md.
  test.skip("SC-008a: POST /api/auth/dev-token returns 404 in production", async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/api/auth/dev-token`);
    expect(response.status()).toBe(404);
  });

  test("SC-008b: POST /api/auth/dev-token returns 200 in test", async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/api/auth/dev-token`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("token");
  });
});
