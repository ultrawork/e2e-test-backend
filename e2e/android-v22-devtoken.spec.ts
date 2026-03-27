import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

function makeToken(
  userId = "android-e2e-user-v2",
  email = "android-v2@e2e.test"
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

test.describe("Android Notes API — Dev-Token Auth Flow v22", () => {
  test.beforeEach(async ({ request }) => {
    await cleanupNotes(request);
  });

  test("SC-001: dev-token endpoint returns a decodable JWT with userId and email", async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/api/auth/dev-token`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("token");
    const token = body.token;
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    // Verify the token is decodable (not encrypted/opaque)
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
    expect(decoded).toHaveProperty("userId");
    expect(decoded).toHaveProperty("email");
  });

  test("SC-002: request without Authorization header is rejected with 401 and error body", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/notes`, {
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty("error");
    expect(typeof body.error).toBe("string");
    expect(body.error.length).toBeGreaterThan(0);
  });

  test("SC-003: GET /api/notes with self-signed Bearer token returns 200 and JSON array", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/notes`, {
      headers: authHeaders(),
    });
    expect(response.status()).toBe(200);
    const notes = await response.json();
    expect(Array.isArray(notes)).toBe(true);
  });

  test("SC-004: POST /api/notes creates note with all expected fields", async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: {
        title: "Retrofit Integration Test",
        content: "Verifying POST creates note with correct fields",
      },
    });
    expect(response.status()).toBe(201);
    const note = await response.json();
    expect(note).toHaveProperty("id");
    expect(typeof note.id).toBe("string");
    expect(note.title).toBe("Retrofit Integration Test");
    expect(note.content).toBe(
      "Verifying POST creates note with correct fields"
    );
    expect(note).toHaveProperty("userId");
    expect(note).toHaveProperty("createdAt");
    expect(note).toHaveProperty("updatedAt");
  });

  test("SC-005: DELETE /api/notes/:id removes note and subsequent GET returns 404", async ({
    request,
  }) => {
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Delete Target", content: "Will be removed" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    const noteId = created.id;

    const deleteRes = await request.delete(`${API_URL}/api/notes/${noteId}`, {
      headers: authHeaders(),
    });
    expect(deleteRes.status()).toBe(204);

    const getRes = await request.get(`${API_URL}/api/notes/${noteId}`, {
      headers: authHeaders(),
    });
    expect(getRes.status()).toBe(404);
  });

  test("SC-006: POST /api/notes with missing title and content returns 400 validation error", async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
    expect(typeof body.error).toBe("string");
  });

  test("SC-007: DELETE /api/notes with non-existent UUID returns 404", async ({
    request,
  }) => {
    const response = await request.delete(
      `${API_URL}/api/notes/00000000-0000-0000-0000-000000000099`,
      { headers: authHeaders() }
    );
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });
});
