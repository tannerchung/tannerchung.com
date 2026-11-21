'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface DeskChromeBarProps {
  isTradeHost: boolean
  siteName: string
  deskLabel: string
  defaultDrop: 'night' | 'day'
}

const PUBLIC_LINKS = [
  { href: '/projects', label: 'projects' },
  { href: '/blog', label: 'writing' },
  { href: '/lab', label: 'lab' },
]

export function DeskChromeBar({
  isTradeHost,
  siteName,
  deskLabel,
  defaultDrop,
}: DeskChromeBarProps) {
  const pathname = usePathname() || '/'
  const isTradeSurface = isTradeHost || pathname.startsWith('/trade')
  const [drop, setDrop] = useState<'night' | 'day'>(defaultDrop)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('tc:lumen-drop')
      if (saved === 'night' || saved === 'day') {
        setDrop(saved)
        document.documentElement.dataset.drop = saved
      }
    } catch {
      // Ignore storage access errors
    }
  }, [])

  function toggleDrop() {
    const next = drop === 'night' ? 'day' : 'night'
    setDrop(next)
    document.documentElement.dataset.drop = next
    try {
      window.localStorage.setItem('tc:lumen-drop', next)
    } catch {
      // Ignore storage access errors
    }
  }

  return (
    <header className="border-b border-[var(--color-rule)] bg-[var(--color-paper)]/90 backdrop-blur-md sticky top-0 z-30">
      <div
        className={`mx-auto w-full px-5 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 ${
          isTradeSurface ? 'max-w-7xl' : 'max-w-5xl'
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_10px_var(--color-glow)]"
          />
          {isTradeSurface ? (
            <div className="flex flex-wrap items-center gap-2 font-mono-code text-xs">
              <Link
                href={isTradeHost ? '/' : '/trade'}
                className="font-medium tracking-tight text-[var(--color-ink)] hover:text-[var(--color-accent)] transition-colors"
              >
                trade.tannerchung.com
              </Link>
              <span className="text-[var(--color-subtle)]">//</span>
              <span className="uppercase tracking-[0.12em] text-[10.5px] text-[var(--color-muted)]">
                {deskLabel}
              </span>
            </div>
          ) : (
            <Link
              href="/"
              className="font-mono-code text-xs sm:text-sm tracking-tight text-[var(--color-ink)] hover:text-[var(--color-accent)] transition-colors"
            >
              {siteName}
            </Link>
          )}
        </div>

        <nav className="flex items-center gap-3 sm:gap-5">
          {isTradeSurface ? (
            <>
              <Link
                href={isTradeHost ? '/' : '/trade'}
                className="font-mono-code text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
              >
                Latest
              </Link>
              <Link
                href="/admin"
                className="font-mono-code text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
              >
                CMS
              </Link>
              <a
                href="https://tannerchung.com"
                className="hidden sm:inline font-mono-code text-[11px] uppercase tracking-[0.1em] text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
              >
                Public ↗
              </a>
            </>
          ) : (
            PUBLIC_LINKS.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm lowercase transition-colors ${
                    active
                      ? 'text-[var(--color-accent)] font-medium'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })
          )}

          <button
            type="button"
            onClick={toggleDrop}
            aria-label={`Switch palette drop (currently ${drop} foundry)`}
            className="lumen-press inline-flex min-h-[34px] items-center gap-1.5 rounded-md border border-[var(--color-rule-2)] bg-[var(--color-paper-2)] px-2.5 py-1 font-mono-code text-[10.5px] uppercase tracking-[0.1em] text-[var(--color-ink-2)] hover:border-[var(--color-accent)] cursor-pointer"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            {drop === 'night' ? 'Night' : 'Day'}
          </button>
        </nav>
      </div>
    </header>
  )
}
