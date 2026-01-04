# Security Audit Workflow Setup

Due to GitHub App permissions, the security audit workflow file cannot be pushed directly via the GitHub API. Follow these steps to add it manually:

## Option 1: Add via GitHub Web Interface (Recommended)

1. Go to your repository on GitHub
2. Navigate to **Actions** tab
3. Click **"New workflow"**
4. Click **"set up a workflow yourself"**
5. Name it `security-audit.yml`
6. Copy and paste the content below
7. Click **"Commit changes"**

## Option 2: Add via Git CLI (Local)

If you have push access with full permissions:

```bash
# Create the workflow file locally
mkdir -p .github/workflows
cat > .github/workflows/security-audit.yml << 'EOF'
[paste content below]
EOF

# Commit and push
git add .github/workflows/security-audit.yml
git commit -m "feat(ci): Add automated security audit workflow"
git push origin main
```

## Workflow File Content

Copy this into `.github/workflows/security-audit.yml`:

```yaml
name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    # Run weekly on Mondays at 9:00 AM UTC
    - cron: '0 9 * * 1'
  workflow_dispatch: # Allow manual trigger

jobs:
  dependency-audit:
    name: Dependency Security Audit
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: cd src && bun install

      - name: Run Bun audit
        run: cd src && bun audit
        continue-on-error: true

      - name: Check for vulnerable packages
        run: cd src && bun outdated
        continue-on-error: true

  code-quality:
    name: Code Quality & Type Safety
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: cd src && bun install

      - name: Run TypeScript type checking
        run: cd src && bun run typecheck

      - name: Run ESLint
        run: cd src && bun run lint
        continue-on-error: true

  secret-scanning:
    name: Secret Scanning
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Check for hardcoded secrets
        run: |
          echo "Scanning for potential secrets..."

          # Check for common secret patterns
          if grep -r -E "(sk-|sk_live_|sk_test_|pk_|api[_-]?key|secret[_-]?key)[\s]*[=:][\s]*['\"][^'\"]{20,}['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next .; then
            echo "⚠️  WARNING: Potential hardcoded secrets found!"
            exit 1
          fi

          # Check if .env files are tracked
          if git ls-files | grep -E "^\.env$|^\.env\.local$|^\.env\.production$"; then
            echo "⚠️  WARNING: .env files should not be tracked in git!"
            exit 1
          fi

          # Check if database files are tracked
          if git ls-files | grep -E "\.db$|\.sqlite$"; then
            echo "⚠️  WARNING: Database files should not be tracked in git!"
            exit 1
          fi

          echo "✅ No obvious secrets found"

  prisma-validation:
    name: Database Schema Validation
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: cd src && bun install

      - name: Validate Prisma schema
        run: cd src && bunx prisma validate

      - name: Check for Prisma generate
        run: cd src && bunx prisma generate
```

## What This Workflow Does

1. **Dependency Audit**: Runs `bun audit` to check for known vulnerabilities
2. **Code Quality**: Runs TypeScript type checking and ESLint
3. **Secret Scanning**: Checks for hardcoded secrets and tracked sensitive files
4. **Prisma Validation**: Validates database schema and generates Prisma client

## When It Runs

- On every push to `main` or `develop` branches
- On every pull request to `main` or `develop`
- Weekly on Mondays at 9:00 AM UTC
- Manually via the Actions tab ("Run workflow" button)

## Alternative: Enable Dependabot Instead

If you prefer GitHub's built-in security features:

1. Go to **Settings** → **Security & analysis**
2. Enable **Dependabot alerts**
3. Enable **Dependabot security updates**

This provides similar dependency scanning without a custom workflow.

---

**Note**: The workflow file was generated during the security audit but couldn't be committed via the GitHub API due to `workflows` permission restrictions.
