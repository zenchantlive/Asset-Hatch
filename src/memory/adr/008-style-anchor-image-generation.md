 @009@00# ADR-008: Style Anchor Image Generation via OpenRouter Flux.2

**Status:** Accepted
**Date:** 2025-12-27
**Decision Makers:** Zenchant, Antigravity AI

---

## Context

The style anchor workflow requires generating a reference image that will guide all subsequent asset generation. This image must be generated via the OpenRouter API using the Flux.2 model, stored in the database, and displayed to the user in the StylePreview panel.

Key challenges:
1. **Model ID Accuracy** - OpenRouter model IDs differ from marketing names
2. **API Response Format** - Image data location varies between providers
3. **Token Limits** - Large base64 images can't be sent back through LLM context
4. **AI SDK v6 Message Parts** - Tool results have different structure than expected
5. **Frontend Reactive Updates** - useEffect loops when not carefully managed

---

## Decision

### 1. OpenRouter Flux.2 Model IDs

**Use exact OpenRouter model IDs, not marketing names:**

```typescript
// ✅ CORRECTdr
export const FLUX_MODELS = {
  'flux-2-dev': 'black-forest-labs/flux.2-dev',
  'flux-2-pro': 'black-forest-labs/flux.2-pro',
};

// ❌ WRONG (these don't exist on OpenRouter)
'black-forest-labs/flux.2-dev' // Returns 400 error
'black-forest-labs/flux.2-pro'  // Missing org prefix
```

### 2. OpenRouter Image Response Format

**Image data is in `message.images` array, NOT `message.content`:**

```typescript
// OpenRouter Flux response structure:
{
  choices: [{
    message: {
      role: 'assistant',
      content: '',  // Empty for image-only responses
      images: [{
        index: 0,
        type: 'image',
        image_url: { url: 'data:image/png;base64,...' }
      }]
    }
  }]
}

// Extraction logic:
const message = response.choices[0].message;
if (message.images?.[0]?.image_url?.url) {
  imageUrl = message.images[0].image_url.url;
}
```

### 3. Avoid Token Limit Errors - Client Fetches Image Separately

**Problem:** Returning 2MB base64 image in tool result → 1M+ tokens → API error

**Solution:** Return only `styleAnchorId` to LLM, client fetches image via separate API:

```typescript
// Server: /api/chat/route.ts - generateStyleAnchor tool
return {
  success: true,
  message: '[System] Style anchor image created.',
  styleAnchorId: result.styleAnchor.id,
  // DO NOT include imageUrl here - too large for LLM context
};

// Client: /api/style-anchor?id=... endpoint
// Returns full style anchor data including base64 image
```

### 4. AI SDK v6 Tool Part Detection

**Tool results use `tool-{toolName}` format, not `tool-result`:**

```typescript
// AI SDK v6 message parts structure:
message.parts = [
  { type: 'step-start', ... },
  { type: 'reasoning', ... },
  { type: 'tool-generateStyleAnchor', result: {...} },  // ← This format!
  { type: 'text', ... }
];

// Detection logic:
for (const part of message.parts) {
  if (part.type === 'tool-generateStyleAnchor') {
    const result = part.result;  // ← Uses 'result', not 'output'
  }
}
```

### 5. Prevent Infinite Fetch Loops with useRef

**Problem:** Set created inside useEffect resets on every render → infinite refetching

```typescript
// ❌ WRONG: Resets on every render
useEffect(() => {
  const processedIds = new Set<string>();  // Resets!
  // ... fetch logic
}, [messages]);

// ✅ CORRECT: Persists across renders
const processedStyleAnchorIds = useRef(new Set<string>());

useEffect(() => {
  if (!processedStyleAnchorIds.current.has(id)) {
    processedStyleAnchorIds.current.add(id);
    // ... fetch once
  }
}, [messages]);
```

---

## API Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Style Anchor Generation                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User: "Generate style anchor"                                │
│           ↓                                                      │
│  2. /api/chat → LLM calls generateStyleAnchor tool              │
│           ↓                                                      │
│  3. Tool executes: calls /api/generate-style internally         │
│           ↓                                                      │
│  4. /api/generate-style:                                        │
│      - Builds optimized Flux prompt                             │
│      - POST to OpenRouter /chat/completions                     │
│      - modalities: ['image', 'text']                            │
│      - Extracts image from message.images[].image_url.url       │
│      - Saves to Prisma (StyleAnchor table)                      │
│           ↓                                                      │
│  5. Returns { styleAnchorId } to LLM (NO image data)            │
│           ↓                                                      │
│  6. Client useEffect detects tool-generateStyleAnchor part      │
│           ↓                                                      │
│  7. Client fetches /api/style-anchor?id=xxx                     │
│           ↓                                                      │
│  8. onStyleAnchorGenerated({ id, imageUrl }) called             │
│           ↓                                                      │
│  9. StylePreview displays image                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## What Didn't Work (Debugging Notes)

### Attempt 1: Direct Image Generation Endpoint
- **Tried:** POST to `/api/v1/images/generations`
- **Result:** 405 Method Not Allowed
- **Why:** OpenRouter deprecated this endpoint; use chat/completions with modalities

### Attempt 2: Wrong Model IDs
- **Tried:** `black-foPrimary designated model is `black-forest-labs/flux.2-pro`.
- **Result:** 400 Bad Request
- **Why:** Model ID is `black-forest-labs/flux.2-pro`, not `flux.2-dev`

### Attempt 3: Extracting from message.content
- **Tried:** Parsing base64 from content string
- **Result:** Empty content, no image
- **Why:** Image data is in `message.images` array

### Attempt 4: Returning imageUrl in Tool Result
- **Tried:** Including full base64 in tool return
- **Result:** 429/Token limit exceeded (1M+ tokens)
- **Why:** 2MB base64 string overwhelms context window

### Attempt 5: Looking for `tool-result` Part Type
- **Tried:** `if (part.type === 'tool-result')`
- **Result:** Never matched
- **Why:** AI SDK v6 uses `tool-{toolName}` format

### Attempt 6: Checking `part.output`
- **Tried:** `const result = part.output`
- **Result:** Always undefined
- **Why:** Property is named `result`, not `output`

### Attempt 7: processedIds Set Inside useEffect
- **Tried:** `const processedIds = new Set()` inside effect
- **Result:** Infinite loop, 100s of fetches
- **Why:** Set resets on every render; need useRef

---

## Consequences

### Positive
- Style anchor images now generate and display correctly
- No token limit errors
- Consistent Flux.2 integration pattern established
- Clear separation of concerns: server stores, client fetches

### Negative
- Extra API call to fetch image (minor latency)
- More complex message part parsing

### Neutral
- Need to document OpenRouter-specific formats for future reference
- AI SDK v6 patterns different from v5 documentation

---

## Related ADRs
- ADR-005: Replace CopilotKit with Vercel AI SDK
- ADR-006: Generation Architecture
- ADR-007: Hybrid Persistence Model
