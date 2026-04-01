import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "fs";

const API_URL = process.env.API_URL || "http://localhost:4000";

test.describe("CORS/JWT Verification", () => {
  test.beforeAll(() => {
    mkdirSync("screenshots", { recursive: true });
  });

  test("SC-01: GET /health returns 200 and status ok", async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
    writeFileSync(
      "screenshots/SC-01-health-check.txt",
      `GET /health -> ${response.status()} ${JSON.stringify(body)}`,
    );
  });

  test("SC-02: GET /api/notes without token returns 401", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/notes`);
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty("error");
    const headers = response.headers();
    expect(headers["content-type"]).toContain("application/json");
    writeFileSync(
      "screenshots/SC-02-no-token-401.txt",
      `GET /api/notes (no token) -> ${response.status()} ${JSON.stringify(body)}`,
    );
  });

  test("SC-03: dev-token + authorized access to /api/notes returns 200", async ({
    request,
  }) => {
    const tokenResponse = await request.post(
      `${API_URL}/api/auth/dev-token`,
    );
    expect(tokenResponse.status()).toBe(200);
    const tokenBody = await tokenResponse.json();
    expect(tokenBody).toHaveProperty("token");
    const token = tokenBody.token;
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const notesResponse = await request.get(`${API_URL}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(notesResponse.status()).toBe(200);
    const notes = await notesResponse.json();
    expect(Array.isArray(notes)).toBe(true);
    const notesHeaders = notesResponse.headers();
    expect(notesHeaders["content-type"]).toContain("application/json");
    writeFileSync(
      "screenshots/SC-03-dev-token-200.txt",
      `POST /api/auth/dev-token -> ${tokenResponse.status()}\nGET /api/notes (auth) -> ${notesResponse.status()} notes=${notes.length}`,
    );
  });

  test("SC-04: OPTIONS preflight with Origin localhost:3000 returns 204 and CORS headers", async ({
    request,
  }) => {
    const response = await request.fetch(`${API_URL}/api/notes`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
      },
    });
    expect(response.status()).toBe(204);
    const headers = response.headers();
    expect(headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
    expect(headers["access-control-allow-credentials"]).toBe("true");
    writeFileSync(
      "screenshots/SC-04-cors-localhost-3000.txt",
      `OPTIONS /api/notes Origin=localhost:3000 -> ${response.status()} ACAO=${headers["access-control-allow-origin"]}`,
    );
  });

  test("SC-05: OPTIONS preflight with Origin localhost:8081 returns 204 and CORS headers", async ({
    request,
  }) => {
    const response = await request.fetch(`${API_URL}/api/notes`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:8081",
        "Access-Control-Request-Method": "GET",
      },
    });
    expect(response.status()).toBe(204);
    const headers = response.headers();
    expect(headers["access-control-allow-origin"]).toBe(
      "http://localhost:8081",
    );
    expect(headers["access-control-allow-credentials"]).toBe("true");
    writeFileSync(
      "screenshots/SC-05-cors-localhost-8081.txt",
      `OPTIONS /api/notes Origin=localhost:8081 -> ${response.status()} ACAO=${headers["access-control-allow-origin"]}`,
    );
  });

  test("SC-06: OPTIONS preflight with Origin localhost:19006 returns 204 and CORS headers", async ({
    request,
  }) => {
    const response = await request.fetch(`${API_URL}/api/notes`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:19006",
        "Access-Control-Request-Method": "GET",
      },
    });
    expect(response.status()).toBe(204);
    const headers = response.headers();
    expect(headers["access-control-allow-origin"]).toBe(
      "http://localhost:19006",
    );
    expect(headers["access-control-allow-credentials"]).toBe("true");
    writeFileSync(
      "screenshots/SC-06-cors-localhost-19006.txt",
      `OPTIONS /api/notes Origin=localhost:19006 -> ${response.status()} ACAO=${headers["access-control-allow-origin"]}`,
    );
  });

  test("SC-07: OPTIONS preflight with unknown Origin has no access-control-allow-origin", async ({
    request,
  }) => {
    const response = await request.fetch(`${API_URL}/api/notes`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://evil.example.com",
        "Access-Control-Request-Method": "GET",
      },
    });
    const headers = response.headers();
    expect(headers["access-control-allow-origin"]).toBeUndefined();
    writeFileSync(
      "screenshots/SC-07-cors-unknown-origin.txt",
      `OPTIONS /api/notes Origin=evil.example.com -> ${response.status()} ACAO=${headers["access-control-allow-origin"] ?? "undefined (blocked)"}`,
    );
  });

  test("SC-08: GET /api/notes with invalid Bearer token returns 401", async ({
    request,
  }) => {
    const response = await request.get(`${API_URL}/api/notes`, {
      headers: { Authorization: "Bearer invalid.token.here" },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty("error");
    const headers = response.headers();
    expect(headers["content-type"]).toContain("application/json");
    writeFileSync(
      "screenshots/SC-08-invalid-token-401.txt",
      `GET /api/notes (invalid token) -> ${response.status()} ${JSON.stringify(body)}`,
    );
  });
});
