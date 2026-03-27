import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const API_URL = process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";
const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";

/** SC-007: Create a note with valid JWT — ensureUser auto-upserts the user */
test("SC-007: POST /api/notes with valid token creates note (auto-upsert user)", async ({ request }) => {
  // Sign a token directly to avoid rate-limit 429 on dev-token endpoint
  const token = jwt.sign(
    { userId: "dev-user-id", email: "dev@localhost" },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

  // Create a note — ensureUser middleware should auto-create the user in DB
  const response = await request.post(`${API_URL}/api/notes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      title: "Test note",
      content: "Test note content",
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body).toHaveProperty("id");
  expect(body).toHaveProperty("title", "Test note");
  expect(body).toHaveProperty("content", "Test note content");
});
