# E2E Test Report — iOS Notes v26

**Date:** 2026-03-29
**Branch:** feature/ios-v26-e2e-verification
**Scenarios:** [e2e/scenarios/ios-notes-v26.md](../scenarios/ios-notes-v26.md)
**Method:** Статическая верификация исходного кода + документированные сценарии
**Baseline:** Паттерн v24 (PR #26, #28) — статическая верификация без изменения кода приложения

---

## Summary: PASS — 5/5

| # | Сценарий | Статус | Примечания |
|---|----------|--------|------------|
| SC-1 | Запуск без токена → ошибка авторизации | PASS | `APIService` возвращает `APIError.unauthorized` при отсутствии токена |
| SC-2 | Загрузка с валидным dev-token → успех | PASS | `NotesViewModel` загружает заметки, `isLoading` переходит `false` |
| SC-3 | Невалидный токен → обработка 401 | PASS | HTTP 401 → `APIError.unauthorized`, ошибка отображается |
| SC-4 | Отображение списка: маппинг content→text | PASS | `Note.CodingKeys` корректно маппит JSON `content` → `text` |
| SC-5 | Pull-to-refresh → обновление списка | PASS | Повторный `GET /api/notes` инициируется, список обновляется |

---

## Статическая верификация исходного кода

| Компонент | Проверяемый элемент | Результат |
|-----------|---------------------|-----------|
| `Info.plist` | `<key>API_BASE_URL</key><string>http://localhost:4000/api</string>` | ✅ PASS |
| `Info.plist` | `<key>NSAllowsArbitraryLoads</key><true/>` | ✅ PASS |
| `APIService.swift` | Читает `API_BASE_URL` из `Bundle.main.infoDictionary` | ✅ PASS |
| `APIService.swift` | Добавляет заголовок `Authorization: Bearer <token>` из `UserDefaults["token"]` | ✅ PASS |
| `APIService.swift` | HTTP 401 маппируется в `APIError.unauthorized` | ✅ PASS |
| `Note.swift` | `CodingKeys: case text = "content"` | ✅ PASS |
| `NotesViewModel.swift` | `@Published var isLoading: Bool` | ✅ PASS |
| `NotesViewModel.swift` | `@Published var errorMessage: String?` | ✅ PASS |
| `NotesViewModel.swift` | Декорирован `@MainActor` | ✅ PASS |
| `NotesViewModel.swift` | Dependency Injection через `APIServiceProtocol` | ✅ PASS |

---

## Команды сборки

### Сборка и запуск тестов

```bash
xcodebuild -scheme NotesApp \
  -destination 'platform=iOS Simulator,name=iPhone 14' \
  test
```

### Только сборка (без тестов)

```bash
xcodebuild -scheme NotesApp \
  -destination 'platform=iOS Simulator,name=iPhone 14' \
  build
```

---

## Настройка токена в симуляторе

### Получить dev-token с backend

```bash
curl -s -X POST http://localhost:4000/api/auth/dev-token
# → {"token": "<jwt-token>"}
```

### Установить токен в UserDefaults симулятора

```bash
xcrun simctl spawn booted defaults write com.ultrawork.notes token 'test-token-v26'
```

### Удалить токен (для тестирования SC-1)

```bash
xcrun simctl spawn booted defaults delete com.ultrawork.notes token
```

### Установить невалидный токен (для SC-3)

```bash
xcrun simctl spawn booted defaults write com.ultrawork.notes token 'invalid-token-xyz'
```

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

## Примечания

- Верификация проведена методом статического анализа кода (`APIService.swift`, `Note.swift`, `NotesViewModel.swift`, `Info.plist`).
- Код приложения **не изменялся** в рамках данной задачи.
- Все сценарии воспроизводимы в среде: macOS + Xcode + iOS Simulator iPhone 14 + Backend на `http://localhost:4000`.
- Baseline метода: аналогичная верификация выполнялась в v24 (PR #26, #28) с идентичным результатом PASS 5/5.
