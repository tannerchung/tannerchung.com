'use client'

import React from 'react'
import type { RedTeamChallengerBlockData, TradeCitationItem } from '@/lib/trade-sheets'
import { CitationRefChips } from './CitationRefChips'

const SEVERITY_STYLE: Record<string, React.CSSProperties> = {
  low: {
    color: 'var(--color-muted)',
    borderColor: 'var(--color-rule-2)',
    backgroundColor: 'var(--color-paper-3)',
  },
  medium: {
    color: 'var(--color-warn)',
    borderColor: 'color-mix(in oklch, var(--color-warn) 38%, transparent)',
    backgroundColor: 'color-mix(in oklch, var(--color-warn) 8%, transparent)',
  },
  elevated: {
    color: 'var(--color-warn)',
    borderColor: 'color-mix(in oklch, var(--color-warn) 38%, transparent)',
    backgroundColor: 'color-mix(in oklch, var(--color-warn) 8%, transparent)',
  },
  high: {
    color: 'var(--color-neg)',
    borderColor: 'color-mix(in oklch, var(--color-neg) 38%, transparent)',
    backgroundColor: 'color-mix(in oklch, var(--color-neg) 8%, transparent)',
  },
  critical: {
    color: 'var(--color-neg)',
    borderColor: 'color-mix(in oklch, var(--color-neg) 38%, transparent)',
    backgroundColor: 'color-mix(in oklch, var(--color-neg) 8%, transparent)',
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  macro: 'MACRO',
  concentration: 'CONCENTRATION',
  liquidity: 'LIQUIDITY',
  tax_wash_sale: 'TAX / WASH SALE',
  options_pin: 'OPTIONS PIN',
  valuation: 'VALUATION',
}

export function RedTeamChallengerBlockView({
  block,
  citations = [],
  onSelectCitation,
}: {
  block: RedTeamChallengerBlockData
  citations?: TradeCitationItem[]
  onSelectCitation?: (index: number) => void
}) {
  const severity = block.overallSeverity ?? 'elevated'
  const blindSpots = (block.blindSpots ?? []).filter((b) => b?.claim)

  return (
    <section
      aria-label="Red-Team Challenger"
      className="border-t border-[var(--color-rule)] pt-7 pb-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="font-mono-code text-[10px] uppercase tracking-[0.14em] text-[var(--color-subtle)]">
          04 · Autonomous Red-Team &amp; Pre-Mortem
        </span>
        <span
          className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono-code font-semibold uppercase tracking-[0.08em] border"
          style={SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.elevated}
        >
          Severity: {severity}
        </span>
      </div>

      <h3
        className="font-serif-display text-[22px] leading-[1.2] text-[var(--color-ink)] mb-3"
        style={{ fontStyle: 'normal' }}
      >
        {block.challengerTitle || 'Autonomous Red-Team & Second-Level Blind Spots'}
      </h3>

      <p className="text-[14px] leading-[1.6] text-[var(--color-ink)] mb-5">
        {block.preMortemSummary}
      </p>

      {blindSpots.length > 0 && (
        <div className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
          {blindSpots.map((spot, idx) => {
            const cat = spot.category ?? 'concentration'
            const sev = spot.severity ?? 'medium'
            return (
              <div key={spot.id ?? idx} className="py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-ink)] px-1.5 py-0.5 border border-[var(--color-rule)] bg-[var(--color-paper-3)]">
                      {CATEGORY_LABELS[cat] ?? cat.toUpperCase()}
                    </span>
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono-code font-semibold uppercase tracking-[0.08em] border"
                      style={SEVERITY_STYLE[sev] ?? SEVERITY_STYLE.medium}
                    >
                      {sev}
                    </span>
                  </div>
                  <CitationRefChips
                    refs={spot.citationRefs}
                    citations={citations}
                    onSelectCitation={onSelectCitation}
                  />
                </div>
                <p className="text-[13.5px] leading-[1.6] text-[var(--color-ink)]">
                  {spot.claim}
                </p>
                {spot.mitigation && (
                  <p className="mt-1.5 text-[12.5px] leading-[1.55] text-[var(--color-muted)]">
                    <span className="font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-pos)] mr-1.5">
                      Mitigation
                    </span>
                    {spot.mitigation}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
