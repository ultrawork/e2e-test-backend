# E2E Scenarios — Notes API

## SC-009: Toggle Favorite

**Endpoint:** `PATCH /api/notes/:id/favorite`

**Описание:** Переключение статуса isFavorited заметки. Запрос без тела — сервер инвертирует текущее значение.

### Предусловия
- Пользователь аутентифицирован (JWT токен в заголовке Authorization).

### Шаги

| # | Действие | Метод / URL | Тело запроса | Ожидаемый код | Проверка |
|---|----------|-------------|-------------|---------------|----------|
| 1 | Создать заметку | `POST /api/notes` | `{ "title": "Test", "content": "Body" }` | 201 | `isFavorited === false` (значение по умолчанию) |
| 2 | Toggle favorite → true | `PATCH /api/notes/:id/favorite` | — | 200 | `isFavorited === true` |
| 3 | Toggle favorite → false | `PATCH /api/notes/:id/favorite` | — | 200 | `isFavorited === false` |
| 4 | Toggle несуществующей заметки | `PATCH /api/notes/nonexistent-id/favorite` | — | 404 | `{ "error": "Note not found" }` |
| 5 | Toggle чужой заметки | `PATCH /api/notes/:otherId/favorite` | — | 404 | `{ "error": "Note not found" }` (маскировка 403) |

### Контракт ответа (200 OK)

```json
{
  "id": "string",
  "title": "string",
  "content": "string",
  "isFavorited": true,
  "userId": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "categories": [
    {
      "id": "string",
      "name": "string",
      "color": "string",
      "createdAt": "string"
    }
  ]
}
```

### Ошибки

| Код | Условие |
|-----|---------|
| 404 | Заметка не найдена или принадлежит другому пользователю |
| 500 | Внутренняя ошибка сервера |
