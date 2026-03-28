# Сценарий E2E v24: Проверка CORS_ORIGINS и JWT middleware

**Версия:** v24
**Дата:** 2026-03-28
**Ветка:** feature/backend-v24-cors-jwt-verification
**Спек:** e2e/cors-jwt-v24.spec.ts

---

## Предусловия

Сервер запущен локально (docker compose up -d или npm run dev) с `.env`:

```env
JWT_ENABLED=true
JWT_SECRET=e2e-test-secret-key-ultrawork
CORS_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:19006
NODE_ENV=development
PORT=4000
```

API доступен по адресу `http://localhost:4000`.

---

## Сценарии

### SC-001: GET /health возвращает 200 без авторизации

**Цель:** Убедиться, что health-endpoint доступен без токена.

**Шаги:**
1. Отправить `GET /health` без заголовка Authorization.
2. Проверить, что статус ответа — `200`.
3. Проверить, что тело ответа — `{"status":"ok"}`.

**Ожидаемый результат:** `200 {"status":"ok"}`

---

### SC-002: GET /api/notes без токена возвращает 401

**Цель:** Убедиться, что JWT middleware защищает /api/* маршруты.

**Шаги:**
1. Отправить `GET /api/notes` без заголовка Authorization.
2. Проверить, что статус ответа — `401`.
3. Проверить, что тело ответа содержит поле `error`.

**Ожидаемый результат:** `401 {"error":"Unauthorized"}`

---

### SC-003: dev-token + авторизованный доступ возвращает 200

**Цель:** Убедиться, что dev-token выдаётся и принимается для /api/notes.

**Шаги:**
1. Отправить `POST /api/auth/dev-token`.
2. Проверить, что статус — `200`, тело содержит поле `token`.
3. Проверить, что `token` — строка из 3 частей (JWT).
4. Отправить `GET /api/notes` с заголовком `Authorization: Bearer <token>`.
5. Проверить, что статус — `200`, тело — массив.

**Ожидаемый результат:** `200 []` (или массив заметок)

---

### SC-004: CORS preflight для Android origin http://localhost:8081

**Цель:** Убедиться, что CORS разрешает источник Android/React Native Metro.

**Шаги:**
1. Отправить `OPTIONS /api/notes` с заголовками:
   - `Origin: http://localhost:8081`
   - `Access-Control-Request-Method: GET`
   - `Access-Control-Request-Headers: Authorization`
2. Проверить, что статус — `204`.
3. Проверить наличие заголовка `access-control-allow-origin: http://localhost:8081`.
4. Проверить наличие заголовка `access-control-allow-credentials: true`.

**Ожидаемый результат:** `204` + корректные CORS-заголовки

---

### SC-005: CORS preflight для Web origin http://localhost:3000

**Цель:** Убедиться, что CORS разрешает источник веб-клиента.

**Шаги:**
1. Отправить `OPTIONS /api/notes` с заголовками:
   - `Origin: http://localhost:3000`
   - `Access-Control-Request-Method: POST`
   - `Access-Control-Request-Headers: Authorization,Content-Type`
2. Проверить, что статус — `204`.
3. Проверить наличие заголовка `access-control-allow-origin: http://localhost:3000`.
4. Проверить наличие заголовка `access-control-allow-credentials: true`.

**Ожидаемый результат:** `204` + корректные CORS-заголовки

---

### SC-006: CORS preflight для Expo origin http://localhost:19006

**Цель:** Убедиться, что CORS разрешает источник Expo Go.

**Шаги:**
1. Отправить `OPTIONS /api/categories` с заголовками:
   - `Origin: http://localhost:19006`
   - `Access-Control-Request-Method: GET`
   - `Access-Control-Request-Headers: Authorization`
2. Проверить, что статус — `204`.
3. Проверить наличие заголовка `access-control-allow-origin: http://localhost:19006`.
4. Проверить наличие заголовка `access-control-allow-credentials: true`.

**Ожидаемый результат:** `204` + корректные CORS-заголовки

---

### SC-007: CORS отклоняет неразрешённый источник http://localhost:9999

**Цель:** Убедиться, что CORS НЕ разрешает источники вне whitelist.

**Шаги:**
1. Отправить `OPTIONS /api/notes` с заголовками:
   - `Origin: http://localhost:9999`
   - `Access-Control-Request-Method: GET`
2. Проверить, что заголовок `access-control-allow-origin` НЕ равен `http://localhost:9999`.

**Ожидаемый результат:** Заголовок ACAO отсутствует или не содержит `http://localhost:9999`

---

### SC-008: POST /api/auth/dev-token возвращает валидный JWT

**Цель:** Убедиться, что dev-token endpoint выдаёт корректный JWT.

**Шаги:**
1. Отправить `POST /api/auth/dev-token`.
2. Проверить, что статус — `200`.
3. Проверить, что поле `token` — строка из 3 точек (header.payload.signature).

**Ожидаемый результат:** `200 {"token":"<jwt_with_3_parts>"}`

---

### SC-009: Ручная проверка curl — preflight CORS

**Цель:** Зафиксировать curl-верификацию для каждого разрешённого источника.

**Шаги:**
1. Выполнить preflight OPTIONS для каждого из разрешённых источников.
2. Проверить заголовки `Access-Control-Allow-Origin` и `Access-Control-Allow-Credentials`.
3. Выполнить preflight для неразрешённого источника (`http://localhost:9999`).
4. Убедиться, что `Access-Control-Allow-Origin` отсутствует или содержит ошибку.

Примеры команд — см. [e2e/reports/backend-v24.md](../reports/backend-v24.md).

---

## Постусловия

- Сервер работает без ошибок после всех проверок.
- Все сценарии SC-001..SC-008 завершаются вердиктом PASS.
- Неразрешённые источники отклоняются CORS middleware (SC-007).
