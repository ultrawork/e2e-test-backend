# E2E Scenarios: Android Notes API Verification

Validates that the Android client's Retrofit API layer works correctly
with the backend: JWT authorization, CRUD operations, and error handling.

**Base URL:** `http://localhost:4000/api`

---

## SC-001: Obtain dev-token

**Request:** `POST /api/auth/dev-token`
**Expected:** 200 + `{ "token": "<jwt>" }` (3-part JWT string)

---

## SC-002: GET /api/notes without token → 401

**Request:** `GET /api/notes` (no Authorization header)
**Expected:** 401 + `{ "error": "..." }`

---

## SC-003: GET /api/notes with Bearer token → 200

**Request:** `GET /api/notes` with `Authorization: Bearer <token>`
**Expected:** 200 + JSON array of notes

---

## SC-004: POST /api/notes → 201

**Request:** `POST /api/notes` with `{ "title": "...", "content": "..." }`
+ `Authorization: Bearer <token>`
**Expected:** 201 + created note object with `id`, `title`, `content`, `userId`, `createdAt`

---

## SC-005: DELETE /api/notes/:id → 204

**Request:** `DELETE /api/notes/<created-note-id>` + Bearer token
**Expected:** 204 (no content); subsequent GET for same id → 404

---

## SC-006: POST /api/notes with empty body → 400

**Request:** `POST /api/notes` with `{}` + Bearer token
**Expected:** 400 + `{ "error": "..." }` (validation error)

---

## SC-007: DELETE /api/notes/nonexistent-id → 404

**Request:** `DELETE /api/notes/00000000-0000-0000-0000-000000000000` + Bearer token
**Expected:** 404 + `{ "error": "..." }`
