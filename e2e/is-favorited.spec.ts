import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL = process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

function makeToken(userId = "e2e-fav-user", email = "fav@test.com"): string {
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

test.describe("isFavorited field", () => {
  test.beforeEach(async ({ request }) => {
    await cleanupNotes(request);
  });

  test.afterAll(async ({ request }) => {
    await cleanupNotes(request);
  });

  test("SC-001: creating a note returns isFavorited as false", async ({ request }) => {
    const res = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Тестовая заметка", content: "Содержимое заметки" },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty("isFavorited", false);
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("title", "Тестовая заметка");
    expect(body).toHaveProperty("content", "Содержимое заметки");
    expect(body).toHaveProperty("categories");
    expect(body).toHaveProperty("createdAt");
    expect(body).toHaveProperty("updatedAt");
  });

  test("SC-002: listing notes includes isFavorited field", async ({ request }) => {
    // Create a note first
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Заметка для списка", content: "Текст" },
    });
    expect(createRes.status()).toBe(201);

    // List notes
    const listRes = await request.get(`${API_URL}/api/notes`, { headers: authHeaders() });
    expect(listRes.status()).toBe(200);

    const notes = await listRes.json();
    expect(Array.isArray(notes)).toBe(true);
    expect(notes.length).toBeGreaterThanOrEqual(1);

    for (const note of notes) {
      expect(note).toHaveProperty("isFavorited", false);
    }
  });

  test("SC-003: getting a note by ID includes isFavorited field", async ({ request }) => {
    // Create a note
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Заметка по ID", content: "Текст" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();

    // Get by ID
    const getRes = await request.get(`${API_URL}/api/notes/${created.id}`, {
      headers: authHeaders(),
    });
    expect(getRes.status()).toBe(200);

    const note = await getRes.json();
    expect(note).toHaveProperty("isFavorited", false);
  });

  test("SC-004: updating a note preserves isFavorited value", async ({ request }) => {
    // Create a note
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "До обновления", content: "Старый текст" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.isFavorited).toBe(false);

    // Update the note
    const updateRes = await request.put(`${API_URL}/api/notes/${created.id}`, {
      headers: authHeaders(),
      data: { title: "После обновления", content: "Новый текст" },
    });
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated).toHaveProperty("isFavorited", false);

    // Verify via GET
    const getRes = await request.get(`${API_URL}/api/notes/${created.id}`, {
      headers: authHeaders(),
    });
    expect(getRes.status()).toBe(200);
    const fetched = await getRes.json();
    expect(fetched).toHaveProperty("isFavorited", false);
  });
});
