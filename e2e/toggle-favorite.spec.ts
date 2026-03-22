import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL = process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

function makeToken(userId = "e2e-user-fav", email = "e2e-fav@test.com"): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "1h" });
}

function authHeaders() {
  return {
    Authorization: `Bearer ${makeToken()}`,
    "Content-Type": "application/json",
  };
}

async function cleanupNotes(request: any) {
  const res = await request.get(`${API_URL}/api/notes`, { headers: authHeaders() });
  if (res.ok()) {
    const notes = await res.json();
    for (const note of notes) {
      await request.delete(`${API_URL}/api/notes/${note.id}`, { headers: authHeaders() });
    }
  }
}

test.describe("Toggle Favorite API", () => {
  test.beforeEach(async ({ request }) => {
    await cleanupNotes(request);
  });

  test("SC-001: Toggle favorite positive path (false→true→false)", async ({ request }) => {
    // Create a note
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Тест избранного", content: "Содержимое" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.isFavorited).toBe(false);
    const noteId = created.id;

    // Toggle: false → true
    const toggle1 = await request.patch(`${API_URL}/api/notes/${noteId}/favorite`, {
      headers: authHeaders(),
    });
    expect(toggle1.status()).toBe(200);
    const toggled1 = await toggle1.json();
    expect(toggled1.isFavorited).toBe(true);
    expect(toggled1.id).toBe(noteId);
    expect(toggled1.title).toBe("Тест избранного");
    expect(toggled1.content).toBe("Содержимое");
    expect(toggled1.categories).toBeDefined();

    // Toggle: true → false
    const toggle2 = await request.patch(`${API_URL}/api/notes/${noteId}/favorite`, {
      headers: authHeaders(),
    });
    expect(toggle2.status()).toBe(200);
    const toggled2 = await toggle2.json();
    expect(toggled2.isFavorited).toBe(false);
  });

  test("SC-002: Toggle favorite for non-existent note returns 404", async ({ request }) => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await request.patch(`${API_URL}/api/notes/${fakeId}/favorite`, {
      headers: authHeaders(),
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Note not found");
  });

  test("SC-003: New note has isFavorited=false by default", async ({ request }) => {
    // Create note
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Тест дефолта", content: "Содержимое" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.isFavorited).toBe(false);
    const noteId = created.id;

    // Verify via GET
    const getRes = await request.get(`${API_URL}/api/notes/${noteId}`, {
      headers: authHeaders(),
    });
    expect(getRes.status()).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.isFavorited).toBe(false);
  });

  test("SC-004: isFavorited preserved when updating note", async ({ request }) => {
    // Create note
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Тест", content: "Содержимое" },
    });
    expect(createRes.status()).toBe(201);
    const noteId = (await createRes.json()).id;

    // Toggle to true
    const toggleRes = await request.patch(`${API_URL}/api/notes/${noteId}/favorite`, {
      headers: authHeaders(),
    });
    expect(toggleRes.status()).toBe(200);
    expect((await toggleRes.json()).isFavorited).toBe(true);

    // Update title/content
    const updateRes = await request.put(`${API_URL}/api/notes/${noteId}`, {
      headers: authHeaders(),
      data: { title: "Обновлённый", content: "Новое содержимое" },
    });
    expect(updateRes.status()).toBe(200);

    // Verify isFavorited is still true
    const getRes = await request.get(`${API_URL}/api/notes/${noteId}`, {
      headers: authHeaders(),
    });
    expect(getRes.status()).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.title).toBe("Обновлённый");
    expect(fetched.content).toBe("Новое содержимое");
    expect(fetched.isFavorited).toBe(true);
  });
});
