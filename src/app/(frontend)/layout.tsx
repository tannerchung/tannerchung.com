import React from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Instrument_Serif, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import { getPayload } from 'payload'
import config from '@payload-config'
import { DeskChromeBar } from '@/components/DeskChromeBar'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Tanner Chung — Systems, Engineering & Sovereign Desk',
  description:
    'Field CTO & AI Systems Engineer in Brooklyn. Building enterprise knowledge graphs, agentic workflows, and disciplined market infrastructure.',
}

async function loadChromeSettings() {
  try {
    const payload = await getPayload({ config })
    const site = await payload.findGlobal({ slug: 'site-settings' })
    return {
      siteName: site?.siteName || 'tannerchung.com',
      locationReadout: site?.locationReadout || 'BROOKLYN, NY // EST. 2026',
      activeTheme: (site?.activeTheme as string) || 'lumen',
      defaultDrop: (site?.defaultDrop === 'day' ? 'day' : 'night') as 'night' | 'day',
    }
  } catch {
    return {
      siteName: 'tannerchung.com',
      locationReadout: 'BROOKLYN, NY // EST. 2026',
      activeTheme: 'lumen',
      defaultDrop: 'night' as const,
    }
  }
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers()
  const host = hdrs.get('host') ?? ''
  const isTradeHost = host.startsWith('trade.')
  const settings = await loadChromeSettings()

  return (
    <html
      lang="en"
      data-theme={settings.activeTheme}
      data-drop={settings.defaultDrop}
      className={`${instrumentSerif.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] flex flex-col">
        <DeskChromeBar
          isTradeHost={isTradeHost}
          siteName={settings.siteName}
          deskLabel="sovereign wealth desk"
          defaultDrop={settings.defaultDrop}
        />
        <main
          className={`flex-1 mx-auto w-full px-5 sm:px-8 py-8 sm:py-10 ${
            isTradeHost ? 'max-w-7xl' : 'max-w-6xl'
          }`}
        >
          {children}
        </main>
        <footer className="border-t border-[var(--color-rule)] bg-[var(--color-paper)]">
          <div
            className={`mx-auto w-full px-5 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-4 text-[11px] text-[var(--color-muted)] font-mono-code uppercase tracking-[0.1em] ${
              isTradeHost ? 'max-w-7xl' : 'max-w-6xl'
            }`}
          >
            <span>
              {isTradeHost
                ? 'PRIVATE DESK · RLS + CLOUDFLARE EDGE HARDENED · DATA MINIMIZED'
                : settings.locationReadout}
            </span>
            <div className="flex items-center gap-5">
              <Link href="/admin" className="hover:text-[var(--color-ink)] transition-colors">
                CMS
              </Link>
              <Link
                href={isTradeHost ? '/' : '/trade'}
                className="hover:text-[var(--color-ink)] transition-colors"
              >
                Desk
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
