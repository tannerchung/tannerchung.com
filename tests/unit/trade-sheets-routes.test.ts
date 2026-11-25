import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { textMentionsTicker } from '@/components/TradeSheetView'

const mockPayload = {
  auth: vi.fn(),
  find: vi.fn(),
  update: vi.fn(),
}

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => mockPayload),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}))

import { PATCH as checksPatch } from '@/app/api/trade-sheets/[date]/checks/route'
import { POST as refreshQuotesPost } from '@/app/api/trade-sheets/[date]/refresh-quotes/route'

describe('Trade Sheets Checks & Refresh Quotes API Routes', () => {
  beforeEach(() => {
    mockPayload.auth.mockReset()
    mockPayload.find.mockReset()
    mockPayload.update.mockReset()
    mockPayload.auth.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('PATCH /checks applies atomic { rowId, checked } toggles without clobbering sibling rows', async () => {
    mockPayload.find.mockResolvedValueOnce({
      docs: [{ id: 'sheet-1', checkedRowIds: ['row-a'] }],
    })
    mockPayload.update.mockImplementationOnce(
      async ({ data }: { data: { checkedRowIds: string[] } }) => ({
        id: 'sheet-1',
        checkedRowIds: data.checkedRowIds,
      }),
    )

    const addReq = new Request('https://trade.tannerchung.com/api/trade-sheets/2026-11-25/checks', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rowId: 'row-b', checked: true }),
    })

    const addRes = await checksPatch(addReq, { params: Promise.resolve({ date: '2026-11-25' }) })
    expect(addRes.status).toBe(200)
    const addJson = (await addRes.json()) as { ok: boolean; checkedRowIds: string[] }
    expect(addJson.ok).toBe(true)
    expect(addJson.checkedRowIds).toEqual(['row-a', 'row-b'])

    // Now uncheck row-a while leaving row-b intact
    mockPayload.find.mockResolvedValueOnce({
      docs: [{ id: 'sheet-1', checkedRowIds: ['row-a', 'row-b'] }],
    })
    mockPayload.update.mockImplementationOnce(
      async ({ data }: { data: { checkedRowIds: string[] } }) => ({
        id: 'sheet-1',
        checkedRowIds: data.checkedRowIds,
      }),
    )

    const removeReq = new Request(
      'https://trade.tannerchung.com/api/trade-sheets/2026-11-25/checks',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rowId: 'row-a', checked: false }),
      },
    )

    const removeRes = await checksPatch(removeReq, {
      params: Promise.resolve({ date: '2026-11-25' }),
    })
    expect(removeRes.status).toBe(200)
    const removeJson = (await removeRes.json()) as { ok: boolean; checkedRowIds: string[] }
    expect(removeJson.checkedRowIds).toEqual(['row-b'])
  })

  it('POST /refresh-quotes preserves previous quotesRefreshedAt and returns 502 when refreshedCount === 0', async () => {
    const prevTimestamp = '2026-11-25T13:00:00.000Z'
    mockPayload.find.mockResolvedValueOnce({
      docs: [
        {
          id: 'sheet-1',
          quotesRefreshedAt: prevTimestamp,
          ticketsJson: [
            {
              id: 't1',
              wave: 'WAVE1',
              custodian: 'Fidelity',
              account: 'Taxable',
              action: 'SELL',
              symbol: 'NVDA',
              qty: '10 sh',
              limitPrice: '$148.00',
              estValue: '$1,480',
              note: 'Trim',
            },
          ],
        },
      ],
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 503 }) as unknown as Response,
    )

    const req = new Request(
      'https://trade.tannerchung.com/api/trade-sheets/2026-11-25/refresh-quotes',
      { method: 'POST' },
    )

    const res = await refreshQuotesPost(req, { params: Promise.resolve({ date: '2026-11-25' }) })
    expect(res.status).toBe(502)
    const json = (await res.json()) as {
      ok: boolean
      refreshedCount: number
      requestedCount: number
      failedTickers: string[]
      quotesRefreshedAt: string
    }
    expect(json.ok).toBe(false)
    expect(json.refreshedCount).toBe(0)
    expect(json.requestedCount).toBe(1)
    expect(json.failedTickers).toEqual(['NVDA'])
    expect(json.quotesRefreshedAt).toBe(prevTimestamp)
    expect(mockPayload.update).not.toHaveBeenCalled()
  })

  it('matches tickers by exact symbol boundary and prevents short-ticker substring false positives', () => {
    expect(textMentionsTicker('Trim V above $290 on multiple expansion', 'V')).toBe(true)
    expect(textMentionsTicker('Hold (T) for dividend yield', 'T')).toBe(true)
    expect(textMentionsTicker('Sell $NVDA call spread', 'NVDA')).toBe(true)

    expect(textMentionsTicker('Never invest into elevated volatility', 'V')).toBe(false)
    expect(textMentionsTicker("Don't target early trims right now", 'T')).toBe(false)
    expect(textMentionsTicker('NVIDIA leads data-center GPU demand', 'NVDA')).toBe(false)
  })
})
