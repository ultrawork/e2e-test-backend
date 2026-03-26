# E2E Backend Setup Guide

Instructions for obtaining a JWT token and running the backend for E2E / iOS UITest sessions.

---

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or via Docker)
- `.env` file configured (copy from `.env.example`)

---

## Quick Start

```bash
# 1. Install dependencies
npm ci

# 2. Copy environment config
cp .env.example .env
# Edit .env and set DATABASE_URL, JWT_SECRET=dev-secret

# 3. Run database migrations
npx prisma migrate deploy

# 4. Seed test data
npm run seed

# 5. Start the server
npm run dev
# or in CI: npm start (requires prior npm run build)
```

The server will be available at `http://localhost:3000`.

---

## Obtaining a JWT Token

### Option 1: Login endpoint (recommended for E2E)

The seed script creates a test user: `test@example.com` / `P@ssw0rd`.

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"P@ssw0rd"}' \
  | jq -r '.token'
```

Save the returned token and pass it in the `Authorization` header:
```
Authorization: Bearer <token>
```

### Option 2: Dev-token endpoint (development / local testing)

When `NODE_ENV != production`:

```bash
curl -s -X POST http://localhost:3000/api/auth/dev-token | jq -r '.token'
```

This issues a token for the default dev user without requiring credentials.

---

## iOS UITest / XCUITest

The iOS app reads the JWT from `UserDefaults` under the key `token`.

Set the token before running tests (example using `xcrun simctl`):
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"P@ssw0rd"}' \
  | jq -r '.token')

# Launch app with token in launch arguments (handled by test setup)
# Or set directly via UserDefaults using launchArguments in XCTestCase
```

---

## Verifying 401 Behaviour

```bash
# No token → 401
curl -s http://localhost:3000/api/notes
# Expected: {"error":"Unauthorized"}

# Invalid token → 401
curl -s http://localhost:3000/api/notes \
  -H "Authorization: Bearer invalid.token.here"
# Expected: {"error":"Unauthorized"}
```

---

## Resetting Data Between Test Runs

Run the seed script to restore the database to a known state:

```bash
npm run seed
```

This deletes all existing notes and users, then recreates:
- 1 test user: `test@example.com` / `P@ssw0rd`
- 3 seed notes owned by that user
