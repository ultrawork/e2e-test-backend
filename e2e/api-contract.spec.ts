import { test, expect } from "@playwright/test";

const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

// SC-001: Health endpoint returns 200 OK with correct JSON
test("SC-001: GET /api/health returns 200 with status ok and ISO timestamp", async ({
  request,
}) => {
  const res = await request.get(`${API_URL}/api/health`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/json");
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body).toHaveProperty("timestamp");
  // Verify ISO 8601 format
  expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
});

// SC-002: Old /health path returns 404
test("SC-002: GET /health (without /api prefix) returns 404", async ({
  request,
}) => {
  const res = await request.get(`${API_URL}/health`);
  expect(res.status()).toBe(404);
});

// SC-003: CORS allows requests from localhost:3000
test("SC-003: CORS headers present for Origin localhost:3000", async ({
  request,
}) => {
  const res = await request.get(`${API_URL}/api/health`, {
    headers: { Origin: "http://localhost:3000" },
  });
  expect(res.status()).toBe(200);
  expect(res.headers()["access-control-allow-origin"]).toBe(
    "http://localhost:3000"
  );
  expect(res.headers()["access-control-allow-credentials"]).toBe("true");
});

// SC-004: CORS blocks disallowed origins
test("SC-004: CORS does not set allow-origin for disallowed origin", async ({
  request,
}) => {
  const res = await request.get(`${API_URL}/api/health`, {
    headers: { Origin: "http://evil.com" },
  });
  // Server still responds (CORS is browser-enforced) but no allow-origin header
  const allowOrigin = res.headers()["access-control-allow-origin"];
  expect(allowOrigin).toBeUndefined();
});

// SC-005: Preflight OPTIONS request for allowed origin
test("SC-005: OPTIONS preflight returns 204 with correct CORS headers", async ({
  request,
}) => {
  const res = await request.fetch(`${API_URL}/api/notes`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:3000",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "Content-Type, Authorization",
    },
  });
  expect(res.status()).toBe(204);
  expect(res.headers()["access-control-allow-origin"]).toBe(
    "http://localhost:3000"
  );
  const allowMethods = res.headers()["access-control-allow-methods"] || "";
  expect(allowMethods).toContain("GET");
  expect(allowMethods).toContain("POST");
  expect(allowMethods).toContain("PUT");
  expect(allowMethods).toContain("DELETE");
  const allowHeaders = res.headers()["access-control-allow-headers"] || "";
  expect(allowHeaders.toLowerCase()).toContain("content-type");
  expect(allowHeaders.toLowerCase()).toContain("authorization");
  expect(res.headers()["access-control-allow-credentials"]).toBe("true");
});

// SC-006: Valid DEV_API_TOKEN grants access to protected endpoints
test("SC-006: Valid DEV_API_TOKEN returns notes with correct structure", async ({
  request,
}) => {
  const res = await request.get(`${API_URL}/api/notes`, {
    headers: {
      Authorization: "Bearer dev-secret-token-change-me",
    },
  });
  expect(res.status()).toBe(200);
  const notes = await res.json();
  expect(Array.isArray(notes)).toBe(true);
  // Verify note structure if seed data exists
  if (notes.length > 0) {
    const note = notes[0];
    expect(note).toHaveProperty("id");
    expect(note).toHaveProperty("title");
    expect(note).toHaveProperty("content");
    expect(note).toHaveProperty("userId");
    expect(note).toHaveProperty("categories");
    expect(note).toHaveProperty("createdAt");
    expect(note).toHaveProperty("updatedAt");
  }
});

// SC-007: Invalid token falls back to default user
test("SC-007: Invalid token still returns 200 (fallback to default user)", async ({
  request,
}) => {
  const res = await request.get(`${API_URL}/api/notes`, {
    headers: {
      Authorization: "Bearer invalid-token-12345",
    },
  });
  expect(res.status()).toBe(200);
  const notes = await res.json();
  expect(Array.isArray(notes)).toBe(true);
});

// SC-008: No Authorization header falls back to default user
test("SC-008: No auth header returns categories (fallback to default user)", async ({
  request,
}) => {
  const res = await request.get(`${API_URL}/api/categories`);
  expect(res.status()).toBe(200);
  const categories = await res.json();
  expect(Array.isArray(categories)).toBe(true);
});
