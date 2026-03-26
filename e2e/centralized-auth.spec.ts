import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

function createToken(payload: Record<string, string> = {}): string {
  return jwt.sign(
    { userId: "e2e-user-id", email: "e2e@test.com", ...payload },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

test.describe("Centralized Auth Middleware — CORS/JWT/ENV", () => {
  // SC-1: Health endpoint accessible without auth
  test("SC-1: GET /api/health returns 200 without auth", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/api/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });

  // SC-2: Dev-token endpoint is public
  test("SC-2: POST /api/auth/dev-token returns 200 with token", async ({
    request,
  }) => {
    const res = await request.post(`${API_URL}/api/auth/dev-token`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("token");
    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(0);
  });

  // SC-3: Protected route /api/notes returns 401 without token
  test("SC-3: GET /api/notes without token returns 401", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/api/notes`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  // SC-4: Access /api/notes with valid Bearer token
  test("SC-4: GET /api/notes with valid token returns 200", async ({
    request,
  }) => {
    const tokenRes = await request.post(`${API_URL}/api/auth/dev-token`);
    const { token } = await tokenRes.json();
    const res = await request.get(`${API_URL}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  // SC-5: Create note with valid Bearer token
  test("SC-5: POST /api/notes with valid token returns 201", async ({
    request,
  }) => {
    const tokenRes = await request.post(`${API_URL}/api/auth/dev-token`);
    const { token } = await tokenRes.json();
    const res = await request.post(`${API_URL}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: "E2E Auth Test Note", content: "Content for centralized auth verification" },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body.title).toBe("E2E Auth Test Note");
  });

  // SC-6: Protected route /api/categories returns 401 without token
  test("SC-6: GET /api/categories without token returns 401", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/api/categories`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  // SC-7: CORS preflight for allowed origins
  test("SC-7: CORS preflight returns correct headers for allowed origins", async ({
    request,
  }) => {
    const origins = [
      "http://localhost:3000",
      "http://localhost:8081",
      "http://localhost:19006",
    ];

    for (const origin of origins) {
      const res = await request.fetch(`${API_URL}/api/notes`, {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "GET",
        },
      });
      const status = res.status();
      expect(status === 200 || status === 204).toBe(true);
      const allowOrigin = res.headers()["access-control-allow-origin"];
      expect(allowOrigin === origin || allowOrigin === "*").toBe(true);
    }
  });

  // SC-8: Invalid token returns 401
  test("SC-8: GET /api/notes with invalid token returns 401", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/api/notes`, {
      headers: { Authorization: "Bearer invalid.token.value" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });
});
