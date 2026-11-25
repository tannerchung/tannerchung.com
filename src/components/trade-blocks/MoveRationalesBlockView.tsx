'use client'

import React from 'react'
import type { MoveRationalesBlockData, TradeCitationItem } from '@/lib/trade-sheets'
import { CitationRefChips } from './CitationRefChips'

function actionStyle(action: string): React.CSSProperties {
  const upper = action.toUpperCase()
  if (upper.includes('SELL') || upper.includes('TRIM')) {
    return {
      color: 'var(--color-neg)',
      borderColor: 'color-mix(in oklch, var(--color-neg) 36%, transparent)',
      backgroundColor: 'color-mix(in oklch, var(--color-neg) 7%, transparent)',
    }
  }
  if (upper.includes('BUY') || upper.includes('ADD')) {
    return {
      color: 'var(--color-pos)',
      borderColor: 'color-mix(in oklch, var(--color-pos) 36%, transparent)',
      backgroundColor: 'color-mix(in oklch, var(--color-pos) 7%, transparent)',
    }
  }
  if (upper.includes('ROLL')) {
    return {
      color: 'var(--color-accent)',
      borderColor: 'color-mix(in oklch, var(--color-accent) 36%, transparent)',
      backgroundColor: 'color-mix(in oklch, var(--color-accent) 7%, transparent)',
    }
  }
  return {
    color: 'var(--color-muted)',
    borderColor: 'var(--color-rule-2)',
    backgroundColor: 'var(--color-paper-3)',
  }
}

export function MoveRationalesBlockView({
  block,
  citations = [],
  onSelectCitation,
  activeTicker,
  onSelectTicker,
}: {
  block: MoveRationalesBlockData
  citations?: TradeCitationItem[]
  onSelectCitation?: (index: number) => void
  activeTicker?: string | null
  onSelectTicker?: (ticker: string) => void
}) {
  const items = (block.items ?? []).filter((item) => item?.ticker && item?.rationale)
  if (items.length === 0) return null

  return (
    <section
      aria-label="Move Rationales"
      className="border-t border-[var(--color-rule)] pt-7 pb-2"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <span className="font-mono-code text-[10px] uppercase tracking-[0.14em] text-[var(--color-subtle)]">
          02 · Ticket-by-Ticket Action Rationale
        </span>
        <span className="font-mono-code tabular-nums text-[11px] text-[var(--color-subtle)]">
          {items.length} {items.length === 1 ? 'position' : 'positions'}
        </span>
      </div>

      {block.sectionTitle && block.sectionTitle !== 'Ticket-by-Ticket Action Rationale' && (
        <h3
          className="font-serif-display text-[22px] leading-[1.2] text-[var(--color-ink)] mb-4"
          style={{ fontStyle: 'normal' }}
        >
          {block.sectionTitle}
        </h3>
      )}

      <div className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
        {items.map((item, idx) => {
          const isSelected =
            activeTicker && item.ticker.toUpperCase() === activeTicker.toUpperCase()
          return (
            <article
              key={item.id ?? `${item.ticker}-${idx}`}
              className="py-4 transition-colors"
              style={
                isSelected
                  ? {
                      backgroundColor: 'color-mix(in oklch, var(--color-accent) 5%, transparent)',
                      paddingLeft: '0.75rem',
                      paddingRight: '0.75rem',
                    }
                  : undefined
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  {onSelectTicker ? (
                    <button
                      type="button"
                      onClick={() => onSelectTicker(item.ticker)}
                      className="font-mono-code text-[14px] font-semibold tracking-tight text-[var(--color-ink)] hover:text-[var(--color-accent)] cursor-pointer"
                    >
                      {item.ticker}
                    </button>
                  ) : (
                    <span className="font-mono-code text-[14px] font-semibold tracking-tight text-[var(--color-ink)]">
                      {item.ticker}
                    </span>
                  )}
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono-code font-semibold uppercase tracking-[0.08em] border"
                    style={actionStyle(item.action)}
                  >
                    {item.action}
                  </span>
                  {item.conviction && (
                    <span className="font-mono-code text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)] px-1.5 py-0.5 border border-[var(--color-rule)] bg-[var(--color-paper-3)]">
                      {item.conviction} conviction
                    </span>
                  )}
                  {item.horizon && (
                    <span className="font-mono-code text-[11px] text-[var(--color-subtle)]">
                      · {item.horizon}
                    </span>
                  )}
                </div>
                <CitationRefChips
                  refs={item.citationRefs}
                  citations={citations}
                  onSelectCitation={onSelectCitation}
                />
              </div>

              <p className="text-[14px] leading-[1.6] text-[var(--color-ink)]">
                {item.rationale}
              </p>

              {item.keyRisks && (
                <p className="mt-2 text-[12.5px] leading-[1.55] text-[var(--color-muted)]">
                  <span className="font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-warn)] mr-1.5">
                    Key Risk
                  </span>
                  {item.keyRisks}
                </p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
