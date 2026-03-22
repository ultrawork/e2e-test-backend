import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";
import { Client } from "pg";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL = process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";
const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/notes";

function makeToken(userId = "e2e-user-1", email = "e2e@test.com"): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "1h" });
}

function authHeaders() {
  return {
    Authorization: `Bearer ${makeToken()}`,
    "Content-Type": "application/json",
  };
}

// Helper to clean up categories and notes between tests
async function cleanupCategories(request: any) {
  const res = await request.get(`${API_URL}/api/categories`, { headers: authHeaders() });
  if (res.ok()) {
    const cats = await res.json();
    for (const cat of cats) {
      await request.delete(`${API_URL}/api/categories/${cat.id}`, { headers: authHeaders() });
    }
  }
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

test.describe("Categories & Notes CRUD API", () => {
  let dbClient: Client;

  test.beforeAll(async () => {
    dbClient = new Client({ connectionString: DATABASE_URL });
    await dbClient.connect();
    // Ensure the isFavorited migration is applied (idempotent)
    await dbClient.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'notes' AND column_name = 'is_favorited'
        ) THEN
          EXECUTE 'ALTER TABLE "notes" ADD COLUMN "is_favorited" BOOLEAN NOT NULL DEFAULT false';
        END IF;
      END $$;
    `);
  });

  test.afterAll(async () => {
    await dbClient.end();
  });

  test.beforeEach(async ({ request }) => {
    await cleanupNotes(request);
    await cleanupCategories(request);
  });

  test("SC-001: Full CRUD cycle for category", async ({ request }) => {
    // Create
    const createRes = await request.post(`${API_URL}/api/categories`, {
      headers: authHeaders(),
      data: { name: "Работа", color: "#FF5733" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.id).toBeTruthy();
    expect(created.name).toBe("Работа");
    expect(created.color).toBe("#FF5733");
    expect(created.createdAt).toBeTruthy();
    const catId = created.id;

    // List
    const listRes = await request.get(`${API_URL}/api/categories`, { headers: authHeaders() });
    expect(listRes.status()).toBe(200);
    const list = await listRes.json();
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.some((c: any) => c.name === "Работа")).toBe(true);

    // Get by ID
    const getRes = await request.get(`${API_URL}/api/categories/${catId}`, { headers: authHeaders() });
    expect(getRes.status()).toBe(200);
    const got = await getRes.json();
    expect(got.name).toBe("Работа");
    expect(got.color).toBe("#FF5733");

    // Update
    const updateRes = await request.put(`${API_URL}/api/categories/${catId}`, {
      headers: authHeaders(),
      data: { name: "Личное", color: "#00FF00" },
    });
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.name).toBe("Личное");
    expect(updated.color).toBe("#00FF00");

    // Delete
    const deleteRes = await request.delete(`${API_URL}/api/categories/${catId}`, { headers: authHeaders() });
    expect(deleteRes.status()).toBe(204);

    // Verify deleted
    const getAfterDelete = await request.get(`${API_URL}/api/categories/${catId}`, { headers: authHeaders() });
    expect(getAfterDelete.status()).toBe(404);
    const errBody = await getAfterDelete.json();
    expect(errBody.error).toBeTruthy();
  });

  test("SC-002: Validation when creating category", async ({ request }) => {
    // Empty name
    const r1 = await request.post(`${API_URL}/api/categories`, {
      headers: authHeaders(),
      data: { name: "", color: "#FF5733" },
    });
    expect(r1.status()).toBe(400);
    expect((await r1.json()).error).toBeTruthy();

    // Invalid hex - word
    const r2 = await request.post(`${API_URL}/api/categories`, {
      headers: authHeaders(),
      data: { name: "A", color: "red" },
    });
    expect(r2.status()).toBe(400);
    expect((await r2.json()).error).toBeTruthy();

    // Invalid hex chars
    const r3 = await request.post(`${API_URL}/api/categories`, {
      headers: authHeaders(),
      data: { name: "A", color: "#GGG000" },
    });
    expect(r3.status()).toBe(400);
    expect((await r3.json()).error).toBeTruthy();

    // Name > 30 chars
    const r4 = await request.post(`${API_URL}/api/categories`, {
      headers: authHeaders(),
      data: { name: "A".repeat(31), color: "#FF5733" },
    });
    expect(r4.status()).toBe(400);
    expect((await r4.json()).error).toBeTruthy();
  });

  test("SC-003: Category name uniqueness", async ({ request }) => {
    // Create first
    const r1 = await request.post(`${API_URL}/api/categories`, {
      headers: authHeaders(),
      data: { name: "Работа", color: "#FF0000" },
    });
    expect(r1.status()).toBe(201);

    // Duplicate name
    const r2 = await request.post(`${API_URL}/api/categories`, {
      headers: authHeaders(),
      data: { name: "Работа", color: "#00FF00" },
    });
    expect(r2.status()).toBe(400);
    expect((await r2.json()).error).toBeTruthy();

    // Create second with different name
    const r3 = await request.post(`${API_URL}/api/categories`, {
      headers: authHeaders(),
      data: { name: "Личное", color: "#0000FF" },
    });
    expect(r3.status()).toBe(201);
    const secondId = (await r3.json()).id;

    // Try renaming second to first's name
    const r4 = await request.put(`${API_URL}/api/categories/${secondId}`, {
      headers: authHeaders(),
      data: { name: "Работа", color: "#0000FF" },
    });
    expect(r4.status()).toBe(400);
    expect((await r4.json()).error).toBeTruthy();
  });

  test("SC-004: 404 for non-existent category", async ({ request }) => {
    const fakeId = "00000000-0000-0000-0000-000000000000";

    const getRes = await request.get(`${API_URL}/api/categories/${fakeId}`, { headers: authHeaders() });
    expect(getRes.status()).toBe(404);
    expect((await getRes.json()).error).toBeTruthy();

    const putRes = await request.put(`${API_URL}/api/categories/${fakeId}`, {
      headers: authHeaders(),
      data: { name: "Test", color: "#FF0000" },
    });
    expect(putRes.status()).toBe(404);

    const delRes = await request.delete(`${API_URL}/api/categories/${fakeId}`, { headers: authHeaders() });
    expect(delRes.status()).toBe(404);
  });

  test("SC-005: Full CRUD cycle for note with categories", async ({ request }) => {
    // Create a category first
    const catRes = await request.post(`${API_URL}/api/categories`, {
      headers: authHeaders(),
      data: { name: "Работа", color: "#FF5733" },
    });
    expect(catRes.status()).toBe(201);
    const categoryId = (await catRes.json()).id;

    // Create note with category
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Первая заметка", content: "Содержимое заметки", categoryIds: [categoryId] },
    });
    expect(createRes.status()).toBe(201);
    const note = await createRes.json();
    expect(note.id).toBeTruthy();
    expect(note.title).toBe("Первая заметка");
    expect(note.content).toBe("Содержимое заметки");
    expect(note.categories).toHaveLength(1);
    expect(note.categories[0].id).toBe(categoryId);
    const noteId = note.id;

    // Get by ID
    const getRes = await request.get(`${API_URL}/api/notes/${noteId}`, { headers: authHeaders() });
    expect(getRes.status()).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.title).toBe("Первая заметка");
    expect(fetched.categories).toHaveLength(1);

    // List
    const listRes = await request.get(`${API_URL}/api/notes`, { headers: authHeaders() });
    expect(listRes.status()).toBe(200);
    const notes = await listRes.json();
    expect(notes.length).toBeGreaterThanOrEqual(1);

    // Update
    const updateRes = await request.put(`${API_URL}/api/notes/${noteId}`, {
      headers: authHeaders(),
      data: { title: "Обновлённая заметка", content: "Новое содержимое" },
    });
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.title).toBe("Обновлённая заметка");
    expect(updated.content).toBe("Новое содержимое");

    // Delete
    const delRes = await request.delete(`${API_URL}/api/notes/${noteId}`, { headers: authHeaders() });
    expect(delRes.status()).toBe(204);

    // Verify deleted
    const getAfterDel = await request.get(`${API_URL}/api/notes/${noteId}`, { headers: authHeaders() });
    expect(getAfterDel.status()).toBe(404);
  });

  test("SC-006: Filter notes by category", async ({ request }) => {
    // Create two categories
    const catWorkRes = await request.post(`${API_URL}/api/categories`, {
      headers: authHeaders(),
      data: { name: "Работа", color: "#FF0000" },
    });
    const catWork = (await catWorkRes.json()).id;

    const catPersonalRes = await request.post(`${API_URL}/api/categories`, {
      headers: authHeaders(),
      data: { name: "Личное", color: "#00FF00" },
    });
    const catPersonal = (await catPersonalRes.json()).id;

    // Create notes
    await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Рабочая заметка", content: "work", categoryIds: [catWork] },
    });
    await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Личная заметка", content: "personal", categoryIds: [catPersonal] },
    });
    await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Без категории", content: "none" },
    });

    // Filter by work
    const workRes = await request.get(`${API_URL}/api/notes?category=${catWork}`, { headers: authHeaders() });
    expect(workRes.status()).toBe(200);
    const workNotes = await workRes.json();
    expect(workNotes).toHaveLength(1);
    expect(workNotes[0].title).toBe("Рабочая заметка");

    // Filter by personal
    const personalRes = await request.get(`${API_URL}/api/notes?category=${catPersonal}`, { headers: authHeaders() });
    expect(personalRes.status()).toBe(200);
    const personalNotes = await personalRes.json();
    expect(personalNotes).toHaveLength(1);
    expect(personalNotes[0].title).toBe("Личная заметка");

    // No filter - all notes
    const allRes = await request.get(`${API_URL}/api/notes`, { headers: authHeaders() });
    expect(allRes.status()).toBe(200);
    const allNotes = await allRes.json();
    expect(allNotes).toHaveLength(3);
  });

  test("SC-007: Validation when creating note", async ({ request }) => {
    // Missing title
    const r1 = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { content: "Без заголовка" },
    });
    expect(r1.status()).toBe(400);
    expect((await r1.json()).error).toBeTruthy();

    // Missing content
    const r2 = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Без контента" },
    });
    expect(r2.status()).toBe(400);
    expect((await r2.json()).error).toBeTruthy();

    // Non-existent category
    const r3 = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Тест", content: "Тест", categoryIds: ["00000000-0000-0000-0000-000000000000"] },
    });
    expect(r3.status()).toBe(400);
    expect((await r3.json()).error).toBeTruthy();
  });

  test("SC-008: Update note categories via set", async ({ request }) => {
    // Create 3 categories
    const catARes = await request.post(`${API_URL}/api/categories`, {
      headers: authHeaders(),
      data: { name: "A", color: "#AA0000" },
    });
    const catA = (await catARes.json()).id;

    const catBRes = await request.post(`${API_URL}/api/categories`, {
      headers: authHeaders(),
      data: { name: "B", color: "#00BB00" },
    });
    const catB = (await catBRes.json()).id;

    const catCRes = await request.post(`${API_URL}/api/categories`, {
      headers: authHeaders(),
      data: { name: "C", color: "#0000CC" },
    });
    const catC = (await catCRes.json()).id;

    // Create note with A and B
    const noteRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Тест", content: "Тест", categoryIds: [catA, catB] },
    });
    expect(noteRes.status()).toBe(201);
    const noteId = (await noteRes.json()).id;

    // Verify initial categories
    const getRes = await request.get(`${API_URL}/api/notes/${noteId}`, { headers: authHeaders() });
    const initial = await getRes.json();
    expect(initial.categories).toHaveLength(2);
    const initialIds = initial.categories.map((c: any) => c.id).sort();
    expect(initialIds).toEqual([catA, catB].sort());

    // Set to B and C
    const updateRes = await request.put(`${API_URL}/api/notes/${noteId}`, {
      headers: authHeaders(),
      data: { title: "Тест", content: "Тест", categoryIds: [catB, catC] },
    });
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.categories).toHaveLength(2);
    const updatedIds = updated.categories.map((c: any) => c.id).sort();
    expect(updatedIds).toEqual([catB, catC].sort());

    // Set to empty
    const clearRes = await request.put(`${API_URL}/api/notes/${noteId}`, {
      headers: authHeaders(),
      data: { title: "Тест", content: "Тест", categoryIds: [] },
    });
    expect(clearRes.status()).toBe(200);
    const cleared = await clearRes.json();
    expect(cleared.categories).toHaveLength(0);
  });

  test("SC-009: Toggle favorite on a note", async ({ request }) => {
    // Create a note — isFavorited defaults to false
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Favorite test", content: "body" },
    });
    expect(createRes.status()).toBe(201);
    const note = await createRes.json();
    expect(note.isFavorited).toBe(false);
    const noteId = note.id;

    // First toggle → true
    const toggle1 = await request.patch(`${API_URL}/api/notes/${noteId}/favorite`, {
      headers: authHeaders(),
    });
    expect(toggle1.status()).toBe(200);
    const toggled1 = await toggle1.json();
    expect(toggled1.isFavorited).toBe(true);

    // Second toggle → false
    const toggle2 = await request.patch(`${API_URL}/api/notes/${noteId}/favorite`, {
      headers: authHeaders(),
    });
    expect(toggle2.status()).toBe(200);
    const toggled2 = await toggle2.json();
    expect(toggled2.isFavorited).toBe(false);

    // Toggle non-existent note → 404
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const toggle404 = await request.patch(`${API_URL}/api/notes/${fakeId}/favorite`, {
      headers: authHeaders(),
    });
    expect(toggle404.status()).toBe(404);
  });

  test("SC-010: Filter notes by favoritesOnly", async ({ request }) => {
    // Create two notes
    const noteARes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Note A", content: "a" },
    });
    expect(noteARes.status()).toBe(201);
    const noteA = await noteARes.json();

    const noteBRes = await request.post(`${API_URL}/api/notes`, {
      headers: authHeaders(),
      data: { title: "Note B", content: "b" },
    });
    expect(noteBRes.status()).toBe(201);

    // Mark noteA as favorite
    const toggleRes = await request.patch(`${API_URL}/api/notes/${noteA.id}/favorite`, {
      headers: authHeaders(),
    });
    expect(toggleRes.status()).toBe(200);
    expect((await toggleRes.json()).isFavorited).toBe(true);

    // GET all notes — should return 2
    const allRes = await request.get(`${API_URL}/api/notes`, { headers: authHeaders() });
    expect(allRes.status()).toBe(200);
    const allNotes = await allRes.json();
    expect(allNotes).toHaveLength(2);

    // GET with favoritesOnly=true — should return only noteA
    const favRes = await request.get(`${API_URL}/api/notes?favoritesOnly=true`, {
      headers: authHeaders(),
    });
    expect(favRes.status()).toBe(200);
    const favNotes = await favRes.json();
    expect(favNotes).toHaveLength(1);
    expect(favNotes[0].id).toBe(noteA.id);

    // GET with favoritesOnly=false — should return all
    const nonFavRes = await request.get(`${API_URL}/api/notes?favoritesOnly=false`, {
      headers: authHeaders(),
    });
    expect(nonFavRes.status()).toBe(200);
    const nonFavNotes = await nonFavRes.json();
    expect(nonFavNotes).toHaveLength(2);
  });
});
