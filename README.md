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
| `GET` | `/api/health` | API-level health check |
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

## CORS Configuration

Set `CORS_ORIGINS` as a comma-separated list of allowed origins:

```env
# Web + React Native + Expo
CORS_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:19006

# Wildcard (development only)
CORS_ORIGINS=*
```

## iOS E2E Verification

Commands for verifying the iOS Notes App (`ultrawork/e2e-test-ios`) against this backend.

**Prerequisites:** Backend running on `localhost:4000`, Xcode 15+, iOS 17 simulator, `Info.plist` with `BASE_URL = http://localhost:4000/api`.

### Unit Tests

```bash
xcodebuild -project NotesApp/NotesApp.xcodeproj \
  -scheme NotesAppTests \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  test 2>&1 | grep -E "Test Case|TEST SUCCEEDED|TEST FAILED|error:"
```

### Simulator: Set Valid Token

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/dev-token | jq -r '.token')
xcrun simctl spawn booted defaults write com.ultrawork.notes token "$TOKEN"
```

### Simulator: Set Invalid Token

```bash
xcrun simctl spawn booted defaults write com.ultrawork.notes token "invalid-token"
```

### Simulator: Clear Token

```bash
xcrun simctl spawn booted defaults delete com.ultrawork.notes token
```

### Build, Install and Launch App on Simulator

```bash
xcodebuild -project NotesApp/NotesApp.xcodeproj \
  -scheme NotesApp \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  build

xcrun simctl install booted NotesApp/build/Build/Products/Debug-iphonesimulator/NotesApp.app
xcrun simctl launch booted com.ultrawork.notes
```

### API Verification (curl)

```bash
# GET /api/notes with valid token → 200
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/dev-token | jq -r '.token')
curl -s -w "\nHTTP_STATUS:%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/notes

# GET /api/notes without token → 401
curl -s -w "\nHTTP_STATUS:%{http_code}\n" http://localhost:4000/api/notes
```

## Environment Variables

See [.env.example](.env.example) for the full list of required environment variables.
