import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";
import { Client } from "pg";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL = process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";
const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/notes";

function makeToken(userId = "e2e-fav-user", email = "fav@test.com"): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "1h" });
}

function authHeaders() {
  return {
    Authorization: `Bearer ${makeToken()}`,
    "Content-Type": "application/json",
  };
}

// Retry helper for rate-limited (429) responses
async function retryOnRateLimit<T>(
  fn: () => Promise<T & { status: () => number }>,
  maxRetries = 5,
  delayMs = 2000
): Promise<T & { status: () => number }> {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fn();
    if (res.status() !== 429) return res;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return fn();
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

test.describe("Favorites: toggle & filter", () => {
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
    // Ensure the default user exists (auth middleware uses "default-user-id")
    await dbClient.query(`
      INSERT INTO users (id, email, password, created_at, updated_at)
      VALUES ('default-user-id', 'dev@localhost', 'password', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
    // Ensure the e2e-fav-user exists (used by this spec's JWT tokens)
    await dbClient.query(`
      INSERT INTO users (id, email, password, created_at, updated_at)
      VALUES ('e2e-fav-user', 'fav@test.com', 'password', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);
  });

  test.afterAll(async () => {
    await dbClient.end();
  });

  test.beforeEach(async ({ request }) => {
    await cleanupNotes(request);
  });

  test("SC-009: Toggle favorite — cycle on/off", async ({ request }) => {
    // Create a note — isFavorited defaults to false
    const createRes = await retryOnRateLimit(() =>
      request.post(`${API_URL}/api/notes`, {
        headers: authHeaders(),
        data: { title: "Favorite cycle", content: "body" },
      })
    );
    expect(createRes.status()).toBe(201);
    const note = await createRes.json();
    expect(note.isFavorited).toBe(false);

    // First toggle → true
    const toggle1 = await request.patch(`${API_URL}/api/notes/${note.id}/favorite`, {
      headers: authHeaders(),
    });
    expect(toggle1.status()).toBe(200);
    const toggled1 = await toggle1.json();
    expect(toggled1.isFavorited).toBe(true);
    expect(toggled1.categories).toBeDefined();

    // Second toggle → false
    const toggle2 = await request.patch(`${API_URL}/api/notes/${note.id}/favorite`, {
      headers: authHeaders(),
    });
    expect(toggle2.status()).toBe(200);
    const toggled2 = await toggle2.json();
    expect(toggled2.isFavorited).toBe(false);
  });

  test("SC-010: Toggle favorite — 404 for non-existent note", async ({ request }) => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await request.patch(`${API_URL}/api/notes/${fakeId}/favorite`, {
      headers: authHeaders(),
    });
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Note not found");
  });

  test("SC-011: Filter notes by favoritesOnly", async ({ request }) => {
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
