# E2E Scenarios — iOS Notes v26

**Version:** v26
**Date:** 2026-03-29
**Target:** NotesApp (iOS Simulator, iPhone 14)
**Backend:** http://localhost:4000/api

---

## Prerequisites

### Build & Run

```bash
xcodebuild -scheme NotesApp \
  -destination 'platform=iOS Simulator,name=iPhone 14' \
  test
```

### Token Setup in Simulator

```bash
# Set valid dev-token
xcrun simctl spawn booted defaults write com.ultrawork.notes token 'test-token-v26'

# Remove token (for SC-1)
xcrun simctl spawn booted defaults delete com.ultrawork.notes token
```

### Get Dev Token from Backend

```bash
curl -s -X POST http://localhost:4000/api/auth/dev-token
```

---

## Scenarios

### SC-1: Запуск без токена — ошибка авторизации

**Предусловие:**
- Токен в UserDefaults отсутствует.

```bash
xcrun simctl spawn booted defaults delete com.ultrawork.notes token
```

**Шаги:**
1. Запустить приложение в симуляторе.
2. Дождаться завершения загрузки.

**Ожидаемый результат:**
- Приложение отображает сообщение об ошибке авторизации (например, «Unauthorized» или аналогичное).
- Список заметок не загружен.
- `APIService` возвращает `APIError.unauthorized` (маппинг HTTP 401).

---

### SC-2: Загрузка с валидным dev-token — успешная загрузка заметок

**Предусловие:**
- Backend запущен на `http://localhost:4000/api`.
- Получен dev-token с backend.

```bash
DEV_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/dev-token | jq -r '.token')
xcrun simctl spawn booted defaults write com.ultrawork.notes token "$DEV_TOKEN"
```

**Шаги:**
1. Запустить приложение.
2. Дождаться загрузки списка заметок.

**Ожидаемый результат:**
- Список заметок загружается успешно.
- `NotesViewModel.isLoading` переходит из `true` в `false`.
- `NotesViewModel.notes` содержит массив заметок (может быть пустым `[]`).
- Ошибок не отображается.

---

### SC-3: 401 при невалидном токене

**Предусловие:**
- В UserDefaults записан невалидный токен.

```bash
xcrun simctl spawn booted defaults write com.ultrawork.notes token 'invalid-token-xyz'
```

**Шаги:**
1. Запустить приложение.
2. Дождаться ответа от сервера.

**Ожидаемый результат:**
- Backend возвращает HTTP 401.
- `APIService` маппит 401 → `APIError.unauthorized`.
- Приложение отображает сообщение об ошибке авторизации.
- Список заметок не загружен.

---

### SC-4: Корректное отображение списка — маппинг content→text

**Предусловие:**
- Валидный токен установлен (SC-2).
- Backend возвращает заметки с полем `content` в JSON.

**Шаги:**
1. Запустить приложение с валидным токеном.
2. Дождаться загрузки списка заметок.
3. Просмотреть отображаемые заметки.

**Ожидаемый результат:**
- Каждая заметка отображает текст из поля `content` бэкенда.
- `Note.CodingKeys` корректно маппит JSON-ключ `content` → Swift-свойство `text`.
- Тексты заметок видны в интерфейсе без искажений.

**Статическая верификация:**
```swift
// Note.swift — ожидаемый маппинг:
enum CodingKeys: String, CodingKey {
    case text = "content"
    // ...
}
```

---

### SC-5: Pull-to-refresh — обновление списка после свайпа

**Предусловие:**
- Валидный токен установлен.
- Список заметок загружен (SC-2).

**Шаги:**
1. Запустить приложение с валидным токеном.
2. Дождаться загрузки списка.
3. Выполнить жест pull-to-refresh (потянуть список вниз).
4. Дождаться завершения обновления.

**Ожидаемый результат:**
- Инициируется повторный запрос к `GET /api/notes`.
- `NotesViewModel.isLoading` снова переходит в `true` во время обновления.
- После завершения список обновляется актуальными данными.
- Ошибок не отображается (при валидном токене).

---

## Конфигурация Info.plist

```xml
<key>API_BASE_URL</key>
<string>http://localhost:4000/api</string>
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

---

## Статическая верификация (baseline)

| Компонент | Проверяемый элемент | Статус |
|-----------|---------------------|--------|
| `Info.plist` | `API_BASE_URL = http://localhost:4000/api` | ✅ |
| `Info.plist` | `NSAllowsArbitraryLoads = true` | ✅ |
| `APIService.swift` | Читает `API_BASE_URL` из `Bundle.main` | ✅ |
| `APIService.swift` | `Authorization: Bearer` из `UserDefaults["token"]` | ✅ |
| `APIService.swift` | HTTP 401 → `APIError.unauthorized` | ✅ |
| `Note.swift` | `CodingKeys: case text = "content"` | ✅ |
| `NotesViewModel.swift` | `@Published isLoading`, `@Published errorMessage` | ✅ |
| `NotesViewModel.swift` | `@MainActor`, DI через `APIServiceProtocol` | ✅ |
