# Technical Requirements Document (`TRD.md`) — `tannerchung.com` & `trade.tannerchung.com`

> Living technical architecture and security contract for `tannerchung.com` and the authenticated `trade.tannerchung.com` execution blotter. Update in the same PR whenever schemas, APIs, env vars, or security rules change.

## 1. System Purpose & Dual-Host Boundary
Single Next.js 16 + Payload CMS 3.94 deployment serving two strictly separated surfaces:
1. **Public Personal Platform (`tannerchung.com`):** Essays (`posts`), shipped engineering builds (`projects`), and interactive frontend experiments (`experiments` where `visibility == 'public'`), styled with the **Hallmark Lumen** design system (`Instrument Serif` + `Plus Jakarta Sans` + `JetBrains Mono`, Night/Day Foundry drops).
2. **Private Sovereign Trade Desk (`trade.tannerchung.com` / `/trade/*`):** `admin`-only 3-room Hybrid A+B workbench (`?tab=blotter`, `?tab=briefing` / legacy `?tab=strategy`, `?tab=citations`) backed by native Payload CMS `blocks`, unnamed `tabs`, `virtual` fields, `TradeNotes` bi-directional `join`, Live Preview (`@payloadcms/live-preview-react`), persistent execution checkboxes, and 1-click Yahoo Finance marketable-limit re-anchoring.

## 2. Tech Stack & Runtime Requirements
- **Framework:** Next.js `16.4.6` (App Router, React `19.3.1`, `withPayload`) + Payload CMS `3.94.0` (`@payloadcms/next`, `@payloadcms/live-preview-react`, `@payloadcms/richtext-lexical`, `@payloadcms/plugin-seo`, `@payloadcms/plugin-mcp`).
- **Styling & Component Workbench:** Tailwind CSS v4 (`@tailwindcss/postcss`) + Hallmark Lumen CSS custom properties (`src/styles/lumen-tokens.css` implements `[data-theme="lumen"]` with `data-drop="night|day"`) + Storybook v10 (`@storybook/nextjs-vite`, `@storybook/addon-mcp`, `@storybook/addon-a11y`).
- **Database:** Supabase PostgreSQL (`schemaName: 'payload'`, `idType: 'uuid'`, `push: false`). `resolveDatabaseUri()` in `src/payload.config.ts` routes runtime traffic to Supavisor transaction pooler `:6543` (`max: 2` on Vercel, `5` locally) and `migrate*` CLI runs to session/direct `:5432` with `uselibpqcompat=true`. **Every new table created in `payload` schema MUST include `ALTER TABLE "payload"."<table>" ENABLE ROW LEVEL SECURITY;` in its migration.**
- **Media Storage:** Cloudflare R2 via `@payloadcms/storage-s3` (`bucket: R2_BUCKET || 'tannerchung-media'`, public CDN `https://media.tannerchung.com`, `clientUploads: true` when `R2_*` credentials are present).
- **Node & Package Manager:** `node >= 22.12.0`, `pnpm >= 9.0.0`. When running Vitest or Storybook on Node `25+`, pass `NODE_OPTIONS="--no-experimental-webstorage"` (handled automatically in `.factory/checks.sh` and `package.json`).

## 3. Architecture & Module Map
- `src/proxy.ts` & `src/lib/routing.ts` — Edge/Node request proxy: rate-limits `POST /api/users/login` (`10` req / `15m` per IP), gates unauthenticated `/trade*` and `trade.*` page requests to `/admin/login?redirect=...`, and rewrites `trade.tannerchung.com/<path>` to `/trade/<path>` (excluding `/trade`, `/admin`, `/api`, `/_next`, `/.well-known`).
- `src/blocks/trade-desk.ts` — Zero-DB-dependency Payload block configs & citation SSRF/OpSec validators:
  - `TRADE_BRIEFING_BLOCKS` (6 blocks on `TradeSheets.briefingBlocks`): `executiveMandate` (`dbName: 'exec_mandate'`), `moveRationales`, `panelDebates`, `redTeamChallenger` (`dbName: 'red_team'`), `newsCatalysts`, `deskAnnotation`.
  - `TRADE_NOTE_LEXICAL_BLOCKS` (2 inline Lexical blocks on `TradeNotes.thesis`): `valuationBand`, `killSwitchRule`.
  - `validatePublicHttpsCitationUrl()` & `sanitizeCitationUrl()`: strictly HTTPS-only, strips `utm_*`/`fbclid`/`gclid`/`mc_*` trackers, blocks loopback/RFC1918/link-local/webmail/personal brokerage hosts, while preserving public SEC EDGAR CIK query parameters.
- `src/collections/` — 7 Payload collections:
  - Public-read (`_status == 'published'`): `projects`, `posts`, `experiments` (additionally requires `visibility == 'public'` unless `admin`), `media` (`read: () => true`).
  - Admin-only (`isAdmin` across CRUD):
    - `users` (`admin` | `viewer`, 7d cookie, 5 max login attempts, 10m lock).
    - `trade-sheets`: unique `sheetDate`, sidebar `sourceMode`, `virtual: true` `executionProgress` (`afterRead` hook), `quotesRefreshedAt`, `relatedTradeNotes` (`relationship` -> `trade-notes`), `admin.livePreview` (`/trade/<sheetDate>` with Desktop `1280×900` & Mobile `390×844` breakpoints), and **unnamed `tabs`** (`01 · Execution Blotter`, `02 · IC Briefing Blocks & Overrides`, `03 · Citations & Telemetry`) preserving flat Postgres columns (`ticketsJson`/`checkedRowIds` remain `jsonb`).
    - `trade-notes`: `versions: { drafts: true }` (migration defaults & backfills `_status` to `'published'` for live `main` backward compatibility), sidebar `conviction` & `valuationZone`, Lexical `thesis` with `BlocksFeature({ blocks: TRADE_NOTE_LEXICAL_BLOCKS })`, and `referencedInSheets` (`type: 'join'`, `collection: 'trade-sheets'`, `on: 'relatedTradeNotes'`).
- `src/globals/` — `site-settings` (public read, admin update) and `trade-desk-settings` (admin-only read/update, **unnamed `tabs`**: `01 · Guardrails & Tax Shield` preserving existing root columns + `02 · IPS Targets & IC Panel Roster` adding `ipsTargets` group & `icSeats` array seeded with 9 `DEFAULT_IC_SEATS`).
- `src/lib/trade-sheets.ts` — Cross-repo producer/consumer contract with `stockbot` (`advisor_os/scripts/publish_trade_sheet_portal.py`): `scrubSensitiveText()` (`/\b\d{8,}\b/g` -> `[REDACTED-ACCT]`), `stripEmojis()`, `scrubBriefingProse()`, `verifyIngestBearerToken()` (SHA-256 `crypto.timingSafeEqual`, minimum 16-char secret), `sanitizeTradeSheetInput()`, `compileBriefingToPayloadBlocks()`, `mergeIngestBriefingBlocks()` (preserves human `deskAnnotation` blocks across re-ingests), `extractSheetTickers()`, and `reanchorTicketWithSpot()`.
- `src/components/trade-blocks/` & `src/components/LivePreviewListener.tsx` — Pure atomic presenters for all 6 briefing blocks, `CitationsLedger`, `TradeNoteThesisCard` (zero-editor-runtime Lexical AST renderer for inline `valuationBand` & `killSwitchRule`), `StandingGuardrailsView`, `RenderTradeBriefingBlocks`, and `RefreshRouteOnSave` Live Preview client listener.

## 4. Environment Variables (Names Only — Never Commit Values; Keep `.env.local` `0600`)
- **Core / DB:** `PAYLOAD_SECRET`, `DATABASE_URI`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `NEXT_PUBLIC_SERVER_URL`, `VERCEL_ENV`.
- **Trade Desk Ingest:** `TRADE_INGEST_SECRET` (`>= 16` chars; Bearer secret shared with `stockbot`).
- **Cloudflare R2 & Turnstile:** `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.

## 5. Security Invariants & Code-Verified Audit Caveats
- **Hard OpSec Rule:** Raw brokerage account numbers (`8+` digits), unredacted tax basis, and non-admin access to `/trade*` or `trade-sheets` are strictly forbidden. Cross-repo schema & redaction parity with `stockbot` is enforced daily at `06:35` via `~/.hermes/tests/test_cross_repo_seams.py`.
- **Indexing & Headers (`next.config.mjs`, `src/app/robots.ts`):** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` globally on `/:path*`, with route-specific overrides on `/trade` and `/trade/:path*` setting `X-Frame-Options: SAMEORIGIN` and `Content-Security-Policy: frame-ancestors 'self'` so Payload Admin Live Preview can embed `/trade/[date]` safely. Non-production deployments inject `X-Robots-Tag: noindex, nofollow` and `Disallow: /`, while production `robots.txt` disallows `/admin`, `/trade`, and `/api/`.
- **Audit Caveat — Dev Secret Fallback:** `src/payload.config.ts:108` falls back to `'dev-only-secret-override-in-env'` if `PAYLOAD_SECRET` is unset; production must fail closed.
- **Ingest Body Cap, Quote Timeout & Access Session Guard:** `POST /api/trade-sheets/ingest` enforces an explicit `256KB` (`262,144`-byte) body limit (`413`) and derives `quotesRefreshedAt` from ticket `quoteUpdatedAt` timestamps; `POST /api/trade-sheets/[date]/refresh-quotes` bounds Yahoo Finance calls with `AbortSignal.timeout(8000)`; and `TradeSheetView` uses `redirect: 'manual'` (`opaqueredirect` / `401` / `403`) so expired Cloudflare Access sessions prompt a clean reload instead of failing silently.
- **Audit Caveat — Single-Instance Login Rate Limiter:** `src/lib/security/rate-limit.ts` uses an in-memory `Map` per serverless instance.

## 6. Explicit Non-Goals
- Direct brokerage order placement/execution APIs (Schwab/Fidelity orders are human-executed from the blotter).
- Multi-tenant public user registration or unauthenticated sharing of `trade.tannerchung.com` sheets.
