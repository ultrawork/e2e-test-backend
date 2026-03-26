# CI: iOS E2E Backend Setup

Instructions for starting the backend on a macOS GitHub Actions runner before running iOS E2E / XCUITest tests.

---

## macOS Runner Steps

Add the following steps to your GitHub Actions workflow **before** running `xcodebuild test`:

```yaml
- name: Install backend dependencies
  working-directory: path/to/e2e-test-backend
  run: npm ci

- name: Run database migrations
  working-directory: path/to/e2e-test-backend
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: dev-secret
    JWT_ENABLED: "true"
    NODE_ENV: development
    PORT: 3000
  run: npx prisma migrate deploy

- name: Seed test data
  working-directory: path/to/e2e-test-backend
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: dev-secret
  run: npm run seed

- name: Build backend
  working-directory: path/to/e2e-test-backend
  run: npm run build

- name: Start backend
  working-directory: path/to/e2e-test-backend
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: dev-secret
    JWT_ENABLED: "true"
    NODE_ENV: development
    PORT: 3000
  run: npm start &

- name: Wait for backend readiness
  run: |
    for i in $(seq 1 30); do
      if curl -sf http://localhost:3000/health; then
        echo "Backend is ready"
        break
      fi
      echo "Waiting... ($i/30)"
      sleep 2
    done
```

---

## Environment Variables Required in CI

| Variable       | Description                          | Example value                             |
|----------------|--------------------------------------|-------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string         | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET`   | Secret for signing JWT tokens        | `dev-secret` (use a strong value in prod) |
| `JWT_ENABLED`  | Enable JWT auth (`true`/`false`)     | `true`                                    |
| `PORT`         | Port the backend listens on          | `3000`                                    |
| `NODE_ENV`     | Runtime environment                  | `development`                             |

---

## PostgreSQL on macOS Runner

GitHub's `macos-latest` runner does not include PostgreSQL by default. Start it with:

```yaml
- name: Start PostgreSQL
  run: |
    brew install postgresql@14
    brew services start postgresql@14
    sleep 3
    createdb notes || true
```

Or use a Docker-based service and run the backend separately.

---

## Docker Compose (alternative)

A `docker-compose.dev.yml` is available for local and CI use:

```bash
docker compose -f docker-compose.dev.yml up -d
# Wait for http://localhost:3000/health → {"status":"ok"}
```

This starts the backend with a PostgreSQL volume and runs migrations automatically.

---

## Readiness Check

The backend exposes two health endpoints:

- `GET http://localhost:3000/health` — top-level, no auth required
- `GET http://localhost:3000/api/health` — API-level, no auth required

Both return `{"status":"ok"}` when the server is ready.

---

## Test Credentials

After `npm run seed`:

| Field    | Value             |
|----------|-------------------|
| Email    | test@example.com  |
| Password | P@ssw0rd          |

Obtain a JWT for iOS tests:
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"P@ssw0rd"}' \
  | tr -d '\n' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "TOKEN=$TOKEN"
```
