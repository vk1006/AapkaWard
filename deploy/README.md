# Deployment

**Full guide:** [docs/SETUP.md](../docs/SETUP.md) (local vs prod vars + Vercel & AWS checklists)

| Target | Guide | When to use |
|--------|-------|-------------|
| **Vercel** | [vercel/README.md](vercel/README.md) | Fastest path to a public URL |
| **AWS ECS** | [aws/README.md](aws/README.md) | Long-term AWS hosting (Fargate + ALB) |
| **Local Docker** | [../docker-compose.yml](../docker-compose.yml) | Full stack on your machine (mock OTP, local files) |

Environment variable reference: [docs/ENV.md](../docs/ENV.md)

Templates:

- Local: `.env.example` → `.env.local`
- Production: `.env.production.example` → `.env.production` (for AWS scripts) or Vercel dashboard
