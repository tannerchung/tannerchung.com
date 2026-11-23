# Testing & Verification Contract (`TESTING.md`) — `tannerchung.com`

> Deterministic CI gate and local verification commands for `tannerchung.com` and `trade.tannerchung.com`. Keep in sync with `package.json` and `.factory/checks.sh`.

## 1. Runtime Prerequisites
- **Node.js:** `>=22.12.0` (`pnpm >= 9.0.0`).
- **Node 25+ WebStorage Flag:** When running Vitest on Node `25.x` (`/opt/homebrew/bin/node`), export `NODE_OPTIONS="--no-experimental-webstorage"` so jsdom `localStorage` is not shadowed. `.factory/checks.sh` sets this automatically.

## 2. Deterministic Gate Commands (`.factory/checks.sh`)
```bash
export PATH="/opt/homebrew/bin:$PATH"
export NODE_OPTIONS="--no-experimental-webstorage"

# 1. TypeScript strict check
pnpm run lint          # runs tsc --noEmit

# 2. Unit test suite (Vitest 3.2.7 + jsdom — 4 test files, 13 tests)
pnpm run test:unit     # runs tests/unit/{access,middleware,security,trade-sheets}.test.ts

# 3. Production Next.js 16 + Payload build (runs automatically in checks.sh when .env.local or .env exists)
pnpm run build

# Or run the full factory gate directly:
./.factory/checks.sh
```

## 3. Cross-Repo Seam Verification (`stockbot <-> tannerchung.com`)
Whenever modifying `src/lib/trade-sheets.ts`, `src/collections/TradeSheets.ts`, or `src/app/api/trade-sheets/ingest/route.ts`, run the ecosystem cross-repo contract suite:
```bash
/Users/tanner/.hermes/hermes-agent/venv/bin/python -m pytest -q \
  /Users/tanner/.hermes/tests/test_cross_repo_seams.py \
  /Users/tanner/.hermes/tests/test_ecosystem_registry_completeness.py
```

## 4. What Is Covered Today (`tests/unit/`)
- `tests/unit/access.test.ts` — `isAdmin` and `publishedOrAdmin` Payload access control guards.
- `tests/unit/middleware.test.ts` — `resolveHostRewrite()` and `resolveTradeLoginRedirect()` dual-host routing for `trade.tannerchung.com` vs `tannerchung.com`.
- `tests/unit/security.test.ts` — `checkRateLimit()` sliding window + `verifyTurnstileToken()` verification.
- `tests/unit/trade-sheets.test.ts` — `scrubSensitiveText()` (`8+` digit account redaction), `verifyIngestBearerToken()` constant-time check, `sanitizeTradeSheetInput()`, `extractEquityTicker()`, and `reanchorTicketWithSpot()` tick-size math.

## 5. Definition of Done (Every PR)
- [ ] `./.factory/checks.sh` exits `0` (`tsc --noEmit`, `vitest run`, `next build` when env present, `bash -n`).
- [ ] `pytest -q ~/.hermes/tests/test_cross_repo_seams.py` exits `0` if Trade Sheet types, redaction, or ingest routes were touched.
- [ ] Payload schema/global changes include `pnpm run generate:types` + committed `src/migrations/*` (`push: false` preserved).
- [ ] Affected `docs/{TRD,APP_FLOW,IMPLEMENTATION_PLAN,TESTING}.md` updated in the same PR.
