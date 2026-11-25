import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { TradeSheetRecord } from '@/lib/trade-sheets'
import { TradeSheetView } from './TradeSheetView'
import {
  SAMPLE_CITATIONS,
  SAMPLE_DESK_ANNOTATION,
  SAMPLE_DESK_SETTINGS,
  SAMPLE_EXECUTIVE_MANDATE,
  SAMPLE_LINKED_NOTES,
  SAMPLE_MOVE_RATIONALES,
  SAMPLE_NEWS_CATALYSTS,
  SAMPLE_PANEL_DEBATES,
  SAMPLE_RED_TEAM,
} from './trade-blocks/TradeBriefingBlocks.stories'

const BASE_SHEET: TradeSheetRecord = {
  id: 'sheet-2026-11-25',
  sheetDate: '2026-11-25',
  title: 'Pre-Thanksgiving Liquidity & Semiconductor Rebalance',
  subtitle: 'Wave 1 trims fund Roth compounder scale-in while protecting the $95k Treasury floor.',
  alertBanner:
    'Wash-sale blackout active through 2026-12-10 for SMH, MRVL, INTC, and 6 other harvested tickers.',
  sourceMode: 'curated',
  executionProgress: '1 / 3 staged',
  quotesRefreshedAt: '2026-11-25T14:30:00.000Z',
  kpis: [
    { label: 'Cash & T-Bills', value: '$112,400', sub: '+$17.4k over floor' },
    { label: 'Portfolio Beta', value: '1.08', sub: 'IPS cap 1.15' },
    { label: 'TLH Carry', value: '-$18,500', sub: 'Schwab realized' },
    { label: 'Option Spreads', value: '4.2% max', sub: '8.0% desk ceiling' },
  ],
  tickets: [
    {
      id: 'w1-nvda-sell',
      wave: 'WAVE1',
      custodian: 'Fidelity',
      account: 'Taxable Joint',
      action: 'SELL',
      symbol: 'NVDA',
      qty: '40 sh',
      limitPrice: '$148.50',
      estValue: '$5,940',
      note: 'Live $149.12 · Lock semiconductor trim above $148 using Specific-ID high-cost lots. Offset by Schwab TLH carry.',
      liveQuote: 149.12,
      quoteUpdatedAt: '2026-11-25T14:30:00.000Z',
    },
    {
      id: 'w2-goog-buy',
      wave: 'WAVE2',
      custodian: 'Fidelity',
      account: 'Roth IRA',
      action: 'BUY',
      symbol: 'GOOG',
      qty: '25 sh',
      limitPrice: '$186.00',
      estValue: '$4,650',
      note: 'Live $184.50 · Accumulate core compounder inside Buy Zone (<$188) post Wave 1 settlement.',
      liveQuote: 184.5,
      quoteUpdatedAt: '2026-11-25T14:30:00.000Z',
    },
    {
      id: 'w2-qqq-roll',
      wave: 'WAVE2',
      custodian: 'Schwab',
      account: 'Taxable Individual',
      action: 'ROLL',
      symbol: 'QQQ 20270115 540C',
      qty: '1 contract',
      limitPrice: '$4.20 cr',
      estValue: '$420',
      note: 'Live $514.20 · Roll covered call out 45 DTE to harvest theta while widening upside cap.',
      liveQuote: 514.2,
      quoteUpdatedAt: '2026-11-25T14:30:00.000Z',
    },
  ],
  strategy: null,
  briefingBlocks: [
    SAMPLE_DESK_ANNOTATION,
    SAMPLE_EXECUTIVE_MANDATE,
    SAMPLE_MOVE_RATIONALES,
    SAMPLE_PANEL_DEBATES,
    SAMPLE_RED_TEAM,
    SAMPLE_NEWS_CATALYSTS,
  ],
  citations: SAMPLE_CITATIONS,
  relatedTradeNotes: SAMPLE_LINKED_NOTES,
  checkedRowIds: ['w1-nvda-sell'],
}

const HISTORY = [
  {
    sheetDate: '2026-11-25',
    title: BASE_SHEET.title,
    ticketCount: 3,
    completedCount: 1,
  },
  {
    sheetDate: '2026-11-24',
    title: 'Monday Cash Reserve & Option Roll Check',
    ticketCount: 4,
    completedCount: 4,
  },
]

const meta: Meta<typeof TradeSheetView> = {
  title: 'Trade Desk/TradeSheetView',
  component: TradeSheetView,
  args: {
    sheet: BASE_SHEET,
    history: HISTORY,
    deskSettings: SAMPLE_DESK_SETTINGS,
  },
}

export default meta
type Story = StoryObj<typeof TradeSheetView>

export const FullSovereignBriefingNightFoundry: Story = {
  globals: {
    drop: 'night',
  },
}

export const DayFoundryLightRefraction: Story = {
  args: {
    initialTab: 'briefing',
  },
  globals: {
    drop: 'day',
  },
}

export const LegacySheetBackwardCompatible: Story = {
  args: {
    initialTab: 'strategy',
    sheet: {
      ...BASE_SHEET,
      id: 'sheet-legacy',
      sourceMode: 'auto_vm',
      briefingBlocks: [],
      citations: [],
      relatedTradeNotes: [],
      strategy: {
        headline: 'Legacy Regime Call: Balanced Late-Cycle Liquidity',
        summaryBullets: [
          'Compiled seamlessly from legacy strategyJson without requiring database backfill.',
        ],
        holdOffNotes: ['Hold dry powder until PCE release at 8:30 AM ET.'],
        facts: [
          {
            pillar: 'Liquidity',
            metric: '$112,400',
            detail: 'Treasury ladder exceeds $95,000 household floor.',
          },
        ],
        expectedResults: [
          {
            metric: 'Semiconductor Weight',
            before: '31.4%',
            after: '27.8%',
            impact: '-3.6% concentration',
          },
        ],
      },
    },
  },
}

export const CashFloorBlockedAndStaleSync: Story = {
  args: {
    initialTab: 'blotter',
    sheet: {
      ...BASE_SHEET,
      id: 'sheet-cash-floor-blocked',
      alertBanner:
        'HOLDINGS SYNC STALE (>36h) & CASH FLOOR BLOCKED: Available cash ($88,200) is below $95,000 Treasury floor. Wave 2 buys halted until Wave 1 proceeds settle.',
      quotesRefreshedAt: null,
      kpis: [
        { label: 'Cash & T-Bills', value: '$88,200', sub: '-$6.8k below $95k floor' },
        { label: 'Holdings Sync', value: '38h stale', sub: 'Refresh Monarch/Schwab' },
        { label: 'Wave 2 Buys', value: 'BLOCKED', sub: 'Await Wave 1 settlement' },
        { label: 'TLH Carry', value: '-$18,500', sub: 'Schwab realized' },
      ],
    },
  },
}

export const EmptyBlotterSession: Story = {
  args: {
    sheet: {
      ...BASE_SHEET,
      id: 'sheet-empty',
      tickets: [],
      checkedRowIds: [],
      briefingBlocks: [],
      citations: [],
      relatedTradeNotes: [],
    },
  },
}
