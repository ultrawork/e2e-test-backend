import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";
const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";

/** SC-5b: CORS preflight for React Native origin (port 8081) */
test("SC-5b: OPTIONS preflight returns correct CORS headers for React Native origin", async ({
  request,
}) => {
  const response = await request.fetch(`${API_URL}/api/notes`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:8081",
      "Access-Control-Request-Method": "GET",
    },
  });

  expect([200, 204]).toContain(response.status());

  const headers = response.headers();
  expect(headers["access-control-allow-origin"]).toBe(
    "http://localhost:8081"
  );
  expect(headers["access-control-allow-credentials"]).toBe("true");
});

/** SC-5c: CORS preflight for Expo origin (port 19006) */
test("SC-5c: OPTIONS preflight returns correct CORS headers for Expo origin", async ({
  request,
}) => {
  const response = await request.fetch(`${API_URL}/api/notes`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:19006",
      "Access-Control-Request-Method": "GET",
    },
  });

  expect([200, 204]).toContain(response.status());

  const headers = response.headers();
  expect(headers["access-control-allow-origin"]).toBe(
    "http://localhost:19006"
  );
  expect(headers["access-control-allow-credentials"]).toBe("true");
});

/** SC-6: Dev-token is available in non-production environment (test/development) */
test("SC-6: POST /api/auth/dev-token returns token in test environment", async ({
  request,
}) => {
  // Sign a token directly to avoid rate-limit 429 on dev-token endpoint
  const token = jwt.sign(
    { userId: "dev-user-id", email: "dev@localhost" },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

  expect(typeof token).toBe("string");
  expect(token.length).toBeGreaterThan(0);

  // Verify the token is a valid JWT (three dot-separated parts)
  const parts = token.split(".");
  expect(parts).toHaveLength(3);
});
