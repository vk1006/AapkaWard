# Environment variables

> **Start here:** [`docs/SETUP.md`](SETUP.md) — local vs prod, Vercel & AWS checklists.

## Profiles

| Profile | File / location | OTP | Storage | Database |
|---------|-----------------|-----|---------|----------|
| **Local dev** | `.env.example` → `.env.local` | `mock` | `local` | Docker Postgres or Neon |
| **Production** | `.env.production.example` → `.env.production` or Vercel | `firebase` | `s3` | Neon (production branch) |

`OTP_ADAPTER` (server) and `NEXT_PUBLIC_OTP_ADAPTER` (browser) **must match**.

---

## Variable reference

| Variable | Local | Production | Notes |
|----------|-------|------------|-------|
| `DATABASE_URL` | ✓ | ✓ | Neon pooler URL in prod |
| `DATABASE_URL_UNPOOLED` | optional | — | Migrations only (`npm run db:migrate`) |
| `NEON_BRANCH` | optional | — | Neon CLI metadata |
| `NEON_AUTH_*` | optional | — | Neon CLI metadata (not used by app) |
| `OTP_ADAPTER` | `mock` | `firebase` | Server verify route |
| `NEXT_PUBLIC_OTP_ADAPTER` | `mock` | `firebase` | Login UI |
| `ADMIN_PHONES` | test phone | real admin phones | Comma-separated E.164 |
| `FIREBASE_PROJECT_ID` | if firebase | ✓ | Server Admin SDK |
| `FIREBASE_CLIENT_EMAIL` | if firebase | ✓ | Server Admin SDK |
| `FIREBASE_PRIVATE_KEY` | if firebase | ✓ | PEM with `\n` line breaks |
| `NEXT_PUBLIC_FIREBASE_*` | if firebase | ✓ | Client SDK (4 vars) |
| `FILE_STORE_ADAPTER` | `local` | `s3` | |
| `UPLOAD_DIR` | `./uploads` | — | Local adapter only |
| `AWS_REGION` | if s3 | `ap-south-1` | |
| `AWS_S3_BUCKET` | if s3 | ✓ | |
| `AWS_ACCESS_KEY_ID` | if s3 locally | Vercel only | Omit on ECS (IAM role) |
| `AWS_SECRET_ACCESS_KEY` | if s3 locally | Vercel only | Omit on ECS (IAM role) |
| `AWS_PROFILE` | optional | — | Local CLI profile |
| `AWS_SESSION_TOKEN` | optional | — | Temporary creds |
| `MODERATION_ADAPTER` | `blocklist` | `blocklist` | |
| `NODE_ENV` | `development` | `production` | |
| `BENCH_PROD_URL` | optional | — | `npm run bench:prod` |

---

## Where to set production values

### Vercel

All variables from `.env.production.example` → **Settings → Environment Variables**.

Include `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` for S3.

Include all `NEXT_PUBLIC_FIREBASE_*` (build-time).

Guide: [deploy/vercel/README.md](../deploy/vercel/README.md)

### AWS ECS

**Secrets Manager** (`ward-campaign/prod`) — sensitive only:

- `DATABASE_URL`
- `ADMIN_PHONES`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

**Task definition** (`deploy/aws/task-definition.json`) — non-sensitive:

- `OTP_ADAPTER`, `FILE_STORE_ADAPTER`, `AWS_REGION`, `AWS_S3_BUCKET`, `MODERATION_ADAPTER`, `NEXT_PUBLIC_OTP_ADAPTER`, `NODE_ENV`

**Docker build** (`npm run deploy:aws:build`) — client Firebase vars as build args.

Guide: [deploy/aws/README.md](../deploy/aws/README.md)

---

## Local dev quick reference

```bash
cp .env.example .env.local
npm run db:setup
npm run dev
```

- URL: http://127.0.0.1:3000
- Login: any phone + OTP `123456` (mock)
- Firebase OTP locally: set both adapters to `firebase`, use http://127.0.0.1:3000 (not `localhost`)

---

## Firebase private key format

In `.env` files and JSON secrets, use `\n` for line breaks inside the quoted string:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

The server converts `\n` to real newlines automatically.
