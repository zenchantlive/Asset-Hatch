# Vercel Deployment Guide for Asset Hatch

This guide walks you through deploying Asset Hatch to Vercel with PostgreSQL.

## 📋 Prerequisites

- GitHub repository with Asset Hatch code
- Vercel account (free tier works)
- GitHub OAuth App for production
- OpenRouter API key

---

## 🚀 Deployment Steps

### 1. Prepare Migration Files (Local - One Time)

Before deploying, generate the initial migration files locally:

```bash
cd src
bunx prisma migrate dev --name init
```

This creates `src/prisma/migrations/` directory with migration SQL files. Commit these files:

```bash
git add src/prisma/migrations
git commit -m "feat(db): Add initial Prisma migrations for production"
git push origin main
```

### 2. Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. **Framework Preset**: Auto-detected as Next.js ✅
5. **Root Directory**: Leave blank (vercel.json handles this)
6. Click **"Deploy"** (first deployment will fail - this is expected)

### 3. Add Vercel Postgres Storage

1. In your Vercel project → **Storage** tab
2. Click **"Create Database"** → Select **"Postgres"**
3. Choose a region close to your users (e.g., `US East (iad1)`)
4. Click **"Create"**

Vercel automatically sets these environment variables:
- `POSTGRES_PRISMA_URL` (for connection pooling)
- `DATABASE_URL` (direct connection)

### 4. Set Environment Variables

Go to **Settings** → **Environment Variables** and add:

| Variable | Value | Where to Get It |
|----------|-------|-----------------|
| `AUTH_SECRET` | Generate with `openssl rand -base64 32` | Terminal |
| `AUTH_GITHUB_ID` | Your GitHub OAuth Client ID | [GitHub OAuth Apps](https://github.com/settings/developers) |
| `AUTH_GITHUB_SECRET` | Your GitHub OAuth Client Secret | [GitHub OAuth Apps](https://github.com/settings/developers) |
| `OPENROUTER_API_KEY` | Your OpenRouter API key | [OpenRouter Keys](https://openrouter.ai/keys) |

**Note**: `POSTGRES_PRISMA_URL` and `DATABASE_URL` are auto-set by Vercel Postgres. Do NOT manually set these.

#### Environment Scopes

Set **all variables** for:
- ✅ Production
- ✅ Preview
- ✅ Development

### 5. Configure GitHub OAuth for Production

Create a **new** OAuth App for production (separate from local dev):

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: Asset Hatch (Production)
   - **Homepage URL**: `https://your-app.vercel.app`
   - **Callback URL**: `https://your-app.vercel.app/api/auth/callback/github`
4. Click **"Register application"**
5. Copy the **Client ID** and **Client Secret**
6. Add them to Vercel environment variables (step 4 above)

### 6. Trigger Deployment

After setting environment variables:

1. Go to **Deployments** tab
2. Find the failed deployment
3. Click **"⋮"** → **"Redeploy"**

Or push a new commit to trigger deployment:

```bash
git commit --allow-empty -m "chore: trigger Vercel deployment"
git push origin main
```

### 7. Verify Deployment

Once deployed:

1. Visit your deployment URL (e.g., `https://your-app.vercel.app`)
2. Click **"Sign in with GitHub"**
3. Authorize the app
4. Create a test project
5. Verify AI chat works (Gemini)
6. Test image generation (Flux)

---

## 🔧 Build Configuration

The build is configured via `vercel.json`:

```json
{
  "buildCommand": "cd src && bun install && bunx prisma generate && bunx prisma migrate deploy && bun run build",
  "outputDirectory": "src/.next",
  "installCommand": "cd src && bun install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### What Happens During Build:

1. `bun install` - Installs dependencies
2. `bunx prisma generate` - Generates Prisma Client (via `postinstall` script)
3. `bunx prisma migrate deploy` - Applies migrations to Vercel Postgres
4. `bun run build` - Builds Next.js app

---

## 🔐 Security Checklist

Before going live:

- ✅ All environment variables set in Vercel
- ✅ GitHub OAuth callback URL updated for production domain
- ✅ `AUTH_SECRET` is a strong random string (32+ characters)
- ✅ Database migrations committed to git
- ✅ `.env.local` is gitignored (never committed)
- ✅ OpenRouter spending limits configured
- ✅ Prisma migrations tested locally first

---

## 🐛 Troubleshooting

### Build fails with "Cannot find module '@prisma/client'"

**Solution**: Ensure `postinstall` script is in `package.json`:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

### "POSTGRES_PRISMA_URL is not defined"

**Solution**:
1. Verify Vercel Postgres is connected in **Storage** tab
2. Check environment variables are set for the correct scope (Production/Preview)
3. Redeploy after adding storage

### Auth redirects to localhost

**Solution**: Check GitHub OAuth callback URL is set to production domain:
- Homepage: `https://your-app.vercel.app`
- Callback: `https://your-app.vercel.app/api/auth/callback/github`

### Database migration fails

**Solution**:
1. Check migration files exist in `src/prisma/migrations/`
2. Run locally first: `bunx prisma migrate dev --name init`
3. Commit and push migrations to git
4. Redeploy

### Images fail to generate

**Solution**:
1. Check `OPENROUTER_API_KEY` is set correctly
2. Verify API key has credits in [OpenRouter Activity](https://openrouter.ai/activity)
3. Check Vercel function logs for errors

---

## 📊 Monitoring

After deployment:

- **Vercel Logs**: Check build and runtime logs in **Deployments** → **Functions**
- **OpenRouter Usage**: Monitor at [https://openrouter.ai/activity](https://openrouter.ai/activity)
- **Database**: Use `bunx prisma studio` with production `DATABASE_URL` (carefully!)

---

## 🔄 Updating Deployment

For code changes:

```bash
git add .
git commit -m "feat: description of changes"
git push origin main
```

Vercel auto-deploys on every push to `main`.

For database schema changes:

```bash
# 1. Update schema.prisma
# 2. Generate migration
bunx prisma migrate dev --name descriptive_name

# 3. Commit migration files
git add src/prisma/migrations
git commit -m "feat(db): Add descriptive_name migration"
git push origin main
```

---

## 💰 Cost Estimation

**Vercel**:
- Hobby Plan: Free (sufficient for demos)
- Pro Plan: $20/month (for production)

**OpenRouter** (BYOK model - users provide own keys):
- Admin key (for demos): ~$5-20/month depending on usage
- Users pay for their own usage with their API keys

**Total**: $0-40/month depending on plan and demo usage

---

## 🎯 Next Steps

After successful deployment:

1. Set custom domain (optional): **Settings** → **Domains**
2. Configure spending limits in OpenRouter dashboard
3. Enable GitHub Dependabot for security updates
4. Monitor Vercel Analytics for usage patterns

---

## 📞 Support

If you encounter issues:

1. Check [Vercel Docs](https://vercel.com/docs)
2. Check [Prisma Docs](https://www.prisma.io/docs)
3. Open an issue in the GitHub repository

---

**Last Updated**: 2026-01-04
