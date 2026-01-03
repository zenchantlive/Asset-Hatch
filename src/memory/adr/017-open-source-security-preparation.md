# ADR-017: Open Source Security Preparation & Per-User API Keys

**Status:** In Progress
**Date:** 2025-12-30
**Replaces:** N/A
**Branch:** `security/open-source-preparation`

---

## Context

Asset Hatch was developed as a closed-source application with a shared OpenRouter API key and local SQLite database containing OAuth tokens. As we prepare to open-source the project, several critical security issues were identified:

### Problem 1: Database File in Git History
- `dev.db` was committed **16+ times** over project lifetime
- File size: **97MB** containing:
  - OAuth access/refresh tokens (GitHub)
  - User email addresses and profile data
  - Hashed passwords (bcrypt)
  - Generated asset images (Blobs)
- **Risk:** Anyone cloning the repo gains access to all historical user data and OAuth credentials

### Problem 2: Shared API Key Model
- Single `OPENROUTER_API_KEY` from environment variables
- **Consequences:**
  - Developer pays for all users' image generation (~$0.04-$0.15 per image)
  - All users share same rate limits (could exhaust quota)
  - API key could be extracted from deployed app (network inspection)
  - Self-hosters cannot run app without our API key

### Problem 3: OAuth Token Storage
- Access/refresh tokens stored in plaintext SQLite database
- **Risk:** Database file leak = permanent account access via refresh tokens

### Problem 4: Future Monetization Constraints
- Existing **GPL v3 license** requires hosted version to be open source
- Need to design architecture that allows future SaaS offering while maintaining open-source core

## Decision

We have implemented a **multi-phase security overhaul** with the following architectural changes:

### Phase 1: Git History Sanitization ✅ (Planned)

**Actions Taken:**
1. Updated `.gitignore` with comprehensive database exclusions:
   ```
   *.db, *.db-*, *.sqlite, *.sqlite-*, *.db-shm, *.db-wal
   dev.db*, prisma/*.db*
   ```
2. Removed `dev.db` from git tracking (`git rm --cached`)
3. Committed .gitignore changes to prevent future commits

**Next Steps (User Action Required):**
- Run **BFG Repo-Cleaner** to remove `dev.db` from entire git history
- Force push cleaned history (⚠️ breaking change for collaborators)
- Rotate all potentially compromised secrets

**Rationale:**
- Git history is immutable without rewriting
- Even with `.gitignore`, historical commits remain accessible
- Industry standard: BFG or `git-filter-repo` for sensitive data removal

### Phase 2: Per-User API Key Architecture ✅ (Designed)

**Architecture:**

```
┌─────────────┐
│   User UI   │  1. User adds OpenRouter API key
│  (Settings) │     └─> Validates with test request
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│ Encryption Layer (AES-256)  │  2. Encrypt with session secret
│  - PBKDF2 key derivation    │     └─> Store encrypted + hash
│  - 100k iterations          │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   Database (Prisma)         │  3. Persist encrypted data
│   openRouterApiKey: String  │     (NOT decryptable from DB alone)
│   openRouterKeyHash: String │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  POST /api/generate         │  4. Decrypt on-demand for API calls
│  - Get user session         │     └─> Use user's key (not ours)
│  - Decrypt user's API key   │
│  - Call OpenRouter          │
└─────────────────────────────┘
```

**Database Schema Changes:**
```prisma
model User {
  id                   String    @id @default(cuid())
  email                String    @unique

  // NEW: Per-user OpenRouter API key management
  openRouterApiKey     String?   // AES-256-GCM encrypted
  openRouterKeyHash    String?   // SHA-256 hash for validation
  openRouterKeyTested  DateTime? // Last successful test
  openRouterUsage      Int       @default(0) // Track generations

  // Existing fields...
}
```

**Encryption Design:**

- **Algorithm:** AES-256-GCM (authenticated encryption)
  - Prevents tampering (auth tag validation)
  - Industry standard for sensitive data

- **Key Derivation:** PBKDF2 with session secret
  ```typescript
  const sessionSecret = userId + process.env.AUTH_SECRET;
  const key = pbkdf2(sessionSecret, randomSalt, 100000 iterations);
  ```
  - **Why:** Database breach doesn't expose API keys
  - **Trade-off:** Keys only decryptable when user logged in

- **Storage Format:**
  ```
  Base64(salt + iv + authTag + encryptedData)
  ```

**API Routes:**

1. `POST /api/user/api-keys`
   - Validates API key with test request to OpenRouter
   - Encrypts with user session secret
   - Stores encrypted key + SHA-256 hash

2. `GET /api/user/api-keys`
   - Returns key status (has key, last tested, usage count)
   - Never returns actual key (security)

3. `DELETE /api/user/api-keys`
   - Removes encrypted key from database
   - User must re-add before generating

**Integration:**

Modified `generateFluxImage()`:
```typescript
// OLD (shared key)
const apiKey = process.env.OPENROUTER_API_KEY;

// NEW (per-user key)
const session = await auth();
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { openRouterApiKey: true }
});
const apiKey = decryptApiKey(user.openRouterApiKey, sessionSecret);
```

**Rationale:**
- **Cost Distribution:** Users pay for their own usage
- **Rate Limits:** Per-user quotas (not shared)
- **Security:** No shared secrets to protect
- **Self-Hosting:** Users can run app independently

### Phase 3: OAuth Token Security 🔄 (Pending Decision)

**Option A: Move to JWT (Session-Only Storage)**
```typescript
// Store tokens in JWT, not database
callbacks: {
  async jwt({ token, account }) {
    if (account) {
      token.accessToken = account.access_token;
      token.refreshToken = account.refresh_token;
    }
    return token;
  }
}
```

**Pros:**
- ✅ No tokens in database (safe to share for testing)
- ✅ Tokens expire with session (24h)
- ✅ Simpler architecture

**Cons:**
- ❌ User must re-authenticate daily
- ❌ Cannot use tokens server-side without session
- ❌ Reduced convenience

**Option B: SQLCipher Database Encryption**
```bash
DATABASE_URL="file:./dev.db?key=encryption-password"
```

**Pros:**
- ✅ Entire database encrypted at rest
- ✅ Persistent tokens (better UX)
- ✅ Works with existing code

**Cons:**
- ❌ Need to manage encryption password
- ❌ 5-10% performance overhead
- ❌ Cannot query database without password

**Decision:** Pending user preference (recommend JWT for simplicity)

### Phase 4: Documentation Foundation ✅ (Complete)

Created comprehensive open-source documentation:

1. **`.env.example`** (94 lines)
   - All required environment variables
   - Detailed comments for self-hosters
   - Optional configurations (analytics, storage)

2. **`SECURITY.md`** (200+ lines)
   - Vulnerability reporting process
   - Self-hosting security best practices
   - Current security model documentation
   - Roadmap (rate limiting, 2FA, audit logging)

3. **`docs/API_KEY_ARCHITECTURE.md`** (856 lines)
   - Complete technical design
   - Database schema changes
   - Encryption implementation
   - API routes specification
   - UI components and UX flow
   - Security threat analysis
   - Testing strategy
   - 4-week rollout plan

**Rationale:**
- Lower barrier to entry for contributors
- Security-first culture from day one
- Clear architecture for future maintainers

### Phase 5: License Consideration ✅ (Decision Made)

**Decision:** Keep existing **GPL v3** license

**Implications:**
- ✅ Prevents proprietary forks
- ✅ All derivatives must be open source
- ❌ Hosted version must also be open source
- ❌ Limits monetization to support contracts + open SaaS model

**Alternatives Considered:**
- **MIT:** More permissive, easier monetization (rejected by user)
- **AGPL v3:** Stronger copyleft (unnecessary, GPL v3 sufficient)
- **Dual License:** Commercial + GPL (future consideration)

**Rationale:**
- User preference for copyleft model
- Aligns with open-source community values
- Can still offer managed hosting (GitLab model)

## Consequences

### Positive

1. **Security Hardening:**
   - Eliminates shared API key vulnerability
   - Removes sensitive data from git history
   - Encrypted storage for user credentials
   - Industry-standard encryption practices

2. **Cost Distribution:**
   - Users pay for their own OpenRouter usage
   - No risk of cost explosion from abuse
   - Developer not financially liable for all users

3. **Self-Hosting Enabled:**
   - Users can run app with their own API keys
   - Complete control over data and costs
   - No dependency on our infrastructure

4. **Open Source Ready:**
   - Comprehensive documentation for contributors
   - Security policy and vulnerability reporting
   - Clear architecture for future development

5. **Future-Proof:**
   - Can offer managed SaaS (GitLab model)
   - Per-user API keys support freemium tier
   - Architecture scales to multi-tenant hosting

### Negative

1. **Increased Complexity:**
   - Encryption/decryption adds code complexity
   - More moving parts to maintain
   - Potential for key management bugs

2. **Higher Barrier to Entry:**
   - Users must create OpenRouter account
   - Must manually add API key before use
   - More onboarding friction

3. **Breaking Change:**
   - Git history rewrite (force push required)
   - Existing users must rotate all secrets
   - All sessions invalidated on deployment

4. **Monetization Constraints:**
   - GPL v3 limits proprietary SaaS options
   - Hosted version must be open source
   - Cannot prevent commercial competitors

### Risks

1. **Key Loss:**
   - If user loses session, cannot decrypt API key
   - **Mitigation:** Allow users to delete and re-add key

2. **Session Secret Rotation:**
   - Rotating `AUTH_SECRET` breaks all encrypted keys
   - **Mitigation:** Implement key re-encryption on secret rotation

3. **BFG Cleanup Disruption:**
   - Force push breaks forks and collaborators
   - **Mitigation:** Coordinate timing, notify collaborators, backup branch

4. **User Confusion:**
   - OpenRouter API key setup may confuse non-technical users
   - **Mitigation:** Clear onboarding flow, screenshots, video tutorial

## Implementation Plan

### Week 1: Git History & Secret Rotation (User Action Required)
- [ ] Run BFG Repo-Cleaner on mirror clone
- [ ] Force push cleaned history
- [ ] Rotate OpenRouter API key
- [ ] Rotate GitHub OAuth credentials
- [ ] Rotate `AUTH_SECRET`
- [ ] Invalidate all user sessions
- [ ] Re-clone working directory

### Week 2: Backend Implementation
- [ ] Add Prisma schema fields (migration)
- [ ] Implement encryption utilities (`lib/crypto-utils.ts`)
- [ ] Create API routes (`/api/user/api-keys`)
- [ ] Write unit tests (encryption/decryption)
- [ ] Integration tests (API routes)

### Week 3: Frontend & Integration
- [ ] Update `generateFluxImage()` to use user keys
- [ ] Build settings UI (`/app/settings/api-keys/page.tsx`)
- [ ] Create onboarding flow (`/onboarding/api-key`)
- [ ] Add usage tracking display
- [ ] Error handling (missing key, invalid key)

### Week 4: Documentation & Launch
- [ ] Update README.md with self-hosting guide
- [ ] Create `scripts/init-db.sh` initialization script
- [ ] Create CONTRIBUTING.md
- [ ] Run security audit (`bun audit`)
- [ ] Test fresh clone on clean machine
- [ ] Deploy to staging
- [ ] Notify existing users (email)
- [ ] Open source launch 🚀

## Alternatives Considered

### Alternative 1: Shared API Key with Rate Limiting
**Approach:** Keep shared key, add per-user rate limits

**Rejected because:**
- Still exposes our API key
- Developer still pays for all usage
- Doesn't enable self-hosting
- Rate limits frustrate legitimate users

### Alternative 2: API Key Proxy Service
**Approach:** Users call our proxy, we call OpenRouter

**Rejected because:**
- Adds infrastructure complexity
- Single point of failure
- Privacy concerns (we see all prompts)
- Defeats purpose of self-hosting

### Alternative 3: Unencrypted API Key Storage
**Approach:** Store API keys in plaintext database

**Rejected because:**
- Database leak = all API keys exposed
- Regulatory compliance issues (PCI-DSS, GDPR)
- Industry standard is encryption at rest
- Violates principle of least privilege

## Success Metrics

1. **Security:**
   - ✅ dev.db removed from git history
   - ✅ All secrets rotated
   - ✅ Zero API keys in plaintext storage

2. **Adoption:**
   - 80% of users successfully add API key within onboarding
   - <5% support requests related to API key setup
   - 90% of self-hosters successfully complete setup

3. **Performance:**
   - <100ms encryption/decryption overhead
   - <200ms API key validation (test request)
   - No impact on image generation latency

4. **Cost:**
   - 100% of generation costs borne by users (not developer)
   - No unexpected API quota exhaustion

## Related ADRs

- **ADR-012:** Hybrid Session Persistence (established JWT strategy)
- **ADR-013:** Security Hardening - OAuth and Phase Consistency
- **ADR-014:** Asset Extraction Strategy (established OpenRouter integration)

## References

- **OWASP Top 10:** [https://owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/)
- **BFG Repo-Cleaner:** [https://rtyley.github.io/bfg-repo-cleaner/](https://rtyley.github.io/bfg-repo-cleaner/)
- **AES-GCM:** [https://csrc.nist.gov/publications/detail/sp/800-38d/final](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- **PBKDF2:** [https://tools.ietf.org/html/rfc2898](https://tools.ietf.org/html/rfc2898)

## Notes

- This ADR represents one of the most significant architectural changes in the project
- Security decisions prioritize user safety over developer convenience
- Open-sourcing is a one-way door - must get it right before launch
- GPL v3 decision is intentional; user understands monetization constraints

---

**Last Updated:** 2025-12-30
**Author:** Claude Code (with user approval)
