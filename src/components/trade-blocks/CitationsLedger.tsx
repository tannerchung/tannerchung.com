'use client'

import React from 'react'
import { sanitizeCitationUrl } from '@/blocks/trade-desk'
import type { TradeCitationItem } from '@/lib/trade-sheets'

const KIND_LABELS: Record<string, string> = {
  sec_filing: 'SEC',
  news: 'WIRE',
  macro: 'MACRO',
  research: 'RESEARCH',
}

export function CitationsLedger({
  citations,
  highlightedIndex,
  onClearHighlight,
  returnLabel,
  onReturn,
}: {
  citations: TradeCitationItem[]
  highlightedIndex?: number | null
  onClearHighlight?: () => void
  returnLabel?: string | null
  onReturn?: () => void
}) {
  const ordered = [...citations].sort((a, b) => a.index - b.index)

  return (
    <section
      aria-label="Citations Ledger"
      className="border-t border-[var(--color-rule)] pt-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <div>
          <span className="font-mono-code text-[10px] uppercase tracking-[0.14em] text-[var(--color-subtle)]">
            Verified Source Ledger
          </span>
          <h2
            className="font-serif-display text-[24px] leading-[1.2] text-[var(--color-ink)] mt-1"
            style={{ fontStyle: 'normal' }}
          >
            Corroborated Citations &amp; Filings
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {returnLabel && onReturn ? (
            <button
              type="button"
              onClick={onReturn}
              className="px-2.5 py-1 border border-[var(--color-accent)] bg-[var(--color-accent-soft)] font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-accent)] hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
            >
              ← {returnLabel}
            </button>
          ) : null}
          {highlightedIndex ? (
            <button
              type="button"
              onClick={onClearHighlight}
              className="font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-accent)] hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2"
            >
              Showing [{highlightedIndex}] · Clear
            </button>
          ) : null}
          <span className="font-mono-code tabular-nums text-[11px] text-[var(--color-subtle)]">
            {ordered.length} {ordered.length === 1 ? 'source' : 'sources'}
          </span>
        </div>
      </div>

      {ordered.length === 0 ? (
        <div className="border border-[var(--color-rule)] bg-[var(--color-paper-3)] px-4 py-6 text-[13px] text-[var(--color-muted)]">
          No verified external citations attached to this session.
        </div>
      ) : (
        <ol className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
          {ordered.map((c) => {
            const safeUrl = sanitizeCitationUrl(c.url)
            const isHighlighted = highlightedIndex === c.index
            const kind = c.kind ?? 'news'
            return (
              <li
                key={c.id ?? `${c.index}-${c.url}`}
                id={`citation-${c.index}`}
                className="py-3.5 px-2 transition-colors"
                style={
                  isHighlighted
                    ? {
                        backgroundColor: 'color-mix(in oklch, var(--color-accent) 9%, transparent)',
                        borderLeft: '2px solid var(--color-accent)',
                        paddingLeft: '0.75rem',
                      }
                    : undefined
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono-code tabular-nums text-[11px] font-semibold text-[var(--color-accent)]">
                        [{c.index}]
                      </span>
                      {c.ticker && (
                        <span className="font-mono-code text-[11px] font-semibold text-[var(--color-ink)]">
                          {c.ticker}
                        </span>
                      )}
                      <span className="font-mono-code text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)] px-1.5 py-0.5 border border-[var(--color-rule)] bg-[var(--color-paper-3)]">
                        {KIND_LABELS[kind] ?? kind.toUpperCase()}
                      </span>
                      <span className="font-mono-code text-[11px] text-[var(--color-muted)]">
                        {c.source}
                      </span>
                      {c.publishedAt && (
                        <span className="font-mono-code tabular-nums text-[11px] text-[var(--color-subtle)]">
                          · {c.publishedAt}
                        </span>
                      )}
                    </div>

                    {safeUrl ? (
                      <a
                        href={safeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13.5px] font-medium text-[var(--color-ink)] hover:text-[var(--color-accent)] underline decoration-[var(--color-rule-2)] underline-offset-4 break-words"
                      >
                        {c.label}
                      </a>
                    ) : (
                      <span className="text-[13.5px] font-medium text-[var(--color-muted)] break-words">
                        {c.label}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

export const CitationsLedgerView = CitationsLedger
