export function resolveHostRewrite(host: string, pathname: string): string | null {
  const cleanHost = host.split(':')[0].toLowerCase()
  if (cleanHost === 'trade.tannerchung.com') {
    if (
      pathname.startsWith('/trade') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/.well-known')
    ) {
      return null
    }
    return pathname === '/' ? '/trade' : `/trade${pathname}`
  }
  return null
}

export function resolveTradeLoginRedirect(
  host: string,
  pathname: string,
  search = '',
): string {
  const rewritten = resolveHostRewrite(host, pathname)
  const targetPath = rewritten ?? (pathname === '/' ? '/trade' : pathname)
  return `${targetPath}${search}`
}
