export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string | null,
  opts?: { secret?: string; fetchImpl?: typeof fetch },
): Promise<boolean> {
  const secret = opts?.secret ?? process.env.TURNSTILE_SECRET_KEY
  if (!token || !secret) return false
  const fetchImpl = opts?.fetchImpl ?? fetch
  const body = new URLSearchParams({ secret, response: token })
  if (remoteIp) body.set('remoteip', remoteIp)

  const res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) return false
  const data = (await res.json()) as { success?: boolean }
  return Boolean(data.success)
}
