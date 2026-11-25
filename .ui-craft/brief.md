# UI Craft Brief — Sovereign Trade Portal (`trade.tannerchung.com`)

## Domain & Audience
Private institutional wealth & multi-account execution desk (`tannerchung.com/trade` and `/trade/[date]`).
Primary operator: Tanner (executing 15-account household tax-aware rotations before/after 09:45 AM ET).

## Aesthetic Stance & Tokens
- **Design System:** Hallmark `Lumen` (`src/styles/lumen-tokens.css` — `oklch()` semantic variables across Drop 01 Night Foundry `[default]` and Drop 02 Day Foundry `[data-drop="day"]`).
- **Director's Cut Layout (`Hybrid A + B`):**
  1. **Top Editorial Spine (from Variant B `01b-editorial-ic-dossier`):** Zero nested card-in-card borders; `1px` `--color-rule` hairlines, `Instrument Serif` roman headings (`font-style: normal`), Stephen Few target-anchored KPI strip (`tabular-nums`), Pinned Human `DeskAnnotation` callout (`border-left: 2px solid var(--color-accent)`), Executive Mandate narrative, and Autonomous Red-Team Challenger kill-criteria strip.
  2. **Interactive Workbench Spine (from Variant A `01a-split-workbench`):** Desktop `>=1024px` 2-column split (`minmax(0, 1.38fr)` Wave-sequenced 17-leg Execution Blotter on the left + sticky `minmax(0, 1fr)` Contextual Ticker Inspector on the right showing per-ticker `MoveRationale`, linked `TradeNote` Buy/Fair/Trim band + kill switch, `9-Seat IC Panel Debate` bull/bear/unresolved gate/dissenting seats, and matching `NewsCatalysts`), plus compact mode toggle (`Split Workbench` | `Full IC Ledger`) and bottom `Verifiable Citations [1..N]` + `Standing Guardrails` (`G-01..G-04`).
  3. **Mobile (`<960px`):** Collapses cleanly to 1-column with zero horizontal overflow (`scrollWidth <= clientWidth`).

## Anti-Slop Prohibitions
- Zero emojis in UI chrome or external news headlines (strip emojis at producer + sanitizer boundary).
- Zero raw `8+` digit account numbers in prose (`[REDACTED-ACCT]`), while preserving 10-digit SEC EDGAR CIKs in `https://www.sec.gov/...` URLs.
- Zero schema jargon (`ExecutiveMandateBlock`, `jsonb`, `Payload`) in reader-facing labels.
- Zero italic serif headings (`font-style: normal` mandatory on all display headings); `font-variant-numeric: tabular-nums` mandatory on all prices, quantities, percentages, and citation indices.
