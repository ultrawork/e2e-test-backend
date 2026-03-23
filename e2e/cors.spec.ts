import { test, expect } from "@playwright/test";

const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

/**
 * SC-001: CORS allows all origins by default (no CORS_ORIGINS set).
 * When the server runs without CORS_ORIGINS, cors({ origin: true }) reflects
 * the request Origin back in Access-Control-Allow-Origin.
 */
test("SC-001: CORS allows all origins by default", async ({ request }) => {
  // Preflight OPTIONS request
  const preflight = await request.fetch(`${API_URL}/health`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://example.com",
      "Access-Control-Request-Method": "GET",
    },
  });
  expect(preflight.status()).toBe(204);
  const preflightACAO = preflight.headers()["access-control-allow-origin"];
  expect(preflightACAO).toBeTruthy();

  // GET request with Origin header
  const res = await request.get(`${API_URL}/health`, {
    headers: { Origin: "http://example.com" },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toEqual({ status: "ok" });
  const acao = res.headers()["access-control-allow-origin"];
  expect(acao).toBeTruthy();
});

/**
 * SC-002: CORS with wildcard (CORS_ORIGINS=*).
 * When CORS_ORIGINS is set to "*", the server responds with
 * Access-Control-Allow-Origin: *.
 */
test("SC-002: CORS with wildcard origin", async ({ request }) => {
  const res = await request.get(`${API_URL}/health`, {
    headers: { Origin: "http://any-domain.com" },
  });
  expect(res.status()).toBe(200);
  const acao = res.headers()["access-control-allow-origin"];
  expect(acao).toBe("*");
});

/**
 * SC-003: CORS with a single specific origin (CORS_ORIGINS=http://allowed.com).
 * Allowed origin gets reflected; disallowed origin does not.
 */
test("SC-003: CORS with single specific origin", async ({ request }) => {
  // Request from allowed origin
  const allowed = await request.get(`${API_URL}/health`, {
    headers: { Origin: "http://allowed.com" },
  });
  expect(allowed.status()).toBe(200);
  const acaoAllowed = allowed.headers()["access-control-allow-origin"];
  expect(acaoAllowed).toBe("http://allowed.com");

  // Request from blocked origin — header must be absent
  const blocked = await request.get(`${API_URL}/health`, {
    headers: { Origin: "http://blocked.com" },
  });
  expect(blocked.status()).toBe(200);
  const acaoBlocked = blocked.headers()["access-control-allow-origin"];
  expect(acaoBlocked).toBeUndefined();
});

/**
 * SC-004: CORS with multiple comma-separated origins
 * (CORS_ORIGINS=http://first.com,http://second.com).
 */
test("SC-004: CORS with multiple origins", async ({ request }) => {
  // First allowed origin
  const first = await request.get(`${API_URL}/health`, {
    headers: { Origin: "http://first.com" },
  });
  expect(first.status()).toBe(200);
  expect(first.headers()["access-control-allow-origin"]).toBe(
    "http://first.com"
  );

  // Second allowed origin
  const second = await request.get(`${API_URL}/health`, {
    headers: { Origin: "http://second.com" },
  });
  expect(second.status()).toBe(200);
  expect(second.headers()["access-control-allow-origin"]).toBe(
    "http://second.com"
  );

  // Disallowed origin
  const third = await request.get(`${API_URL}/health`, {
    headers: { Origin: "http://third.com" },
  });
  expect(third.status()).toBe(200);
  expect(third.headers()["access-control-allow-origin"]).toBeUndefined();
});

/**
 * SC-005: Preflight (OPTIONS) request is handled correctly with a specific origin
 * (CORS_ORIGINS=http://allowed.com).
 */
test("SC-005: Preflight OPTIONS with specific origin", async ({ request }) => {
  const preflight = await request.fetch(`${API_URL}/api/notes`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://allowed.com",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "Content-Type, Authorization",
    },
  });
  expect(preflight.status()).toBe(204);
  expect(preflight.headers()["access-control-allow-origin"]).toBe(
    "http://allowed.com"
  );
  const allowMethods = preflight.headers()["access-control-allow-methods"];
  expect(allowMethods).toBeTruthy();
  expect(allowMethods).toContain("POST");
});
