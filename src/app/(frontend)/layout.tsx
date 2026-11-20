import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Instrument_Serif, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
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
  title: 'Tanner Chung — Systems, Engineering & Experiments',
  description:
    'Field CTO & AI Systems Engineer in Brooklyn. Building enterprise knowledge graphs, agentic workflows, and disciplined market infrastructure.',
}

const navLinks = [
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Writing' },
  { href: '/lab', label: 'Lab' },
]

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col">
        <header className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
            <Link href="/" className="font-mono-code text-sm tracking-tight text-[var(--ink)]">
              tannerchung.com
            </Link>
            <nav className="flex items-center gap-6 text-sm text-[var(--muted)]">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-[var(--ink)] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-12">{children}</main>
        <footer className="border-t border-[var(--border)]">
          <div className="mx-auto max-w-5xl px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--muted)] font-mono-code">
            <span>BROOKLYN, NY // EST. 2026</span>
            <div className="flex items-center gap-5">
              <Link href="/admin" className="hover:text-[var(--ink)] transition-colors">
                CMS
              </Link>
              <Link href="/trade" className="hover:text-[var(--ink)] transition-colors">
                Desk
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
