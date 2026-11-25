import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { TradeSheetView } from '@/components/TradeSheetView'
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
} from '@/components/trade-blocks/TradeBriefingBlocks.stories'
import type { TradeSheetRecord } from '@/lib/trade-sheets'

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: vi.fn(),
  }),
}))

const SHEET_FIXTURE: TradeSheetRecord = {
  id: 'sheet-1',
  sheetDate: '2026-11-25',
  title: 'Pre-Thanksgiving Rebalance',
  subtitle: 'Wave 1 trims precede Wave 2 compounder adds.',
  sourceMode: 'curated',
  executionProgress: '1 / 2 staged',
  kpis: [{ label: 'Cash & T-Bills', value: '$112,400', sub: '+$17.4k over floor' }],
  tickets: [
    {
      id: 'w1-nvda',
      wave: 'WAVE1',
      custodian: 'Fidelity',
      account: 'Taxable',
      action: 'SELL',
      symbol: 'NVDA',
      qty: '40 sh',
      limitPrice: '$148.50',
      estValue: '$5,940',
      note: 'Trim semiconductor cluster above $148.',
      liveQuote: 149.12,
    },
    {
      id: 'w2-goog',
      wave: 'WAVE2',
      custodian: 'Fidelity',
      account: 'Roth IRA',
      action: 'BUY',
      symbol: 'GOOG',
      qty: '25 sh',
      limitPrice: '$186.00',
      estValue: '$4,650',
      note: 'Add core compounder below $188.',
      liveQuote: 184.5,
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
  checkedRowIds: ['w1-nvda'],
}

const HISTORY_FIXTURE = [
  { sheetDate: '2026-11-25', title: 'Pre-Thanksgiving Rebalance', ticketCount: 2, completedCount: 1 },
]

beforeEach(() => {
  pushMock.mockReset()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ checkedRowIds: ['w1-nvda', 'w2-goog'] }),
    })),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('TradeSheetView Hybrid A+B Workbench', () => {
  it('defaults to Room 01 Execution Blotter when initialTab is omitted and updates sticky inspector on row click & j/k keys', () => {
    render(
      <TradeSheetView
        sheet={SHEET_FIXTURE}
        history={HISTORY_FIXTURE}
        deskSettings={SAMPLE_DESK_SETTINGS}
      />,
    )

    const blotterTab = screen.getByRole('tab', { name: /01 · Execution Blotter/i })
    expect(blotterTab.getAttribute('aria-selected')).toBe('true')
    const inspector = screen.getByLabelText('Contextual IC and Citation Inspector')
    expect(inspector).toBeTruthy()
    expect(screen.getByLabelText('Pinned Desk Annotations')).toBeTruthy()

    // Press 'j' to move selection from NVDA -> GOOG and verify linked Research Thesis appears in inspector
    fireEvent.keyDown(window, { key: 'j' })
    expect(within(inspector).getByText(/Linked Research Thesis/i)).toBeTruthy()
    expect(within(inspector).getByText(/Mandatory Exit/i)).toBeTruthy()

    // Press 'k' to return to NVDA
    fireEvent.keyDown(window, { key: 'k' })
    expect(within(inspector).getByText(/Cap NVDA trim strictly at 15%/i)).toBeTruthy()
  })

  it('maps both initialTab="strategy" and initialTab="briefing" to Room 02 IC Briefing', () => {
    const { unmount } = render(
      <TradeSheetView
        sheet={SHEET_FIXTURE}
        history={HISTORY_FIXTURE}
        deskSettings={SAMPLE_DESK_SETTINGS}
        initialTab="strategy"
      />,
    )
    expect(
      screen.getByRole('tab', { name: /02 · IC Briefing & Dissent/i }).getAttribute('aria-selected'),
    ).toBe('true')
    unmount()

    render(
      <TradeSheetView
        sheet={SHEET_FIXTURE}
        history={HISTORY_FIXTURE}
        deskSettings={SAMPLE_DESK_SETTINGS}
        initialTab="briefing"
      />,
    )
    expect(
      screen.getByRole('tab', { name: /02 · IC Briefing & Dissent/i }).getAttribute('aria-selected'),
    ).toBe('true')
  })

  it('toggles staged checkbox independently and persists via PATCH /api/trade-sheets/[date]/checks', async () => {
    render(
      <TradeSheetView
        sheet={SHEET_FIXTURE}
        history={HISTORY_FIXTURE}
        deskSettings={SAMPLE_DESK_SETTINGS}
      />,
    )

    const googCheckbox = screen.getByRole('checkbox', {
      name: /Mark GOOG BUY as staged/i,
    }) as HTMLInputElement
    expect(googCheckbox.checked).toBe(false)

    fireEvent.click(googCheckbox)
    await waitFor(() => {
      expect(googCheckbox.checked).toBe(true)
    })
    expect(fetch).toHaveBeenCalledWith(
      '/api/trade-sheets/2026-11-25/checks',
      expect.objectContaining({ method: 'PATCH' }),
    )
  })

  it('jumps from a citation chip in Room 02 to Room 03 Citations Ledger with highlight', () => {
    render(
      <TradeSheetView
        sheet={SHEET_FIXTURE}
        history={HISTORY_FIXTURE}
        deskSettings={SAMPLE_DESK_SETTINGS}
        initialTab="briefing"
      />,
    )

    const citBtn = screen.getAllByRole('button', { name: /NVIDIA Form 10-Q/i })[0]
    fireEvent.click(citBtn)

    expect(
      screen
        .getByRole('tab', { name: /03 · Citations & Telemetry/i })
        .getAttribute('aria-selected'),
    ).toBe('true')
    expect(screen.getByText(/Showing \[1\] · Clear/i)).toBeTruthy()
  })

  it('renders legacy strategyJson fallback when briefingBlocks is empty', () => {
    render(
      <TradeSheetView
        sheet={{
          ...SHEET_FIXTURE,
          briefingBlocks: [],
          strategy: {
            headline: 'Legacy Balanced Regime',
            summaryBullets: ['Fallback summary point from legacy strategyJson.'],
            facts: [],
            expectedResults: [],
          },
        }}
        history={HISTORY_FIXTURE}
        deskSettings={SAMPLE_DESK_SETTINGS}
        initialTab="strategy"
      />,
    )

    expect(screen.getByText('Legacy Balanced Regime')).toBeTruthy()
    expect(screen.getByText('Fallback summary point from legacy strategyJson.')).toBeTruthy()
  })
})
