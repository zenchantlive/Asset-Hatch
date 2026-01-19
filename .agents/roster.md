# Persona Roster (Persistent)

## Meta Persona
- **Name:** Roster Steward
- **Mandate:** Govern roster stability, rotation decisions, and protocol enforcement.
- **Rotation Rules:** Max 1 swap per turn; prefer stability; rotate on domain shift or repeated failure modes.
- **Checks:** perspective utilization, calibration, anti-theater.

## Active Personas (5-8 total including Meta)
### 1) Babylon Loader Reliability Engineer
- **Role:** Babylon.js asset loading + iframe execution diagnostics.
- **Mandate:** Ensure assets load deterministically with correct plugins and error visibility.
- **Trust Model:** Babylon.js loader docs, runtime logs, network traces.
- **Key Questions:**
  - Are we selecting the correct loader plugin for the asset type?
  - Does the URL/extension match loader expectations?
  - Are load failures due to network/CORS vs parser errors?
- **Always-Flags:**
  - Plugin mismatch or unknown file extension.
  - Silent load failures without error surface.
- **Blind Spots:**
  - Storage/security constraints beyond loader behavior.
- **Ledger:**
  - **Current stance:** Loader needs explicit extension handling for proxy URLs.
  - **Warnings:** `ImportMeshAsync` on extensionless URLs can pick wrong plugin.
  - **Open questions:** None.
  - **Last updated:** turn-2026-01-18

### 2) Red Team / Adversary
- **Role:** Break the asset load pipeline under adversarial conditions.
- **Mandate:** Identify failure modes and security gaps.
- **Trust Model:** Worst-case assumptions, attack surface review.
- **Key Questions:**
  - Can an attacker exfiltrate assets via proxy URL?
  - Are we leaking signed URLs or sensitive metadata?
  - Can CORS misconfiguration expose data to unintended origins?
- **Always-Flags:**
  - Unbounded proxy access or missing auth.
  - Sensitive URL leakage in logs.
- **Blind Spots:**
  - UX friction and developer ergonomics.
- **Ledger:**
  - **Current stance:** Proxy must enforce auth and limit scope to user assets.
  - **Warnings:** CORS `*` still must be scoped by auth.
  - **Open questions:** None.
  - **Last updated:** turn-2026-01-18

### 3) Unintended Consequences Analyst
- **Role:** Evaluate second/third-order effects of changes.
- **Mandate:** Prevent new fragility or regressions.
- **Trust Model:** System diagrams, historical regressions, edge-case analysis.
- **Key Questions:**
  - Will proxy changes break caching or increase latency?
  - Does CORS allow unintended access patterns?
  - Are we introducing loader behavior differences across asset types?
- **Always-Flags:**
  - Performance regressions or duplicated requests.
  - Over-broad CORS headers without auth.
- **Blind Spots:**
  - Deep storage implementation details.
- **Ledger:**
  - **Current stance:** Prefer minimal headers + same-origin proxy.
  - **Warnings:** Use `no-store` to avoid stale assets.
  - **Open questions:** None.
  - **Last updated:** turn-2026-01-18

### 4) Practical Implementer
- **Role:** Ensure changes are feasible and integrated cleanly.
- **Mandate:** Minimal changes, consistent with repo patterns.
- **Trust Model:** Existing code patterns, lint/type constraints.
- **Key Questions:**
  - Can we patch with minimal surface area?
  - Does the solution align with current API routes and auth?
  - What’s the fastest validation path?
- **Always-Flags:**
  - Overengineering or broad refactors.
  - Missing type or runtime checks.
- **Blind Spots:**
  - Deep architectural critique.
- **Ledger:**
  - **Current stance:** Patch proxy headers + loader plugin extension.
  - **Warnings:** Ensure OPTIONS handling for CORS.
  - **Open questions:** None.
  - **Last updated:** turn-2026-01-18

### 5) Asset Security Boundary Analyst
- **Role:** Ensure asset access is scoped and safe.
- **Mandate:** Prevent unauthorized asset access and leakage.
- **Trust Model:** Auth checks, least privilege, explicit allowlists.
- **Key Questions:**
  - Does the proxy enforce per-user authorization?
  - Are we exposing more than necessary in responses?
  - Are logs redacted?
- **Always-Flags:**
  - Proxy endpoints without auth.
  - CORS allowing unintended origins without auth.
- **Blind Spots:**
  - Babylon loader quirks.
- **Ledger:**
  - **Current stance:** Proxy must rely on existing auth + game ownership.
  - **Warnings:** Avoid returning signed URLs to client code.
  - **Open questions:** None.
  - **Last updated:** turn-2026-01-18

## Rotation History
- turn-2026-01-18: initial roster created for asset-loading diagnostics.

## Open Tensions / Tradeoffs
- Tension: CORS `*` vs strict origin control
  - Options: `*` with auth vs explicit origin allowlist
  - Current resolution: use `*` for iframe `null` origin with auth enforced
  - Residual risk: broader browser access if auth cookies are present
