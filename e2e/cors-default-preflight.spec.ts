import { test, expect } from "@playwright/test";

const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

/**
 * SC-006: Preflight OPTIONS request with default CORS (no CORS_ORIGINS).
 * When the server runs without CORS_ORIGINS, preflight should succeed
 * and reflect the Origin back.
 */
test("SC-006: Preflight OPTIONS with default CORS (no CORS_ORIGINS)", async ({
  request,
}) => {
  const preflight = await request.fetch(`${API_URL}/health`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://example.com",
      "Access-Control-Request-Method": "GET",
    },
  });
  expect(preflight.status()).toBe(204);
  const acao = preflight.headers()["access-control-allow-origin"];
  expect(acao).toBeTruthy();
});
