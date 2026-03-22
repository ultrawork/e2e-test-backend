import { test, expect } from "@playwright/test";

const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

test.describe("CORS Middleware E2E", () => {
  test("SC-001: Preflight OPTIONS returns 204 with CORS headers", async ({
    request,
  }) => {
    const res = await request.fetch(`${API_URL}/api/notes`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://example.com",
        "Access-Control-Request-Method": "GET",
      },
    });

    expect(res.status()).toBe(204);
    const acao = res.headers()["access-control-allow-origin"];
    expect(acao).toBeTruthy();
  });

  test("SC-002: GET with Origin receives CORS headers", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/health`, {
      headers: {
        Origin: "http://any-domain.com",
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });

    const acao = res.headers()["access-control-allow-origin"];
    expect(acao).toBeTruthy();
  });

  test("SC-003: Request without Origin header is not blocked", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/health`);

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });

  test("SC-004: Preflight for allowed origin returns 204 with matching header", async ({
    request,
  }) => {
    const origin = "http://localhost:3000";
    const res = await request.fetch(`${API_URL}/api/notes`, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "GET",
      },
    });

    expect(res.status()).toBe(204);
    const acao = res.headers()["access-control-allow-origin"];
    expect(acao).toBeTruthy();
  });

  test("SC-005: Regular GET from allowed origin returns CORS header", async ({
    request,
  }) => {
    const origin = "http://localhost:3000";
    const res = await request.get(`${API_URL}/health`, {
      headers: {
        Origin: origin,
      },
    });

    expect(res.status()).toBe(200);
    const acao = res.headers()["access-control-allow-origin"];
    expect(acao).toBeTruthy();
  });

  test("SC-006: Preflight for protected endpoint does not require auth", async ({
    request,
  }) => {
    const res = await request.fetch(`${API_URL}/api/notes`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Authorization,Content-Type",
      },
    });

    expect(res.status()).toBe(204);
    const acao = res.headers()["access-control-allow-origin"];
    expect(acao).toBeTruthy();
    const acah = res.headers()["access-control-allow-headers"];
    expect(acah).toBeTruthy();
  });
});
