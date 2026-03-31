import { test, expect } from "@playwright/test";
import { mkdirSync } from "fs";

const API_URL = process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

mkdirSync("screenshots", { recursive: true });

test.describe("Backend Notes API v32", () => {
  test("SC-1: GET /health returns 200 and status ok", async ({ request, page }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
    await page.goto(`${API_URL}/health`);
    await page.screenshot({ path: "screenshots/SC-1-health.png" });
  });

  test("SC-2: POST /api/auth/dev-token returns JWT token", async ({ request, page }) => {
    const response = await request.post(`${API_URL}/api/auth/dev-token`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("token");
    const token = body.token;
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    // JWT has 3 parts
    expect(token.split(".").length).toBe(3);
    await page.goto(`${API_URL}/health`);
    await page.screenshot({ path: "screenshots/SC-2-dev-token.png" });
  });

  test("SC-3: GET /api/notes without token returns 401", async ({ request, page }) => {
    const response = await request.get(`${API_URL}/api/notes`);
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toMatch(/unauthorized/i);
    await page.goto(`${API_URL}/health`);
    await page.screenshot({ path: "screenshots/SC-3-no-token-401.png" });
  });

  test("SC-4: POST /api/notes and GET /api/notes with valid token", async ({ request, page }) => {
    // Step 1: Get dev-token
    const tokenRes = await request.post(`${API_URL}/api/auth/dev-token`);
    expect(tokenRes.status()).toBe(200);
    const { token } = await tokenRes.json();

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Step 2: Create a note
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers,
      data: { title: "Test Note", content: "Test note from E2E v32" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created).toHaveProperty("id");
    expect(created.title).toBe("Test Note");
    expect(created.content).toBe("Test note from E2E v32");

    // Step 3: List notes and verify created note is present
    const listRes = await request.get(`${API_URL}/api/notes`, { headers });
    expect(listRes.status()).toBe(200);
    const notes = await listRes.json();
    expect(Array.isArray(notes)).toBe(true);
    expect(notes.length).toBeGreaterThanOrEqual(1);
    const found = notes.some((n: any) => n.title === "Test Note");
    expect(found).toBe(true);

    await page.goto(`${API_URL}/health`);
    await page.screenshot({ path: "screenshots/SC-4-create-and-list.png" });
  });

  test("SC-5: GET /api/notes with invalid token returns 401", async ({ request, page }) => {
    const response = await request.get(`${API_URL}/api/notes`, {
      headers: { Authorization: "Bearer invalid.jwt.token" },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toMatch(/unauthorized/i);
    await page.goto(`${API_URL}/health`);
    await page.screenshot({ path: "screenshots/SC-5-invalid-token-401.png" });
  });
});
