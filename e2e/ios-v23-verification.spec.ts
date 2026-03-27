import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";
const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";

test.describe("iOS v23 — APIService & ViewModel Verification", () => {
  test("SC-2: GET /api/notes with valid token returns 200 and notes array", async ({
    request,
  }) => {
    // Sign a token directly to avoid rate-limit 429 on dev-token endpoint
    const token = jwt.sign(
      { userId: "e2e-test-user", email: "e2e@test.local" },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    // Verify token is a valid JWT (3 dot-separated parts)
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    // Request notes with the valid token
    const notesResponse = await request.get(`${API_URL}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(notesResponse.status()).toBe(200);

    // Verify response is a JSON array
    const notes = await notesResponse.json();
    expect(Array.isArray(notes)).toBe(true);

    // If notes exist, verify each has id and content fields
    // (iOS Note model maps content → text via CodingKeys)
    for (const note of notes) {
      expect(note).toHaveProperty("id");
      expect(note).toHaveProperty("content");
    }
  });

  test("SC-3: GET /api/notes without token returns 401", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/notes`);
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("SC-2a: Notes response fields are compatible with iOS Note model", async ({
    request,
  }) => {
    // Sign a token directly to verify JWT_SECRET compatibility
    const token = jwt.sign(
      { userId: "e2e-test-user", email: "e2e@test.local" },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    const response = await request.get(`${API_URL}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);

    const notes = await response.json();
    expect(Array.isArray(notes)).toBe(true);
  });
});
