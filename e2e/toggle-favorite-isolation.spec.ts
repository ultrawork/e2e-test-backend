import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL = process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

function makeToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "1h" });
}

function authHeadersFor(userId: string, email: string) {
  return {
    Authorization: `Bearer ${makeToken(userId, email)}`,
    "Content-Type": "application/json",
  };
}

const userA = { userId: "user-a-isolation", email: "user-a@test.com" };
const userB = { userId: "user-b-isolation", email: "user-b@test.com" };

async function cleanupNotesFor(request: any, userId: string, email: string) {
  const headers = authHeadersFor(userId, email);
  const res = await request.get(`${API_URL}/api/notes`, { headers });
  if (res.ok()) {
    const notes = await res.json();
    for (const note of notes) {
      await request.delete(`${API_URL}/api/notes/${note.id}`, { headers });
    }
  }
}

test.describe("Toggle Favorite - User Isolation", () => {
  test.beforeEach(async ({ request }) => {
    await cleanupNotesFor(request, userA.userId, userA.email);
    await cleanupNotesFor(request, userB.userId, userB.email);
  });

  test("SC-005: User B cannot toggle favorite on User A note", async ({ request }) => {
    const headersA = authHeadersFor(userA.userId, userA.email);
    const headersB = authHeadersFor(userB.userId, userB.email);

    // User A creates a note
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers: headersA,
      data: { title: "Заметка A", content: "Приватная" },
    });
    expect(createRes.status()).toBe(201);
    const noteId = (await createRes.json()).id;

    // User B tries to toggle favorite — should get 404 (not found for this user)
    const toggleB = await request.patch(`${API_URL}/api/notes/${noteId}/favorite`, {
      headers: headersB,
    });
    expect(toggleB.status()).toBe(404);
    const errorBody = await toggleB.json();
    expect(errorBody.error).toBe("Note not found");

    // User A can toggle favorite on their own note
    const toggleA = await request.patch(`${API_URL}/api/notes/${noteId}/favorite`, {
      headers: headersA,
    });
    expect(toggleA.status()).toBe(200);
    const toggled = await toggleA.json();
    expect(toggled.isFavorited).toBe(true);
  });
});
