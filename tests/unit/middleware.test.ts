import { describe, expect, it } from 'vitest'
import { resolveHostRewrite } from '@/lib/routing'

describe('resolveHostRewrite', () => {
  it('rewrites trade.tannerchung.com root to /trade', () => {
    expect(resolveHostRewrite('trade.tannerchung.com', '/')).toBe('/trade')
    expect(resolveHostRewrite('trade.tannerchung.com', '/sheets')).toBe('/trade/sheets')
    expect(resolveHostRewrite('trade.tannerchung.com', '/admin')).toBeNull()
  })

  it('leaves primary domain untouched', () => {
    expect(resolveHostRewrite('tannerchung.com', '/')).toBeNull()
  })
})
