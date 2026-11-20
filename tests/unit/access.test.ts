import { describe, expect, it } from 'vitest'
import { isAdmin, publishedOrAdmin } from '@/access/roles'

describe('access guards', () => {
  it('denies unauthenticated users from admin-only collections', () => {
    expect(isAdmin({ req: { user: null } } as never)).toBe(false)
    expect(isAdmin({ req: { user: { id: '1', role: 'viewer' } } } as never)).toBe(false)
  })

  it('allows admin users', () => {
    expect(isAdmin({ req: { user: { id: '1', role: 'admin' } } } as never)).toBe(true)
  })

  it('restricts unauthenticated reads to published docs only', () => {
    expect(publishedOrAdmin({ req: { user: null } } as never)).toEqual({
      _status: { equals: 'published' },
    })
    expect(publishedOrAdmin({ req: { user: { id: '1', role: 'admin' } } } as never)).toBe(true)
  })
})
