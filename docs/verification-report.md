# Verification Report: Backend CORS/JWT/ENV

**Date:** 2026-03-26
**Branch:** `feature/centralize-auth-middleware`
**Base:** `epic/ec0bc15c`

---

## 1. CORS Middleware

### Configuration (`src/app.ts`)
CORS middleware is applied via `cors()` with origins from `config.corsOrigins`.
The `parseCorsOrigins()` function in `src/config/index.ts` parses `CORS_ORIGINS` env variable.

### Allowed Origins (`.env.example`)
```
CORS_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:19006
```

### CORS Preflight Test Results
| Origin | Access-Control-Allow-Origin | Status |
|---|---|---|
| `http://localhost:3000` | `http://localhost:3000` | PASS |
| `http://localhost:8081` | `http://localhost:8081` | PASS |
| `http://localhost:19006` | `http://localhost:19006` | PASS |

---

## 2. ENV Variables

### `.env.example` contents (verified):
| Variable | Present | Description |
|---|---|---|
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |
| `JWT_ENABLED` | Yes | Enable/disable JWT authentication |

### Loading in application (`src/config/index.ts`):
```typescript
jwtSecret: process.env.JWT_SECRET || "",
jwtEnabled: process.env.JWT_ENABLED === "true",
corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS || ""),
```
**Result:** PASS — all variables are loaded from environment.

---

## 3. JWT Middleware Routing

### Architecture
Auth middleware is centralized in `src/routes/index.ts`:
```
/api/health       → NO auth (before router.use(authMiddleware))
/api/auth/*       → NO auth (before router.use(authMiddleware))
router.use(authMiddleware)  ← centralized guard
/api/notes        → REQUIRES auth
/api/categories   → REQUIRES auth
```

### Test Results

| Endpoint | Auth Required | Expected | Actual | Status |
|---|---|---|---|---|
| `GET /api/health` | No | 200 `{"status":"ok"}` | 200 `{"status":"ok"}` | PASS |
| `POST /api/auth/dev-token` | No | 200 `{"token":"..."}` | 200 `{"token":"<jwt>"}` | PASS |
| `GET /api/notes` (no token) | Yes | 401 | 401 `{"error":"Unauthorized"}` | PASS |
| `GET /api/notes` (valid token) | Yes | 200 | 200 (notes array) | PASS |
| `POST /api/notes` (valid token) | Yes | 201 | 201 (created note) | PASS |
| `GET /api/categories` (no token) | Yes | 401 | 401 `{"error":"Unauthorized"}` | PASS |

---

## 4. Test Evidence

### Unit Tests (`npm test`)
```
PASS src/services/categories.service.test.ts
PASS src/middleware/auth.test.ts
PASS src/routes/index.test.ts
PASS src/routes/categories.routes.test.ts
PASS src/routes/auth.routes.test.ts
PASS src/middleware/ensureUser.test.ts
PASS src/routes/notes.routes.test.ts
PASS src/verification.test.ts

Test Suites: 8 passed, 8 total
Tests:       63 passed, 63 total
```

### Build (`npm run build`)
```
> tsc
(no errors)
```

### Lint (`npm run lint`)
```
> eslint src/ --ext .ts
(no errors)
```

---

## 5. Changes Made (this branch)

1. **`src/routes/index.ts`** — Added centralized `authMiddleware` between public (`/health`, `/auth`) and protected (`/notes`, `/categories`) routes.
2. **`src/routes/notes.routes.ts`** — Removed duplicate `authMiddleware` import and usage; kept `ensureUser`.
3. **`src/routes/categories.routes.ts`** — Removed duplicate `authMiddleware` import and usage.
4. **`src/app.ts`** — Removed redundant app-level `/health` endpoint (only `/api/health` remains).
5. **`src/verification.test.ts`** — Added verification tests covering CORS preflight, JWT auth flow, and route protection.
6. **`docs/verification-report.md`** — This report.

---

## 6. Conclusion

All verification criteria are met:
- CORS middleware active, allowed origins pass preflight
- ENV variables present in `.env.example` and correctly loaded by app
- `GET /api/health` → 200 without auth
- `POST /api/auth/dev-token` → 200 with valid JWT
- `GET /api/notes` without token → 401
- `GET /api/notes` and `POST /api/notes` with token → 200/201
- All new routes added after `router.use(authMiddleware)` are protected by default
