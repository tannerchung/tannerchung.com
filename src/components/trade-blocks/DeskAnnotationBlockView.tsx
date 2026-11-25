'use client'

import React from 'react'
import type { DeskAnnotationBlockData } from '@/lib/trade-sheets'

const SCOPE_LABELS: Record<string, string> = {
  session: 'SESSION NOTE',
  ticker: 'TICKER OVERRIDE',
  risk_override: 'RISK OVERRIDE',
  post_mortem: 'POST-MORTEM',
}

export function DeskAnnotationBlockView({
  block,
}: {
  block: DeskAnnotationBlockData
}) {
  const scope = block.scope ?? 'session'
  const isRiskOverride = scope === 'risk_override'

  return (
    <aside
      aria-label={`Desk Annotation: ${block.heading}`}
      className="border border-[var(--color-rule)] border-l-2 bg-[var(--color-paper-2)] px-5 py-4"
      style={{
        borderLeftColor: isRiskOverride ? 'var(--color-neg)' : 'var(--color-accent)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="font-mono-code text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: isRiskOverride ? 'var(--color-neg)' : 'var(--color-accent)' }}
          >
            {SCOPE_LABELS[scope] ?? scope.toUpperCase()}
          </span>
          {block.ticker && (
            <span className="font-mono-code text-[11px] font-semibold text-[var(--color-ink)] px-1.5 py-0.5 border border-[var(--color-rule)] bg-[var(--color-paper-3)]">
              {block.ticker}
            </span>
          )}
          {block.pinToTop !== false && (
            <span className="font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
              · Pinned
            </span>
          )}
        </div>
        <div className="font-mono-code text-[11px] text-[var(--color-subtle)]">
          {block.author || 'Tanner Chung'}
          {block.createdAtNote ? ` · ${block.createdAtNote.slice(0, 10)}` : ''}
        </div>
      </div>

      <h3
        className="font-display text-[20px] leading-[1.2] text-[var(--color-ink)] mb-1.5"
        style={{ fontStyle: 'normal' }}
      >
        {block.heading}
      </h3>
      <p className="text-[13.5px] leading-[1.6] text-[var(--color-muted)] whitespace-pre-line">
        {block.body}
      </p>
    </aside>
  )
}
