import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

function makeToken(
  userId = "test-user-id",
  email = "test@example.com"
): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "1h" });
}

test.describe("CORS Middleware", () => {
  test("SC-001: CORS allows requests from permitted origin", async ({
    request,
  }) => {
    // Preflight OPTIONS request
    const preflight = await request.fetch(`${API_URL}/health`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3001",
        "Access-Control-Request-Method": "GET",
      },
    });
    // Accept 204 or 200 for preflight
    expect([200, 204]).toContain(preflight.status());
    const preflightACAO = preflight.headers()["access-control-allow-origin"];
    expect(preflightACAO).toBeTruthy();

    // Actual GET request with Origin header
    const res = await request.get(`${API_URL}/health`, {
      headers: {
        Origin: "http://localhost:3001",
      },
    });
    expect(res.status()).toBe(200);
    const acao = res.headers()["access-control-allow-origin"];
    expect(acao).toBeTruthy();
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });

  test("SC-002: CORS blocks requests from disallowed origin", async ({
    request,
  }) => {
    const preflight = await request.fetch(`${API_URL}/health`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://evil.com",
        "Access-Control-Request-Method": "GET",
      },
    });
    const acao = preflight.headers()["access-control-allow-origin"];
    // Disallowed origin should not have ACAO header, or it should not match evil.com
    if (acao) {
      expect(acao).not.toBe("http://evil.com");
    }
  });

  test("SC-003: CORS with wildcard allows any origin", async ({ request }) => {
    const res = await request.get(`${API_URL}/health`, {
      headers: {
        Origin: "http://any-domain.com",
      },
    });
    expect(res.status()).toBe(200);
    const acao = res.headers()["access-control-allow-origin"];
    // When CORS_ORIGINS=*, the header should be "*"
    // When CORS_ORIGINS is a list that includes our origin, it echoes the origin
    // Either way, we expect a truthy ACAO header
    expect(acao).toBeTruthy();
  });
});

test.describe("JWT Authentication", () => {
  test("SC-004: Production - request without token returns 401", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/api/notes`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error", "Authentication required");
  });

  test("SC-005: Production - request with invalid token returns 401", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/api/notes`, {
      headers: {
        Authorization: "Bearer invalid-token-12345",
      },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error", "Invalid token");
  });

  test("SC-006: Valid JWT token passes authentication", async ({
    request,
  }) => {
    const token = makeToken();
    const res = await request.get(`${API_URL}/api/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("SC-007: Development - request without token passes via dev-fallback", async ({
    request,
  }) => {
    // Detect server mode: if unauthenticated request returns 401, server is in production mode
    const probe = await request.get(`${API_URL}/api/notes`);
    const isProduction = probe.status() === 401;
    test.skip(isProduction, "Requires development mode (server is running in production mode)");

    const res = await request.get(`${API_URL}/api/categories`);
    // In development mode, this should succeed (dev-fallback)
    // In production mode, this would return 401
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("SC-008: Non-Bearer authorization format returns 401", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/api/notes`, {
      headers: {
        Authorization: "Basic dXNlcjpwYXNz",
      },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error", "Authentication required");
  });
});
