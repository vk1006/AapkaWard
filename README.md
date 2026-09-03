# Ward Campaign Platform

Hindi-first ward election campaign website with extensible architecture (ports/adapters for DB, OTP, storage, moderation).

## Quick start (local)

```bash
# 1. Start Postgres (local) OR link Neon (see below)
docker-compose up -d postgres

# 2. Configure env
cp .env.example .env.local
# For Neon: neon login && neon link --project-id <id> --branch production -y && neon env pull

# 3. Migrate & seed
npm run db:setup

# 4. Run dev server
npm run dev
```

After pulling code with new database changes, run `npm run db:migrate` before starting the app.

Open http://127.0.0.1:3000/hi

**Dev login:** phone `+919999999999`, OTP `123456` (admin if listed in `ADMIN_PHONES`)

> **Firebase OTP locally:** set `OTP_ADAPTER` and `NEXT_PUBLIC_OTP_ADAPTER` to `firebase` in `.env.local`. Use `http://127.0.0.1:3000` (not `localhost`) — add `127.0.0.1` to Firebase authorized domains.

## Environment variables

| Profile | Template | Guide |
|---------|----------|-------|
| Local dev | `.env.example` → `.env.local` | **[docs/SETUP.md](docs/SETUP.md)** |
| Production | `.env.production.example` | **[docs/SETUP.md](docs/SETUP.md)** |

Variable reference: [docs/ENV.md](docs/ENV.md)

## Architecture

- **Modular monolith** with hexagonal ports in `src/infrastructure/ports/`
- Adapters wired in `src/infrastructure/container.ts` via env vars
- Domain modules in `src/modules/` — no vendor SDK imports

### Swap adapters via env

| Variable | Options | Local default |
|----------|---------|---------------|
| `OTP_ADAPTER` / `NEXT_PUBLIC_OTP_ADAPTER` | `mock`, `firebase` | `mock` |
| `FILE_STORE_ADAPTER` | `local`, `s3` | `local` |
| `MODERATION_ADAPTER` | `blocklist` | `blocklist` |
| `DATABASE_URL` | Postgres connection string | — |

### Neon (hosted Postgres)

```bash
npm i -g neon@latest && neon login
neon link --project-id <your-project-id> --branch production -y
neon config init   # once — creates neon.ts
neon deploy        # apply policy + pull DATABASE_URL into .env.local
npm run db:setup
```

Local Docker Postgres: `postgresql://ward:ward@localhost:5432/ward_campaign`

### AWS S3 (issue media uploads)

For local testing with S3, set in `.env.local`:

```env
FILE_STORE_ADAPTER=s3
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket-name
AWS_PROFILE=your-aws-profile   # or ACCESS_KEY + SECRET
```

Verify: `npm run s3:check`

## API latency benchmark

**Local** (requires `npm run dev`):

```bash
npm run bench:api
npm run bench:api:strict
```

**Production** (public APIs only):

```bash
BENCH_PROD_URL=https://your-domain.com npm run bench:prod
```

Endpoints and thresholds: `scripts/benchmark/config.ts`

## Deployment

| Target | Guide |
|--------|-------|
| **Vercel** (quick prod URL) | [deploy/vercel/README.md](deploy/vercel/README.md) |
| **AWS ECS** (long-term) | [deploy/aws/README.md](deploy/aws/README.md) |
| **Local Docker** (mock OTP, local files) | `docker-compose up -d --build` |

```bash
docker-compose up -d --build
docker-compose exec app npx tsx scripts/migrate.ts
docker-compose exec app npx tsx scripts/seed.ts
```

## Feature flags (admin UI)

- `issues` — ward issues feed (off by default)
- `petitions` — petitions from beyond-panch issues (off)
- `content_freeze` — block new suggestions during MCC
- `public_suggestion_wall` — show approved suggestions publicly

## Project structure

```
src/
  infrastructure/ports/     # Interfaces (DatabasePort, OtpPort, FileStorePort, ...)
  infrastructure/adapters/  # Postgres, Firebase, Local/S3, Blocklist
  infrastructure/container.ts
  modules/                  # Identity, Content, Suggestions, Events, ...
  app/[locale]/             # Hindi-default UI
  app/api/                  # REST API
```

See [docs/BLUEPRINT.md](docs/BLUEPRINT.md) for full product blueprint.
