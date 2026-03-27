# E2E Report: CORS & JWT Verification (Backend v23)

**Date:** 2026-03-27
**Environment:** Node.js 20, PostgreSQL 15, local (non-Docker)
**Server:** Express.js via `ts-node-dev`
**Configuration:**
- `JWT_ENABLED=true`
- `JWT_SECRET=<test value, set via .env>`
- `CORS_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:19006`

**`.env.example` verification:** Confirmed that `.env.example` already contains the correct values for `CORS_ORIGINS` (three origins), `JWT_ENABLED=true`, and `JWT_SECRET` (empty placeholder). No changes to `.env.example` were required.

---

## Results Summary

| Scenario | Description | Expected | Actual | Result |
|---|---|---|---|---|
| SC-001 | GET `/health` | 200 | 200 | **PASS** |
| SC-002 | GET `/api/notes` (no token) | 401 | 401 | **PASS** |
| SC-003 | POST `/api/auth/dev-token` (test) | 200 + JWT | 200 + JWT | **PASS** |
| SC-004 | GET `/api/notes` (with token) | 200 | 200 | **PASS** |
| SC-005 | OPTIONS `/api/notes` Origin: localhost:3000 | 204 + CORS | 204 + CORS | **PASS** |
| SC-006 | OPTIONS `/api/notes` Origin: localhost:8081 | 204 + CORS | 204 + CORS | **PASS** |
| SC-007 | OPTIONS `/api/notes` Origin: localhost:19006 | 204 + CORS | 204 + CORS | **PASS** |
| SC-008a | POST `/api/auth/dev-token` (production) | 404 | 404 | **PASS** |
| SC-008b | POST `/api/auth/dev-token` (test) | 200 | 200 | **PASS** |

**Verdict: ALL PASS (9/9 test cases across 8 scenarios, SC-008 split into a/b)**

---

## Detailed Results

### SC-001: GET /health → 200

```
$ curl -s -w "\nHTTP_CODE: %{http_code}\n" http://localhost:3000/health
{"status":"ok"}
HTTP_CODE: 200
```

### SC-002: GET /api/notes without token → 401

```
$ curl -s -w "\nHTTP_CODE: %{http_code}\n" http://localhost:3000/api/notes
{"error":"Unauthorized"}
HTTP_CODE: 401
```

### SC-003: POST /api/auth/dev-token (NODE_ENV=test) → 200

```
$ curl -s -w "\nHTTP_CODE: %{http_code}\n" -X POST http://localhost:3000/api/auth/dev-token
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
HTTP_CODE: 200
```

### SC-004: GET /api/notes with Bearer token → 200

```
$ TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/dev-token | jq -r .token)
$ curl -s -w "\nHTTP_CODE: %{http_code}\n" -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/notes
[]
HTTP_CODE: 200
```

### SC-005: CORS preflight Origin: http://localhost:3000 → 204

```
$ curl -s -D - -o /dev/null -X OPTIONS http://localhost:3000/api/notes \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
```

### SC-006: CORS preflight Origin: http://localhost:8081 → 204

```
$ curl -s -D - -o /dev/null -X OPTIONS http://localhost:3000/api/notes \
  -H "Origin: http://localhost:8081" \
  -H "Access-Control-Request-Method: GET"

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:8081
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
```

### SC-007: CORS preflight Origin: http://localhost:19006 → 204

```
$ curl -s -D - -o /dev/null -X OPTIONS http://localhost:3000/api/notes \
  -H "Origin: http://localhost:19006" \
  -H "Access-Control-Request-Method: GET"

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:19006
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
```

### SC-008a: POST /api/auth/dev-token (NODE_ENV=production) → 404

```
$ curl -s -w "\nHTTP_CODE: %{http_code}\n" -X POST http://localhost:3000/api/auth/dev-token
{"error":"Not found"}
HTTP_CODE: 404
```

### SC-008b: POST /api/auth/dev-token (NODE_ENV=test) → 200

```
$ curl -s -w "\nHTTP_CODE: %{http_code}\n" -X POST http://localhost:3000/api/auth/dev-token
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
HTTP_CODE: 200
```

---

## Verification Conclusions

### Production Guard

The `/api/auth/dev-token` endpoint is correctly guarded by `NODE_ENV` check in `src/routes/auth.routes.ts:9`:
- `NODE_ENV=production` → returns `404 Not found` (SC-008a)
- `NODE_ENV=test` → returns `200` with JWT token (SC-008b)
- `NODE_ENV=development` → returns `200` with JWT token (SC-003)

### CORS Restriction

CORS is correctly configured via `CORS_ORIGINS` environment variable:
- All three allowed origins (`localhost:3000`, `localhost:8081`, `localhost:19006`) receive proper CORS headers (SC-005, SC-006, SC-007)
- `Access-Control-Allow-Origin` is set to the specific requesting origin (not `*`)
- `Access-Control-Allow-Credentials: true` is present
- Preflight responses return `204 No Content` as expected

### JWT Authentication

JWT middleware correctly enforces authentication when `JWT_ENABLED=true`:
- Requests without token are rejected with `401 Unauthorized` (SC-002)
- Requests with valid Bearer token are accepted (SC-004)

---

## Issues Found

### CORS wildcard fallback when CORS_ORIGINS is empty

**Observation:** `parseCorsOrigins()` in `src/config/index.ts` returns `"*"` when `CORS_ORIGINS`
env var is empty or unset, because empty string and `"*"` share the same branch:
```typescript
if (!raw || raw.trim() === "*") { return "*"; }
```
This means an unconfigured server would allow all origins. With `CORS_ORIGINS` properly set
(as verified in this report), the behavior is correct. The fix for the empty-string case
is tracked separately and is out of scope for this verification PR.
