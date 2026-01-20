# Asset Pipeline Analysis Personas

**Purpose**: These personas should be invoked by the next AI session when analyzing the asset loading failure. Each persona brings a specific lens to the problem.

---

## Persona 1: CloudFront Signed URL Expert

**Real Name**: Policy, Signature, Key-Pair-Id

**Background**: 10 years designing CDN caching strategies with signed URLs. Specializes in AWS CloudFront, signed cookies, and pre-signed URLs.

**Key Questions**:
1. "What's the default expiration time on Tripo3D's signed URLs? Can we configure it?"
2. "Can we use a lambda@edge to refresh signatures on-demand without hitting the origin?"
3. "What's the difference between signed URLs and signed cookies for our use case?"
4. "Are CloudFront edge caches caching the 403 responses?"

**What This Viewpoint Sees**:
- The URL has `Policy=, Signature=, Key-Pair-Id=` parameters
- These are time-limited cryptographic proofs
- When they expire, the URL becomes a 403 Forbidden
- Edge caches might be caching the rejection

**Blind Spots**:
- Doesn't consider client-side storage solutions
- Assumes CloudFront is the right tool

---

## Persona 2: Game Asset Pipeline Architect

**Real Name**: Shipping 3D Models to Players

**Background**: Led asset pipelines for shipped games on mobile and console. Knows how Unity/UE5 handle asset bundling, LODs, and streaming.

**Key Questions**:
1. "How do shipped games actually deliver 3D assets? Do they use signed URLs?"
2. "What's the industry standard for asset versioning when assets update?"
3. "Should assets be bundled at build time or streamed at runtime?"
4. "What's the file size limit for browser-downloadable assets?"

**What This Viewpoint Sees**:
- Most shipped games bundle assets in the application
- Runtime streaming is for open-world games with GB of assets
- For <100MB games, bundling is simpler
- Asset updates typically require app updates or hotfix systems

**Blind Spots**:
- May over-engineer for a web-based prototype
- Doesn't consider the "AI generates code" workflow

---

## Persona 3: Babylon.js Loading Specialist

**Real Name**: The `ASSETS` Global and Beyond

**Background**: Core contributor to Babylon.js asset loading system. Knows `ASSETS.load()`, `ImportMeshAsync`, `SceneLoader`, and caching strategies.

**Key Questions**:
1. "What happens inside ASSETS.load when it returns null? Is there debugging we can enable?"
2. "Does ASSETS have built-in caching we can leverage?"
3. "What's the difference between loading from a URL vs loading from an ArrayBuffer?"
4. "Can we intercept the fetch request to add auth headers?"

**What This Viewpoint Sees**:
- `ASSETS.load()` wraps a more complex loading mechanism
- It tries multiple strategies (fetch, XHR, scene loader)
- When it returns null, all strategies failed
- The actual fetch errors might be swallowed

**Blind Spots**:
- Doesn't consider server-side solutions
- Assumes client-side loading is the only path

---

## Persona 4: Security/Crypto Boundary Analyst

**Real Name**: Token Expiration, CORS, and Trust Boundaries

**Background**: Security researcher specializing in web authentication and API design. Knows OAuth, JWT, and signed request patterns.

**Key Questions**:
1. "What attack does URL signing prevent? Are we protecting against it?"
2. "Is CORS blocking our direct access, or is it the signed URL?"
3. "Should we use a proxy that adds auth headers, rather than client-side signatures?"
4. "What happens if someone shares a signed URL? Does it expire for everyone?"

**What This Viewpoint Sees**:
- Signed URLs protect the origin from unauthorized access
- They're designed for "anyone with the link can access until expiration"
- If URLs are meant for the user, why do they expire so quickly?
- The real question: who should be able to access these assets?

**Blind Spots**:
- May over-engineer security for a prototype
- Doesn't consider UX of re-authentication

---

## Persona 5: Web Storage & Caching Strategist

**Real Name**: IndexedDB, Cache API, and Service Workers

**Background**: Expert in browser storage APIs. Has shipped apps that cache GB of data in the browser.

**Key Questions**:
1. "Can we download the GLB once and cache it in IndexedDB?"
2. "What's the browser storage limit? Can we cache 100MB+ of assets?"
3. "Should we use the Cache API for URL-based assets?"
4. "How do we invalidate the cache when the asset updates?"

**What This Viewpoint Sees**:
- The browser can store large amounts of data
- IndexedDB can hold ArrayBuffers of GLB files
- We could download on approval, store forever, load from cache
- Cache invalidation is the hard part

**Blind Spots**:
- Doesn't consider users with limited storage
- May not account for browser privacy modes

---

## Persona 6: Cost/Business Model Analyst

**Real Name**: Storage, Bandwidth, and Sustainability

**Background**: Built infrastructure for content-heavy platforms. Knows R2, S3, and egress costs.

**Key Questions**:
1. "What's the cost difference between Tripo3D URLs vs self-hosted?"
2. "R2 has no egress fees - should we move assets there?"
3. "What's the storage cost per GB? Per month?"
4. "How often do users regenerate assets vs reuse existing ones?"

**What This Viewpoint Sees**:
- Tripo3D URLs have zero cost to us (they pay)
- Self-hosting has storage + bandwidth costs
- R2's no-egress model might be perfect for this
- But we need to download first, which costs bandwidth

**Blind Spots**:
- Doesn't consider technical complexity of migration
- May prioritize cost over reliability

---

## How to Use These Personas

When analyzing the asset loading failure:

1. **List all applicable personas** for this problem
2. **Speak in their voice** - use their terminology, ask their questions
3. **Document disagreements** - where do perspectives conflict?
4. **Synthesize** - what does the consensus look like?

Example output:

```
Analysis using 3 perspectives:

CloudFront Expert says: "The URL expired after 1 hour. We can extend this."
Babylon Specialist says: "ASSETS.load failed silently. Let's add logging."
Storage Strategist says: "Download once, cache forever in IndexedDB."

Consensus: Download on approval, cache locally, extend URL validity as backup.
```

---

## Current Problem Statement (for Persona Review)

> **Problem**: AI sees approved 3D assets in system prompt and `listUserAssets` output, but `ASSETS.load("assetKey", scene)` returns null. The Tripo3D URLs contain CloudFront signed parameters that expire before the scene loads.

> **Constraints**: 
> - Must work in browser
> - User approves assets in Asset Hatch
> - AI generates game code in Hatch Studios
> - Assets should load reliably across sessions

> **Assumptions to Question**:
> - We must use Tripo3D URLs as-is
> - Assets should load at runtime from external URLs
> - URL expiration is a feature, not a bug

**Task for Next Session**: Apply lattice.md protocol with these personas. Develop a solution that:
1. Makes assets load reliably
2. Doesn't require user re-approval
3. Is cost-effective
4. Works with existing asset generation workflow
