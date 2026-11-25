# UI Craft Component & Payload Block Mapping Spec

## 1:1 Payload CMS 3.94 Block -> Presenter -> Storybook MCP Mapping
| Payload Block Slug (`src/blocks/trade-desk.ts`) | React Presenter (`src/components/trade-blocks/`) | Role in Hybrid A+B Layout |
| :--- | :--- | :--- |
| `deskAnnotation` (`DeskAnnotationBlock`) | `DeskAnnotationBlockView.tsx` | Pinned human execution override / debrief bar; preserved across `stockbot` re-ingests. |
| `executiveMandate` (`ExecutiveMandateBlock`) | `ExecutiveMandateBlockView.tsx` | Editorial mandate headline (`Instrument Serif`), cash-floor badge, narrative summary, and wave conflict resolution rules. |
| `redTeamChallenger` (`RedTeamChallengerBlock`) | `RedTeamChallengerBlockView.tsx` | Autonomous challenger kill criteria + expandable blind spots (`critical | high | medium | low`). |
| `moveRationales` (`MoveRationaleBlock`) | `MoveRationaleBlockView.tsx` | Powers both the Contextual Ticker Inspector thesis header and full-ledger rationale view. |
| `panelDebates` (`PanelDebateBlock`) | `PanelDebateBlockView.tsx` | 9-Seat IC vote breakdown, bull/bear cases, unresolved gate, and dissenting seat quotes. |
| `newsCatalysts` (`NewsCatalystBlock`) | `NewsCatalystBlockView.tsx` | Emoji-scrubbed SEC EDGAR & market wire catalysts with `[n]` citation jump-links. |
| `citations` (`TradeSheets.citations`) | `CitationsLedgerView.tsx` | Validated `https:`-only public citation footer (`#cite-1..N`). |
| `TradeDeskSettings` Global | `StandingGuardrailsView.tsx` | Renders `standingGuardrails`, `ipsTargets` (`targetBetaMax`, `minCashFloorUsd`), and `icSeats` (fixes dropped-global bug). |
| `TradeNotes` (`relatedTradeNotes`) | `LinkedTradeNoteCard.tsx` | Displays per-symbol conviction, valuation zone (`buy_zone | hold_zone | trim_zone`), and `metricsJson` / Lexical thesis. |
