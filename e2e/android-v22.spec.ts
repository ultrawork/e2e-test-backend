import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

function makeToken(
  userId = "android-e2e-user",
  email = "android@e2e.test"
): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "1h" });
}

function authHeaders() {
  return {
    Authorization: `Bearer ${makeToken()}`,
    "Content-Type": "application/json",
  };
}

async function cleanupNotes(request: any) {
  const res = await request.get(`${API_URL}/api/notes`, {
    headers: authHeaders(),
  });
  if (res.ok()) {
    const notes = await res.json();
    for (const note of notes) {
      await request.delete(`${API_URL}/api/notes/${note.id}`, {
        headers: authHeaders(),
      });
    }
  }
}

test.describe("Android Notes API Verification v22", () => {
  test.beforeEach(async ({ request }) => {
    await cleanupNotes(request);
  });

  test("SC-001: POST /api/auth/dev-token returns 200 and a valid JWT", async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/api/auth/dev-token`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("token");
    const token = body.token;
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);
  });

  test("SC-002: GET /api/notes without Authorization returns 401", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/notes`);
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("SC-003: GET /api/notes with Bearer token returns 200 and array", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/notes`, {
      headers: authHeaders(),
    });
    expect(response.status()).toBe(200);
    const notes = await response.json();
    expect(Array.isArray(notes)).toBe(true);
  });

  test("SC-004: POST /api/notes creates a note and returns 201", async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Android E2E Note", content: "Created from E2E test" },
    });
    expect(response.status()).toBe(201);
    const note = await response.json();
    expect(note).toHaveProperty("id");
    expect(note.title).toBe("Android E2E Note");
    expect(note.content).toBe("Created from E2E test");
    expect(note).toHaveProperty("userId");
    expect(note).toHaveProperty("createdAt");
  });

  test("SC-005: DELETE /api/notes/:id returns 204 and note is removed", async ({
    request,
  }) => {
    // Create a note first
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "To Delete", content: "Will be deleted" },
    });
    expect(createRes.status()).toBe(201);
    const noteId = (await createRes.json()).id;

    // Delete it
    const deleteRes = await request.delete(`${API_URL}/api/notes/${noteId}`, {
      headers: authHeaders(),
    });
    expect(deleteRes.status()).toBe(204);

    // Verify it's gone
    const getRes = await request.get(`${API_URL}/api/notes/${noteId}`, {
      headers: authHeaders(),
    });
    expect(getRes.status()).toBe(404);
  });

  test("SC-006: POST /api/notes with empty body returns 400", async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("SC-007: DELETE /api/notes/nonexistent-id returns 404", async ({
    request,
  }) => {
    const response = await request.delete(
      `${API_URL}/api/notes/00000000-0000-0000-0000-000000000000`,
      { headers: authHeaders() }
    );
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });
});
