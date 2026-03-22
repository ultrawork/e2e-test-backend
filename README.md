# Notes App Backend

REST API backend for a cross-platform notes application. Built with Express.js, Prisma ORM, and PostgreSQL.

## Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL 16
- **Auth:** JWT (jsonwebtoken + bcrypt)
- **Security:** Helmet, CORS, express-rate-limit
- **Containerization:** Docker + Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)

### Local Development

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your values

# Run database migrations
npx prisma migrate dev

# Seed the database with sample data
npm run seed

# Start development server
npm run dev
```

### Docker

```bash
# Start backend + PostgreSQL
docker compose up -d

# Run migrations inside container
docker compose exec backend npx prisma migrate dev
```

The API will be available at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run seed` | Seed database with sample data |
| `npx prisma studio` | Open Prisma database GUI |

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Express server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Secret for signing JWT tokens | — |
| `DEV_API_TOKEN` | Development API token (see below) | — |
| `NEXT_PUBLIC_APP_URL` | Public URL for web application | `http://localhost:3001` |
| `API_BASE_URL` | Base URL for mobile apps | `http://localhost:3000/api` |
| `NEXT_PUBLIC_API_URL` | API URL for Next.js web client | `http://localhost:3000/api` |

See [.env.example](.env.example) for the full list.

## Development Auth (DEV_API_TOKEN)

During development, you can authenticate API requests using a static token instead of JWT.

1. Set `DEV_API_TOKEN` in your `.env` file:
   ```
   DEV_API_TOKEN=dev-secret-token-change-me
   ```

2. Pass the token in the `Authorization` header:
   ```bash
   # curl
   curl -H "Authorization: Bearer dev-secret-token-change-me" http://localhost:3000/api/notes

   # httpie
   http GET http://localhost:3000/api/notes Authorization:"Bearer dev-secret-token-change-me"
   ```

3. In Postman: set Authorization type to "Bearer Token" and paste the token value.

> **Note:** When `DEV_API_TOKEN` is not set, the server falls back to a default dev user automatically (no auth header needed).

## Seed Data

Run `npm run seed` (or `npx prisma db seed`) to populate the database with sample data:

- **1 user:** `dev@localhost` (password: `devpassword123`)
- **4 categories:** Work (`#4A90E2`), Personal (`#E74C3C`), Ideas (`#2ECC71`), Learning (`#F39C12`)
- **7 notes:** distributed across categories (3 Work, 2 Personal, 1 Ideas+Learning, 1 Learning)

The seed script uses `upsert` — safe to run multiple times.

## API Reference

### GET /api/health

Health check endpoint. No authentication required.

**Response** `200 OK`:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Notes (`/api/notes`)

All note endpoints require authentication (DEV_API_TOKEN or default dev user).

#### Data Model

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Unique identifier |
| `title` | `string` | Note title (required) |
| `content` | `string` | Note content (required) |
| `userId` | `string` (UUID) | Owner user ID |
| `categories` | `Category[]` | Associated categories |
| `createdAt` | `string` (ISO 8601) | Creation timestamp |
| `updatedAt` | `string` (ISO 8601) | Last update timestamp |

#### GET /api/notes

List all notes for the authenticated user.

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `category` | `string` (UUID) | Filter notes by category ID |

**Example:**
```bash
# All notes
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/notes

# Filter by category
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/notes?category=cat-work-0001
```

**Response** `200 OK`:
```json
[
  {
    "id": "note-0001",
    "title": "Sprint planning notes",
    "content": "Review backlog items...",
    "userId": "default-user-id",
    "categories": [
      { "id": "cat-work-0001", "name": "Work", "color": "#4A90E2", "createdAt": "..." }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

#### GET /api/notes/:id

Get a single note by ID.

**Response** `200 OK` | `404 Not Found` | `403 Forbidden`

#### POST /api/notes

Create a new note.

**Request body:**
```json
{
  "title": "My Note",
  "content": "Note content here",
  "categoryIds": ["cat-work-0001"]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Note title |
| `content` | `string` | Yes | Note content |
| `categoryIds` | `string[]` | No | Array of category UUIDs to link |

**Response** `201 Created` | `400 Bad Request`

#### PUT /api/notes/:id

Update an existing note.

**Request body:** same as POST.

**Response** `200 OK` | `400 Bad Request` | `404 Not Found` | `403 Forbidden`

#### DELETE /api/notes/:id

Delete a note.

**Response** `204 No Content` | `404 Not Found` | `403 Forbidden`

---

### Categories (`/api/categories`)

All category endpoints require authentication.

#### Data Model

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Unique identifier |
| `name` | `string` | Category name (1–30 characters, unique) |
| `color` | `string` | Hex color (`#RRGGBB` format) |
| `createdAt` | `string` (ISO 8601) | Creation timestamp |

#### GET /api/categories

List all categories.

**Response** `200 OK`:
```json
[
  {
    "id": "cat-work-0001",
    "name": "Work",
    "color": "#4A90E2",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

#### GET /api/categories/:id

Get a single category by ID.

**Response** `200 OK` | `404 Not Found`

#### POST /api/categories

Create a new category.

**Request body:**
```json
{
  "name": "Work",
  "color": "#4A90E2"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | `string` | Yes | 1–30 characters, unique |
| `color` | `string` | Yes | Valid hex color (`#RRGGBB`) |

**Response** `201 Created` | `400 Bad Request`

#### PUT /api/categories/:id

Update a category.

**Request body:** same as POST.

**Response** `200 OK` | `400 Bad Request` | `404 Not Found`

#### DELETE /api/categories/:id

Delete a category.

**Response** `204 No Content` | `404 Not Found`

## Database Schema Changes

- Added `Category` model with fields: `id` (UUID), `name`, `color`, `createdAt`
- `Note` now has a many-to-many relationship with `Category` via `Note.categories: Category[]`
- Removed the old `Category` enum (`PERSONAL`, `WORK`, `IDEAS`) and the `Note.category` field
- The implicit join table `_CategoryToNote` is created automatically by Prisma with cascading deletes on both sides (deleting a Note or Category removes the related join records)

### Running Migrations

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Apply migrations in development
npx prisma migrate dev -n add_category_mn

# Apply migrations in production / container
npx prisma migrate deploy
```

Inside Docker:

```bash
docker compose exec backend npx prisma migrate deploy
```

## Project Structure

```
├── prisma/
│   ├── schema.prisma        # Database schema (User, Note, Category)
│   ├── seed.ts              # Database seed script
│   └── migrations/          # SQL migration files
├── src/
│   ├── config/               # Environment configuration
│   ├── middleware/            # Auth, error handling, rate limiting
│   ├── models/               # TypeScript type exports (Note, Category)
│   ├── routes/               # API route definitions
│   ├── services/             # Business logic (placeholder)
│   ├── types/                # TypeScript type definitions
│   ├── app.ts                # Express app setup
│   └── index.ts              # Server entry point
├── .env.example              # Environment variables template
├── docker-compose.yml        # Docker Compose for local dev
├── Dockerfile                # Multi-stage production build
├── package.json
└── tsconfig.json
```
