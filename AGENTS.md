# AGENTS.md — TannerChung.com & Sovereign Trade Desk (`tannerchung-com`)

> Canonical repository for **tannerchung.com** (public engineering/essays/lab site) and **trade.tannerchung.com** (authenticated Trade Sheet execution blotter). Keep this root file concise (<150 lines); authoritative technical, route, roadmap, and verification contracts live in `docs/`.

<!-- hermes-docs-index -->
## Canonical Repository Docs (`docs/`)
Read these repository docs before writing specs, `.hermes/plans/` tasks, or code:
- `docs/TRD.md` — Stack, dual-host routing (`tannerchung.com` vs `trade.tannerchung.com`), Supabase Supavisor `:6543`/`:5432` rules, `stockbot -> /api/trade-sheets/ingest` OpSec seam, security boundaries, and non-goals.
- `docs/APP_FLOW.md` — Public & private routes, host rewrites (`src/proxy.ts` / `src/lib/routing.ts`), 2-tab Trade Sheet blotter flows, and `admin`-only RBAC rules.
- `docs/IMPLEMENTATION_PLAN.md` — Shipped baseline, active hardening & content-detail milestones, and technical debt.
- `docs/TESTING.md` — Node `>=22.12.0` (`--no-experimental-webstorage` on Node `>=25`), Vitest unit suites, cross-repo seam tests, and Definition of Done.

## Non-Negotiable OpSec & Workspace Rules
- **Trade Desk Privacy Firewall:** Never expose `trade-sheets`, `trade-notes`, or `trade-desk-settings` to unauthenticated visitors or `viewer` users (`isAdmin` only). Never weaken `RAW_ACCT_NUM_RE` (`/\b\d{8,}\b/g`) account-number redaction or SHA-256 `timingSafeEqual` Bearer verification in `src/lib/trade-sheets.ts` (enforced daily by `~/.hermes/tests/test_cross_repo_seams.py`).
- **Schema Safety:** `push: false` is locked in `postgresAdapter` (`payload` Postgres schema); always run `pnpm run generate:types` and commit Drizzle migrations (`pnpm run migrate:create`).
- **Doc Sync Rule:** Any PR changing routes, host rewrites, Payload collections/globals, migrations, ingest schemas, or test commands **must** update affected `docs/*.md` in the same PR.
