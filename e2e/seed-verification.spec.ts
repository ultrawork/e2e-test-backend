import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL = process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

/** Token for the seed user (default-user-id) to query seed data */
function makeSeedToken(): string {
  return jwt.sign({ userId: "default-user-id", email: "dev@localhost" }, JWT_SECRET, {
    expiresIn: "1h",
  });
}

function seedAuthHeaders() {
  return {
    Authorization: `Bearer ${makeSeedToken()}`,
    "Content-Type": "application/json",
  };
}

test.describe("Seed Data Verification", () => {
  test("SC-006: Seed data loaded correctly", async ({ request }) => {
    // Get notes for seed user
    const notesRes = await request.get(`${API_URL}/api/notes`, {
      headers: seedAuthHeaders(),
    });
    expect(notesRes.status()).toBe(200);
    const notes = await notesRes.json();
    expect(notes.length).toBeGreaterThanOrEqual(5);

    // Verify mix of isFavorited values
    const favorited = notes.filter((n: any) => n.isFavorited === true);
    const notFavorited = notes.filter((n: any) => n.isFavorited === false);
    expect(favorited.length).toBeGreaterThanOrEqual(1);
    expect(notFavorited.length).toBeGreaterThanOrEqual(1);

    // Get categories
    const catsRes = await request.get(`${API_URL}/api/categories`, {
      headers: seedAuthHeaders(),
    });
    expect(catsRes.status()).toBe(200);
    const categories = await catsRes.json();
    expect(categories.length).toBeGreaterThanOrEqual(2);

    const catNames = categories.map((c: any) => c.name);
    expect(catNames).toContain("Работа");
    expect(catNames).toContain("Личное");

    // Verify notes have varying category counts (0 to 2)
    const categoryCounts = notes.map((n: any) => (n.categories ? n.categories.length : 0));
    expect(categoryCounts.some((c: number) => c === 0)).toBe(true);
    expect(categoryCounts.some((c: number) => c >= 1)).toBe(true);
  });
});
