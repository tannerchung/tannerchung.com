# Implementation Plan (`IMPLEMENTATION_PLAN.md`) — `tannerchung.com`

> Repository-level milestone tracker (shipped baseline vs. active priorities). Per-feature TDD execution specs belong in `.hermes/plans/YYYY-MM-DD_*.md`.

## 1. Shipped Baseline (`main`)
- **Milestone 0 — Toolchain & Core Payload v3 Schema (`8c7354b`..`5b15e5e`):** Archived legacy static GitHub Pages site into `archive/`, initialized Next.js 16.4.6 + Payload CMS 3.94 + Supabase `payload` Postgres schema (`UUID`, `push: false`), Supavisor `:6543`/`:5432` pooler resolution, Cloudflare R2 media adapter, and Turnstile/rate-limit helpers.
- **Milestone 1 — Public Frontend, Dual-Host Trade Desk & Bearer Ingest (`48cc26b`..`c6f6841`):** Public routes (`/`, `/projects`, `/blog`, `/lab`), `src/proxy.ts` `trade.tannerchung.com` host routing & login guard, 2-tab `TradeSheetView` (`strategy` + `blotter`), `POST /api/trade-sheets/ingest` (`RAW_ACCT_NUM_RE` sanitizer + SHA-256 `timingSafeEqual`), checkbox persistence, and Yahoo Finance live quote re-anchoring.
- **Milestone 2 — MCP Plugin, Hallmark Lumen Theme & Ecosystem Manifest (`038a012`..`31390ea`):** `@payloadcms/plugin-mcp` migration, Hallmark Lumen token system (`Night`/`Day` drops, `SiteSettings` & `TradeDeskSettings` globals), `DeskChromeBar`, `.hermes-project.json`, and cross-repo `stockbot <-> tannerchung.com` seam tests.
- **Milestone 3 — Software Factory & Canonical Docs Baseline (`2026-11-22`):** `.factory/{config.json,checks.sh}`, `.env.local` tightened to `0600`, `AGENTS.md` index, and `docs/{TRD,APP_FLOW,IMPLEMENTATION_PLAN,TESTING}.md`.

## 2. Active & Upcoming Milestones

### Milestone 4 — Production Security & Resilience Hardening *(Next)*
- [ ] Fail closed in `src/payload.config.ts` when `NODE_ENV === 'production'` and `PAYLOAD_SECRET` is unset (remove silent fallback in prod).
- [ ] Enforce explicit `256KB` request payload cap in `POST /api/trade-sheets/ingest` (matching `ecosystem_topology.py` spec) and add `AbortSignal.timeout(8000)` to `fetchYahooSpot()` in `POST /api/trade-sheets/[date]/refresh-quotes`.
- [ ] Harden `resolveTradeLoginRedirect()` in `src/lib/routing.ts` to reject `//` protocol-relative or backslash paths, and wrap `getPayload()` in `/projects`, `/blog`, and `/lab` with graceful degraded error boundaries matching `/`.

### Milestone 5 — Content Detail Routes & Lab Component Registry
- [ ] Implement `/projects/[slug]`, `/blog/[slug]`, and `/lab/[slug]` detail routes rendering Lexical `richText` bodies, cover media, and `@payloadcms/plugin-seo` metadata.
- [ ] Build the `componentKey` registry for interactive `/lab` experiments (`motion`, `theme`, `interactive`, `instagram-skill`, `shader`).
- [ ] Add Playwright E2E smoke coverage for public pages, `trade.tannerchung.com` redirect guard, and authenticated blotter interactions.

## 3. Technical Debt & Known Gaps
- **Single-process rate limiter (`src/lib/security/rate-limit.ts`):** In-memory `Map` resets across serverless cold starts; Cloudflare Zero Trust / WAF edge rules provide primary perimeter protection in production.
- **Unused Turnstile component (`src/components/TurnstileField.tsx`):** Helper and client field exist and are unit-tested, awaiting a public contact/newsletter form if added later.
- **Node 25 + Vitest WebStorage quirk:** Running `vitest` directly under Node `25.x` requires `NODE_OPTIONS="--no-experimental-webstorage"` (handled automatically by `.factory/checks.sh`).
