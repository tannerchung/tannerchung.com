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

# 2. Unit & component test suite (Vitest 3.2.7 + jsdom — tests/unit/**/*.test.{ts,tsx} & src/**/*.test.{ts,tsx})
pnpm run test:unit

# 3. Storybook static build (Storybook v10 + @storybook/nextjs-vite + @storybook/addon-mcp + @storybook/addon-a11y)
pnpm run build-storybook   # or `pnpm run storybook` on :6006 for MCP / visual QA

# 4. Production Next.js 16 + Payload build (runs automatically in checks.sh when .env.local or .env exists)
pnpm run build

# Or run the full package check / factory gate directly:
pnpm run check
./.factory/checks.sh
```

## 3. Database Migration & RLS Verification
Every Payload schema change must use `push: false` + committed Drizzle migrations (`src/migrations/`). After running `CI=1 pnpm run migrate`, verify 100% RLS coverage across `payload` schema tables:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'payload' AND NOT rowsecurity;
-- Expected: 0 rows
```

## 4. Cross-Repo Seam Verification (`stockbot <-> tannerchung.com`)
Whenever modifying `src/lib/trade-sheets.ts`, `src/collections/TradeSheets.ts`, or `src/app/api/trade-sheets/ingest/route.ts`, run the ecosystem cross-repo contract suite:
```bash
/Users/tanner/.hermes/hermes-agent/venv/bin/python -m pytest -q \
  /Users/tanner/.hermes/tests/test_cross_repo_seams.py \
  /Users/tanner/.hermes/tests/test_ecosystem_registry_completeness.py
```

## 5. What Is Covered Today (`tests/unit/` & `src/**/*.test.tsx`)
- `tests/unit/access.test.ts` — `isAdmin` and `publishedOrAdmin` Payload access control guards.
- `tests/unit/middleware.test.ts` — `resolveHostRewrite()` and `resolveTradeLoginRedirect()` dual-host routing for `trade.tannerchung.com` vs `tannerchung.com`.
- `tests/unit/security.test.ts` — `checkRateLimit()` sliding window + `verifyTurnstileToken()` verification.
- `tests/unit/trade-sheets.test.ts` — `scrubSensitiveText()` (`8+` digit account redaction), `verifyIngestBearerToken()` constant-time check, `sanitizeTradeSheetInput()`, `extractEquityTicker()`, and `reanchorTicketWithSpot()` tick-size math.
- `tests/unit/payload-trade-blocks.test.ts` — `TRADE_BRIEFING_BLOCKS` (6 slugs), `TRADE_NOTE_LEXICAL_BLOCKS` (`valuationBand`, `killSwitchRule`), `validatePublicHttpsCitationUrl()` / `sanitizeCitationUrl()` SSRF & brokerage domain guards, unnamed `tabs` on `TradeSheets` & `TradeDeskSettings`, virtual `executionProgress`, `TradeNotes` drafts + `join`.
- `tests/unit/trade-sheets-briefing.test.ts` — Emoji/markdown/account-number prose scrubbing, briefing block compilation, citation index remapping, `mergeIngestBriefingBlocks()` human `deskAnnotation` preservation, and `POST /api/trade-sheets/ingest` auto-linking of published `trade-notes`.
- `src/components/trade-blocks/TradeBriefingBlocks.test.tsx` — Atomic presenters for all 6 briefing blocks, `TradeNoteThesisCard` (Lexical AST + inline `ValuationBand` & `KillSwitchRule`), `CitationsLedger`, and `StandingGuardrailsView`.
- `tests/unit/trade-sheet-view.test.tsx` — `TradeSheetView` 3-Room Hybrid A+B workbench (`blotter`, `briefing`/`strategy`, `citations`), `j`/`k` inspector navigation, `/checks` persistence, citation jump highlighting, and `strategyJson` fallback.

## 6. Definition of Done (Every PR)
- [ ] `./.factory/checks.sh` exits `0` (`tsc --noEmit`, `vitest run`, `next build` when env present, `bash -n`).
- [ ] `pnpm run build-storybook` exits `0` (`/storybook-static` gitignored).
- [ ] `pytest -q ~/.hermes/tests/test_cross_repo_seams.py` exits `0` if Trade Sheet types, redaction, or ingest routes were touched.
- [ ] Payload schema/global changes include `pnpm run generate:types`, `pnpm run generate:importmap`, committed additive `src/migrations/*` (`push: false` preserved), and `0` unprotected RLS tables in `payload` schema.
- [ ] Affected `docs/{TRD,APP_FLOW,IMPLEMENTATION_PLAN,TESTING}.md` updated in the same PR.
