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
| `npx prisma studio` | Open Prisma database GUI |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |
| `DELETE` | `/api/auth/account` | Delete account |
| `GET` | `/api/notes` | List notes |
| `GET` | `/api/notes/:id` | Get note by ID |
| `POST` | `/api/notes` | Create note |
| `PUT` | `/api/notes/:id` | Update note |
| `DELETE` | `/api/notes/:id` | Delete note |

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

## CORS

Cross-Origin Resource Sharing is controlled by the `CORS_ORIGIN` environment variable.

| Value | Behaviour |
|---|---|
| unset | All origins allowed |
| `*` | All origins allowed (explicit wildcard) |
| `http://localhost:3000` | Single origin whitelisted |
| `http://localhost:3000,http://localhost:3001` | Multiple origins (comma-separated) |

Requests without an `Origin` header (curl, native iOS/Android apps) are always allowed.

**Android emulator:** when testing a web client inside the Android emulator browser that calls the API on the host machine, add `http://10.0.2.2:3000` to the list:

```
CORS_ORIGIN=http://localhost:3000,http://10.0.2.2:3000
```

### Verifying CORS with curl

**Preflight request (OPTIONS):**

```bash
curl -i -X OPTIONS http://localhost:3000/api/notes \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"
# Expected: HTTP/1.1 204 No Content
# Expected header: Access-Control-Allow-Origin: http://localhost:3000
```

**Simple GET request:**

```bash
curl -i http://localhost:3000/api/notes \
  -H "Origin: http://localhost:3000"
# Expected header in response: Access-Control-Allow-Origin: http://localhost:3000
```

**Browser check:** start the backend (`npm run dev`), open your web client at the configured origin, and confirm there are no CORS errors in the browser console (DevTools → Console).

## Environment Variables

See [.env.example](.env.example) for the full list of required environment variables.
