# ADR 008: WSL Authentication and Standalone Script Stability

## Context
Running Asset Hatch in a WSL environment on a Windows host (NTFS mount) introduced two critical stability issues:
1. **Auth.js v5 Failures**: The credentials sign-in provider failed with `CredentialsSignin` due to untrusted host headers in the virtualized WSL network.
2. **Database Connection Failures**: Standalone scripts (Seed, DB checks) failed with `SASL: SCRAM-SERVER-FIRST-MESSAGE` because environment variables from `.env.local` were not consistently loaded outside the Next.js runtime.

## Decision
1. **Force Host Trust**: Explicitly set `AUTH_TRUST_HOST=true` in the local environment for all WSL developers.
2. **Case-Insensitive Normalization**: Normalize all email inputs to lowercase in the Auth.js `authorize` callback to prevent mismatches with the registration logic.
3. **Explicit Dotenv Loading**: Standardize on using `dotenv` with absolute path resolution for all standalone TypeScript scripts to ensure database connection strings are always available.

## Consequences
- **Pros**: 
    - Reliable sign-in for demo accounts in local development.
    - Improved debugging for database issues via standalone scripts.
    - Elimination of case-sensitivity bugs in authentication.
- **Cons**: 
    - Requires developers to maintain `AUTH_TRUST_HOST` in their local `.env` files.
    - Slight boilerplate overhead for new standalone scripts.
