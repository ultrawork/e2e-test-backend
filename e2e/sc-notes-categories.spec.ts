import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

function makeToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET);
}

const TOKEN = makeToken("sc-notes-cat-user-1", "sc-notes@example.com");
const AUTH = { Authorization: `Bearer ${TOKEN}` };

async function createCat(
  request: any,
  name: string,
  color: string
): Promise<{ id: string; name: string; color: string }> {
  const res = await request.post(`${API_URL}/api/categories`, {
    headers: AUTH,
    data: { name, color },
  });
  expect(res.status()).toBe(201);
  return res.json();
}

test.describe("SC Notes-Categories Integration", () => {
  test("SC-005: Create note with category binding", async ({ request }) => {
    const cat1 = await createCat(request, "Work005", "#FF0000");
    const cat2 = await createCat(request, "Ideas005", "#00FF00");

    // Create note with both categories
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: AUTH,
      data: {
        title: "My Note",
        content: "Content",
        categoryIds: [cat1.id, cat2.id],
      },
    });
    expect(createRes.status()).toBe(201);
    const note = await createRes.json();
    expect(note.categories).toHaveLength(2);
    const catIds = note.categories
      .map((c: { id: string }) => c.id)
      .sort();
    expect(catIds).toEqual([cat1.id, cat2.id].sort());

    // Verify via GET
    const getRes = await request.get(`${API_URL}/api/notes/${note.id}`, {
      headers: AUTH,
    });
    expect(getRes.status()).toBe(200);
    const fetched = await getRes.json();
    expect(fetched.categories).toHaveLength(2);
    for (const cat of fetched.categories) {
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("name");
      expect(cat).toHaveProperty("color");
      expect(cat).toHaveProperty("createdAt");
    }
  });

  test("SC-006: Update category binding on a note", async ({ request }) => {
    const catA = await createCat(request, "Work006", "#FF0000");
    const catB = await createCat(request, "Ideas006", "#00FF00");
    const catC = await createCat(request, "Personal006", "#0000FF");

    // Create note with catA and catB
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: AUTH,
      data: {
        title: "NoteToUpdate",
        content: "Content",
        categoryIds: [catA.id, catB.id],
      },
    });
    expect(createRes.status()).toBe(201);
    const note = await createRes.json();

    // Replace with catC only
    const upd1 = await request.put(`${API_URL}/api/notes/${note.id}`, {
      headers: AUTH,
      data: {
        title: "Updated",
        content: "Updated content",
        categoryIds: [catC.id],
      },
    });
    expect(upd1.status()).toBe(200);
    const updated1 = await upd1.json();
    expect(updated1.categories).toHaveLength(1);
    expect(updated1.categories[0].id).toBe(catC.id);

    // Remove all categories
    const upd2 = await request.put(`${API_URL}/api/notes/${note.id}`, {
      headers: AUTH,
      data: {
        title: "Updated",
        content: "Updated content",
        categoryIds: [],
      },
    });
    expect(upd2.status()).toBe(200);
    expect((await upd2.json()).categories).toEqual([]);
  });

  test("SC-007: Filter notes by category", async ({ request }) => {
    const catWork = await createCat(request, "Work007", "#FF0000");
    const catPersonal = await createCat(request, "Personal007", "#0000FF");

    // Create 3 notes
    await request.post(`${API_URL}/api/notes`, {
      headers: AUTH,
      data: {
        title: "Work Note",
        content: "work",
        categoryIds: [catWork.id],
      },
    });
    await request.post(`${API_URL}/api/notes`, {
      headers: AUTH,
      data: {
        title: "Personal Note",
        content: "personal",
        categoryIds: [catPersonal.id],
      },
    });
    await request.post(`${API_URL}/api/notes`, {
      headers: AUTH,
      data: { title: "No Category Note", content: "none" },
    });

    // Filter by Work
    const resWork = await request.get(
      `${API_URL}/api/notes?category=${catWork.id}`,
      { headers: AUTH }
    );
    expect(resWork.status()).toBe(200);
    const workNotes = await resWork.json();
    expect(workNotes.length).toBeGreaterThanOrEqual(1);
    expect(
      workNotes.every((n: { title: string }) =>
        n.title.includes("Work Note") ||
        n.categories?.some((c: { id: string }) => c.id === catWork.id)
      )
    ).toBe(true);

    // Filter by Personal
    const resPers = await request.get(
      `${API_URL}/api/notes?category=${catPersonal.id}`,
      { headers: AUTH }
    );
    expect(resPers.status()).toBe(200);
    const persNotes = await resPers.json();
    expect(persNotes.length).toBeGreaterThanOrEqual(1);

    // No filter — all notes
    const resAll = await request.get(`${API_URL}/api/notes`, {
      headers: AUTH,
    });
    expect(resAll.status()).toBe(200);
    const allNotes = await resAll.json();
    expect(allNotes.length).toBeGreaterThanOrEqual(3);
  });

  test("SC-008: Create note with non-existent categories fails", async ({
    request,
  }) => {
    // Non-existent category ID
    const r1 = await request.post(`${API_URL}/api/notes`, {
      headers: AUTH,
      data: {
        title: "Test",
        content: "Content",
        categoryIds: ["00000000-0000-0000-0000-000000000000"],
      },
    });
    expect(r1.status()).toBe(400);
    expect((await r1.json()).error).toBe(
      "One or more categories not found"
    );

    // categoryIds not an array
    const r2 = await request.post(`${API_URL}/api/notes`, {
      headers: AUTH,
      data: {
        title: "Test",
        content: "Content",
        categoryIds: "not-an-array",
      },
    });
    expect(r2.status()).toBe(400);
    expect((await r2.json()).error).toBe("categoryIds must be an array");
  });
});
