'use client'

import React from 'react'
import type { IcSeatConfig } from '@/globals/TradeDeskSettings'
import type { PanelDebatesBlockData, TradeCitationItem } from '@/lib/trade-sheets'
import { CitationRefChips } from './CitationRefChips'

const STANCE_STYLE: Record<
  'approve' | 'caution' | 'dissent' | 'abstain',
  { label: string; style: React.CSSProperties }
> = {
  approve: {
    label: 'APPROVE',
    style: {
      color: 'var(--color-pos)',
      borderColor: 'color-mix(in oklch, var(--color-pos) 38%, transparent)',
      backgroundColor: 'color-mix(in oklch, var(--color-pos) 8%, transparent)',
    },
  },
  caution: {
    label: 'CAUTION',
    style: {
      color: 'var(--color-warn)',
      borderColor: 'color-mix(in oklch, var(--color-warn) 38%, transparent)',
      backgroundColor: 'color-mix(in oklch, var(--color-warn) 8%, transparent)',
    },
  },
  dissent: {
    label: 'DISSENT',
    style: {
      color: 'var(--color-neg)',
      borderColor: 'color-mix(in oklch, var(--color-neg) 38%, transparent)',
      backgroundColor: 'color-mix(in oklch, var(--color-neg) 8%, transparent)',
    },
  },
  abstain: {
    label: 'ABSTAIN',
    style: {
      color: 'var(--color-muted)',
      borderColor: 'var(--color-rule-2)',
      backgroundColor: 'var(--color-paper-3)',
    },
  },
}

export function PanelDebatesBlockView({
  block,
  citations = [],
  icSeats = [],
  onSelectCitation,
}: {
  block: PanelDebatesBlockData
  citations?: TradeCitationItem[]
  icSeats?: IcSeatConfig[]
  onSelectCitation?: (index: number) => void
}) {
  const seats = (block.seats ?? []).filter((s) => s?.seatName && s?.thesis)
  const seatMetaByKey = new Map<string, IcSeatConfig>()
  for (const cfg of icSeats) {
    seatMetaByKey.set(cfg.seatKey.toLowerCase(), cfg)
  }

  const counts = seats.reduce(
    (acc, s) => {
      acc[s.stance] = (acc[s.stance] ?? 0) + 1
      return acc
    },
    { approve: 0, caution: 0, dissent: 0, abstain: 0 } as Record<string, number>,
  )

  return (
    <section
      aria-label={`IC Panel Debate: ${block.topic}`}
      className="border-t border-[var(--color-rule)] pt-7 pb-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="font-mono-code text-[10px] uppercase tracking-[0.14em] text-[var(--color-subtle)]">
          03 · Investment Committee Debate &amp; Dissent
        </span>
        {seats.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 font-mono-code tabular-nums text-[10px] text-[var(--color-muted)]">
            <span>{counts.approve} approve</span>
            <span>·</span>
            <span>{counts.caution} caution</span>
            <span>·</span>
            <span
              style={
                counts.dissent > 0 ? { color: 'var(--color-neg)', fontWeight: 600 } : undefined
              }
            >
              {counts.dissent} dissent
            </span>
          </div>
        )}
      </div>

      <h3
        className="font-display text-[23px] leading-[1.2] text-[var(--color-ink)] mb-3"
        style={{ fontStyle: 'normal' }}
      >
        {block.topic}
      </h3>

      {block.consensusSummary && (
        <p className="text-[14px] leading-[1.6] text-[var(--color-ink)] mb-4">
          {block.consensusSummary}
        </p>
      )}

      {(block.dissentHeadline || block.strongestUnresolvedObjection) && (
        <div
          className="border-l-2 pl-4 py-2 mb-5 bg-[var(--color-paper-3)] pr-4"
          style={{ borderColor: 'var(--color-neg)' }}
        >
          <div className="font-mono-code text-[10px] uppercase tracking-[0.12em] text-[var(--color-neg)] mb-1">
            Strongest Unresolved Dissent
          </div>
          {block.dissentHeadline && (
            <div className="text-[14px] font-medium text-[var(--color-ink)] mb-1">
              {block.dissentHeadline}
            </div>
          )}
          {block.strongestUnresolvedObjection && (
            <p className="text-[13px] leading-[1.55] text-[var(--color-muted)]">
              {block.strongestUnresolvedObjection}
            </p>
          )}
        </div>
      )}

      {seats.length > 0 && (
        <div className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
          {seats.map((seat, idx) => {
            const stanceMeta = STANCE_STYLE[seat.stance] ?? STANCE_STYLE.caution
            const seatConfig = seatMetaByKey.get(seat.seatKey.toLowerCase())
            return (
              <div key={seat.id ?? `${seat.seatKey}-${idx}`} className="py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-[var(--color-ink)]">
                      {seat.seatName}
                    </span>
                    {seatConfig?.archetype && (
                      <span className="font-mono-code text-[10px] text-[var(--color-subtle)]">
                        {seatConfig.archetype}
                      </span>
                    )}
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono-code font-semibold uppercase tracking-[0.08em] border"
                      style={stanceMeta.style}
                    >
                      {stanceMeta.label}
                    </span>
                  </div>
                  <CitationRefChips
                    refs={seat.citationRefs}
                    citations={citations}
                    onSelectCitation={onSelectCitation}
                  />
                </div>
                <p className="text-[13.5px] leading-[1.6] text-[var(--color-ink)]">
                  {seat.thesis}
                </p>
                {seat.objection && (
                  <p className="mt-1.5 text-[12.5px] leading-[1.55] text-[var(--color-muted)]">
                    <span className="font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-neg)] mr-1.5">
                      Objection
                    </span>
                    {seat.objection}
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
