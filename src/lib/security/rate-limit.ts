const buckets = new Map<string, number[]>()

export function checkRateLimit(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now()
  const recent = (buckets.get(key) ?? []).filter((ts) => now - ts < windowMs)
  if (recent.length >= maxRequests) {
    buckets.set(key, recent)
    return { allowed: false, remaining: 0 }
  }
  recent.push(now)
  buckets.set(key, recent)
  return { allowed: true, remaining: maxRequests - recent.length }
}
