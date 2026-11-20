import { describe, expect, it, vi } from 'vitest'
import { verifyTurnstileToken } from '@/lib/security/turnstile'
import { checkRateLimit } from '@/lib/security/rate-limit'

describe('verifyTurnstileToken', () => {
  it('rejects empty tokens without hitting Cloudflare', async () => {
    const fetchMock = vi.fn()
    const ok = await verifyTurnstileToken('', '1.2.3.4', { secret: 'sec', fetchImpl: fetchMock as never })
    expect(ok).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts form payload to siteverify and honors success boolean', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
    const ok = await verifyTurnstileToken('tok_123', '1.2.3.4', { secret: 'sec', fetchImpl: fetchMock as never })
    expect(ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})

describe('checkRateLimit', () => {
  it('blocks requests exceeding max per window', () => {
    const key = `test:${Date.now()}`
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true)
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true)
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(false)
  })
})
