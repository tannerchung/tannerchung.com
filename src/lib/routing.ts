export function resolveHostRewrite(host: string, pathname: string): string | null {
  const cleanHost = host.split(':')[0].toLowerCase()
  if (cleanHost === 'trade.tannerchung.com') {
    if (
      pathname.startsWith('/trade') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next')
    ) {
      return null
    }
    return pathname === '/' ? '/trade' : `/trade${pathname}`
  }
  return null
}
