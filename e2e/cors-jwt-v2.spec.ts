import { test, expect } from "@playwright/test";

const API_URL =
  process.env.API_URL || process.env.BASE_URL || "http://localhost:4000";

/** SC-1: Health endpoint возвращает 200 и статус ok */
test("SC-1: GET /api/health returns 200 with status ok", async ({
  request,
}) => {
  const response = await request.get(`${API_URL}/api/health`);
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toEqual({ status: "ok" });
});

/** SC-2: Защищённый эндпоинт без JWT возвращает 401 */
test("SC-2: GET /api/notes without Authorization returns 401", async ({
  request,
}) => {
  const response = await request.get(`${API_URL}/api/notes`);
  expect(response.status()).toBe(401);

  const body = await response.json();
  expect(body).toEqual({ error: "Unauthorized" });
});

/** SC-3: Получение dev-token и доступ к защищённому эндпоинту */
test("SC-3: dev-token grants access to protected endpoint", async ({
  request,
}) => {
  // Step 1: obtain dev-token
  const tokenRes = await request.post(`${API_URL}/api/auth/dev-token`);
  expect(tokenRes.status()).toBe(200);

  const tokenBody = await tokenRes.json();
  expect(tokenBody).toHaveProperty("token");
  expect(typeof tokenBody.token).toBe("string");
  expect(tokenBody.token.length).toBeGreaterThan(0);

  // Step 2: use token to access protected endpoint
  const notesRes = await request.get(`${API_URL}/api/notes`, {
    headers: { Authorization: `Bearer ${tokenBody.token}` },
  });
  expect(notesRes.status()).toBe(200);

  const notes = await notesRes.json();
  expect(Array.isArray(notes)).toBe(true);
});

/** SC-5: CORS preflight возвращает корректные заголовки для разрешённого origin */
test("SC-5: OPTIONS preflight returns correct CORS headers for allowed origin", async ({
  request,
}) => {
  const response = await request.fetch(`${API_URL}/api/notes`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:3000",
      "Access-Control-Request-Method": "GET",
    },
  });

  // Preflight should return 204 or 200
  expect([200, 204]).toContain(response.status());

  const headers = response.headers();
  expect(headers["access-control-allow-origin"]).toBe(
    "http://localhost:3000"
  );
  expect(headers["access-control-allow-credentials"]).toBe("true");
});
