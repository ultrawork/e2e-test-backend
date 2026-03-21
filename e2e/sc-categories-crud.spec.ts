import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "e2e-test-secret-key-ultrawork";
const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

function makeToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET);
}

const TOKEN = makeToken("sc-cat-user-1", "sc-cat@example.com");
const AUTH = { Authorization: `Bearer ${TOKEN}` };

test.describe("SC Categories CRUD", () => {
  test("SC-001: Full CRUD lifecycle of a category", async ({ request }) => {
    // 1. GET — empty list
    const listEmpty = await request.get(`${API_URL}/api/categories`, {
      headers: AUTH,
    });
    expect(listEmpty.status()).toBe(200);
    const emptyArr = await listEmpty.json();
    expect(Array.isArray(emptyArr)).toBe(true);

    // 2. POST — create
    const createRes = await request.post(`${API_URL}/api/categories`, {
      headers: AUTH,
      data: { name: "Work", color: "#FF5733" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created).toHaveProperty("id");
    expect(created.name).toBe("Work");
    expect(created.color).toBe("#FF5733");
    expect(created).toHaveProperty("createdAt");

    // 3. GET — list contains 1
    const listOne = await request.get(`${API_URL}/api/categories`, {
      headers: AUTH,
    });
    expect(listOne.status()).toBe(200);
    const oneArr = await listOne.json();
    const found = oneArr.find((c: { id: string }) => c.id === created.id);
    expect(found).toBeDefined();
    expect(found.name).toBe("Work");

    // 4. PUT — update
    const updateRes = await request.put(
      `${API_URL}/api/categories/${created.id}`,
      { headers: AUTH, data: { name: "Personal", color: "#00FF00" } }
    );
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.name).toBe("Personal");
    expect(updated.color).toBe("#00FF00");
    expect(updated.id).toBe(created.id);

    // 5. DELETE
    const deleteRes = await request.delete(
      `${API_URL}/api/categories/${created.id}`,
      { headers: AUTH }
    );
    expect(deleteRes.status()).toBe(204);

    // 6. GET — gone
    const listAfterDel = await request.get(`${API_URL}/api/categories`, {
      headers: AUTH,
    });
    expect(listAfterDel.status()).toBe(200);
    const afterDel = await listAfterDel.json();
    expect(
      afterDel.find((c: { id: string }) => c.id === created.id)
    ).toBeUndefined();
  });

  test("SC-002: Validation rejects invalid category input", async ({
    request,
  }) => {
    // Empty name
    const r1 = await request.post(`${API_URL}/api/categories`, {
      headers: AUTH,
      data: { name: "", color: "#FF0000" },
    });
    expect(r1.status()).toBe(400);
    expect((await r1.json()).error).toBe(
      "name must be between 1 and 30 characters"
    );

    // Name too long
    const r2 = await request.post(`${API_URL}/api/categories`, {
      headers: AUTH,
      data: {
        name: "A very long category name that exceeds the limit",
        color: "#FF0000",
      },
    });
    expect(r2.status()).toBe(400);
    expect((await r2.json()).error).toBe(
      "name must be between 1 and 30 characters"
    );

    // Invalid color — word
    const r3 = await request.post(`${API_URL}/api/categories`, {
      headers: AUTH,
      data: { name: "Test", color: "red" },
    });
    expect(r3.status()).toBe(400);
    expect((await r3.json()).error).toBe(
      "color must be a valid hex color (#RRGGBB)"
    );

    // Invalid hex chars
    const r4 = await request.post(`${API_URL}/api/categories`, {
      headers: AUTH,
      data: { name: "Test", color: "#GGG000" },
    });
    expect(r4.status()).toBe(400);
    expect((await r4.json()).error).toBe(
      "color must be a valid hex color (#RRGGBB)"
    );
  });

  test("SC-003: Operations on non-existent category return 404", async ({
    request,
  }) => {
    const fakeId = "00000000-0000-0000-0000-000000000000";

    const putRes = await request.put(`${API_URL}/api/categories/${fakeId}`, {
      headers: AUTH,
      data: { name: "Test", color: "#FF0000" },
    });
    expect(putRes.status()).toBe(404);
    expect((await putRes.json()).error).toBe("Category not found");

    const delRes = await request.delete(
      `${API_URL}/api/categories/${fakeId}`,
      { headers: AUTH }
    );
    expect(delRes.status()).toBe(404);
    expect((await delRes.json()).error).toBe("Category not found");
  });

  test("SC-004: Requests without auth return 401", async ({ request }) => {
    // No header
    const r1 = await request.get(`${API_URL}/api/categories`);
    expect(r1.status()).toBe(401);
    expect((await r1.json()).error).toBe("Unauthorized");

    // No header on POST
    const r2 = await request.post(`${API_URL}/api/categories`, {
      data: { name: "Test", color: "#FF0000" },
    });
    expect(r2.status()).toBe(401);
    expect((await r2.json()).error).toBe("Unauthorized");

    // Invalid token
    const r3 = await request.get(`${API_URL}/api/categories`, {
      headers: { Authorization: "Bearer invalid-token" },
    });
    expect(r3.status()).toBe(401);
    expect((await r3.json()).error).toBe("Invalid or expired token");
  });
});
