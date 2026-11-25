'use client'

import React from 'react'
import type { TradeCitationItem } from '@/lib/trade-sheets'

export function parseCitationRefIndices(refs?: string | null): number[] {
  if (!refs) return []
  const seen = new Set<number>()
  const out: number[] = []
  for (const part of refs.split(/[,\s;]+/)) {
    const cleaned = part.replace(/[^0-9]/g, '')
    if (!cleaned) continue
    const num = Number(cleaned)
    if (Number.isInteger(num) && num > 0 && !seen.has(num)) {
      seen.add(num)
      out.push(num)
    }
  }
  return out
}

export function CitationRefChips({
  refs,
  indices,
  citations = [],
  onSelectCitation,
}: {
  refs?: string | null
  indices?: number[]
  citations?: TradeCitationItem[]
  onSelectCitation?: (index: number) => void
}) {
  const list = indices ?? parseCitationRefIndices(refs)
  if (list.length === 0) return null

  const byIndex = new Map<number, TradeCitationItem>()
  for (const c of citations) {
    byIndex.set(c.index, c)
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1 align-baseline">
      {list.map((idx) => {
        const match = byIndex.get(idx)
        const title = match ? `${match.source}: ${match.label}` : `Jump to citation [${idx}]`
        return (
          <button
            key={idx}
            type="button"
            title={title}
            aria-label={title}
            onClick={() => onSelectCitation?.(idx)}
            className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono-code tabular-nums leading-none border border-[var(--color-rule)] bg-[var(--color-paper-3)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-1 transition-colors cursor-pointer"
          >
            [{idx}]
          </button>
        )
      })}
    </span>
  )
}
