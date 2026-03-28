# E2E Сценарий v25: Проверка CORS_ORIGINS и JWT middleware

**Версия:** v25
**Дата:** 2026-03-28
**Спецификация:** `e2e/cors-jwt-v25.spec.ts`
**Окружение:** Node.js, Express.js, JWT, CORS

---

## Предусловия

| Переменная окружения | Значение |
|---|---|
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:8081,http://localhost:19006` |
| `JWT_ENABLED` | `true` |
| `JWT_SECRET` | `e2e-test-secret-key-ultrawork` |
| `NODE_ENV` | `development` |
| `PORT` | `4000` |

Сервер запущен и доступен по адресу `http://localhost:4000`.

---

## Сценарии (SC-001 — SC-009)

### SC-001: Публичный эндпоинт /health возвращает 200

**Цель:** Убедиться, что публичный health-check эндпоинт доступен без авторизации.

**Действие:** `GET http://localhost:4000/health`

**Ожидаемый результат:**
- Статус: `200 OK`
- Тело: `{"status":"ok"}`

**Вывод:** CORS и JWT middleware не блокируют публичные эндпоинты.

---

### SC-002: Приватный эндпоинт без токена возвращает 401

**Цель:** Убедиться, что JWT middleware защищает приватные эндпоинты.

**Действие:** `GET http://localhost:4000/api/notes` (без заголовка Authorization)

**Ожидаемый результат:**
- Статус: `401 Unauthorized`
- Тело: `{"error": "..."}`

**Вывод:** JWT middleware корректно блокирует неавторизованные запросы.

---

### SC-003: Получение dev-token и авторизованный доступ к /api/notes

**Цель:** Убедиться, что dev-token выдаётся и позволяет получить доступ к защищённому эндпоинту.

**Действие:**
1. `POST http://localhost:4000/api/auth/dev-token`
2. `GET http://localhost:4000/api/notes` с заголовком `Authorization: Bearer <token>`

**Ожидаемый результат:**
1. Статус: `200 OK`, тело: `{"token": "<jwt>"}` — токен является валидным JWT (3 части через точку)
2. Статус: `200 OK`, тело: массив заметок

**Вывод:** Dev-token корректно выдаётся и принимается JWT middleware.

---

### SC-004: CORS preflight для web-клиента (Origin: http://localhost:3000)

**Цель:** Убедиться, что CORS middleware разрешает запросы с web-клиента.

**Действие:** `OPTIONS http://localhost:4000/api/notes` с заголовками:
- `Origin: http://localhost:3000`
- `Access-Control-Request-Method: GET`

**Ожидаемый результат:**
- Статус: `204 No Content`
- Заголовок `Access-Control-Allow-Origin: http://localhost:3000`
- Заголовок `Access-Control-Allow-Credentials: true`

**Вывод:** CORS middleware корректно обрабатывает preflight для web-клиента (React/Next.js).

---

### SC-005: CORS preflight для Android/RN клиента (Origin: http://localhost:8081)

**Цель:** Убедиться, что CORS middleware разрешает запросы с React Native Metro.

**Действие:** `OPTIONS http://localhost:4000/api/notes` с заголовками:
- `Origin: http://localhost:8081`
- `Access-Control-Request-Method: GET`

**Ожидаемый результат:**
- Статус: `204 No Content`
- Заголовок `Access-Control-Allow-Origin: http://localhost:8081`
- Заголовок `Access-Control-Allow-Credentials: true`

**Вывод:** CORS middleware корректно обрабатывает preflight для Android/React Native клиента.

---

### SC-006: CORS preflight для Expo Go клиента (Origin: http://localhost:19006)

**Цель:** Убедиться, что CORS middleware разрешает запросы с Expo Go.

**Действие:** `OPTIONS http://localhost:4000/api/notes` с заголовками:
- `Origin: http://localhost:19006`
- `Access-Control-Request-Method: GET`

**Ожидаемый результат:**
- Статус: `204 No Content`
- Заголовок `Access-Control-Allow-Origin: http://localhost:19006`
- Заголовок `Access-Control-Allow-Credentials: true`

**Вывод:** CORS middleware корректно обрабатывает preflight для Expo Go (iOS/Android).

---

### SC-007: Dev-token заблокирован в production-окружении

**Цель:** Убедиться, что dev-token эндпоинт недоступен в production.

**Предусловие:** `NODE_ENV=production`

**Действие:** `POST http://localhost:4000/api/auth/dev-token`

**Ожидаемый результат:**
- Статус: `403 Forbidden` или `404 Not Found`

**Вывод:** Dev-token эндпоинт защищён от использования в production-окружении.

---

### SC-008: Dev-token доступен в development/test-окружении

**Цель:** Убедиться, что dev-token выдаётся в dev/test-окружении.

**Предусловие:** `NODE_ENV=development` или `NODE_ENV=test`

**Действие:** `POST http://localhost:4000/api/auth/dev-token`

**Ожидаемый результат:**
- Статус: `200 OK`
- Тело: `{"token": "<jwt>"}` — токен является валидным JWT (3 части через точку)

**Вывод:** Dev-token корректно выдаётся в dev/test-окружении для тестирования.

---

### SC-009: Неизвестный origin блокируется CORS middleware

**Цель:** Убедиться, что CORS middleware блокирует запросы с неизвестных origins.

**Действие:** `OPTIONS http://localhost:4000/api/notes` с заголовками:
- `Origin: http://evil.example.com`
- `Access-Control-Request-Method: GET`

**Ожидаемый результат:**
- Заголовок `Access-Control-Allow-Origin` отсутствует или не совпадает с запрошенным origin (origin не попадает в whitelist `CORS_ORIGINS`)

**Вывод:** CORS middleware корректно отклоняет origins, не входящих в `CORS_ORIGINS` whitelist.

---

## Итог

| Сценарий | Описание | Статус |
|---|---|---|
| SC-001 | GET /health → 200 (публичный) | PASS |
| SC-002 | GET /api/notes без токена → 401 | PASS |
| SC-003 | dev-token + авторизованный доступ | PASS |
| SC-004 | CORS preflight http://localhost:3000 → 204 | PASS |
| SC-005 | CORS preflight http://localhost:8081 → 204 | PASS |
| SC-006 | CORS preflight http://localhost:19006 → 204 | PASS |
| SC-007 | dev-token в production → 403/404 | PASS |
| SC-008 | dev-token в development → 200 | PASS |
| SC-009 | evil origin → CORS blocked | PASS |

**Итог: 9/9 PASS**
