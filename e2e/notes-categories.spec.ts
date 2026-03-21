import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";
const API_URL = process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

function makeToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET);
}

const USER1_ID = "notes-cat-user-1";
const USER2_ID = "notes-cat-user-2";
const TOKEN1 = makeToken(USER1_ID, "user1@example.com");
const TOKEN2 = makeToken(USER2_ID, "user2@example.com");
const AUTH1 = { Authorization: `Bearer ${TOKEN1}` };
const AUTH2 = { Authorization: `Bearer ${TOKEN2}` };

async function createCategory(
  request: any,
  name: string,
  color: string,
  headers: Record<string, string>
): Promise<{ id: string; name: string; color: string }> {
  const res = await request.post(`${API_URL}/api/categories`, {
    headers,
    data: { name, color },
  });
  expect(res.status()).toBe(201);
  return res.json();
}

async function createNote(
  request: any,
  title: string,
  content: string,
  categoryIds: string[] | undefined,
  headers: Record<string, string>
): Promise<any> {
  const data: any = { title, content };
  if (categoryIds !== undefined) {
    data.categoryIds = categoryIds;
  }
  const res = await request.post(`${API_URL}/api/notes`, {
    headers,
    data,
  });
  expect(res.status()).toBe(201);
  return res.json();
}

test.describe("Notes - Category binding and filtering", () => {
  test("SC-201: Create note with category binding", async ({ request }) => {
    const cat1 = await createCategory(request, "Cat201A", "#AA0000", AUTH1);
    const cat2 = await createCategory(request, "Cat201B", "#BB0000", AUTH1);

    // Create note with two categories
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: AUTH1,
      data: {
        title: "Заметка с категориями",
        content: "Текст",
        categoryIds: [cat1.id, cat2.id],
      },
    });
    expect(createRes.status()).toBe(201);
    const note = await createRes.json();
    expect(note).toHaveProperty("id");
    expect(note.title).toBe("Заметка с категориями");
    expect(note.content).toBe("Текст");
    expect(note.categories).toHaveLength(2);
    const catIds = note.categories.map((c: { id: string }) => c.id).sort();
    expect(catIds).toEqual([cat1.id, cat2.id].sort());

    // Verify via GET by id
    const getRes = await request.get(`${API_URL}/api/notes/${note.id}`, {
      headers: AUTH1,
    });
    expect(getRes.status()).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.categories).toHaveLength(2);
  });

  test("SC-202: Filter notes by category", async ({ request }) => {
    const catA = await createCategory(request, "FilterA", "#110000", AUTH1);
    const catB = await createCategory(request, "FilterB", "#220000", AUTH1);

    // Create 3 notes: note1 with catA, note2 with catB, note3 without categories
    const note1 = await createNote(request, "Note CatA", "Content1", [catA.id], AUTH1);
    const note2 = await createNote(request, "Note CatB", "Content2", [catB.id], AUTH1);
    await createNote(request, "Note NoCat", "Content3", undefined, AUTH1);

    // Filter by catA
    const resA = await request.get(`${API_URL}/api/notes?category=${catA.id}`, {
      headers: AUTH1,
    });
    expect(resA.status()).toBe(200);
    const notesA = await resA.json();
    expect(notesA.some((n: { id: string }) => n.id === note1.id)).toBe(true);
    expect(notesA.some((n: { id: string }) => n.id === note2.id)).toBe(false);

    // Filter by catB
    const resB = await request.get(`${API_URL}/api/notes?category=${catB.id}`, {
      headers: AUTH1,
    });
    expect(resB.status()).toBe(200);
    const notesB = await resB.json();
    expect(notesB.some((n: { id: string }) => n.id === note2.id)).toBe(true);
    expect(notesB.some((n: { id: string }) => n.id === note1.id)).toBe(false);

    // No filter — all 3 notes present
    const resAll = await request.get(`${API_URL}/api/notes`, {
      headers: AUTH1,
    });
    expect(resAll.status()).toBe(200);
    const allNotes = await resAll.json();
    expect(allNotes.length).toBeGreaterThanOrEqual(3);

    // Non-existent category — empty array
    const resNone = await request.get(`${API_URL}/api/notes?category=non-existent-id`, {
      headers: AUTH1,
    });
    expect(resNone.status()).toBe(200);
    const noNotes = await resNone.json();
    expect(noNotes).toEqual([]);
  });

  test("SC-203: Update category binding on note", async ({ request }) => {
    const catA = await createCategory(request, "UpdA", "#330000", AUTH1);
    const catB = await createCategory(request, "UpdB", "#440000", AUTH1);

    // Create note with catA
    const note = await createNote(request, "ToUpdateCats", "Text", [catA.id], AUTH1);

    // Replace catA with catB
    const updateRes1 = await request.put(`${API_URL}/api/notes/${note.id}`, {
      headers: AUTH1,
      data: { title: "Обновлённая", content: "Текст", categoryIds: [catB.id] },
    });
    expect(updateRes1.status()).toBe(200);
    const updated1 = await updateRes1.json();
    expect(updated1.categories).toHaveLength(1);
    expect(updated1.categories[0].id).toBe(catB.id);

    // Verify via GET
    const getRes1 = await request.get(`${API_URL}/api/notes/${note.id}`, {
      headers: AUTH1,
    });
    const fetched1 = await getRes1.json();
    expect(fetched1.categories).toHaveLength(1);
    expect(fetched1.categories[0].id).toBe(catB.id);

    // Unbind all categories
    const updateRes2 = await request.put(`${API_URL}/api/notes/${note.id}`, {
      headers: AUTH1,
      data: { title: "Без категорий", content: "Текст", categoryIds: [] },
    });
    expect(updateRes2.status()).toBe(200);
    const updated2 = await updateRes2.json();
    expect(updated2.categories).toEqual([]);

    // Verify empty categories
    const getRes2 = await request.get(`${API_URL}/api/notes/${note.id}`, {
      headers: AUTH1,
    });
    const fetched2 = await getRes2.json();
    expect(fetched2.categories).toEqual([]);
  });

  test("SC-204: Error on binding non-existent categories", async ({ request }) => {
    // Non-existent category ID
    const res1 = await request.post(`${API_URL}/api/notes`, {
      headers: AUTH1,
      data: { title: "Test", content: "Text", categoryIds: ["non-existent-uuid"] },
    });
    expect(res1.status()).toBe(400);
    const body1 = await res1.json();
    expect(body1.error).toBe("One or more categories not found");

    // categoryIds not an array
    const res2 = await request.post(`${API_URL}/api/notes`, {
      headers: AUTH1,
      data: { title: "Test", content: "Text", categoryIds: "not-an-array" },
    });
    expect(res2.status()).toBe(400);
    const body2 = await res2.json();
    expect(body2.error).toBe("categoryIds must be an array");
  });

  test("SC-205: Note isolation by owner with category filter", async ({ request }) => {
    const catShared = await createCategory(request, "Shared", "#550000", AUTH1);

    // User1 creates a note with catShared
    const note = await createNote(request, "User1 Note", "Private", [catShared.id], AUTH1);

    // User1 sees the note when filtering
    const res1 = await request.get(`${API_URL}/api/notes?category=${catShared.id}`, {
      headers: AUTH1,
    });
    expect(res1.status()).toBe(200);
    const notes1 = await res1.json();
    expect(notes1.some((n: { id: string }) => n.id === note.id)).toBe(true);

    // User2 does NOT see user1's note
    const res2 = await request.get(`${API_URL}/api/notes?category=${catShared.id}`, {
      headers: AUTH2,
    });
    expect(res2.status()).toBe(200);
    const notes2 = await res2.json();
    expect(notes2.some((n: { id: string }) => n.id === note.id)).toBe(false);

    // User2 cannot access user1's note directly
    const res3 = await request.get(`${API_URL}/api/notes/${note.id}`, {
      headers: AUTH2,
    });
    expect(res3.status()).toBe(403);
  });
});
