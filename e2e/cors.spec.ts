import { test, expect } from "@playwright/test";

const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

// The frontend origin that should be allowed by CORS_ORIGINS in the test environment
const ALLOWED_ORIGIN =
  process.env.FRONTEND_URL || "http://localhost:4121";

const DISALLOWED_ORIGIN = "http://evil.example.com";

// SC-001: Request with allowed Origin returns CORS headers
test("SC-001: allowed origin receives Access-Control-Allow-Origin header", async ({
  request,
}) => {
  const res = await request.get(`${API_URL}/health`, {
    headers: { Origin: ALLOWED_ORIGIN },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toEqual({ status: "ok" });
  expect(res.headers()["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
});

// SC-002: Request with disallowed Origin is blocked
test("SC-002: disallowed origin is blocked by CORS", async ({ request }) => {
  const res = await request.get(`${API_URL}/health`, {
    headers: { Origin: DISALLOWED_ORIGIN },
  });
  expect(res.status()).toBe(500);
  expect(res.headers()["access-control-allow-origin"]).toBeUndefined();
});

// SC-003: Request without Origin header succeeds
test("SC-003: request without Origin header succeeds", async ({ request }) => {
  const res = await request.fetch(`${API_URL}/health`, {
    method: "GET",
    headers: {},
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toEqual({ status: "ok" });
});

// SC-004: Preflight OPTIONS with allowed Origin returns CORS headers
test("SC-004: preflight OPTIONS with allowed origin returns CORS headers", async ({
  request,
}) => {
  const res = await request.fetch(`${API_URL}/health`, {
    method: "OPTIONS",
    headers: {
      Origin: ALLOWED_ORIGIN,
      "Access-Control-Request-Method": "GET",
    },
  });
  expect(res.status()).toBe(204);
  expect(res.headers()["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN);
  expect(res.headers()["access-control-allow-methods"]).toBeDefined();
});
