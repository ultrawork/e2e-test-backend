import { test, expect } from "@playwright/test";

const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

/** V20-1: GET /api/health returns 200 and { status: "ok" } */
test("V20-1: GET /api/health returns 200", async ({ request }) => {
  const response = await request.get(`${API_URL}/api/health`);
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});

/** V20-2: GET /api/notes without token returns 401 */
test("V20-2: GET /api/notes without token returns 401", async ({
  request,
}) => {
  const response = await request.get(`${API_URL}/api/notes`);
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ error: "Unauthorized" });
});

/** V20-3: Dev-token grants access to /api/notes */
test("V20-3: dev-token grants access to /api/notes", async ({ request }) => {
  const tokenRes = await request.post(`${API_URL}/api/auth/dev-token`);
  expect(tokenRes.status()).toBe(200);
  const { token } = await tokenRes.json();
  expect(typeof token).toBe("string");
  expect(token.split(".")).toHaveLength(3);

  const notesRes = await request.get(`${API_URL}/api/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(notesRes.status()).toBe(200);
  expect(Array.isArray(await notesRes.json())).toBe(true);
});

/** V20-4: CORS preflight for web frontend origin (localhost:3001) */
test("V20-4: CORS preflight for web origin (3001)", async ({ request }) => {
  const response = await request.fetch(`${API_URL}/api/notes`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:3001",
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "Authorization",
    },
  });
  expect([200, 204]).toContain(response.status());
  const h = response.headers();
  expect(h["access-control-allow-origin"]).toBe("http://localhost:3001");
  expect(h["access-control-allow-credentials"]).toBe("true");
  expect(
    (h["access-control-allow-headers"] || "").toLowerCase()
  ).toContain("authorization");
});

/** V20-5: CORS preflight for React Native origin (localhost:8081) */
test("V20-5: CORS preflight for RN origin (8081)", async ({ request }) => {
  const response = await request.fetch(`${API_URL}/api/notes`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:8081",
      "Access-Control-Request-Method": "GET",
    },
  });
  expect([200, 204]).toContain(response.status());
  const h = response.headers();
  expect(h["access-control-allow-origin"]).toBe("http://localhost:8081");
  expect(h["access-control-allow-credentials"]).toBe("true");
});

/** V20-6: CORS preflight for Expo origin (localhost:19006) */
test("V20-6: CORS preflight for Expo origin (19006)", async ({ request }) => {
  const response = await request.fetch(`${API_URL}/api/notes`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:19006",
      "Access-Control-Request-Method": "GET",
    },
  });
  expect([200, 204]).toContain(response.status());
  const h = response.headers();
  expect(h["access-control-allow-origin"]).toBe("http://localhost:19006");
  expect(h["access-control-allow-credentials"]).toBe("true");
});

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
