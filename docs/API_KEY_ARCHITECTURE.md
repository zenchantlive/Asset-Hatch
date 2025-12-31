# API Key Management Architecture

**Status**: Design Document
**Created**: 2025-12-30
**For**: Open Source Preparation

---

## Problem Statement

Currently, Asset Hatch uses a single `OPENROUTER_API_KEY` from environment variables. This creates several problems for open-sourcing:

1. **Cost Burden**: Developer pays for all users' image generation
2. **Rate Limits**: All users share the same API quota
3. **Security Risk**: API key could be extracted from deployed app
4. **No Self-Hosting**: Users can't run the app without our API key

## Solution: Per-User API Key Management

Users provide their own OpenRouter API keys, stored encrypted in the database, and used for their own image generation requests.

---

## Architecture Overview

```
┌─────────────┐
│   User UI   │
│  (Settings) │
└──────┬──────┘
       │ 1. Add API Key
       ▼
┌─────────────────────────────┐
│   POST /api/user/api-keys   │
│  - Validate key with test   │
│  - Encrypt with user secret │
│  - Store hash for validation│
└──────┬──────────────────────┘
       │ 2. Save encrypted
       ▼
┌─────────────────────────────┐
│      Database (Prisma)      │
│  User {                     │
│    openRouterApiKey: String │ ← AES-256 encrypted
│    openRouterKeyHash: String│ ← SHA-256 for validation
│  }                          │
└──────┬──────────────────────┘
       │ 3. Retrieve & decrypt
       ▼
┌─────────────────────────────┐
│    POST /api/generate       │
│  - Get user session         │
│  - Decrypt user's API key   │
│  - Call OpenRouter with key │
└─────────────────────────────┘
```

---

## Database Schema Changes

### Prisma Schema Update

```prisma
model User {
  id                   String    @id @default(cuid())
  email                String    @unique
  name                 String?
  image                String?
  hashedPassword       String?

  // NEW: OpenRouter API Key Management
  openRouterApiKey     String?   // AES-256 encrypted key
  openRouterKeyHash    String?   // SHA-256 hash for validation
  openRouterKeyTested  DateTime? // Last successful test
  openRouterUsage      Int       @default(0) // Track # of generations

  // Existing relations
  accounts             Account[]
  sessions             Session[]
  projects             Project[]

  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}
```

### Migration Strategy

```bash
# Create migration
bunx prisma migrate dev --name add_user_api_keys

# Migration SQL (auto-generated)
ALTER TABLE User ADD COLUMN openRouterApiKey TEXT;
ALTER TABLE User ADD COLUMN openRouterKeyHash TEXT;
ALTER TABLE User ADD COLUMN openRouterKeyTested DATETIME;
ALTER TABLE User ADD COLUMN openRouterUsage INTEGER DEFAULT 0;
```

---

## Encryption Implementation

### Design Decisions

**Encryption Algorithm**: AES-256-GCM (Galois/Counter Mode)
- Authenticated encryption (prevents tampering)
- Industry standard
- Supported by Node.js crypto module

**Encryption Key Source**: User session secret
- Unique per user
- Rotates on logout
- Not stored in database

**Why NOT store encryption key in database?**
- If database is compromised, all keys are compromised
- Session-based keys mean keys are only decryptable when user is logged in

### Encryption Utility

```typescript
// lib/crypto-utils.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Derive encryption key from user session secret
 */
export function deriveKey(sessionSecret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    sessionSecret,
    salt,
    100000, // iterations
    32,     // key length (256 bits)
    'sha256'
  );
}

/**
 * Encrypt API key with user session secret
 */
export function encryptApiKey(apiKey: string, sessionSecret: string): string {
  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive encryption key from session secret
  const key = deriveKey(sessionSecret, salt);

  // Encrypt
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(apiKey, 'utf8'),
    cipher.final()
  ]);

  // Get auth tag
  const authTag = cipher.getAuthTag();

  // Combine: salt + iv + authTag + encrypted
  const result = Buffer.concat([salt, iv, authTag, encrypted]);

  return result.toString('base64');
}

/**
 * Decrypt API key with user session secret
 */
export function decryptApiKey(encryptedData: string, sessionSecret: string): string {
  // Decode from base64
  const buffer = Buffer.from(encryptedData, 'base64');

  // Extract components
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = buffer.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  // Derive encryption key
  const key = deriveKey(sessionSecret, salt);

  // Decrypt
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

/**
 * Hash API key for validation (SHA-256)
 */
export function hashApiKey(apiKey: string): string {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}
```

---

## API Routes

### 1. Add/Update API Key

**Endpoint**: `POST /api/user/api-keys`

```typescript
// app/api/user/api-keys/route.ts
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { encryptApiKey, hashApiKey } from '@/lib/crypto-utils';
import { z } from 'zod';

const apiKeySchema = z.object({
  apiKey: z.string().startsWith('sk-or-v1-'),
});

export async function POST(req: Request) {
  // 1. Authenticate
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate input
  const body = await req.json();
  const parsed = apiKeySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid API key format' }, { status: 400 });
  }

  const { apiKey } = parsed.data;

  // 3. Test API key with OpenRouter
  try {
    const testResponse = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!testResponse.ok) {
      return Response.json(
        { error: 'Invalid API key - OpenRouter test failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    return Response.json(
      { error: 'Failed to validate API key' },
      { status: 500 }
    );
  }

  // 4. Encrypt and hash
  const sessionSecret = session.user.id + process.env.AUTH_SECRET;
  const encryptedKey = encryptApiKey(apiKey, sessionSecret);
  const keyHash = hashApiKey(apiKey);

  // 5. Store in database
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      openRouterApiKey: encryptedKey,
      openRouterKeyHash: keyHash,
      openRouterKeyTested: new Date(),
    },
  });

  return Response.json({
    success: true,
    testedAt: new Date().toISOString(),
  });
}
```

### 2. Get API Key Status

**Endpoint**: `GET /api/user/api-keys`

```typescript
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      openRouterKeyHash: true,
      openRouterKeyTested: true,
      openRouterUsage: true,
    },
  });

  return Response.json({
    hasKey: !!user?.openRouterKeyHash,
    lastTested: user?.openRouterKeyTested,
    usage: user?.openRouterUsage || 0,
  });
}
```

### 3. Delete API Key

**Endpoint**: `DELETE /api/user/api-keys`

```typescript
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      openRouterApiKey: null,
      openRouterKeyHash: null,
      openRouterKeyTested: null,
    },
  });

  return Response.json({ success: true });
}
```

---

## Image Generation Integration

### Update `generateFluxImage()`

```typescript
// lib/openrouter-image.ts
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { decryptApiKey } from '@/lib/crypto-utils';

export async function generateFluxImage(
  options: FluxGenerationOptions
): Promise<FluxGenerationResult> {
  // 1. Get current user session
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  // 2. Get user's API key
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { openRouterApiKey: true },
  });

  if (!user?.openRouterApiKey) {
    throw new Error(
      'OpenRouter API key not configured. Please add your API key in Settings.'
    );
  }

  // 3. Decrypt API key
  const sessionSecret = session.user.id + process.env.AUTH_SECRET;
  const apiKey = decryptApiKey(user.openRouterApiKey, sessionSecret);

  // 4. Generate image (existing logic)
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`, // Use user's key!
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.modelId,
      messages: [{ role: 'user', content: options.prompt }],
      modalities: ['image', 'text'],
    }),
  });

  // 5. Track usage
  await prisma.user.update({
    where: { id: session.user.id },
    data: { openRouterUsage: { increment: 1 } },
  });

  // ... rest of existing logic
}
```

---

## UI Components

### Settings Page: `/app/settings/api-keys/page.tsx`

**Features**:
- Input field for API key
- "Test Connection" button (validates before saving)
- Status indicator (✅ Active, ❌ Not configured)
- Usage counter
- Delete button

**UX Flow**:
```
1. User goes to Settings → API Keys
2. Enters OpenRouter API key
3. Clicks "Test Connection"
   ├─ Success → Save to database (encrypted)
   └─ Failure → Show error message
4. Status updates to "Active ✅"
5. Usage counter shows # of generations
```

### First-Run Experience

**New user flow**:
1. Sign up / sign in
2. Redirect to `/onboarding/api-key`
3. Prompt: "Add your OpenRouter API key to start generating"
4. Link to https://openrouter.ai/keys with instructions
5. After adding key → Redirect to dashboard

---

## Security Considerations

### Threats & Mitigations

| Threat | Mitigation |
|--------|------------|
| **Database breach** | Keys encrypted with session secrets (not in DB) |
| **Man-in-the-middle** | HTTPS only, secure cookies |
| **Session hijacking** | JWT with short expiry (24h), httpOnly cookies |
| **Key extraction from logs** | Never log API keys, use `***` masking |
| **Replay attacks** | Auth tags in AES-GCM prevent tampering |
| **Brute force decryption** | PBKDF2 with 100k iterations + random salt |

### Additional Protections

1. **Rate Limiting**:
   ```typescript
   // Max 10 API key operations per hour per user
   // Max 100 image generations per hour per user
   ```

2. **Audit Logging**:
   ```typescript
   // Log all API key changes (add, update, delete)
   // Include timestamp, user ID, IP address
   ```

3. **Key Rotation**:
   ```typescript
   // Warn users if key is >90 days old
   // Provide "Rotate Key" button in UI
   ```

---

## Fallback for Development

For local development without user API keys:

```typescript
// lib/openrouter-image.ts
export async function generateFluxImage(options) {
  // Try user's API key first
  let apiKey = await getUserApiKey();

  // Fallback to env var for development
  if (!apiKey && process.env.NODE_ENV === 'development') {
    apiKey = process.env.OPENROUTER_API_KEY;
    console.warn('⚠️  Using fallback API key from .env for development');
  }

  if (!apiKey) {
    throw new Error('No API key configured');
  }

  // ... rest of logic
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// lib/__tests__/crypto-utils.test.ts
describe('API Key Encryption', () => {
  it('should encrypt and decrypt API key', () => {
    const key = 'sk-or-v1-test-key';
    const secret = 'user-session-secret';

    const encrypted = encryptApiKey(key, secret);
    const decrypted = decryptApiKey(encrypted, secret);

    expect(decrypted).toBe(key);
  });

  it('should fail with wrong session secret', () => {
    const key = 'sk-or-v1-test-key';
    const encrypted = encryptApiKey(key, 'secret-1');

    expect(() => {
      decryptApiKey(encrypted, 'secret-2');
    }).toThrow();
  });
});
```

### Integration Tests

```typescript
// app/api/user/api-keys/__tests__/route.test.ts
describe('POST /api/user/api-keys', () => {
  it('should save valid API key', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/user/api-keys', {
        method: 'POST',
        body: JSON.stringify({ apiKey: 'sk-or-v1-valid-key' }),
      })
    );

    expect(response.status).toBe(200);
  });

  it('should reject invalid API key', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/user/api-keys', {
        method: 'POST',
        body: JSON.stringify({ apiKey: 'invalid-key' }),
      })
    );

    expect(response.status).toBe(400);
  });
});
```

---

## Rollout Plan

### Phase 1: Backend Implementation (Week 1)
- [ ] Add Prisma schema fields
- [ ] Create migration
- [ ] Implement encryption utilities
- [ ] Create API routes
- [ ] Write unit tests

### Phase 2: Integration (Week 2)
- [ ] Update `generateFluxImage()`
- [ ] Add fallback for development
- [ ] Integration tests
- [ ] Error handling

### Phase 3: UI (Week 3)
- [ ] Build settings page
- [ ] Add onboarding flow
- [ ] Usage tracking UI
- [ ] Test in staging

### Phase 4: Deployment (Week 4)
- [ ] Run migration on production
- [ ] Deploy code
- [ ] Monitor errors
- [ ] Notify existing users

---

## Open Questions

1. **What happens to existing users?**
   - Prompt them to add API key on next login
   - Grace period: Allow env var fallback for 30 days
   - Send email notification

2. **Should we offer a free tier with our API key?**
   - Pro: Lower barrier to entry
   - Con: Cost exposure
   - Recommendation: Start with "BYO key" only, add free tier later

3. **How to handle key rotation?**
   - UI warning after 90 days
   - One-click rotation (add new, test, delete old)
   - Email reminders

---

**Status**: Ready for implementation after BFG cleanup and secret rotation.
