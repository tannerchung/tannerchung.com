'use client'

import React from 'react'
import type { ExecutiveMandateBlockData, TradeCitationItem } from '@/lib/trade-sheets'
import { CitationRefChips } from './CitationRefChips'

const POSTURE_META: Record<
  ExecutiveMandateBlockData['posture'],
  { label: string; style: React.CSSProperties }
> = {
  risk_on: {
    label: 'RISK ON',
    style: {
      color: 'var(--color-pos)',
      borderColor: 'color-mix(in oklch, var(--color-pos) 38%, transparent)',
      backgroundColor: 'color-mix(in oklch, var(--color-pos) 8%, transparent)',
    },
  },
  balanced: {
    label: 'BALANCED',
    style: {
      color: 'var(--color-ink)',
      borderColor: 'var(--color-rule-2)',
      backgroundColor: 'var(--color-paper-3)',
    },
  },
  defensive: {
    label: 'DEFENSIVE',
    style: {
      color: 'var(--color-warn)',
      borderColor: 'color-mix(in oklch, var(--color-warn) 38%, transparent)',
      backgroundColor: 'color-mix(in oklch, var(--color-warn) 8%, transparent)',
    },
  },
  stand_aside: {
    label: 'STAND ASIDE',
    style: {
      color: 'var(--color-neg)',
      borderColor: 'color-mix(in oklch, var(--color-neg) 38%, transparent)',
      backgroundColor: 'color-mix(in oklch, var(--color-neg) 8%, transparent)',
    },
  },
}

export function ExecutiveMandateBlockView({
  block,
  citations = [],
  onSelectCitation,
}: {
  block: ExecutiveMandateBlockData
  citations?: TradeCitationItem[]
  onSelectCitation?: (index: number) => void
}) {
  const posture = POSTURE_META[block.posture] ?? POSTURE_META.balanced
  const summaryPoints = (block.summaryPoints ?? []).filter((p) => p?.text)
  const holdOffNotes = (block.holdOffNotes ?? []).filter((n) => n?.note)

  return (
    <section
      aria-label="Executive Mandate"
      className="border-t border-[var(--color-rule)] pt-7 pb-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono-code text-[10px] uppercase tracking-[0.14em] text-[var(--color-subtle)]">
            01 · Executive Mandate
          </span>
          <span
            className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono-code font-semibold uppercase tracking-[0.1em] border"
            style={posture.style}
          >
            {posture.label}
          </span>
        </div>
        <CitationRefChips
          refs={block.citationRefs}
          citations={citations}
          onSelectCitation={onSelectCitation}
        />
      </div>

      <h2
        className="font-display text-[26px] sm:text-[30px] leading-[1.16] tracking-[-0.015em] text-[var(--color-ink)] mb-4"
        style={{ fontStyle: 'normal' }}
      >
        {block.mandateHeadline}
      </h2>

      {(block.cashFloorGate || block.regimeCall) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3.5 border-y border-[var(--color-rule)] mb-5">
          {block.regimeCall && (
            <div>
              <div className="font-mono-code text-[10px] uppercase tracking-[0.12em] text-[var(--color-subtle)] mb-1">
                Regime Call
              </div>
              <p className="text-[13px] leading-[1.5] text-[var(--color-ink)]">
                {block.regimeCall}
              </p>
            </div>
          )}
          {block.cashFloorGate && (
            <div>
              <div className="font-mono-code text-[10px] uppercase tracking-[0.12em] text-[var(--color-subtle)] mb-1">
                Cash &amp; Liquidity Gate
              </div>
              <p className="font-mono-code tabular-nums text-[13px] leading-[1.5] text-[var(--color-ink)]">
                {block.cashFloorGate}
              </p>
            </div>
          )}
        </div>
      )}

      {summaryPoints.length > 0 && (
        <ul className="space-y-2.5 mb-5">
          {summaryPoints.map((pt, idx) => (
            <li
              key={pt.id ?? idx}
              className="flex gap-3 text-[14px] leading-[1.6] text-[var(--color-ink)]"
            >
              <span className="font-mono-code tabular-nums text-[11px] text-[var(--color-subtle)] pt-1 shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span>{pt.text}</span>
            </li>
          ))}
        </ul>
      )}

      {holdOffNotes.length > 0 && (
        <div
          className="border-l-2 pl-4 py-1 mt-4"
          style={{ borderColor: 'var(--color-warn)' }}
        >
          <div className="font-mono-code text-[10px] uppercase tracking-[0.12em] text-[var(--color-warn)] mb-2">
            Hold-Off &amp; Discipline Notes
          </div>
          <ul className="space-y-1.5">
            {holdOffNotes.map((n, idx) => (
              <li
                key={n.id ?? idx}
                className="text-[13px] leading-[1.55] text-[var(--color-muted)]"
              >
                {n.note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
