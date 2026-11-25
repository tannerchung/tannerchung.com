import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import { DEFAULT_IC_SEATS } from '@/globals/TradeDeskSettings'
import type {
  DeskAnnotationBlockData,
  DeskSettingsSummary,
  ExecutiveMandateBlockData,
  LinkedTradeNote,
  MoveRationalesBlockData,
  NewsCatalystsBlockData,
  PanelDebatesBlockData,
  RedTeamChallengerBlockData,
  TradeCitationItem,
} from '@/lib/trade-sheets'
import {
  CitationsLedger,
  DeskAnnotationBlockView,
  ExecutiveMandateBlockView,
  MoveRationalesBlockView,
  NewsCatalystsBlockView,
  PanelDebatesBlockView,
  RedTeamChallengerBlockView,
  StandingGuardrailsView,
  TradeNoteThesisCard,
} from './index'

export const SAMPLE_CITATIONS: TradeCitationItem[] = [
  {
    index: 1,
    ticker: 'NVDA',
    source: 'SEC EDGAR',
    kind: 'sec_filing',
    label: 'NVIDIA Form 10-Q — Data Center Gross Margin & Blackwell Ramp Disclosure',
    url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=10-Q',
    publishedAt: '2026-11-22',
  },
  {
    index: 2,
    ticker: 'GOOG',
    source: 'Reuters',
    kind: 'news',
    label: 'Alphabet Cloud Operating Margins Expand to 19% on Custom TPU v6e Adoption',
    url: 'https://www.reuters.com/technology/alphabet-cloud-margins-tpu-v6e-2026-11-23/',
    publishedAt: '2026-11-23',
  },
  {
    index: 3,
    source: 'Federal Reserve',
    kind: 'macro',
    label: 'FOMC November Minutes — Neutral Rate Dispersion & Balance Sheet Runoff Pace',
    url: 'https://www.federalreserve.gov/monetarypolicy/fomcminutes20261120.htm',
    publishedAt: '2026-11-20',
  },
]

export const SAMPLE_DESK_ANNOTATION: DeskAnnotationBlockData = {
  id: 'ann-1',
  blockType: 'deskAnnotation',
  author: 'Tanner Chung',
  pinToTop: true,
  scope: 'risk_override',
  ticker: 'NVDA',
  heading: 'Cap NVDA trim strictly at 15% of taxable lot until post-CPI close',
  body: 'Hold remaining Fidelity taxable shares through Friday settlement so realized gains stay fully sheltered by the -$18.5k Schwab TLH carry.',
  createdAtNote: '2026-11-25',
}

export const SAMPLE_EXECUTIVE_MANDATE: ExecutiveMandateBlockData = {
  id: 'mandate-1',
  blockType: 'executiveMandate',
  posture: 'balanced',
  mandateHeadline: 'Trim crowded AI hardware strength, preserve $95k cash floor, rotate selectively into compounders',
  cashFloorGate: '$112,400 pro-forma cash & T-bills vs $95,000 minimum floor (+$17,400 buffer)',
  regimeCall: 'Late-cycle expansion with elevated megacap beta (1.12) and tight credit spreads',
  summaryPoints: [
    {
      text: 'Execute Wave 1 NVDA and AVGO trims first to lock in realized liquidity above the $95k reserve before staging any Wave 2 buys.',
    },
    {
      text: 'Add GOOG in Roth IRA on weakness below $188 where search monopoly cash flows trade at 19x NTM FCF.',
    },
    {
      text: 'Roll short QQQ Dec covered call only if option bid/ask spread stays below the 8% desk ceiling.',
    },
  ],
  holdOffNotes: [
    {
      note: 'Do not repurchase SMH, MRVL, or INTC inside any account before 2026-12-10 wash-sale blackout expiration.',
    },
  ],
  citationRefs: '1, 2, 3',
}

export const SAMPLE_MOVE_RATIONALES: MoveRationalesBlockData = {
  id: 'moves-1',
  blockType: 'moveRationales',
  sectionTitle: 'Ticket-by-Ticket Action Rationale',
  items: [
    {
      ticker: 'NVDA',
      action: 'SELL',
      conviction: 'trim',
      horizon: '1-3 Weeks',
      rationale: 'Trim 40 shares above $148 to bring semiconductor factor cluster below the 22% IPS ceiling while staying inside net-zero tax carry.',
      keyRisks: 'Continued hyperscaler capex beats could extend momentum toward $165.',
      citationRefs: '1',
    },
    {
      ticker: 'GOOG',
      action: 'BUY',
      conviction: 'high',
      horizon: '3-5 Years',
      rationale: 'Scale core Roth IRA compounder as Cloud operating leverage accelerates and valuation sits at a 14% discount to historical EV/EBIT.',
      keyRisks: 'DOJ remedies ruling timeline could trigger short-term multiple compression.',
      citationRefs: '2',
    },
  ],
}

export const SAMPLE_PANEL_DEBATES: PanelDebatesBlockData = {
  id: 'debate-1',
  blockType: 'panelDebates',
  topic: 'Semiconductor Concentration Trim vs Compounder Reinvestment Speed',
  consensusSummary: '7 of 9 seats endorse Wave 1 trimming on NVDA strength while pacing Wave 2 GOOG deployment into two limit tranches.',
  dissentHeadline: 'Druckenmiller & Lynch warn against under-sizing AI infrastructure leaders ahead of Q1 hyperscaler guidance.',
  strongestUnresolvedObjection: 'If hyperscaler 2027 capex budgets revise upward by another 20%, trimming below 8% weight forfeits asymmetric right-tail convexity.',
  seats: [
    {
      seatKey: 'marks',
      seatName: 'Howard Marks',
      stance: 'approve',
      thesis: 'Trims are dictated by asymmetry rather than pessimism: when forward expectations leave zero margin for error, harvesting 15% reduces left-tail fragility.',
      citationRefs: '1',
    },
    {
      seatKey: 'klarman',
      seatName: 'Seth Klarman',
      stance: 'approve',
      thesis: 'Rebuilding the $95k Treasury reserve first protects optionality if credit spreads widen into Q1.',
      citationRefs: '3',
    },
    {
      seatKey: 'druckenmiller',
      seatName: 'Druckenmiller',
      stance: 'dissent',
      thesis: 'Earnings revisions remain positive and liquidity conditions have not broken; keep core NVDA weight intact and hedge index beta instead.',
      objection: 'Selling your cleanest earnings momentum leader prematurely rarely improves full-cycle Sharpe.',
      citationRefs: '1',
    },
    {
      seatKey: 'cpa_tax',
      seatName: 'CPA Tax Shield',
      stance: 'caution',
      thesis: 'Proceed strictly with Specific-ID high-cost tax lots in Fidelity and enforce the 2026-12-10 wash-sale blocklist across all accounts.',
    },
  ],
}

export const SAMPLE_RED_TEAM: RedTeamChallengerBlockData = {
  id: 'redteam-1',
  blockType: 'redTeamChallenger',
  challengerTitle: 'Autonomous Red-Team & Second-Level Blind Spots',
  overallSeverity: 'elevated',
  preMortemSummary: 'If 10-year real yields spike 40 bps after Friday PCE, long-duration AI equities and covered-call rolls could gap simultaneously.',
  blindSpots: [
    {
      category: 'concentration',
      severity: 'high',
      claim: 'Combined semiconductor + cloud infrastructure look-through weight sits at 31.4% across Fidelity and Schwab ETFs.',
      mitigation: 'Require Wave 1 NVDA trim settlement before releasing Wave 2 buy limits.',
      citationRefs: '1',
    },
    {
      category: 'tax_wash_sale',
      severity: 'medium',
      claim: 'Automatic dividend reinvestment (DRIP) in IRA accounts can silently trigger cross-account wash sales on SMH/INTC.',
      mitigation: 'Verify DRIP is disabled on all 9 wash-sale tickers through 2026-12-10.',
    },
  ],
}

export const SAMPLE_NEWS_CATALYSTS: NewsCatalystsBlockData = {
  id: 'news-1',
  blockType: 'newsCatalysts',
  windowLabel: 'Last 72h Corroborated Wire & SEC Filings',
  items: [
    {
      ticker: 'NVDA',
      headline: 'NVIDIA 10-Q highlights Blackwell rack production scaling with temporary 120 bps gross margin dilution',
      catalystKind: 'sec_filing',
      impactSummary: 'Confirms strong demand visibility while introducing near-term margin sensitivity.',
      publishedAt: '2026-11-22',
      citationIndex: 1,
    },
    {
      ticker: 'GOOG',
      headline: 'Google Cloud reaches 19% operating margin run-rate on internal TPU v6e silicon',
      catalystKind: 'earnings',
      impactSummary: 'Validates multi-year operating leverage thesis inside Roth IRA compounder sleeve.',
      publishedAt: '2026-11-23',
      citationIndex: 2,
    },
  ],
}

export const SAMPLE_LINKED_NOTES: LinkedTradeNote[] = [
  {
    id: 'note-goog',
    title: 'Alphabet (GOOG) — Core Compounder & Cloud Operating Leverage Thesis',
    ticker: 'GOOG',
    conviction: 'high',
    valuationZone: 'buy_zone',
    strategy: 'Core Compounder',
    thesis: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Search distribution paired with vertically integrated TPU silicon gives Alphabet durable ',
              },
              { type: 'text', text: '28%+ ROIC', format: 1 },
              { type: 'text', text: ' while trading at a discount to megacap peers.' },
            ],
          },
          {
            type: 'block',
            fields: {
              blockType: 'valuationBand',
              ticker: 'GOOG',
              asOfDate: '2026-11-24',
              buyBelowUsd: 188,
              fairValueUsd: 215,
              trimAboveUsd: 245,
              currentSpotUsd: 184.5,
              methodology: '22x NTM Owner Earnings',
              notes: 'Trading inside Buy Zone; stage Roth IRA additions below $188.',
            },
          },
          {
            type: 'block',
            fields: {
              blockType: 'killSwitchRule',
              ticker: 'GOOG',
              triggerKind: 'fundamental',
              condition: 'Search revenue growth decelerates below 4% YoY for two consecutive quarters alongside Cloud margin contraction.',
              action: 'Pause additions and cut core sleeve weight by 40%.',
              severity: 'mandatory_exit',
            },
          },
        ],
      },
    },
  },
]

export const SAMPLE_DESK_SETTINGS: DeskSettingsSummary = {
  deskLabel: 'sovereign wealth & execution desk',
  cashFloorTarget: '$95,000 Cash & Treasury Floor (Thru Nov 30)',
  maxOptionSpreadPct: 8,
  taxShieldReadout: '-$18.5k Realized Schwab TLH Carry · $0.00 Net Tax Target',
  washSaleBlackoutThrough: '2026-12-10',
  washSaleTickers: 'DRAM, EUAD, ICLN, INTC, KTEC, MAGC, MRVL, SHLD, SMH',
  standingGuardrails: [
    {
      code: 'CASH-FLOOR',
      rule: 'Never breach the $95,000 household cash + T-bill reserve during Wave 2 deployment.',
    },
    {
      code: 'OPT-SPREAD',
      rule: 'Reject any option roll whose bid-ask spread exceeds 8.0% of mid-price.',
    },
    {
      code: 'WASH-SALE',
      rule: 'Zero purchases across all taxable & IRA accounts for wash-sale tickers through 2026-12-10.',
    },
  ],
  ipsTargets: {
    targetBetaMax: 1.15,
    minCashFloorUsd: 95000,
    coreAllocationTargetPct: 75,
    satelliteMaxSingleWeightPct: 8,
  },
  icSeats: DEFAULT_IC_SEATS,
}

const meta: Meta = {
  title: 'Trade Desk/Briefing Blocks',
  excludeStories: /^SAMPLE_/,
  parameters: {
    layout: 'padded',
  },
}

export default meta

export const ExecutiveMandate: StoryObj = {
  render: () => (
    <div className="max-w-[780px] mx-auto p-4">
      <ExecutiveMandateBlockView
        block={SAMPLE_EXECUTIVE_MANDATE}
        citations={SAMPLE_CITATIONS}
      />
    </div>
  ),
}

export const MoveRationales: StoryObj = {
  render: () => (
    <div className="max-w-[780px] mx-auto p-4">
      <MoveRationalesBlockView
        block={SAMPLE_MOVE_RATIONALES}
        citations={SAMPLE_CITATIONS}
        activeTicker="GOOG"
      />
    </div>
  ),
}

export const PanelDebates: StoryObj = {
  render: () => (
    <div className="max-w-[780px] mx-auto p-4">
      <PanelDebatesBlockView
        block={SAMPLE_PANEL_DEBATES}
        citations={SAMPLE_CITATIONS}
        icSeats={DEFAULT_IC_SEATS}
      />
    </div>
  ),
}

export const RedTeamChallenger: StoryObj = {
  render: () => (
    <div className="max-w-[780px] mx-auto p-4">
      <RedTeamChallengerBlockView
        block={SAMPLE_RED_TEAM}
        citations={SAMPLE_CITATIONS}
      />
    </div>
  ),
}

export const NewsCatalysts: StoryObj = {
  render: () => (
    <div className="max-w-[780px] mx-auto p-4">
      <NewsCatalystsBlockView
        block={SAMPLE_NEWS_CATALYSTS}
        citations={SAMPLE_CITATIONS}
      />
    </div>
  ),
}

export const DeskAnnotation: StoryObj = {
  render: () => (
    <div className="max-w-[780px] mx-auto p-4">
      <DeskAnnotationBlockView block={SAMPLE_DESK_ANNOTATION} />
    </div>
  ),
}

export const LinkedTradeNoteWithEmbeddedBlocks: StoryObj = {
  render: () => (
    <div className="max-w-[780px] mx-auto p-4">
      <TradeNoteThesisCard note={SAMPLE_LINKED_NOTES[0]} />
    </div>
  ),
}

export const CitationsLedgerHighlighted: StoryObj = {
  render: () => (
    <div className="max-w-[880px] mx-auto p-4">
      <CitationsLedger citations={SAMPLE_CITATIONS} highlightedIndex={2} />
    </div>
  ),
}

export const StandingGuardrailsAndIps: StoryObj = {
  render: () => (
    <div className="max-w-[920px] mx-auto p-4">
      <StandingGuardrailsView deskSettings={SAMPLE_DESK_SETTINGS} />
    </div>
  ),
}
