import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const API_URL = process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

function makeToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET);
}

const TOKEN = makeToken("test-user-cat-1", "catuser@example.com");
const AUTH_HEADER = { Authorization: `Bearer ${TOKEN}` };

test.describe("Categories CRUD API", () => {
  test("SC-101: Create category - positive path", async ({ request }) => {
    // Create category
    const createRes = await request.post(`${API_URL}/api/categories`, {
      headers: AUTH_HEADER,
      data: { name: "Работа", color: "#FF5733" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created).toHaveProperty("id");
    expect(created.name).toBe("Работа");
    expect(created.color).toBe("#FF5733");
    expect(created).toHaveProperty("createdAt");

    // Verify via GET
    const listRes = await request.get(`${API_URL}/api/categories`, {
      headers: AUTH_HEADER,
    });
    expect(listRes.status()).toBe(200);
    const categories = await listRes.json();
    expect(Array.isArray(categories)).toBe(true);
    const found = categories.find((c: { id: string }) => c.id === created.id);
    expect(found).toBeDefined();
    expect(found.name).toBe("Работа");
    expect(found.color).toBe("#FF5733");
  });

  test("SC-102: Validation on category creation", async ({ request }) => {
    // Empty name
    const res1 = await request.post(`${API_URL}/api/categories`, {
      headers: AUTH_HEADER,
      data: { name: "", color: "#FF0000" },
    });
    expect(res1.status()).toBe(400);
    const body1 = await res1.json();
    expect(body1.error).toBe("name must be between 1 and 30 characters");

    // Name too long (31 chars)
    const res2 = await request.post(`${API_URL}/api/categories`, {
      headers: AUTH_HEADER,
      data: { name: "a".repeat(31), color: "#FF0000" },
    });
    expect(res2.status()).toBe(400);
    const body2 = await res2.json();
    expect(body2.error).toBe("name must be between 1 and 30 characters");

    // Invalid color - not hex
    const res3 = await request.post(`${API_URL}/api/categories`, {
      headers: AUTH_HEADER,
      data: { name: "Test", color: "red" },
    });
    expect(res3.status()).toBe(400);
    const body3 = await res3.json();
    expect(body3.error).toBe("color must be a valid hex color (#RRGGBB)");

    // Invalid hex characters
    const res4 = await request.post(`${API_URL}/api/categories`, {
      headers: AUTH_HEADER,
      data: { name: "Test", color: "#GG0000" },
    });
    expect(res4.status()).toBe(400);
    const body4 = await res4.json();
    expect(body4.error).toBe("color must be a valid hex color (#RRGGBB)");
  });

  test("SC-103: Update category and 404 handling", async ({ request }) => {
    // Create a category first
    const createRes = await request.post(`${API_URL}/api/categories`, {
      headers: AUTH_HEADER,
      data: { name: "ToUpdate", color: "#111111" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();

    // Update it
    const updateRes = await request.put(`${API_URL}/api/categories/${created.id}`, {
      headers: AUTH_HEADER,
      data: { name: "Личное", color: "#00FF00" },
    });
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.name).toBe("Личное");
    expect(updated.color).toBe("#00FF00");

    // Verify via GET
    const listRes = await request.get(`${API_URL}/api/categories`, {
      headers: AUTH_HEADER,
    });
    const categories = await listRes.json();
    const found = categories.find((c: { id: string }) => c.id === created.id);
    expect(found).toBeDefined();
    expect(found.name).toBe("Личное");
    expect(found.color).toBe("#00FF00");

    // Update non-existent
    const notFoundRes = await request.put(`${API_URL}/api/categories/non-existent-id`, {
      headers: AUTH_HEADER,
      data: { name: "Test", color: "#000000" },
    });
    expect(notFoundRes.status()).toBe(404);
    const notFoundBody = await notFoundRes.json();
    expect(notFoundBody.error).toBe("Category not found");
  });

  test("SC-104: Delete category and 404 handling", async ({ request }) => {
    // Create a category
    const createRes = await request.post(`${API_URL}/api/categories`, {
      headers: AUTH_HEADER,
      data: { name: "ToDelete", color: "#AABBCC" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();

    // Delete it
    const deleteRes = await request.delete(`${API_URL}/api/categories/${created.id}`, {
      headers: AUTH_HEADER,
    });
    expect(deleteRes.status()).toBe(204);

    // Verify deleted via GET
    const listRes = await request.get(`${API_URL}/api/categories`, {
      headers: AUTH_HEADER,
    });
    const categories = await listRes.json();
    const found = categories.find((c: { id: string }) => c.id === created.id);
    expect(found).toBeUndefined();

    // Delete again - 404
    const deleteAgainRes = await request.delete(`${API_URL}/api/categories/${created.id}`, {
      headers: AUTH_HEADER,
    });
    expect(deleteAgainRes.status()).toBe(404);
    const body = await deleteAgainRes.json();
    expect(body.error).toBe("Category not found");
  });

  test("SC-105: Unauthenticated requests return 401", async ({ request }) => {
    // No auth header
    const res1 = await request.get(`${API_URL}/api/categories`);
    expect(res1.status()).toBe(401);
    const body1 = await res1.json();
    expect(body1.error).toBe("Unauthorized");

    // No auth header on POST
    const res2 = await request.post(`${API_URL}/api/categories`, {
      data: { name: "Test", color: "#000000" },
    });
    expect(res2.status()).toBe(401);
    const body2 = await res2.json();
    expect(body2.error).toBe("Unauthorized");

    // Invalid token
    const res3 = await request.get(`${API_URL}/api/categories`, {
      headers: { Authorization: "Bearer invalid-token" },
    });
    expect(res3.status()).toBe(401);
    const body3 = await res3.json();
    expect(body3.error).toBe("Invalid or expired token");
  });
});
