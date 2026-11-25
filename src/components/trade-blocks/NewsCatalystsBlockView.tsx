'use client'

import React from 'react'
import type { NewsCatalystsBlockData, TradeCitationItem } from '@/lib/trade-sheets'
import { CitationRefChips } from './CitationRefChips'

const KIND_LABELS: Record<string, string> = {
  sec_filing: 'SEC FILING',
  earnings: 'EARNINGS',
  macro: 'MACRO',
  analyst: 'ANALYST',
  geopolitical: 'GEOPOLITICAL',
}

export function NewsCatalystsBlockView({
  block,
  citations = [],
  onSelectCitation,
}: {
  block: NewsCatalystsBlockData
  citations?: TradeCitationItem[]
  onSelectCitation?: (index: number) => void
}) {
  const items = (block.items ?? []).filter((item) => item?.headline)
  if (items.length === 0) return null

  return (
    <section
      aria-label="News and Catalysts"
      className="border-t border-[var(--color-rule)] pt-7 pb-2"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <span className="font-mono-code text-[10px] uppercase tracking-[0.14em] text-[var(--color-subtle)]">
          05 · News &amp; Corroborated Catalysts
        </span>
        {block.windowLabel && (
          <span className="font-mono-code text-[11px] text-[var(--color-subtle)]">
            {block.windowLabel}
          </span>
        )}
      </div>

      <div className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
        {items.map((item, idx) => {
          const kind = item.catalystKind ?? 'sec_filing'
          return (
            <article key={item.id ?? idx} className="py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  {item.ticker && (
                    <span className="font-mono-code text-[12px] font-semibold text-[var(--color-ink)]">
                      {item.ticker}
                    </span>
                  )}
                  <span className="font-mono-code text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)] px-1.5 py-0.5 border border-[var(--color-rule)] bg-[var(--color-paper-3)]">
                    {KIND_LABELS[kind] ?? kind.toUpperCase()}
                  </span>
                  {item.publishedAt && (
                    <span className="font-mono-code tabular-nums text-[11px] text-[var(--color-subtle)]">
                      {item.publishedAt}
                    </span>
                  )}
                </div>
                {typeof item.citationIndex === 'number' && item.citationIndex > 0 && (
                  <CitationRefChips
                    indices={[item.citationIndex]}
                    citations={citations}
                    onSelectCitation={onSelectCitation}
                  />
                )}
              </div>

              <h4
                className="text-[14px] font-medium leading-[1.45] text-[var(--color-ink)]"
                style={{ fontStyle: 'normal' }}
              >
                {item.headline}
              </h4>

              {item.impactSummary && (
                <p className="mt-1 text-[13px] leading-[1.55] text-[var(--color-muted)]">
                  {item.impactSummary}
                </p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
