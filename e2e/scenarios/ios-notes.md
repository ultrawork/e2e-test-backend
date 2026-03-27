# E2E Scenarios: iOS Notes App — APIService & ViewModel Verification

**PR:** [ultrawork/e2e-test-ios#26](https://github.com/ultrawork/e2e-test-ios/pull/26) (`feature/api-service-notes-viewmodel`, merged)
**Branch:** `epic/073bfd82`
**BASE_URL:** `http://localhost:4000/api`
**Backend:** `localhost:4000` (e2e-test-backend)

---

## Preconditions

- Backend running on `localhost:4000` with JWT enabled
- iOS project cloned from `ultrawork/e2e-test-ios`, branch `epic/073bfd82`
- `Info.plist` contains `BASE_URL = http://localhost:4000/api`
- Xcode 15+ installed with iOS 17 simulator

---

## SC-1: Unit Tests — 6/6 PASS

**Type:** Automated
**Command:**

```bash
xcodebuild -project NotesApp/NotesApp.xcodeproj \
  -scheme NotesAppTests \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  test 2>&1 | grep -E "Test Case|TEST SUCCEEDED|TEST FAILED|error:"
```

**Expected:** All 6 tests pass:

| # | Test | Suite |
|---|------|-------|
| 1 | `testFetchNotesSuccess` | APIServiceTests |
| 2 | `testFetchNotesUnauthorized` | APIServiceTests |
| 3 | `testFetchNotesNetworkError` | APIServiceTests |
| 4 | `testFetchNotesSuccess` | NotesViewModelTests |
| 5 | `testFetchNotesUnauthorized` | NotesViewModelTests |
| 6 | `testFetchNotesNetworkError` | NotesViewModelTests |

**Pass criteria:** `TEST SUCCEEDED` in output, 6 tests passed.

---

## SC-2: GET /api/notes with Valid Token — 200

**Type:** Manual (curl)
**Steps:**

1. Obtain a valid JWT token:

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/dev-token | jq -r '.token')
```

2. Request notes with the token:

```bash
curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/notes
```

**Expected:**
- HTTP status: `200`
- Response body: JSON array of notes, each with `id` (string) and `content` (string)
- The iOS `Note` model maps `content` → `text` via `CodingKeys`

**Pass criteria:** Status 200, valid JSON array with `id` and `content` fields.

---

## SC-3: GET /api/notes without Token — 401

**Type:** Manual (curl)
**Steps:**

```bash
curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
  http://localhost:4000/api/notes
```

**Expected:**
- HTTP status: `401`
- Response body: `{"error": ...}` (unauthorized)

**Pass criteria:** Status 401.

---

## SC-4: UI Simulator — Notes List with Valid Token

**Type:** Manual (Simulator)
**Steps:**

1. Build and install the app:

```bash
xcodebuild -project NotesApp/NotesApp.xcodeproj \
  -scheme NotesApp \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  build
xcrun simctl install booted NotesApp/build/Build/Products/Debug-iphonesimulator/NotesApp.app
```

2. Set a valid token in simulator UserDefaults:

```bash
xcrun simctl spawn booted defaults write com.ultrawork.notes token "$TOKEN"
```

3. Launch the app:

```bash
xcrun simctl launch booted com.ultrawork.notes
```

**Expected:**
- App displays a list of notes fetched from the API
- Each note shows its text content
- No error message displayed
- `ProgressView` appears briefly during loading

**Pass criteria:** Notes list visible, no error banner.

---

## SC-5: UI Simulator — Unauthorized with Invalid Token

**Type:** Manual (Simulator)
**Steps:**

1. Set an invalid token:

```bash
xcrun simctl spawn booted defaults write com.ultrawork.notes token "invalid-token"
```

2. Kill and relaunch the app:

```bash
xcrun simctl terminate booted com.ultrawork.notes
xcrun simctl launch booted com.ultrawork.notes
```

**Expected:**
- App displays error message "Unauthorized"
- Notes list is empty

**Pass criteria:** "Unauthorized" error message visible, empty list.

---

## Token Management Reference

```bash
# Set valid token
xcrun simctl spawn booted defaults write com.ultrawork.notes token "YOUR_VALID_TOKEN"

# Set invalid token
xcrun simctl spawn booted defaults write com.ultrawork.notes token "invalid-token"

# Clear token
xcrun simctl spawn booted defaults delete com.ultrawork.notes token

# Read current token
xcrun simctl spawn booted defaults read com.ultrawork.notes token
```
