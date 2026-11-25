import { describe, expect, it } from 'vitest'
import {
  extractEquityTicker,
  reanchorTicketWithSpot,
  sanitizeTradeSheetInput,
  verifyIngestBearerToken,
} from '@/lib/trade-sheets'

describe('trade-sheets security & helpers', () => {
  it('verifies bearer tokens in constant time', () => {
    const secret = '0123456789abcdef0123456789abcdef'
    expect(verifyIngestBearerToken(`Bearer ${secret}`, secret)).toBe(true)
    expect(verifyIngestBearerToken(`Bearer wrong`, secret)).toBe(false)
    expect(verifyIngestBearerToken(null, secret)).toBe(false)
    expect(verifyIngestBearerToken(`Bearer ${secret}`, 'short')).toBe(false)
  })

  it('scrubs raw 8+ digit account numbers on ingest', () => {
    const out = sanitizeTradeSheetInput({
      sheetDate: '2026-11-20',
      title: 'Blotter for 987654321',
      ticketsJson: [
        {
          id: 'r1',
          wave: 'WAVE1',
          custodian: 'Fidelity',
          account: 'Roth IRA 123456789',
          action: 'sell',
          symbol: 'SYY',
          qty: '148',
          limitPrice: '$77.50',
          estValue: '$11,470',
          note: 'Tax-free rotation',
        },
      ],
    })
    expect(out.title).toBe('Blotter for [REDACTED-ACCT]')
    expect(out.ticketsJson[0].account).toBe('Roth IRA [REDACTED-ACCT]')
    expect(out.ticketsJson[0].action).toBe('SELL')
  })

  it('extracts equity tickers from stocks and option contracts', () => {
    expect(extractEquityTicker('SYY')).toBe('SYY')
    expect(extractEquityTicker('NFLX 12/18/26 $65C')).toBe('NFLX')
    expect(extractEquityTicker('XLV 01/15/27 $175P')).toBe('XLV')
    expect(extractEquityTicker('BRK-B')).toBe('BRK-B')
  })

  it('re-anchors equity limits while preserving option strike limits', () => {
    const sellUpdated = reanchorTicketWithSpot(
      {
        id: 's1',
        wave: 'WAVE1',
        custodian: 'Fidelity',
        account: 'Roth IRA',
        action: 'SELL',
        symbol: 'SYY',
        qty: '100',
        limitPrice: '$77.50',
        estValue: '$7,750',
        note: 'Live $77.81 · Whole-share Day Limit',
      },
      80.0,
      '2026-11-20T14:30:00.000Z',
    )
    expect(sellUpdated.limitPrice).toBe('$79.70')
    expect(sellUpdated.estValue).toBe('$7,970')
    expect(sellUpdated.note).toContain('Live $80.00')

    const optUpdated = reanchorTicketWithSpot(
      {
        id: 'o1',
        wave: 'WAVE1',
        custodian: 'Merrill Edge',
        account: 'IRRA',
        action: 'STO CALL',
        symbol: 'AMZN 12/18/26 $290C',
        qty: '1',
        limitPrice: '$2.55',
        estValue: '+$255',
        note: 'Live $250.25 · Covered call',
      },
      254.5,
      '2026-11-20T14:30:00.000Z',
    )
    expect(optUpdated.limitPrice).toBe('$2.55')
    expect(optUpdated.note).toContain('Live $254.50')

    const staleTagScrubbed = reanchorTicketWithSpot(
      {
        id: 'p1',
        wave: 'WAVE1',
        custodian: 'Merrill Edge',
        account: 'Merrill IRRA-Edge',
        action: 'SELL',
        symbol: 'PLTR',
        qty: '100 sh',
        limitPrice: '$158.70',
        estValue: '$15,870',
        note: 'Day Limit · Mon EOD $159.36 · $0 tax · 0% target weight',
      },
      161.18,
      '2026-11-24T21:30:00.000Z',
    )
    expect(staleTagScrubbed.limitPrice).toBe('$160.55')
    expect(staleTagScrubbed.estValue).toBe('$16,055')
    expect(staleTagScrubbed.note).toContain('Live $161.18')
    expect(staleTagScrubbed.note).not.toContain('Mon EOD')
  })
})
