import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DEFAULT_IC_SEATS } from '@/globals/TradeDeskSettings'
import {
  CitationsLedger,
  RenderTradeBriefingBlocks,
  StandingGuardrailsView,
  TradeNoteThesisCard,
} from './index'
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
} from './TradeBriefingBlocks.stories'

afterEach(() => {
  cleanup()
})

describe('Trade Briefing Block Presenters', () => {
  it('renders all 6 Payload briefing blocks and wires citation ref callbacks', () => {
    const onSelectCitation = vi.fn()
    const onSelectTicker = vi.fn()

    render(
      <RenderTradeBriefingBlocks
        blocks={[
          SAMPLE_DESK_ANNOTATION,
          SAMPLE_EXECUTIVE_MANDATE,
          SAMPLE_MOVE_RATIONALES,
          SAMPLE_PANEL_DEBATES,
          SAMPLE_RED_TEAM,
          SAMPLE_NEWS_CATALYSTS,
        ]}
        citations={SAMPLE_CITATIONS}
        icSeats={DEFAULT_IC_SEATS}
        onSelectCitation={onSelectCitation}
        onSelectTicker={onSelectTicker}
      />,
    )

    expect(
      screen.getByText(/Cap NVDA trim strictly at 15% of taxable lot/i),
    ).toBeTruthy()
    expect(
      screen.getByText(/Trim crowded AI hardware strength, preserve \$95k cash floor/i),
    ).toBeTruthy()
    expect(screen.getByText(/Strongest Unresolved Dissent/i)).toBeTruthy()
    expect(screen.getByText(/Cycle & Second-Level Risk/i)).toBeTruthy()
    expect(
      screen.getByText(/Autonomous Red-Team & Second-Level Blind Spots/i),
    ).toBeTruthy()
    expect(
      screen.getByText(/Google Cloud reaches 19% operating margin/i),
    ).toBeTruthy()

    const citationButtons = screen.getAllByRole('button', { name: /NVIDIA Form 10-Q/i })
    fireEvent.click(citationButtons[0])
    expect(onSelectCitation).toHaveBeenCalledWith(1)

    fireEvent.click(screen.getByRole('button', { name: 'GOOG' }))
    expect(onSelectTicker).toHaveBeenCalledWith('GOOG')
  })

  it('renders TradeNoteThesisCard with embedded ValuationBand and KillSwitchRule Lexical blocks', () => {
    render(<TradeNoteThesisCard note={SAMPLE_LINKED_NOTES[0]} />)

    expect(screen.getByText('BUY ZONE')).toBeTruthy()
    expect(screen.getByText('$188.00')).toBeTruthy()
    expect(screen.getByText('$215.00')).toBeTruthy()
    expect(screen.getByText('$245.00')).toBeTruthy()
    expect(screen.getByText('$184.50')).toBeTruthy()
    expect(screen.getByText(/Mandatory Exit/i)).toBeTruthy()
    expect(screen.getByText(/Pause additions and cut core sleeve weight by 40%/i)).toBeTruthy()
  })

  it('renders CitationsLedger safely and neutralizes disallowed URLs', () => {
    render(
      <CitationsLedger
        citations={[
          ...SAMPLE_CITATIONS,
          {
            index: 4,
            source: 'Untrusted',
            label: 'Unsafe JS Link',
            url: 'javascript:alert(1)',
          },
          {
            index: 5,
            source: 'Broker',
            label: 'Private Fidelity URL',
            url: 'https://digital.fidelity.com/account',
          },
        ]}
        highlightedIndex={2}
      />,
    )

    const validLink = screen.getByRole('link', { name: /NVIDIA Form 10-Q/i })
    expect(validLink.getAttribute('href')).toContain('https://www.sec.gov/')
    expect(validLink.getAttribute('rel')).toBe('noopener noreferrer')

    // Unsafe URLs must NOT render as clickable anchors
    expect(screen.queryByRole('link', { name: /Unsafe JS Link/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /Private Fidelity URL/i })).toBeNull()
    expect(screen.getByText('Unsafe JS Link')).toBeTruthy()
  })

  it('renders Back to Blotter return pill in CitationsLedger and invokes onReturn', () => {
    const onReturn = vi.fn()
    render(
      <CitationsLedger
        citations={SAMPLE_CITATIONS}
        highlightedIndex={1}
        returnLabel="Back to Blotter"
        onReturn={onReturn}
      />,
    )

    const backBtn = screen.getByRole('button', { name: /Back to Blotter/i })
    fireEvent.click(backBtn)
    expect(onReturn).toHaveBeenCalledTimes(1)
  })

  it('renders StandingGuardrailsView with IPS targets and 9 IC seats', () => {
    render(<StandingGuardrailsView deskSettings={SAMPLE_DESK_SETTINGS} />)

    expect(screen.getByText('1.15')).toBeTruthy()
    expect(screen.getByText('$95,000')).toBeTruthy()
    expect(screen.getByText('75%')).toBeTruthy()
    expect(screen.getByText('8%')).toBeTruthy()
    expect(screen.getByText('CASH-FLOOR')).toBeTruthy()
    expect(screen.getByText(/Configured Investment Committee Roster \(9 seats\)/i)).toBeTruthy()
  })
})
