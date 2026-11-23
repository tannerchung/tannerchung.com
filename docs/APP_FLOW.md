# App Flow Document (`APP_FLOW.md`) — `tannerchung.com` & `trade.tannerchung.com`

> Canonical route inventory, host-routing behavior, user journeys, and RBAC matrix. Update whenever routes, host rewrites, tabs, or auth states change.

## 1. Route & Host Inventory

All `(frontend)` routes share `FrontendLayout` (`src/app/(frontend)/layout.tsx`), rendering `DeskChromeBar` (`max-w-6xl` on `tannerchung.com`, `max-w-7xl` with `"sovereign wealth desk"` badge on `trade.tannerchung.com`) and Night/Day drop toggle.

| Route (`tannerchung.com`) | `trade.tannerchung.com` Host Rewrite | Auth / Access | Primary Surface & Data Source |
| :--- | :--- | :--- | :--- |
| `/` | *(rewrites `/` -> `/trade`)* | Public | Hero manifesto + up to 6 published `projects` + 4 recent `posts` (graceful empty fallback if DB unseeded) |
| `/projects` | *(rewrites `/projects` -> `/trade/projects` -> 404)* | Public | Published `projects` grid (`limit: 50`) |
| `/blog` | *(rewrites `/blog` -> `/trade/blog` -> 404)* | Public | Chronological published `posts` index (`limit: 50`) |
| `/lab` | *(rewrites `/lab` -> `/trade/lab` -> 404)* | Public | Sandbox index of `published` + `visibility: 'public'` `experiments` |
| `/trade` | `https://trade.tannerchung.com/` | `admin` only | Latest daily `TradeSheetView` (`?tab=strategy` or `?tab=blotter`) + up to 20 `trade-notes` research memos |
| `/trade/[date]` | `https://trade.tannerchung.com/[date]` | `admin` only | Specific `YYYY-MM-DD` Trade Sheet (`today` / `latest` redirect to newest `sheetDate`, or `/trade` if empty; unknown date -> `notFound()`) |
| `/admin` (`[[...segments]]`) | `https://trade.tannerchung.com/admin` | `admin` only | Payload CMS 3.94 Admin UI + `/admin/login` authentication gate |
| `GET /api/health` | Same (`/api/*` bypasses host rewrite) | Public | Verifies Payload Postgres query (`projects limit 1`) + reports `env`, `r2Configured`, `turnstileConfigured` (`200` or `500`) |
| `POST /api/trade-sheets/ingest` | Same | Bearer (`TRADE_INGEST_SECRET`) | Idempotent upsert by `sheetDate`; scrubs `8+` digit account numbers; preserves valid `checkedRowIds` unless `resetChecks: true` |
| `PATCH /api/trade-sheets/[date]/checks` | Same | `admin` cookie | Persists checked ticket row IDs (`checkedRowIds`, max `200`) for cross-device blotter state |
| `POST /api/trade-sheets/[date]/refresh-quotes` | Same | `admin` cookie | Fetches live Yahoo Finance spot prices per unique equity ticker and re-anchors `SELL` (`0.996x`) / `BUY` (`1.004x`) limits + option underlying spot notes |
| `/api/[...slug]` | Same | Per-collection RBAC | Payload REST, GraphQL, and `@payloadcms/plugin-mcp` endpoints |

## 2. Core User & System Journeys

1. **Automated Morning / Close Trade Sheet Ingest (`stockbot` -> `trade.tannerchung.com`):**
   - Weekday Advisor OS jobs run `publish_trade_sheet_portal.py` -> `POST /api/trade-sheets/ingest` with `Authorization: Bearer <TRADE_INGEST_SECRET>`.
   - Handler validates token via SHA-256 `timingSafeEqual`, runs `sanitizeTradeSheetInput()` (redacting any accidental `8+` digit account numbers), upserts `trade-sheets` by `sheetDate` (preserving checked ticket IDs across intra-day re-publishes unless `resetChecks: true`), and returns `https://trade.tannerchung.com/<YYYY-MM-DD>`.
   - Morning Brief & Close Digest emails link directly to `?tab=strategy` and `?tab=blotter`.

2. **Authenticated Trade Desk Execution (`trade.tannerchung.com`):**
   - Unauthenticated request to `https://trade.tannerchung.com/2026-11-22?tab=blotter` hits `src/proxy.ts` -> `307` redirect to `/admin/login?redirect=%2Ftrade%2F2026-11-22%3Ftab%3Dblotter`.
   - After Payload `admin` login (`payload-token` cookie), Server Component `TradeSheetByDatePage` verifies `user.role === 'admin'` (defense-in-depth behind `proxy.ts`), loads the target sheet + 30-day date switcher + `trade-desk-settings` guardrails (cash floor, max option spread %, TLH shield, wash-sale blackout tickers).
   - **Tab 1 (`strategy`):** Executive headline, KPI strip, empirical pillar facts, hold-off notes, and before/after expected impact table.
   - **Tab 2 (`blotter`):** Wave 1 / Wave 2 ticket table with custodian filters, 1-click limit copy, persistent checkboxes (`PATCH /api/trade-sheets/[date]/checks`), and **Refresh Live Quotes** (`POST /api/trade-sheets/[date]/refresh-quotes`).

## 3. Role & Access Matrix

| Role / Caller | Public Pages (`/`, `/projects`, `/blog`, `/lab`) | `/trade*` & `trade-sheets` / `trade-notes` / `trade-desk-settings` | `/admin` & Content Writes | `POST /api/trade-sheets/ingest` |
| :--- | :--- | :--- | :--- | :--- |
| **Anonymous** | Read `published` (and `public` experiments) | Blocked (`307` -> `/admin/login` / `401` API) | Login screen only (`10 req/15m` IP limit) | `401` without Bearer secret |
| **`viewer` User** | Read `published` | Blocked (`user.role !== 'admin'` redirects to `/admin/login`; `isAdmin` returns `false`) | Denied (`admin` access false) | `401` without Bearer secret |
| **`admin` User** | Full read (including drafts & `private` experiments) | Full read/write (`checks`, `refresh-quotes`, date history, memos) | Full CMS + MCP access | Requires Bearer secret |
| **`stockbot` Publisher** | N/A | Upsert `trade-sheets` via ingest endpoint only | No | Allowed with `TRADE_INGEST_SECRET` |

## 4. Empty & Error States
- **Empty CMS (`/`):** Renders hero cleanly and prompts `/admin` publishing; `/projects`, `/blog`, and `/lab` render clean empty-state copy when `docs.length === 0`.
- **No Trade Sheets Ingested (`/trade`):** Renders `"01 · PRIVATE EXECUTION APPARATUS — daily desk ready to ingest"` empty state; `/trade/today` redirects to `/trade`.
- **Missing Sheet Date (`/trade/2099-01-01`):** Triggers Next.js `notFound()` (`404`); `checks` and `refresh-quotes` APIs return `404 { ok: false, error: 'Sheet not found' }`.
