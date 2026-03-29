# E2E Scenarios: CORS/JWT Verification v26

**Версия:** v26
**Дата:** 2026-03-29
**Спецификация:** `e2e/cors-jwt-v26.spec.ts`
**Автор:** E2E Automation

---

## Окружение

| Переменная | Значение |
|---|---|
| `API_BASE_URL` | `http://localhost:4000` |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:8081,exp://127.0.0.1:19006` |
| `JWT_ENABLED` | `true` |
| `NODE_ENV` | `test` |
| `JWT_SECRET` | `e2e-test-secret-key-ultrawork` |

---

## Сценарии

### SC-001: Health check

**Описание:** Эндпоинт `/health` доступен без авторизации и возвращает статус сервиса.

**Запрос:**
```
GET /health
```

**Ожидаемый результат:**
- HTTP статус: `200`
- Тело ответа: `{ "status": "ok" }`

---

### SC-002: 401 без токена

**Описание:** Запрос к защищённому эндпоинту без Bearer-токена отклоняется JWT middleware.

**Запрос:**
```
GET /api/notes
```

**Ожидаемый результат:**
- HTTP статус: `401`
- Тело ответа содержит поле `error`

---

### SC-003: Успешный доступ с dev-token

**Описание:** Получение dev-токена и успешный запрос к защищённому эндпоинту.

**Шаги:**
1. `POST /api/auth/dev-token` → получить JWT
2. `GET /api/notes` с заголовком `Authorization: Bearer <token>`

**Ожидаемый результат:**
- Шаг 1: HTTP статус `200`, тело содержит `token` (строка, 3 части через `.`)
- Шаг 2: HTTP статус `200`, тело — массив

---

### SC-004: CORS preflight для Origin http://localhost:3000

**Описание:** Preflight OPTIONS-запрос от разрешённого веб-клиента возвращает корректные CORS-заголовки.

**Запрос:**
```
OPTIONS /api/notes
Origin: http://localhost:3000
Access-Control-Request-Method: GET
```

**Ожидаемый результат:**
- HTTP статус: `204`
- `Access-Control-Allow-Origin: http://localhost:3000`
- `Access-Control-Allow-Credentials: true`

---

### SC-005: CORS preflight для Origin http://localhost:8081

**Описание:** Preflight OPTIONS-запрос от Android/React Native Metro-клиента.

**Запрос:**
```
OPTIONS /api/notes
Origin: http://localhost:8081
Access-Control-Request-Method: GET
```

**Ожидаемый результат:**
- HTTP статус: `204`
- `Access-Control-Allow-Origin: http://localhost:8081`
- `Access-Control-Allow-Credentials: true`

---

### SC-006: CORS preflight для Origin exp://127.0.0.1:19006 (Expo Go)

**Описание:** Preflight OPTIONS-запрос от Expo Go iOS-клиента. Ключевое отличие v26 — схема `exp://` вместо `http://`.

**Запрос:**
```
OPTIONS /api/notes
Origin: exp://127.0.0.1:19006
Access-Control-Request-Method: GET
```

**Ожидаемый результат:**
- HTTP статус: `204`
- `Access-Control-Allow-Origin: exp://127.0.0.1:19006`
- `Access-Control-Allow-Credentials: true`

---

### SC-007: dev-token недоступен в production

**Описание:** Исходный код `src/routes/auth.routes.ts` содержит проверку на production-окружение, блокирующую выдачу dev-токена в продакшн.

**Проверка:** Статический анализ файла `src/routes/auth.routes.ts`.

**Ожидаемый результат:**
- Файл содержит строку `"production"` (production guard реализован)

---

### SC-008: JWT middleware корректно обрабатывает запросы

**Описание:** В тестовом окружении (`NODE_ENV=test`) `POST /api/auth/dev-token` возвращает валидный JWT.

**Запрос:**
```
POST /api/auth/dev-token
NODE_ENV=test
```

**Ожидаемый результат:**
- HTTP статус: `200`
- Тело содержит `token` (строка с 3 частями через `.`)

---

### SC-009: Отклонение неразрешённых Origins

**Описание:** Preflight OPTIONS-запрос от неразрешённого Origin не возвращает CORS-заголовок `Access-Control-Allow-Origin`.

**Запрос:**
```
OPTIONS /api/notes
Origin: http://evil.example.com
Access-Control-Request-Method: GET
```

**Ожидаемый результат:**
- Заголовок `Access-Control-Allow-Origin` отсутствует (`null`) или равен `"false"` — не допускается возврат `*` или любого другого значения
