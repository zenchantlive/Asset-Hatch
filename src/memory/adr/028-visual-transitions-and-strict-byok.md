# ADR 028: App-Wide Visual Transitions and Strict BYOK Enforcement

## Context
As Asset Hatch moved towards a more professional "Hatch Studios" experience, two friction points emerged:
1. **Visual Jarring**: Navigating between the dashboard and the complex Planning/Studio pages felt abrupt, with multiple loading states visible as assets and themes initialized.
2. **Security/Billing Discrepancy**: The BYOK (Bring Your Own Key) system had a silent fallback mechanism where if a user's key was malformed or empty, it would silently fall back to the system key, leading to unexpected billing for the maintainers and confusing 401 errors for the users.

## Decision
1. **Aurora Hatching Transition**: Implement a global `useAppTransition` hook and a full-page `FullPageTransition` component. This component uses high-performance CSS Aurora gradients and a pulsing logo to bridge the "loading gap" visually.
2. **Strict BYOK Priority**: Redesign the API provider selection to treat any user-provided key (including empty strings) as a hard override. This ensures that once a user opts into BYOK, the system key is never used as a fallback.
3. **Storage-Level Sanitization**: Sanitize all API keys (trimming whitespace and removing quotes) at the point of saving to the database, rather than just at the point of usage.

## Consequences
- **Pros**:
    - High-end, premium feel during project creation and loading.
    - Guaranteed cost control for the system maintainers.
    - Clearer error reporting when a user's specific key is failing.
- **Cons**:
    - Users with broken keys will be blocked immediately instead of silently falling back to a working system key (intended behavior).
