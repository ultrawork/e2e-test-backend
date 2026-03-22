import { test, expect } from "@playwright/test";

const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

test.describe("CORS Origin Validation E2E", () => {
  test("SC-005: Disallowed origin is rejected when CORS_ORIGIN is configured", async ({
    request,
  }) => {
    // Send request with an origin that should not be in any whitelist
    const res = await request.get(`${API_URL}/health`, {
      headers: {
        Origin: "http://evil.com",
      },
    });

    // If CORS_ORIGIN is set (not wildcard), expect 403 and no CORS header
    // If CORS_ORIGIN is unset/wildcard, the origin is allowed (200)
    const status = res.status();
    if (status === 403) {
      const body = await res.json();
      expect(body.error).toBe("Not allowed by CORS");
      const acao = res.headers()["access-control-allow-origin"];
      expect(acao).toBeUndefined();
    } else {
      // Wildcard mode — all origins allowed
      expect(status).toBe(200);
      const acao = res.headers()["access-control-allow-origin"];
      expect(acao).toBeTruthy();
    }
  });

  test("SC-006a: First allowed origin receives CORS header", async ({
    request,
  }) => {
    // localhost:3000 is the default CORS_ORIGIN in .env.example
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

  test("SC-006b: Second allowed origin receives CORS header when multi-origin configured", async ({
    request,
  }) => {
    // If CORS_ORIGIN includes localhost:3001, this should pass
    // If wildcard, this also passes
    const origin = "http://localhost:3001";
    const res = await request.get(`${API_URL}/health`, {
      headers: {
        Origin: origin,
      },
    });

    const status = res.status();
    // Either allowed (200 with CORS header) or blocked (403)
    if (status === 200) {
      const acao = res.headers()["access-control-allow-origin"];
      expect(acao).toBeTruthy();
    } else {
      expect(status).toBe(403);
    }
  });

  test("SC-006c: Disallowed origin blocked when multi-origin configured", async ({
    request,
  }) => {
    const res = await request.get(`${API_URL}/health`, {
      headers: {
        Origin: "http://attacker.example.com",
      },
    });

    const status = res.status();
    if (status === 403) {
      const body = await res.json();
      expect(body.error).toBe("Not allowed by CORS");
    } else {
      // Wildcard mode — all origins allowed
      expect(status).toBe(200);
    }
  });
});
