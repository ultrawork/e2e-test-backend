import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

function makeToken(
  userId = "e2e-user-1",
  email = "e2e@test.com"
): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "1h" });
}

function authHeaders() {
  return {
    Authorization: `Bearer ${makeToken()}`,
    "Content-Type": "application/json",
  };
}

test.describe("Backend API — Auth & Notes (SC-001..SC-007)", () => {
  // SC-001: Obtain dev-token
  test("SC-001: POST /api/auth/dev-token returns valid JWT", async ({
    request,
  }) => {
    const res = await request.post(`${API_URL}/api/auth/dev-token`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("token");
    expect(typeof body.token).toBe("string");

    // JWT has 3 dot-separated parts
    const parts = body.token.split(".");
    expect(parts).toHaveLength(3);
  });

  // SC-002: GET /api/notes without token → 401
  test("SC-002: GET /api/notes without token returns 401", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/api/notes`);
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  // SC-003: GET /api/notes with valid token → 200 + array
  test("SC-003: GET /api/notes with valid token returns note list", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/api/notes`, {
      headers: authHeaders(),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);

    if (body.length > 0) {
      const note = body[0];
      expect(note).toHaveProperty("id");
      expect(note).toHaveProperty("title");
      expect(note).toHaveProperty("content");
      expect(note).toHaveProperty("createdAt");
      expect(note).toHaveProperty("updatedAt");

      // ISO 8601 format check
      expect(new Date(note.createdAt).toISOString()).toBe(note.createdAt);
    }
  });

  // SC-004: POST /api/notes — create a note
  test("SC-004: POST /api/notes creates a new note", async ({ request }) => {
    const res = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Test Note E2E", content: "Test content for E2E scenario" },
    });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body.title).toBe("Test Note E2E");
    expect(body.content).toBe("Test content for E2E scenario");
    expect(body).toHaveProperty("createdAt");
    expect(body).toHaveProperty("updatedAt");

    // Cleanup
    await request.delete(`${API_URL}/api/notes/${body.id}`, {
      headers: authHeaders(),
    });
  });

  // SC-005: POST /api/notes without required fields → 400
  test("SC-005: POST /api/notes without content returns 400", async ({
    request,
  }) => {
    const res = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Only Title" },
    });
    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body).toEqual({ error: "title and content are required" });
  });

  // SC-006: DELETE /api/notes/:id — delete existing note
  test("SC-006: DELETE /api/notes/:id removes the note", async ({
    request,
  }) => {
    // Create a note first
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: {
        title: "Note to Delete",
        content: "This note will be deleted in E2E test",
      },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();

    // Delete
    const deleteRes = await request.delete(
      `${API_URL}/api/notes/${created.id}`,
      { headers: authHeaders() }
    );
    expect(deleteRes.status()).toBe(204);

    // Verify it's gone
    const listRes = await request.get(`${API_URL}/api/notes`, {
      headers: authHeaders(),
    });
    const notes = await listRes.json();
    const found = notes.find((n: any) => n.id === created.id);
    expect(found).toBeUndefined();
  });

  // SC-007: DELETE /api/notes/:id for non-existent note → 404
  test("SC-007: DELETE /api/notes/:id for non-existent note returns 404", async ({
    request,
  }) => {
    const res = await request.delete(
      `${API_URL}/api/notes/nonexistent-id-12345`,
      { headers: authHeaders() }
    );
    expect(res.status()).toBe(404);

    const body = await res.json();
    expect(body).toEqual({ error: "Note not found" });
  });
});
