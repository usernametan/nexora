# Personal Cosmos API (Java)

Spring Boot 3.3.5 / Java 21 backend for the Personal Cosmos frontend. It provides
JWT authentication, per-user state-document sync (the localStorage data), and
file storage for the Mars knowledge vault.

## Requirements

- JDK 21+
- No Maven install required: the Maven Wrapper is checked in.

## Run (development, H2 in-memory)

```bash
cd server
./mvnw spring-boot:run
```

The API listens on `http://localhost:8080`. The H2 database is in-memory and is
recreated on restart; schema is managed by Hibernate (`ddl-auto=update`) and
Flyway is disabled.

Build and test:

```bash
cd server
./mvnw test          # Spring Boot + MockMvc integration tests
./mvnw clean package # produces target/personal-cosmos-api-0.0.1-SNAPSHOT.jar
java -jar target/personal-cosmos-api-0.0.1-SNAPSHOT.jar
```

## Environment variables

| Variable | Default (dev) | Description |
| --- | --- | --- |
| `APP_JWT_SECRET` | dev-only fallback (>= 32 chars) | HMAC-SHA256 signing secret. **Required in prod.** |
| `APP_JWT_EXPIRATION_MS` | `604800000` (7 days) | Token lifetime in milliseconds. |
| `APP_CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed origins. |
| `APP_FILE_STORAGE_DIR` | `./data/uploads` | Directory for uploaded file bytes. |
| `DB_URL` | — | Prod only: JDBC URL, e.g. `jdbc:postgresql://localhost:5432/cosmos`. |
| `DB_USER` | — | Prod only: database user. |
| `DB_PASSWORD` | — | Prod only: database password. |
| `SPRING_PROFILES_ACTIVE` | none | Set to `prod` for PostgreSQL + Flyway. |
| `PORT` | `8080` | Server port (Spring Boot standard). |

Production:

```bash
SPRING_PROFILES_ACTIVE=prod \
DB_URL=jdbc:postgresql://localhost:5432/cosmos \
DB_USER=cosmos DB_PASSWORD=secret \
APP_JWT_SECRET='a-long-random-production-secret-at-least-32-chars' \
APP_CORS_ORIGINS='https://cosmos.example.com' \
java -jar target/personal-cosmos-api-0.0.1-SNAPSHOT.jar
```

The prod profile uses `ddl-auto=validate` and runs Flyway migration
`src/main/resources/db/migration/V1__init.sql`.

## Docker

```bash
cd server
docker build -t personal-cosmos-api .
docker run -p 8080:8080 -e APP_JWT_SECRET='a-long-random-production-secret-at-least-32-chars' personal-cosmos-api
```

## API

All routes are prefixed with `/api/v1`. Authenticated routes require
`Authorization: Bearer <token>`.

### Auth and profile

| Method | Path | Body / notes |
| --- | --- | --- |
| POST | `/auth/register` | `{email,password,name,timezone?,currency?}` → `201 {token,user}`; duplicate email `409`. |
| POST | `/auth/login` | `{email,password}` → `200 {token,user}`; bad credentials `401`. |
| GET | `/auth/me` | Current user. |
| PATCH | `/profile` | `{name?,timezone?,currency?}` → user. Omitted fields are unchanged. Currency is a 3-letter code. |

### State sync

Keys must match `personal-cosmos:` followed by 1–104 characters from
`A–Z a–z 0–9 : _ -` (max 120 chars total). Values are arbitrary JSON up to 1 MiB.

| Method | Path | Body / notes |
| --- | --- | --- |
| GET | `/state` | `[{key,value,version,updatedAt}]` for the current user. |
| GET | `/state/{key}` | One entry, or `404`. |
| PUT | `/state/{key}` | `{value,baseVersion?}`. Upsert; new entries start at version 1. Stale `baseVersion` → `409`. |
| PUT | `/state` | `{entries:[{key,value,baseVersion?}]}` (max 200), transactional import. |
| DELETE | `/state/{key}` | `204`, or `404` if absent. |
| DELETE | `/state` | `204`, deletes all state for the user. |

All state access is scoped to the authenticated user. `baseVersion` for a
not-yet-existing key is `0`.

### Files

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/files` | `multipart/form-data` field `file`, max 20 MB → `201 {id,name,contentType,size,downloadUrl,createdAt}`. |
| GET | `/files` | Metadata list for the user. |
| GET | `/files/{id}` | Bytes with `Content-Type` and `Content-Disposition`; images, PDFs and plain text are `inline`, other types `attachment`. |
| DELETE | `/files/{id}` | `204`. |

Client filenames are sanitized for display only; bytes are stored on disk under
random generated names inside `APP_FILE_STORAGE_DIR`.

### Health

`GET /health` is public and returns `{"status":"ok","timestamp":"..."}`.

## Errors

Every error uses the same envelope:

```json
{
  "timestamp": "2026-10-29T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "email: email must be a valid email address",
  "path": "/api/v1/auth/register",
  "errors": { "email": "email must be a valid email address" }
}
```

`errors` is present only for validation failures. Stack traces are never exposed.
Handled statuses include `400`, `401`, `403`, `404`, `409`, `413`, `500`.
