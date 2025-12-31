# Security Policy

## Reporting a Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via GitHub Security Advisories:
- Go to https://github.com/zenchantlive/Asset-Hatch/security/advisories
- Click "Report a vulnerability"
- Fill in the details

### What to Include

Please include as much of the following information as possible:

- **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
- **Affected component** (e.g., API endpoint, specific file)
- **Steps to reproduce** the vulnerability
- **Proof of concept** or exploit code (if available)
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 7-30 days
  - Medium: 30-90 days
  - Low: Best effort

---

## Security Best Practices for Self-Hosting

### 1. Environment Variables

**NEVER commit your `.env.local` file to git.**

```bash
# Generate strong secrets
openssl rand -base64 32  # For AUTH_SECRET
```

### 2. API Key Management

**Protect your OpenRouter API key:**

- Store in `.env.local` (gitignored)
- Never hardcode in source files
- Rotate immediately if exposed
- Monitor usage at https://openrouter.ai/activity
- Set spending limits in OpenRouter dashboard

### 3. Database Security

**For production deployments:**

```bash
# Use encrypted database
DATABASE_URL="file:./prod.db?key=your-encryption-password"

# Set proper file permissions
chmod 600 prod.db
```

**Never expose your database file:**
- Add `*.db` to `.gitignore` (already done)
- Don't commit to public repos
- Contains OAuth tokens and user data

### 4. OAuth Security

**GitHub OAuth setup:**

- Use different OAuth apps for dev/production
- Set callback URL to exact production domain
- Rotate `AUTH_GITHUB_SECRET` if exposed

**Session security:**
```bash
# Strong AUTH_SECRET required
AUTH_SECRET="minimum-32-character-random-string"

# HTTPS only in production
NEXTAUTH_URL="https://your-domain.com"
```

### 5. Input Validation

**All user inputs are validated:**

- Zod schemas on API routes
- SQL injection prevention via Prisma ORM
- XSS prevention via React's built-in escaping
- File upload validation (size, type, content)

**If extending the codebase:**
- Always validate user input with Zod
- Use parameterized queries (Prisma handles this)
- Sanitize HTML content before rendering

### 6. Dependency Updates

```bash
# Check for vulnerabilities
bun audit

# Update dependencies
bun update
```

**Enable Dependabot alerts:**
- Go to Settings → Security & analysis
- Enable "Dependabot alerts"
- Enable "Dependabot security updates"

---

## Known Security Considerations

### Current Security Model

**User API Keys (Open Source Model):**
- Users provide their own OpenRouter API keys
- Keys are stored encrypted in the database
- Encryption uses user-specific session secrets
- Keys are never logged or exposed in responses

**OAuth Token Storage:**
- Currently stored in database (encrypted via SQLCipher recommended)
- Alternative: Store in JWT (session-only, no database persistence)
- Tokens expire with session (24 hours default)

### Security Roadmap

**Planned improvements:**
- [ ] Add rate limiting per user/API key
- [ ] Implement API key rotation mechanism
- [ ] Add 2FA support
- [ ] Enhanced audit logging
- [ ] Automated security scanning in CI/CD

---

## Security Hall of Fame

We recognize and thank security researchers who responsibly disclose vulnerabilities.

*No vulnerabilities reported yet. Be the first!*

---

**Last Updated:** 2025-12-30
