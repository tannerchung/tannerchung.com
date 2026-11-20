'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string }
  }
}

export function TurnstileField({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey || !ref.current || !window.turnstile) return
    window.turnstile.render(ref.current, { sitekey: siteKey, callback: onToken })
  }, [siteKey, onToken])

  if (!siteKey) return null
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={ref} />
    </>
  )
}
