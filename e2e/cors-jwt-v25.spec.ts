import { test, expect } from "@playwright/test";

const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

test.describe("CORS/JWT Verification v25", () => {
  // SC-001: Public endpoint accessible without auth
  test("SC-001: GET /health returns 200 and status ok", async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });

  // SC-002: JWT middleware blocks unauthenticated requests
  test("SC-002: GET /api/notes without token returns 401", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/notes`);
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  // SC-003: dev-token issued and accepted by JWT middleware
  test("SC-003: dev-token + authorized access to /api/notes", async ({
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

  // SC-004: CORS preflight accepted for web client (React/Next.js)
  test("SC-004: OPTIONS preflight with Origin http://localhost:3000 returns 204 and CORS headers", async () => {
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
  });

  // SC-005: CORS preflight accepted for Android/React Native Metro
  test("SC-005: OPTIONS preflight with Origin http://localhost:8081 returns 204 and CORS headers", async () => {
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
  });

  // SC-006: CORS preflight accepted for Expo Go (iOS/Android)
  test("SC-006: OPTIONS preflight with Origin http://localhost:19006 returns 204 and CORS headers", async () => {
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
  });

  // SC-007: dev-token blocked in production environment
  test("SC-007: POST /api/auth/dev-token blocked in production (NODE_ENV=production)", async ({
    request,
  }) => {
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === "production") {
      const response = await request.post(`${API_URL}/api/auth/dev-token`);
      expect([403, 404]).toContain(response.status());
    } else {
      // In non-production, verify the endpoint works (covered by SC-003 and SC-008)
      const response = await request.post(`${API_URL}/api/auth/dev-token`);
      expect(response.status()).toBe(200);
    }
  });

  // SC-008: dev-token available in development/test environment
  test("SC-008: POST /api/auth/dev-token returns valid JWT in development/test environment", async ({
    request,
  }) => {
    const tokenRes = await request.post(`${API_URL}/api/auth/dev-token`);
    expect(tokenRes.status()).toBe(200);

    const body = await tokenRes.json();
    expect(body).toHaveProperty("token");
    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(0);

    const parts = body.token.split(".");
    expect(parts).toHaveLength(3);
  });

  // SC-009: Unknown/evil origin blocked by CORS middleware
  test("SC-009: OPTIONS preflight with evil origin is blocked by CORS", async () => {
    const evilOrigin = "http://evil.example.com";
    const response = await fetch(`${API_URL}/api/notes`, {
      method: "OPTIONS",
      headers: {
        Origin: evilOrigin,
        "Access-Control-Request-Method": "GET",
      },
    });
    // CORS middleware with callback-based origin validation should reject unknown origins:
    // The Access-Control-Allow-Origin header must NOT reflect the evil origin back
    const allowOrigin = response.headers.get("access-control-allow-origin");
    expect(allowOrigin).not.toBe(evilOrigin);
    // Wildcard '*' with credentials is also a CORS misconfiguration
    expect(allowOrigin).not.toBe("*");
  });
});
