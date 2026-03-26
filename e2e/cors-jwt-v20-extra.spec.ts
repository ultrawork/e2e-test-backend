import { test, expect } from "@playwright/test";

const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

/** V20-7: CORS preflight for disallowed origin does NOT return allow-origin */
test("V20-7: CORS preflight rejects disallowed origin", async ({ request }) => {
  const response = await request.fetch(`${API_URL}/api/notes`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://evil.example.com",
      "Access-Control-Request-Method": "GET",
    },
  });
  const h = response.headers();
  // The server should NOT echo back the disallowed origin
  const allowOrigin = h["access-control-allow-origin"] || "";
  expect(allowOrigin).not.toBe("http://evil.example.com");
});
