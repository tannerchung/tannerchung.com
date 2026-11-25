# Technical Requirements Document (`TRD.md`) — `tannerchung.com` & `trade.tannerchung.com`

> Living technical architecture and security contract for `tannerchung.com` and the authenticated `trade.tannerchung.com` execution blotter. Update in the same PR whenever schemas, APIs, env vars, or security rules change.

## 1. System Purpose & Dual-Host Boundary
Single Next.js 16 + Payload CMS 3.94 deployment serving two strictly separated surfaces:
1. **Public Personal Platform (`tannerchung.com`):** Essays (`posts`), shipped engineering builds (`projects`), and interactive frontend experiments (`experiments` where `visibility == 'public'`), styled with the **Hallmark Lumen** design system (`Instrument Serif` + `Plus Jakarta Sans` + `JetBrains Mono`, Night/Day Foundry drops).
2. **Private Sovereign Trade Desk (`trade.tannerchung.com` / `/trade/*`):** `admin`-only 2-tab daily Trade Sheet execution blotter (`?tab=strategy` & `?tab=blotter`), persistent execution checkboxes, 1-click Yahoo Finance marketable-limit re-anchoring, and standing `trade-notes` research memos.

## 2. Tech Stack & Runtime Requirements
- **Framework:** Next.js `16.4.6` (App Router, React `19.3.1`, `withPayload`) + Payload CMS `3.94.0` (`@payloadcms/next`, `@payloadcms/richtext-lexical`, `@payloadcms/plugin-seo`, `@payloadcms/plugin-mcp`).
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`) + Hallmark Lumen CSS custom properties (`src/styles/lumen-tokens.css` currently implements `[data-theme="lumen"]` with `data-drop="night|day"`; `SiteSettings` also exposes `grid` and `cobalt` selector options).
- **Database:** Supabase PostgreSQL (`schemaName: 'payload'`, `idType: 'uuid'`, `push: false`). `resolveDatabaseUri()` in `src/payload.config.ts` routes runtime traffic to Supavisor transaction pooler `:6543` (`max: 2` on Vercel, `5` locally) and `migrate*` CLI runs to session/direct `:5432` with `uselibpqcompat=true`.
- **Media Storage:** Cloudflare R2 via `@payloadcms/storage-s3` (`bucket: R2_BUCKET || 'tannerchung-media'`, public CDN `https://media.tannerchung.com`, `clientUploads: true` when `R2_*` credentials are present).
- **Node & Package Manager:** `node >= 22.12.0`, `pnpm >= 9.0.0`. When running Vitest on Node `25+`, pass `NODE_OPTIONS="--no-experimental-webstorage"` (handled automatically in `.factory/checks.sh`).

## 3. Architecture & Module Map
- `src/proxy.ts` & `src/lib/routing.ts` — Edge/Node request proxy: rate-limits `POST /api/users/login` (`10` req / `15m` per IP), gates unauthenticated `/trade*` and `trade.*` page requests to `/admin/login?redirect=...`, and rewrites `trade.tannerchung.com/<path>` to `/trade/<path>` (excluding `/trade`, `/admin`, `/api`, `/_next`, `/.well-known`).
- `src/collections/` — 7 Payload collections:
  - Public-read (`_status == 'published'`): `projects`, `posts`, `experiments` (additionally requires `visibility == 'public'` unless `admin`), `media` (`read: () => true`).
  - Admin-only (`isAdmin` across CRUD): `users` (`admin` | `viewer`, 7d cookie, 5 max login attempts, 10m lock), `trade-sheets` (unique `sheetDate`), `trade-notes`.
- `src/globals/` — `site-settings` (public read, admin update: `siteName`, `tagline`, `locationReadout`, `activeTheme`, `defaultDrop`) and `trade-desk-settings` (admin-only read/update: `deskLabel`, `cashFloorTarget`, `maxOptionSpreadPct`, `taxShieldReadout`, `washSaleBlackoutThrough`, `washSaleTickers`, `standingGuardrails`).
- `src/lib/trade-sheets.ts` — Cross-repo producer/consumer contract with `stockbot` (`advisor_os/scripts/publish_trade_sheet_portal.py`): `scrubSensitiveText()` (`/\b\d{8,}\b/g` -> `[REDACTED-ACCT]`), `verifyIngestBearerToken()` (SHA-256 `crypto.timingSafeEqual`, minimum 16-char secret), `sanitizeTradeSheetInput()` (caps `kpisJson <= 8`, `ticketsJson <= 150`), and `reanchorTicketWithSpot()` (`0.996x` SELL / `1.004x` BUY tick-size rounding).

## 4. Environment Variables (Names Only — Never Commit Values; Keep `.env.local` `0600`)
- **Core / DB:** `PAYLOAD_SECRET`, `DATABASE_URI`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `NEXT_PUBLIC_SERVER_URL`, `VERCEL_ENV`.
- **Trade Desk Ingest:** `TRADE_INGEST_SECRET` (`>= 16` chars; Bearer secret shared with `stockbot`).
- **Cloudflare R2 & Turnstile:** `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.

## 5. Security Invariants & Code-Verified Audit Caveats
- **Hard OpSec Rule:** Raw brokerage account numbers (`8+` digits), unredacted tax basis, and non-admin access to `/trade*` or `trade-sheets` are strictly forbidden. Cross-repo schema & redaction parity with `stockbot` is enforced daily at `06:35` via `~/.hermes/tests/test_cross_repo_seams.py`.
- **Indexing & Headers (`next.config.mjs`, `src/app/robots.ts`):** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`; non-production deployments inject `X-Robots-Tag: noindex, nofollow` and `Disallow: /`, while production `robots.txt` disallows `/admin`, `/trade`, and `/api/`.
- **Audit Caveat — Dev Secret Fallback:** `src/payload.config.ts:108` falls back to `'dev-only-secret-override-in-env'` if `PAYLOAD_SECRET` is unset; production must fail closed.
- **Ingest Body Cap, Quote Timeout & Access Session Guard:** `POST /api/trade-sheets/ingest` enforces an explicit `256KB` (`262,144`-byte) body limit (`413`) and derives `quotesRefreshedAt` from ticket `quoteUpdatedAt` timestamps; `POST /api/trade-sheets/[date]/refresh-quotes` bounds Yahoo Finance calls with `AbortSignal.timeout(8000)`; and `TradeSheetView` uses `redirect: 'manual'` (`opaqueredirect` / `401` / `403`) so expired Cloudflare Access sessions prompt a clean reload instead of failing silently.
- **Audit Caveat — Single-Instance Login Rate Limiter:** `src/lib/security/rate-limit.ts` uses an in-memory `Map` per serverless instance.

## 6. Explicit Non-Goals
- Direct brokerage order placement/execution APIs (Schwab/Fidelity orders are human-executed from the blotter).
- Multi-tenant public user registration or unauthenticated sharing of `trade.tannerchung.com` sheets.
