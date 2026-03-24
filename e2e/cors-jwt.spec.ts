import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";
const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";

// SC-001: Get dev-token in dev mode
test("SC-001: POST /api/auth/dev-token returns a valid JWT", async ({
  request,
}) => {
  const response = await request.post(`${API_URL}/api/auth/dev-token`);
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveProperty("token");
  expect(typeof body.token).toBe("string");
  // JWT format: xxx.xxx.xxx
  expect(body.token.split(".")).toHaveLength(3);
});

// SC-002: Access protected endpoint with valid token
test("SC-002: GET /api/notes with valid token returns 200", async ({
  request,
}) => {
  // Step 1: obtain dev token
  const tokenRes = await request.post(`${API_URL}/api/auth/dev-token`);
  expect(tokenRes.status()).toBe(200);
  const { token } = await tokenRes.json();

  // Step 2: access notes with token
  const notesRes = await request.get(`${API_URL}/api/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(notesRes.status()).toBe(200);
  const notes = await notesRes.json();
  expect(Array.isArray(notes)).toBe(true);
});

// SC-003: Reject access without token
test("SC-003: GET /api/notes without token returns 401", async ({
  request,
}) => {
  const response = await request.get(`${API_URL}/api/notes`);
  expect(response.status()).toBe(401);

  const body = await response.json();
  expect(body).toEqual({ error: "Unauthorized" });
});

// SC-004: Reject access with invalid token
test("SC-004: GET /api/notes with invalid token returns 401", async ({
  request,
}) => {
  const response = await request.get(`${API_URL}/api/notes`, {
    headers: { Authorization: "Bearer invalid.token.value" },
  });
  expect(response.status()).toBe(401);

  const body = await response.json();
  expect(body).toEqual({ error: "Unauthorized" });
});

// SC-005: All private routes are protected
test("SC-005: GET /api/categories and POST /api/notes without token return 401", async ({
  request,
}) => {
  const categoriesRes = await request.get(`${API_URL}/api/categories`);
  expect(categoriesRes.status()).toBe(401);
  const catBody = await categoriesRes.json();
  expect(catBody).toEqual({ error: "Unauthorized" });

  const notesRes = await request.post(`${API_URL}/api/notes`, {
    data: { title: "test", content: "test" },
  });
  expect(notesRes.status()).toBe(401);
  const notesBody = await notesRes.json();
  expect(notesBody).toEqual({ error: "Unauthorized" });
});

// SC-006: CORS headers for allowed origin
test("SC-006: CORS headers present for allowed origin", async ({
  request,
}) => {
  const response = await request.get(`${API_URL}/health`, {
    headers: { Origin: "http://localhost:3001" },
  });
  expect(response.status()).toBe(200);

  const acao = response.headers()["access-control-allow-origin"];
  expect(acao).toBe("http://localhost:3001");

  const acac = response.headers()["access-control-allow-credentials"];
  expect(acac).toBe("true");
});

// SC-007: CORS preflight for allowed origin
test("SC-007: OPTIONS preflight returns correct CORS headers", async ({
  request,
}) => {
  const response = await request.fetch(`${API_URL}/api/notes`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:3001",
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "Authorization",
    },
  });
  expect(response.status()).toBe(204);

  const acao = response.headers()["access-control-allow-origin"];
  expect(acao).toBe("http://localhost:3001");

  const acac = response.headers()["access-control-allow-credentials"];
  expect(acac).toBe("true");

  const acah = response.headers()["access-control-allow-headers"];
  expect(acah).toBeDefined();
});

// SC-008: CORS rejects disallowed origin
test("SC-008: CORS does not allow disallowed origin", async ({ request }) => {
  const response = await request.get(`${API_URL}/health`, {
    headers: { Origin: "http://evil-site.com" },
  });

  const acao = response.headers()["access-control-allow-origin"];
  // Should either be absent or not equal to the evil origin
  if (acao) {
    expect(acao).not.toBe("http://evil-site.com");
  }
});
