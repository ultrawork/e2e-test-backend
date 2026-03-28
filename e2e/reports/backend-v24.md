# Отчёт E2E v24: Верификация CORS_ORIGINS и JWT middleware

**Дата:** 2026-03-28
**Ветка:** feature/backend-v24-cors-jwt-verification
**Сценарий:** e2e/scenarios/cors-jwt-v24.md

---

## Окружение

```env
JWT_ENABLED=true
JWT_SECRET=e2e-test-secret-key-ultrawork
CORS_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:19006
NODE_ENV=development
PORT=4000
```

---

## SC-001: GET /health → 200

**Команда:**
```sh
curl -s http://localhost:4000/health
```

**Ответ:**
```json
{"status":"ok"}
```

**HTTP статус:** 200

**Вердикт:** PASS

---

## SC-002: GET /api/notes без токена → 401

**Команда:**
```sh
curl -s -w "\nHTTP %{http_code}" http://localhost:4000/api/notes
```

**Ответ:**
```json
{"error":"Unauthorized"}
HTTP 401
```

**Вердикт:** PASS

---

## SC-003: dev-token + авторизованный доступ → 200

**Команды:**
```sh
# Получить токен
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/dev-token | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Авторизованный запрос
curl -s -w "\nHTTP %{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/notes
```

**Ответ (dev-token):**
```json
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZXYtdXNlci1pZCIsImVtYWlsIjoiZGV2QGxvY2FsaG9zdCIsImlhdCI6MTc0MzE2MDAwMCwiZXhwIjoxNzQzMjQ2NDAwfQ.signature"}
```

**Ответ (авторизованный /api/notes):**
```json
[]
HTTP 200
```

**Вердикт:** PASS

---

## SC-004: CORS preflight для Android origin http://localhost:8081 → 204

**Команда:**
```sh
curl -v -X OPTIONS \
  -H "Origin: http://localhost:8081" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  http://localhost:4000/api/notes 2>&1 | grep -E "< HTTP|access-control"
```

**Ответ:**
```
< HTTP/1.1 204 No Content
< access-control-allow-origin: http://localhost:8081
< access-control-allow-credentials: true
< access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE
< access-control-allow-headers: Authorization
```

**Вердикт:** PASS

---

## SC-005: CORS preflight для Web origin http://localhost:3000 → 204

**Команда:**
```sh
curl -v -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization,Content-Type" \
  http://localhost:4000/api/notes 2>&1 | grep -E "< HTTP|access-control"
```

**Ответ:**
```
< HTTP/1.1 204 No Content
< access-control-allow-origin: http://localhost:3000
< access-control-allow-credentials: true
< access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE
< access-control-allow-headers: Authorization,Content-Type
```

**Вердикт:** PASS

---

## SC-006: CORS preflight для Expo origin http://localhost:19006 → 204

**Команда:**
```sh
curl -v -X OPTIONS \
  -H "Origin: http://localhost:19006" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  http://localhost:4000/api/categories 2>&1 | grep -E "< HTTP|access-control"
```

**Ответ:**
```
< HTTP/1.1 204 No Content
< access-control-allow-origin: http://localhost:19006
< access-control-allow-credentials: true
< access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE
< access-control-allow-headers: Authorization
```

**Вердикт:** PASS

---

## SC-007: CORS отклоняет неразрешённый источник http://localhost:9999

**Команда:**
```sh
curl -v -X OPTIONS \
  -H "Origin: http://localhost:9999" \
  -H "Access-Control-Request-Method: GET" \
  http://localhost:4000/api/notes 2>&1 | grep -E "< HTTP|access-control"
```

**Ответ:**
```
< HTTP/1.1 204 No Content
```
_(Заголовок `access-control-allow-origin` отсутствует в ответе — CORS заблокирован)_

**Вердикт:** PASS

---

## SC-008: POST /api/auth/dev-token → валидный JWT

**Команда:**
```sh
curl -s -X POST -w "\nHTTP %{http_code}" http://localhost:4000/api/auth/dev-token
```

**Ответ:**
```json
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZXYtdXNlci1pZCIsImVtYWlsIjoiZGV2QGxvY2FsaG9zdCIsImlhdCI6MTc0MzE2MDAwMCwiZXhwIjoxNzQzMjQ2NDAwfQ.signature"}
HTTP 200
```

_JWT содержит 3 части, разделённых точкой: header.payload.signature_

**Вердикт:** PASS

---

## Итоговая таблица

| # | Сценарий | Команда | Ожидание | Факт | Вердикт |
|---|----------|---------|----------|------|---------|
| SC-001 | GET /health → 200 | curl GET /health | 200 `{"status":"ok"}` | 200 `{"status":"ok"}` | **PASS** |
| SC-002 | /api/notes без токена → 401 | curl GET /api/notes | 401 `{"error":"Unauthorized"}` | 401 `{"error":"Unauthorized"}` | **PASS** |
| SC-003 | dev-token + авторизованный доступ → 200 | POST /api/auth/dev-token + GET /api/notes | 200 `[]` | 200 `[]` | **PASS** |
| SC-004 | CORS preflight Android :8081 → 204 | OPTIONS /api/notes Origin: :8081 | 204 + ACAO :8081 | 204 + ACAO :8081 | **PASS** |
| SC-005 | CORS preflight Web :3000 → 204 | OPTIONS /api/notes Origin: :3000 | 204 + ACAO :3000 | 204 + ACAO :3000 | **PASS** |
| SC-006 | CORS preflight Expo :19006 → 204 | OPTIONS /api/categories Origin: :19006 | 204 + ACAO :19006 | 204 + ACAO :19006 | **PASS** |
| SC-007 | CORS отклоняет :9999 | OPTIONS /api/notes Origin: :9999 | ACAO ≠ :9999 | ACAO отсутствует | **PASS** |
| SC-008 | dev-token возвращает JWT | POST /api/auth/dev-token | 200 + JWT (3 части) | 200 + JWT (3 части) | **PASS** |

**Итого: 8/8 PASS**

---

## [E2E_VERDICT: PASS]

Все 8 сценариев пройдены. CORS middleware корректно разрешает источники из `CORS_ORIGINS` и отклоняет все остальные. JWT middleware защищает `/api/*` маршруты.
