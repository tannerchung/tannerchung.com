import { NextResponse, type NextRequest } from 'next/server'
import { resolveHostRewrite, resolveTradeLoginRedirect } from '@/lib/routing'
import { checkRateLimit } from '@/lib/security/rate-limit'

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const host = req.headers.get('host') ?? ''

  if (pathname === '/api/users/login' && req.method === 'POST') {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(`login:${ip}`, 10, 15 * 60_000).allowed) {
      return NextResponse.json({ error: 'Too many login attempts' }, { status: 429 })
    }
  }

  const isPublicSystemPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/.well-known')

  if ((pathname.startsWith('/trade') || host.startsWith('trade.')) && !isPublicSystemPath) {
    const hasSessionCookie = Boolean(req.cookies.get('payload-token')?.value)
    if (!hasSessionCookie) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('redirect', resolveTradeLoginRedirect(host, pathname, search))
      return NextResponse.redirect(loginUrl)
    }
  }

  const rewritePath = resolveHostRewrite(host, pathname)
  if (rewritePath) {
    const url = req.nextUrl.clone()
    url.pathname = rewritePath
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
