# API Contract

Backend REST API for Notes App. Base URL: `http://localhost:3000/api`

---

## Authentication

All `/notes` endpoints require a `Authorization: Bearer <token>` header.

### POST /api/auth/login

Authenticate with email and password, receive a JWT.

**Request body:**
```json
{
  "email": "test@example.com",
  "password": "P@ssw0rd"
}
```

**Response `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response `401 Unauthorized`:**
```json
{ "error": "Invalid credentials" }
```

**Response `400 Bad Request`:**
```json
{ "error": "email and password are required" }
```

---

### POST /api/auth/dev-token *(development/test only)*

Issues a JWT without credentials. Not available in `NODE_ENV=production`.

**Response `200 OK`:**
```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

---

## Notes

### GET /api/notes

Returns all notes belonging to the authenticated user.

**Response `200 OK`:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "My note",
    "content": "Note body text",
    "userId": "test-user-seed-id",
    "createdAt": "2024-03-15T10:00:00.000Z",
    "updatedAt": "2024-03-15T10:00:00.000Z",
    "categories": []
  }
]
```

> Note: `isFavorited` is **not** included in server responses — it is managed locally on the client.

**Optional query param:** `?category=<categoryId>` — filters by category.

**Response `401 Unauthorized`** when token is missing or invalid:
```json
{ "error": "Unauthorized" }
```

---

### POST /api/notes

Creates a new note.

**Request body:**
```json
{
  "title": "My note",
  "content": "Note body text",
  "categoryIds": []
}
```
`categoryIds` is optional.

**Response `201 Created`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "My note",
  "content": "Note body text",
  "userId": "test-user-seed-id",
  "createdAt": "2024-03-15T11:00:00.000Z",
  "updatedAt": "2024-03-15T11:00:00.000Z",
  "categories": []
}
```

**Response `400 Bad Request`:**
```json
{ "error": "title and content are required" }
```

**Response `401 Unauthorized`:**
```json
{ "error": "Unauthorized" }
```

---

### DELETE /api/notes/:id

Deletes a note by ID.

**Response `204 No Content`** — empty body on success.

**Response `404 Not Found`:**
```json
{ "error": "Note not found" }
```

**Response `401 Unauthorized`:**
```json
{ "error": "Unauthorized" }
```

---

## Health Check

### GET /health

Top-level health check (no auth required).

**Response `200 OK`:**
```json
{ "status": "ok" }
```

### GET /api/health

API-level health check.

**Response `200 OK`:**
```json
{ "status": "ok" }
```

---

## Error Response Format

All error responses follow the shape:
```json
{ "error": "<message>" }
```

---

## Date Format

All timestamps (`createdAt`, `updatedAt`) are ISO 8601 strings in UTC:
```
2024-03-15T10:00:00.000Z
```
