import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL = process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

/** SC-001: Get dev-token in development mode */
test("SC-001: POST /api/auth/dev-token returns a valid JWT", async ({ request }) => {
  const response = await request.post(`${API_URL}/api/auth/dev-token`);
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveProperty("token");
  expect(typeof body.token).toBe("string");
  expect(body.token.length).toBeGreaterThan(0);

  // JWT has three dot-separated parts
  const parts = body.token.split(".");
  expect(parts).toHaveLength(3);
});

/** SC-002: Access protected endpoint with valid JWT */
test("SC-002: GET /api/notes with valid token returns 200", async ({ request }) => {
  // Get dev-token first
  const tokenRes = await request.post(`${API_URL}/api/auth/dev-token`);
  expect(tokenRes.status()).toBe(200);
  const { token } = await tokenRes.json();

  const response = await request.get(`${API_URL}/api/notes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

/** SC-003: Request to protected endpoint without token */
test("SC-003: GET /api/notes without token returns 401", async ({ request }) => {
  const response = await request.get(`${API_URL}/api/notes`);
  expect(response.status()).toBe(401);

  const body = await response.json();
  expect(body).toEqual({ error: "Unauthorized" });
});

/** SC-004: Request to protected endpoint with invalid token */
test("SC-004: GET /api/notes with invalid token returns 401", async ({ request }) => {
  const response = await request.get(`${API_URL}/api/notes`, {
    headers: {
      Authorization: "Bearer invalid-token-value",
    },
  });
  expect(response.status()).toBe(401);

  const body = await response.json();
  expect(body).toEqual({ error: "Unauthorized" });
});

/** SC-005: CORS headers for allowed origin */
test("SC-005: CORS headers present for allowed origin", async ({ request }) => {
  const response = await request.get(`${API_URL}/health`, {
    headers: {
      Origin: "http://localhost:3001",
    },
  });
  expect(response.status()).toBe(200);

  const headers = response.headers();
  expect(headers["access-control-allow-credentials"]).toBe("true");
  // Origin is reflected back when credentials is true
  expect(headers["access-control-allow-origin"]).toBeTruthy();
});

/** SC-006: Preflight OPTIONS returns CORS headers */
test("SC-006: OPTIONS preflight returns CORS headers", async ({ request }) => {
  const response = await request.fetch(`${API_URL}/api/notes`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:3001",
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "Authorization",
    },
  });
  expect(response.status()).toBe(204);

  const headers = response.headers();
  expect(headers["access-control-allow-credentials"]).toBe("true");
  expect(headers["access-control-allow-origin"]).toBeTruthy();
  // Authorization should be in allowed headers
  const allowHeaders = (headers["access-control-allow-headers"] || "").toLowerCase();
  expect(allowHeaders).toContain("authorization");
});
