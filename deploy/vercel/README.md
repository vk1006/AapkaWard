# Vercel deployment

Deploy **ward-campaign** to Vercel (CLI or GitHub import).

## Quick deploy (CLI)

```bash
# 1. Log in (opens browser)
npx vercel login

# 2. Link project (create new or select existing)
npx vercel link

# 3. Push env vars from .env.production
cp .env.production.example .env.production   # first time only
./deploy/vercel/sync-env.sh production

# 4. Deploy
npm run deploy:vercel
# or: SYNC_ENV=1 npm run deploy:vercel   # sync env + deploy in one go
```

After deploy, add your `*.vercel.app` hostname to **Firebase authorized domains** and **reCAPTCHA domains**.

---

## GitHub import (alternative)

Vercel deploys from Git. If the repo is not on GitHub yet:

```bash
# Create a repo on github.com, then:
git remote add origin git@github.com:YOUR_USER/ward-campaign.git
git push -u origin main
```

## 2. Import on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Root directory: `.` (default)
5. Build command: `npm run build` (default)
6. Do **not** enable `output: standalone` — that's Docker-only

## 3. Environment variables

Copy every variable from **`.env.production.example`** into Vercel → Project → **Settings** → **Environment Variables** (Production).

Reference: [docs/SETUP.md](../../docs/SETUP.md) · [docs/ENV.md](../../docs/ENV.md)

### `FIREBASE_PRIVATE_KEY`

Paste the full PEM including `-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----`.

Either one line with `\n` for line breaks, or multiline in Vercel's value field.

### AWS on Vercel

Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` — Vercel has no IAM task role like ECS.

## 4. Deploy

Click **Deploy**. First build takes ~2–3 minutes.

Your URL will be like: `https://ward-campaign-xxxxx.vercel.app`

## 5. Firebase (required for phone OTP)

After deploy, add your Vercel hostname to:

1. **Firebase Console** → Authentication → Settings → **Authorized domains**
2. **Google Cloud** → reCAPTCHA Enterprise → your key → **Domains**

Add hostname only (e.g. `ward-campaign-xxxxx.vercel.app`), no `https://`.

## 6. Verify

```bash
curl https://YOUR_APP.vercel.app/api/health
# {"status":"ok",...}
```

Open `https://YOUR_APP.vercel.app/en/login` and test Firebase phone OTP.

```bash
BENCH_PROD_URL=https://YOUR_APP.vercel.app npm run bench:prod
```

## CLI deploy (optional)

```bash
npm i -g vercel
cd ward-campaign
vercel login
vercel link
vercel env pull .env.vercel   # after setting vars in dashboard
vercel --prod
```

## Later: move to AWS ECS

When AWS account is verified, continue with [deploy/aws/README.md](../aws/README.md).
