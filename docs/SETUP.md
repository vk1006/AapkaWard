# Setup & deployment guide

One place for **local dev**, **environment variables**, and **deploying to Vercel or AWS**.

| What you need | File |
|---------------|------|
| **This guide** (start here) | `docs/SETUP.md` |
| Local env template | [`.env.example`](../.env.example) → copy to `.env.local` |
| Production env template | [`.env.production.example`](../.env.production.example) |
| Full variable reference | [`docs/ENV.md`](ENV.md) |
| Vercel step-by-step | [`deploy/vercel/README.md`](../deploy/vercel/README.md) |
| AWS ECS step-by-step | [`deploy/aws/README.md`](../deploy/aws/README.md) |

---

## 1. Local development

### Variables (`.env.local`)

Copy the template and fill in values:

```bash
cp .env.example .env.local
```

| Variable | Local value | Required? |
|----------|-------------|-----------|
| `DATABASE_URL` | Docker: `postgresql://ward:ward@localhost:5432/ward_campaign` **or** Neon URL | ✓ |
| `OTP_ADAPTER` | `mock` (no SMS) | ✓ |
| `NEXT_PUBLIC_OTP_ADAPTER` | `mock` (must match server) | ✓ |
| `ADMIN_PHONES` | `+919999999999` (test admin) | ✓ |
| `FILE_STORE_ADAPTER` | `local` | ✓ |
| `UPLOAD_DIR` | `./uploads` | if local storage |
| `MODERATION_ADAPTER` | `blocklist` | ✓ |
| `NODE_ENV` | `development` | ✓ |

**Only if testing Firebase OTP locally** (optional):

| Variable | Notes |
|----------|-------|
| `OTP_ADAPTER` / `NEXT_PUBLIC_OTP_ADAPTER` | both `firebase` |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | server Admin SDK |
| `NEXT_PUBLIC_FIREBASE_*` (4 vars) | client SDK |
| Open app at | http://127.0.0.1:3000 (not `localhost`) |

**Only if testing S3 uploads locally** (optional):

| Variable | Notes |
|----------|-------|
| `FILE_STORE_ADAPTER` | `s3` |
| `AWS_REGION`, `AWS_S3_BUCKET` | your bucket |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | or `AWS_PROFILE` |

### Run locally

```bash
# Option A: Docker Postgres
docker-compose up -d postgres

# Option B: Neon
neon login && neon link --project-id <id> --branch production -y && neon env pull

# Setup DB + start
npm run db:setup
npm run dev
```

Open **http://127.0.0.1:3000/hi**

**Mock login:** any phone + OTP `123456`

Verify:

```bash
curl http://127.0.0.1:3000/api/health
npm run bench:api -- --skip-auth
```

---

## 2. Production variables (overview)

Copy template for AWS deploy scripts:

```bash
cp .env.production.example .env.production
# fill in real values (never commit this file)
```

| Variable | Production value |
|----------|------------------|
| `DATABASE_URL` | Neon pooler URL (production branch) |
| `OTP_ADAPTER` | `firebase` |
| `NEXT_PUBLIC_OTP_ADAPTER` | `firebase` |
| `ADMIN_PHONES` | Real admin phone numbers (comma-separated E.164) |
| `FIREBASE_PROJECT_ID` | Firebase project |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_PRIVATE_KEY` | PEM key (`\n` for line breaks) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client config |
| `FILE_STORE_ADAPTER` | `s3` |
| `AWS_REGION` | `ap-south-1` |
| `AWS_S3_BUCKET` | `ward-campaign-prod` |
| `MODERATION_ADAPTER` | `blocklist` |
| `NODE_ENV` | `production` |

`OTP_ADAPTER` and `NEXT_PUBLIC_OTP_ADAPTER` **must match**.

---

## 3. Deploy to Vercel

**Best for:** fastest public URL while AWS is pending.

### What you need

- GitHub repo with this code
- [Vercel](https://vercel.com) account
- Neon production `DATABASE_URL`
- Firebase project (Phone auth + Blaze plan)
- AWS S3 bucket + IAM user keys (Vercel has no IAM role)

### Steps

1. Push repo to GitHub
2. Vercel → **Add New** → **Project** → import repo
3. Framework: **Next.js** (auto-detected), build: `npm run build`
4. **Settings → Environment Variables** — copy **every** variable from `.env.production.example`
5. Deploy
6. Add Vercel hostname to **Firebase authorized domains** + **reCAPTCHA domains**

### Vercel env checklist

Set all of these in the Vercel dashboard (Production):

```
DATABASE_URL
OTP_ADAPTER=firebase
NEXT_PUBLIC_OTP_ADAPTER=firebase
ADMIN_PHONES
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FILE_STORE_ADAPTER=s3
AWS_REGION=ap-south-1
AWS_S3_BUCKET=ward-campaign-prod
AWS_ACCESS_KEY_ID          ← required on Vercel
AWS_SECRET_ACCESS_KEY      ← required on Vercel
MODERATION_ADAPTER=blocklist
NODE_ENV=production
```

### Verify

```bash
curl https://YOUR_APP.vercel.app/api/health
# Test login at https://YOUR_APP.vercel.app/en/login
```

Full guide: [`deploy/vercel/README.md`](../deploy/vercel/README.md)

---

## 4. Deploy to AWS (ECS Fargate)

**Best for:** long-term production on AWS (Fargate + ALB + ECR).

### What you need

- AWS CLI + Docker
- AWS account (ECR, ECS, IAM, Secrets Manager, ALB)
- Neon production `DATABASE_URL`
- S3 bucket `ward-campaign-prod` in `ap-south-1`
- Firebase production config

### Where each variable goes

| Variable | Vercel | AWS ECS |
|----------|--------|---------|
| `DATABASE_URL` | Dashboard | **Secrets Manager** |
| `ADMIN_PHONES` | Dashboard | **Secrets Manager** |
| `FIREBASE_PROJECT_ID` | Dashboard | **Secrets Manager** |
| `FIREBASE_CLIENT_EMAIL` | Dashboard | **Secrets Manager** |
| `FIREBASE_PRIVATE_KEY` | Dashboard | **Secrets Manager** |
| `OTP_ADAPTER`, `FILE_STORE_ADAPTER`, `AWS_*`, `MODERATION_ADAPTER`, `NODE_ENV` | Dashboard | **Task definition** env |
| `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_OTP_ADAPTER` | Dashboard | **Docker build** args |
| `AWS_ACCESS_KEY_ID` / `SECRET` | Dashboard | **Omit** (task IAM role) |

**Secrets Manager** template: [`deploy/aws/secrets.example.json`](../deploy/aws/secrets.example.json) (5 keys only)

**Task definition:** [`deploy/aws/task-definition.json`](../deploy/aws/task-definition.json)

### Deploy commands

```bash
# 1. Create secret in AWS Secrets Manager (see deploy/aws/README.md)
# 2. Create IAM roles (ecs-execution + ecs-task)
# 3. Run migrations
./deploy/aws/migrate.sh

# 4. Build + push Docker image (loads .env.production or .env.local)
./deploy/aws/build-and-push.sh

# 5. Register task definition, create ECS cluster + ALB + service
#    (see deploy/aws/README.md)
```

### After deploy

1. Copy ALB DNS name from AWS Console
2. Add ALB hostname to **Firebase authorized domains** + **reCAPTCHA domains**
3. Test: `curl http://<alb-dns>/api/health`

Full guide: [`deploy/aws/README.md`](../deploy/aws/README.md)

---

## 5. Quick comparison

| | Local | Vercel | AWS ECS |
|---|-------|--------|---------|
| **Env file** | `.env.local` | Vercel dashboard | Secrets Manager + task def |
| **OTP** | `mock` | `firebase` | `firebase` |
| **Storage** | `local` | `s3` | `s3` |
| **AWS keys** | optional | required | not needed (IAM role) |
| **Database** | Docker or Neon | Neon prod | Neon prod |
| **URL** | http://127.0.0.1:3000 | `*.vercel.app` | ALB DNS or custom domain |
| **Firebase domains** | `127.0.0.1` | Vercel hostname | ALB hostname |

---

## 6. Firebase private key format

In `.env` files and Secrets Manager JSON, use `\n` for line breaks:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

In Secrets Manager JSON, escape backslashes: `\\n`

The server converts these to real newlines automatically.

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| Mock login returns 400 | `OTP_ADAPTER` and `NEXT_PUBLIC_OTP_ADAPTER` must both be `mock` |
| Firebase OTP fails locally | Use http://127.0.0.1:3000, add `127.0.0.1` to Firebase domains |
| Firebase OTP fails on Vercel/AWS | Add deploy hostname to Firebase + reCAPTCHA domains |
| S3 upload fails on Vercel | Set `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` |
| S3 upload fails on ECS | Check task IAM role has S3 policy on bucket |
| `@parcel/watcher` error on Mac | `npm install` (optional dep `@parcel/watcher-darwin-arm64` is in package.json) |

More detail: [`docs/ENV.md`](ENV.md)
