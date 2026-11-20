import { describe, expect, it } from 'vitest'
import { resolveHostRewrite, resolveTradeLoginRedirect } from '@/lib/routing'

describe('resolveHostRewrite & resolveTradeLoginRedirect', () => {
  it('rewrites trade.tannerchung.com root to /trade and skips system paths', () => {
    expect(resolveHostRewrite('trade.tannerchung.com', '/')).toBe('/trade')
    expect(resolveHostRewrite('trade.tannerchung.com', '/2026-11-20')).toBe('/trade/2026-11-20')
    expect(resolveHostRewrite('trade.tannerchung.com', '/admin')).toBeNull()
    expect(resolveHostRewrite('trade.tannerchung.com', '/api/trade-sheets/ingest')).toBeNull()
    expect(resolveHostRewrite('trade.tannerchung.com', '/.well-known/acme-challenge/abc')).toBeNull()
  })

  it('leaves primary domain untouched', () => {
    expect(resolveHostRewrite('tannerchung.com', '/')).toBeNull()
  })

  it('computes post-login redirect back to /trade rather than /', () => {
    expect(resolveTradeLoginRedirect('trade.tannerchung.com', '/')).toBe('/trade')
    expect(resolveTradeLoginRedirect('trade.tannerchung.com', '/2026-11-20', '?tab=blotter')).toBe(
      '/trade/2026-11-20?tab=blotter',
    )
    expect(resolveTradeLoginRedirect('tannerchung.com', '/trade/today')).toBe('/trade/today')
  })
})
