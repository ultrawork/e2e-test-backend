import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

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

test.describe("Notes Favorites API", () => {
  test.beforeEach(async ({ request }) => {
    await cleanupNotes(request);
  });

  test("SC-010-API: Toggle favorite marks note as favorited and back", async ({
    request,
  }) => {
    // Create a note — isFavorited should default to false
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Fav test", content: "body" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.isFavorited).toBe(false);
    const noteId = created.id;

    // Toggle → true
    const toggle1 = await request.patch(
      `${API_URL}/api/notes/${noteId}/favorite`,
      { headers: authHeaders() }
    );
    expect(toggle1.status()).toBe(200);
    const toggled1 = await toggle1.json();
    expect(toggled1.isFavorited).toBe(true);
    expect(toggled1.id).toBe(noteId);

    // Toggle → false
    const toggle2 = await request.patch(
      `${API_URL}/api/notes/${noteId}/favorite`,
      { headers: authHeaders() }
    );
    expect(toggle2.status()).toBe(200);
    const toggled2 = await toggle2.json();
    expect(toggled2.isFavorited).toBe(false);
  });

  test("SC-011-API: Toggle favorite on non-existent note returns 404", async ({
    request,
  }) => {
    const res = await request.patch(
      `${API_URL}/api/notes/00000000-0000-0000-0000-000000000000/favorite`,
      { headers: authHeaders() }
    );
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Note not found");
  });

  test("SC-012-API: isFavorited field is present in list and get responses", async ({
    request,
  }) => {
    // Create two notes, toggle one
    const r1 = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Note A", content: "a" },
    });
    const noteA = (await r1.json()).id;

    await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Note B", content: "b" },
    });

    // Mark A as favorite
    await request.patch(`${API_URL}/api/notes/${noteA}/favorite`, {
      headers: authHeaders(),
    });

    // GET single — should have isFavorited = true
    const getRes = await request.get(`${API_URL}/api/notes/${noteA}`, {
      headers: authHeaders(),
    });
    expect(getRes.status()).toBe(200);
    const single = await getRes.json();
    expect(single.isFavorited).toBe(true);

    // GET list — every note should have isFavorited field
    const listRes = await request.get(`${API_URL}/api/notes`, {
      headers: authHeaders(),
    });
    expect(listRes.status()).toBe(200);
    const notes = await listRes.json();
    expect(notes).toHaveLength(2);
    for (const n of notes) {
      expect(typeof n.isFavorited).toBe("boolean");
    }
    const favNote = notes.find((n: any) => n.title === "Note A");
    const plainNote = notes.find((n: any) => n.title === "Note B");
    expect(favNote.isFavorited).toBe(true);
    expect(plainNote.isFavorited).toBe(false);
  });

  test("SC-013-API: isFavorited persists through note update", async ({
    request,
  }) => {
    // Create and toggle favorite
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Persist test", content: "original" },
    });
    const noteId = (await createRes.json()).id;

    await request.patch(`${API_URL}/api/notes/${noteId}/favorite`, {
      headers: authHeaders(),
    });

    // Update title/content — isFavorited should remain true
    const updateRes = await request.put(`${API_URL}/api/notes/${noteId}`, {
      headers: authHeaders(),
      data: { title: "Updated title", content: "updated body" },
    });
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.title).toBe("Updated title");
    expect(updated.isFavorited).toBe(true);
  });
});
