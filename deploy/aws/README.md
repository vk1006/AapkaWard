# AWS deployment (ECS Fargate)

Deploy **ward-campaign** to AWS using **ECS Fargate + ALB + ECR**.

```
Internet → ALB (HTTP for now) → ECS Fargate (Next.js container)
                              ├── Neon Postgres (DATABASE_URL)
                              ├── S3 (FILE_STORE_ADAPTER=s3, IAM task role)
                              └── Firebase (OTP_ADAPTER=firebase)
```

## No custom domain (start here)

You can deploy and test with the **ALB DNS name** only — no Route 53 or ACM cert needed yet.

| Item | Without domain |
|------|----------------|
| App URL | `http://ward-campaign-xxxxx.ap-south-1.elb.amazonaws.com` |
| TLS | **HTTP only** (port 80 listener on ALB) |
| Firebase | Add the **ALB hostname** to authorized domains + reCAPTCHA key domains |
| Later | Point a domain at the ALB + add ACM HTTPS listener |

After the ECS service is running, copy the ALB DNS from **EC2 → Load Balancers → DNS name**, then:

1. **Firebase** → Authentication → Settings → **Authorized domains** → add `ward-campaign-xxxxx.ap-south-1.elb.amazonaws.com` (hostname only, no `http://`)
2. **Google Cloud** → reCAPTCHA Enterprise → your key → **Domains** → add the same hostname
3. Test: `http://<alb-dns>/api/health` and login at `http://<alb-dns>/en/login`

Skip Step 6 item 4 (ACM) and use **HTTP listener on port 80** only until you have a domain.

## Prerequisites

1. **AWS CLI v2** — [Install](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. **Docker Desktop** (or Docker Engine)
3. **AWS account** with permissions for ECR, ECS, IAM, Secrets Manager, ALB
4. **Neon** production `DATABASE_URL` (see `.env.production.example`)
5. **S3 bucket** `ward-campaign-prod` in `ap-south-1`
6. **Firebase** production config

Env reference: [docs/SETUP.md](../../docs/SETUP.md) · [docs/ENV.md](../../docs/ENV.md)

Configure AWS CLI:

```bash
aws configure
# Region: ap-south-1
aws sts get-caller-identity   # verify
```

## Step 1 — IAM roles

Create two IAM roles in the AWS Console (or CLI):

### ECS task execution role (`ward-campaign-ecs-execution`)

Trusted entity: `ecs-tasks.amazonaws.com`

Attach managed policies:
- `AmazonECSTaskExecutionRolePolicy`
- Custom policy for Secrets Manager read on `ward-campaign/prod`

### ECS task role (`ward-campaign-ecs-task`)

Trusted entity: `ecs-tasks.amazonaws.com`

Attach S3 policy (no static AWS keys needed in production):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::ward-campaign-prod/*"
    }
  ]
}
```

## Step 2 — Store secrets

Create a secret in **Secrets Manager** named `ward-campaign/prod` (key/value JSON).

Use `deploy/aws/secrets.example.json` as a template. Required keys:

| Key | Example |
|-----|---------|
| `DATABASE_URL` | Neon pooler URL |
| `ADMIN_PHONES` | `+919999999999` |
| `FIREBASE_PROJECT_ID` | `ward-campaign-app` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-...@...iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Full PEM with `\n` for newlines |

```bash
aws secretsmanager create-secret \
  --name ward-campaign/prod \
  --secret-string file://deploy/aws/secrets.example.json \
  --region ap-south-1
```

(Update the JSON with real values before running.)

## Step 3 — Run migrations

From your laptop (before first deploy). Scripts load `.env.production` first, then `.env.local`:

```bash
./deploy/aws/migrate.sh
```

Or pass `DATABASE_URL` directly:

```bash
DATABASE_URL="postgresql://..." ./deploy/aws/migrate.sh
```

## Step 4 — Build and push Docker image

`NEXT_PUBLIC_*` Firebase vars are **baked in at build time**:

```bash
chmod +x deploy/aws/build-and-push.sh
./deploy/aws/build-and-push.sh
```

This creates ECR repo `ward-campaign` (if missing) and pushes `latest`.

## Step 5 — ECS cluster + task definition

1. **ECS Console** → Create cluster → `ward-campaign` (Fargate)
2. Edit `deploy/aws/task-definition.json` if needed:
   - Update IAM role ARNs and ECR image URI for your account
   - Update Secrets Manager ARNs if your secret name differs
   - Update `AWS_S3_BUCKET` if needed
3. Register task definition:

```bash
aws ecs register-task-definition \
  --cli-input-json file://deploy/aws/task-definition.json \
  --region ap-south-1
```

4. Create **CloudWatch log group**:

```bash
aws logs create-log-group --log-group-name /ecs/ward-campaign --region ap-south-1
```

## Step 6 — ALB + ECS service (HTTP, no domain)

1. **EC2 → Load Balancers** → Create ALB (internet-facing, `ap-south-1`)
2. Listener: **HTTP port 80** only (skip HTTPS until you have a domain)
3. Target group: HTTP port 3000, health check path `/api/health`
4. **ECS** → Create service:
   - Cluster: `ward-campaign`
   - Task definition: `ward-campaign`
   - Launch type: Fargate
   - Desired count: 1
   - VPC + **public subnets** (simplest without domain)
   - Assign public IP: **enabled** (for tasks in public subnets)
   - Security group: allow 3000 from ALB only
   - Load balancer: attach to ALB target group
5. Copy the ALB **DNS name** from the load balancer details page

## Step 7 — Firebase + reCAPTCHA (ALB hostname)

**Firebase Console** → Authentication → Settings → **Authorized domains**

Add the ALB hostname only, e.g. `ward-campaign-1234567890.ap-south-1.elb.amazonaws.com`

**Google Cloud** → reCAPTCHA → your key → **Domains** → add the same hostname.

## Step 8 — Verify

```bash
# Use your ALB DNS (HTTP)
curl http://ward-campaign-xxxxx.ap-south-1.elb.amazonaws.com/api/health
# → {"status":"ok",...}

# Benchmarks
echo 'BENCH_PROD_URL=http://ward-campaign-xxxxx.ap-south-1.elb.amazonaws.com' >> .env.local
npm run bench:prod
```

Test login with real phone OTP at `http://<alb-dns>/en/login`.

## Env reference

See [docs/ENV.md](../../docs/ENV.md) — ECS splits secrets (Secrets Manager) vs task env vs Docker build args.

## Redeploy (new code)

```bash
./deploy/aws/build-and-push.sh

aws ecs update-service \
  --cluster ward-campaign \
  --service ward-campaign \
  --force-new-deployment \
  --region ap-south-1
```

Run migrations if schema changed:

```bash
./deploy/aws/migrate.sh
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Task fails to start | Check CloudWatch `/ecs/ward-campaign` logs |
| Health check failing | Ensure `/api/health` returns 200; check `DATABASE_URL` |
| S3 upload fails | Verify task role has S3 policy; `AWS_S3_BUCKET` set |
| Firebase OTP fails | Add ALB hostname to Firebase authorized domains + reCAPTCHA key domains |
| `NEXT_PUBLIC_*` wrong | Rebuild image with correct build args |

## Cost estimate (minimal)

| Service | ~Monthly |
|---------|----------|
| ECS Fargate (0.5 vCPU, 1GB) | ~$15–20 |
| ALB | ~$18 |
| ECR | ~$1 |
| S3 + Neon | Existing |

Scale to 0 is not supported on Fargate; use desired count 0 to stop tasks when not needed.
