# E2E Test Report — Backend v26 CORS/JWT Verification

**Date:** 2026-03-29T00:00:00Z
**Branch:** feature/e2e-cors-jwt-v26
**Spec:** e2e/cors-jwt-v26.spec.ts
**Environment:**
- `API_BASE_URL=http://localhost:4000`
- `CORS_ORIGINS=http://localhost:3000,http://localhost:8081,exp://127.0.0.1:19006`
- `JWT_ENABLED=true`
- `JWT_SECRET=e2e-test-secret-key-ultrawork`
- `NODE_ENV=test`

## Summary: PASS 9/9

| # | Scenario | Status | Notes |
|---|----------|--------|-------|
| SC-001 | GET /health → 200 `{"status":"ok"}` | PASS | Unprotected endpoint accessible without auth |
| SC-002 | GET /api/notes without token → 401 `{"error":...}` | PASS | JWT middleware rejects unauthenticated requests |
| SC-003 | POST /api/auth/dev-token → 200 `{"token":"<jwt>"}` + GET /api/notes with token → 200 `[]` | PASS | Dev token issued; authorized request succeeds |
| SC-004 | OPTIONS /api/notes Origin: http://localhost:3000 → 204 + CORS headers | PASS | Preflight accepted for web client |
| SC-005 | OPTIONS /api/notes Origin: http://localhost:8081 → 204 + CORS headers | PASS | Preflight accepted for Android/RN Metro |
| SC-006 | OPTIONS /api/notes Origin: exp://127.0.0.1:19006 → 204 + CORS headers | PASS | Preflight accepted for Expo Go iOS client |
| SC-007 | src/routes/auth.routes.ts contains production guard | PASS | Static check: "production" found in source |
| SC-008 | POST /api/auth/dev-token in NODE_ENV=test → 200 + valid JWT | PASS | Dev token available in test environment |
| SC-009 | OPTIONS /api/notes Origin: http://evil.example.com → ACAO is null or "false" | PASS | Disallowed origin strictly rejected (null or "false", not just != evil) |

## Ключевые изменения v26 vs v22

- `CORS_ORIGINS`: Expo Go origin изменён с `http://localhost:19006` на `exp://127.0.0.1:19006`
- Переменная URL: `API_BASE_URL` (ранее `API_URL` / `BASE_URL`)
- `NODE_ENV=test` вместо `development`
- Добавлены SC-007, SC-008, SC-009 (production guard, JWT в test, отклонение evil origin)

## Команды запуска

```bash
# Установить зависимости
npm ci

# Запустить E2E тесты v26
API_BASE_URL=http://localhost:4000 \
  CORS_ORIGINS="http://localhost:3000,http://localhost:8081,exp://127.0.0.1:19006" \
  NODE_ENV=test \
  JWT_ENABLED=true \
  JWT_SECRET=e2e-test-secret-key-ultrawork \
  npm run e2e -- e2e/cors-jwt-v26.spec.ts
```

## Предусловия

- Backend запущен на порту `4000`
- `CORS_ORIGINS` включает все три разрешённых Origin
- `NODE_ENV=test` (dev-token эндпоинт доступен)
- `JWT_ENABLED=true`, `JWT_SECRET` задан
