import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL = process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

function makeToken(userId = "e2e-user-1", email = "e2e@test.com"): string {
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

test.describe("Notes isFavorited field", () => {
  test.beforeEach(async ({ request }) => {
    await cleanupNotes(request);
  });

  test("SC-002: API returns isFavorited=false when creating a note", async ({ request }) => {
    // Create note
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Тестовая заметка", content: "Проверка isFavorited" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.isFavorited).toBe(false);

    // Get by ID confirms the same
    const getRes = await request.get(`${API_URL}/api/notes/${created.id}`, { headers: authHeaders() });
    expect(getRes.status()).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.isFavorited).toBe(false);
  });

  test("SC-003: List notes contains isFavorited for each note", async ({ request }) => {
    // Create two notes
    const r1 = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Заметка 1", content: "Контент 1" },
    });
    expect(r1.status()).toBe(201);

    const r2 = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Заметка 2", content: "Контент 2" },
    });
    expect(r2.status()).toBe(201);

    // List all
    const listRes = await request.get(`${API_URL}/api/notes`, { headers: authHeaders() });
    expect(listRes.status()).toBe(200);
    const notes = await listRes.json();
    expect(notes.length).toBeGreaterThanOrEqual(2);

    for (const note of notes) {
      expect(note).toHaveProperty("isFavorited");
      expect(note.isFavorited).toBe(false);
    }
  });

  test("SC-004: Updating a note preserves isFavorited (backward compatibility)", async ({ request }) => {
    // Create note
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Оригинал", content: "Текст" },
    });
    expect(createRes.status()).toBe(201);
    const noteId = (await createRes.json()).id;

    // Update without sending isFavorited
    const updateRes = await request.put(`${API_URL}/api/notes/${noteId}`, {
      headers: authHeaders(),
      data: { title: "Обновлённый", content: "Новый текст" },
    });
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.title).toBe("Обновлённый");
    expect(updated.content).toBe("Новый текст");
    expect(updated.isFavorited).toBe(false);

    // GET confirms
    const getRes = await request.get(`${API_URL}/api/notes/${noteId}`, { headers: authHeaders() });
    expect(getRes.status()).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.isFavorited).toBe(false);
  });
});
