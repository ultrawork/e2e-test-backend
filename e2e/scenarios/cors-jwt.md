# E2E Scenarios: CORS & JWT Verification (Backend v23)

## Prerequisites

- Node.js >= 18 (required for global `fetch()` used in CORS preflight tests)
- Server running locally (`docker compose up -d` or `npm run dev`)
- `NODE_ENV=development` or `NODE_ENV=test`
- `.env` configured from `.env.example` with:
  - `JWT_ENABLED=true`
  - `JWT_SECRET` set to a non-empty value
  - `CORS_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:19006`

---

## SC-001: Health check returns 200

**Goal:** Confirm the server is running and responds to health checks.

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health
```

**Expected:** HTTP 200, body `{"status":"ok"}`

---

## SC-002: GET /api/notes without token returns 401

**Goal:** Confirm JWT middleware rejects unauthenticated requests when `JWT_ENABLED=true`.

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/notes
```

**Expected:** HTTP 401, body `{"error":"Unauthorized"}`

---

## SC-003: POST /api/auth/dev-token returns JWT (dev/test)

**Goal:** Confirm the dev-token endpoint issues a valid JWT in non-production environments.

```bash
curl -s -X POST http://localhost:3000/api/auth/dev-token
```

**Expected:** HTTP 200, body contains `{"token":"<jwt>"}`

---

## SC-004: GET /api/notes with Bearer token returns 200

**Goal:** Confirm authenticated requests pass JWT middleware.

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/dev-token | jq -r .token)
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/notes
```

**Expected:** HTTP 200

---

## SC-005: CORS preflight for Origin http://localhost:3000

**Goal:** Confirm CORS headers are returned for the web app origin.

```bash
curl -s -I -X OPTIONS http://localhost:3000/api/notes \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"
```

**Expected:** HTTP 204, headers include:
- `Access-Control-Allow-Origin: http://localhost:3000`
- `Access-Control-Allow-Credentials: true`

---

## SC-006: CORS preflight for Origin http://localhost:8081

**Goal:** Confirm CORS headers are returned for the React Native origin.

```bash
curl -s -I -X OPTIONS http://localhost:3000/api/notes \
  -H "Origin: http://localhost:8081" \
  -H "Access-Control-Request-Method: GET"
```

**Expected:** HTTP 204, headers include:
- `Access-Control-Allow-Origin: http://localhost:8081`
- `Access-Control-Allow-Credentials: true`

---

## SC-007: CORS preflight for Origin http://localhost:19006

**Goal:** Confirm CORS headers are returned for the Expo origin.

```bash
curl -s -I -X OPTIONS http://localhost:3000/api/notes \
  -H "Origin: http://localhost:19006" \
  -H "Access-Control-Request-Method: GET"
```

**Expected:** HTTP 204, headers include:
- `Access-Control-Allow-Origin: http://localhost:19006`
- `Access-Control-Allow-Credentials: true`

---

## SC-008a: POST /api/auth/dev-token in production returns 404

**Goal:** Confirm the dev-token endpoint is disabled when `NODE_ENV=production`.

**Precondition:** Restart server with `NODE_ENV=production`.

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/auth/dev-token
```

**Expected:** HTTP 404, body `{"error":"Not found"}`

---

## SC-008b: POST /api/auth/dev-token in test returns 200

**Goal:** Confirm the dev-token endpoint is available when `NODE_ENV=test`.

**Precondition:** Restart server with `NODE_ENV=test`.

```bash
curl -s -X POST http://localhost:3000/api/auth/dev-token
```

**Expected:** HTTP 200, body contains `{"token":"<jwt>"}`
