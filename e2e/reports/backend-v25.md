# E2E Test Report — Backend v25 CORS/JWT Verification

**Date:** 2026-03-28T00:00:00Z
**Branch:** feature/e2e-cors-jwt-v25
**Spec:** e2e/cors-jwt-v25.spec.ts
**Environment:**
- `CORS_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:19006`
- `JWT_ENABLED=true`
- `JWT_SECRET=e2e-test-secret-key-ultrawork`
- `NODE_ENV=development`
- `PORT=4000`

## Dependency Versions

| Package | Version |
|---|---|
| `@playwright/test` | `^1.42.0` |
| `express` | `^4.18.2` |
| `cors` | `^2.8.5` |
| `jsonwebtoken` | `^9.0.0` |
| `typescript` | `^5.2.0` |
| Node.js | `20.x` |

## Run Commands

```sh
# Install dependencies
npm install

# Start the server
JWT_ENABLED=true \
  JWT_SECRET=e2e-test-secret-key-ultrawork \
  CORS_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:19006 \
  NODE_ENV=development \
  PORT=4000 \
  npm run dev

# In a separate terminal, run E2E tests
JWT_ENABLED=true \
  JWT_SECRET=e2e-test-secret-key-ultrawork \
  CORS_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:19006 \
  npx playwright test e2e/cors-jwt-v25.spec.ts
```

## Summary: 9/9 PASS

| # | Scenario | Status | Notes |
|---|----------|--------|-------|
| SC-001 | GET /health → 200 `{"status":"ok"}` | PASS | Public endpoint accessible without auth |
| SC-002 | GET /api/notes without token → 401 `{"error":...}` | PASS | JWT middleware rejects unauthenticated requests |
| SC-003 | POST /api/auth/dev-token → 200 `{"token":"<jwt>"}` + GET /api/notes with token → 200 `[]` | PASS | Dev token issued; authorized request succeeds |
| SC-004 | OPTIONS /api/notes Origin: http://localhost:3000 → 204 + CORS headers | PASS | Preflight accepted for web client (React/Next.js) |
| SC-005 | OPTIONS /api/notes Origin: http://localhost:8081 → 204 + CORS headers | PASS | Preflight accepted for Android/RN Metro client |
| SC-006 | OPTIONS /api/notes Origin: http://localhost:19006 → 204 + CORS headers | PASS | Preflight accepted for Expo Go client |
| SC-007 | POST /api/auth/dev-token in production → 403/404 | PASS | Dev-token blocked in production environment |
| SC-008 | POST /api/auth/dev-token in development → 200 valid JWT | PASS | Dev-token available in dev/test environment |
| SC-009 | OPTIONS /api/notes Origin: http://evil.example.com → CORS blocked | PASS | Unknown origin rejected by CORS middleware |

## Test Output Log

```
Running 9 tests using 1 worker

  ✓ SC-001: GET /health returns 200 and status ok (45ms)
  ✓ SC-002: GET /api/notes without token returns 401 (23ms)
  ✓ SC-003: dev-token + authorized access to /api/notes (67ms)
  ✓ SC-004: OPTIONS preflight with Origin http://localhost:3000 returns 204 and CORS headers (18ms)
  ✓ SC-005: OPTIONS preflight with Origin http://localhost:8081 returns 204 and CORS headers (15ms)
  ✓ SC-006: OPTIONS preflight with Origin http://localhost:19006 returns 204 and CORS headers (14ms)
  ✓ SC-007: POST /api/auth/dev-token blocked in production (NODE_ENV=production) (21ms)
  ✓ SC-008: POST /api/auth/dev-token returns valid JWT in development/test environment (19ms)
  ✓ SC-009: OPTIONS preflight with evil origin is blocked by CORS (16ms)

  9 passed (243ms)
```

## Unit Test Run (local)

```
PASS src/services/categories.service.test.ts
PASS src/middleware/ensureUser.test.ts
PASS src/routes/auth.routes.test.ts
PASS src/middleware/auth.test.ts
PASS src/routes/categories.routes.test.ts
PASS src/routes/notes.routes.test.ts

Test Suites: 6 passed, 6 total
Tests:       48 passed, 48 total
```

## Middleware Verification

### CORS Middleware

CORS middleware использует `CORS_ORIGINS` из переменной окружения с callback-based origin validation:

```typescript
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
```

- Origins из `CORS_ORIGINS` разрешены (SC-004, SC-005, SC-006 — PASS)
- Неизвестные origins блокируются (SC-009 — PASS)

### JWT Middleware

JWT middleware защищает приватные эндпоинты:
- `GET /api/notes` без токена → 401 (SC-002 — PASS)
- `GET /api/notes` с валидным Bearer-токеном → 200 (SC-003 — PASS)
- `GET /health` не требует токена — публичный эндпоинт (SC-001 — PASS)

## Conclusion

[E2E_VERDICT: PASS]

API стабильно и готово для использования клиентами всех платформ:
- **Web** (React/Next.js на `http://localhost:3000`) — CORS настроен корректно
- **Android/React Native** (Metro на `http://localhost:8081`) — CORS настроен корректно
- **iOS/Android** (Expo Go на `http://localhost:19006`) — CORS настроен корректно

JWT middleware защищает приватные эндпоинты, публичные остаются доступны без токена.
