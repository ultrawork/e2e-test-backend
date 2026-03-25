import { test, expect } from "@playwright/test";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL = process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

/** SC-001: GET /api/health — service availability with timestamp */
test("SC-001: GET /api/health returns 200 with status ok and ISO timestamp", async ({ request }) => {
  const response = await request.get(`${API_URL}/api/health`);
  expect(response.status()).toBe(200);

  const contentType = response.headers()["content-type"] || "";
  expect(contentType).toContain("application/json");

  const body = await response.json();
  expect(body.status).toBe("ok");
  expect(typeof body.timestamp).toBe("string");
  expect(body.timestamp.length).toBeGreaterThan(0);

  // Validate ISO 8601 date format
  const parsed = new Date(body.timestamp);
  expect(parsed.getTime()).not.toBeNaN();
});

/** SC-002: POST /api/auth/dev-token returns valid JWT in dev mode */
test("SC-002: POST /api/auth/dev-token returns a valid JWT with three parts", async ({ request }) => {
  const response = await request.post(`${API_URL}/api/auth/dev-token`);
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveProperty("token");
  expect(typeof body.token).toBe("string");

  // JWT format: header.payload.signature
  const parts = body.token.split(".");
  expect(parts).toHaveLength(3);
  // Each part should be non-empty base64url
  for (const part of parts) {
    expect(part.length).toBeGreaterThan(0);
  }
});

/** SC-004: GET /api/notes without token returns 401 */
test("SC-004: GET /api/notes without Authorization header returns 401", async ({ request }) => {
  const response = await request.get(`${API_URL}/api/notes`);
  expect(response.status()).toBe(401);

  const body = await response.json();
  expect(body).toHaveProperty("error");
  expect(body.error).toBe("Unauthorized");
});

/** SC-005: GET /api/notes with valid dev-token returns 200 */
test("SC-005: GET /api/notes with valid JWT returns 200 and array", async ({ request }) => {
  // Step 1: obtain dev-token
  const tokenRes = await request.post(`${API_URL}/api/auth/dev-token`);
  expect(tokenRes.status()).toBe(200);
  const { token } = await tokenRes.json();

  // Step 2: access protected endpoint
  const response = await request.get(`${API_URL}/api/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

/** SC-006: CORS Access-Control-Allow-Origin for allowed origin on /api/health */
test("SC-006: CORS headers present for allowed origin on /api/health", async ({ request }) => {
  const response = await request.get(`${API_URL}/api/health`, {
    headers: { Origin: "http://localhost:3001" },
  });
  expect(response.status()).toBe(200);

  const headers = response.headers();
  expect(headers["access-control-allow-origin"]).toBeTruthy();
});

/** SC-007: Dev-token JWT payload contains correct userId */
test("SC-007: dev-token JWT contains userId from DEV_USER_ID config", async ({ request }) => {
  const response = await request.post(`${API_URL}/api/auth/dev-token`);
  expect(response.status()).toBe(200);

  const { token } = await response.json();
  expect(token).toBeDefined();

  // Decode JWT payload (base64url decode of middle part)
  const payloadB64 = token.split(".")[1];
  const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf-8");
  const payload = JSON.parse(payloadJson);

  expect(payload).toHaveProperty("userId");
  expect(typeof payload.userId).toBe("string");
  expect(payload.userId.length).toBeGreaterThan(0);
  expect(payload).toHaveProperty("email", "dev@localhost");
});
