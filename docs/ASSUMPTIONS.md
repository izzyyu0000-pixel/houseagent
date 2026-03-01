# Assumptions and Conservative Choices

Date: 2026-02-28

## Assumptions

1. No explicit feature requirement was provided in this turn, so the safest actionable scope is repository hardening without changing product behavior.
2. `src/components/CardGenerator.tsx` is treated as protected core logic and intentionally left unchanged.
3. This workspace is currently missing `.git/`, so guardrails are implemented as local scripts instead of git hooks.

## Conservative, Rollback-Friendly Changes

1. Added `scripts/check-secrets.mjs` to detect common leaked-key patterns.
2. Added npm scripts:
   - `npm run check:secrets`
   - `npm test` (runs secrets scan + build)
3. No runtime behavior changes to the card generation flow.

## Known Limits

1. Pattern-based scanning can produce false positives/false negatives.
2. Without git metadata, this scan checks workspace files (with excludes) rather than staged files only.
