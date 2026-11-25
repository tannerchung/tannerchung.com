'use client'

import React from 'react'
import type { DeskSettingsSummary } from '@/lib/trade-sheets'

export function StandingGuardrailsView({
  deskSettings,
}: {
  deskSettings?: DeskSettingsSummary | null
}) {
  if (!deskSettings) return null

  const guardrails = deskSettings.standingGuardrails ?? []
  const ips = deskSettings.ipsTargets
  const icSeats = deskSettings.icSeats ?? []

  return (
    <section
      aria-label="Standing Guardrails and IPS Targets"
      className="border-t border-[var(--color-rule)] pt-6 space-y-6"
    >
      <div>
        <span className="font-mono-code text-[10px] uppercase tracking-[0.14em] text-[var(--color-subtle)]">
          Standing Desk Policy &amp; Governance
        </span>
        <h2
          className="font-serif-display text-[24px] leading-[1.2] text-[var(--color-ink)] mt-1"
          style={{ fontStyle: 'normal' }}
        >
          IPS Targets, Tax Shield &amp; Standing Guardrails
        </h2>
      </div>

      {ips && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-y border-[var(--color-rule)] py-4">
          <div>
            <div className="font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
              Max Portfolio Beta
            </div>
            <div className="font-mono-code tabular-nums text-[18px] font-semibold text-[var(--color-ink)] mt-1">
              {typeof ips.targetBetaMax === 'number' ? ips.targetBetaMax.toFixed(2) : '—'}
            </div>
          </div>
          <div>
            <div className="font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
              Min Cash Floor
            </div>
            <div className="font-mono-code tabular-nums text-[18px] font-semibold text-[var(--color-ink)] mt-1">
              {typeof ips.minCashFloorUsd === 'number'
                ? `$${ips.minCashFloorUsd.toLocaleString('en-US')}`
                : '—'}
            </div>
          </div>
          <div>
            <div className="font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
              Core Target
            </div>
            <div className="font-mono-code tabular-nums text-[18px] font-semibold text-[var(--color-ink)] mt-1">
              {typeof ips.coreAllocationTargetPct === 'number'
                ? `${ips.coreAllocationTargetPct}%`
                : '—'}
            </div>
          </div>
          <div>
            <div className="font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
              Satellite Cap
            </div>
            <div className="font-mono-code tabular-nums text-[18px] font-semibold text-[var(--color-ink)] mt-1">
              {typeof ips.satelliteMaxSingleWeightPct === 'number'
                ? `${ips.satelliteMaxSingleWeightPct}%`
                : '—'}
            </div>
          </div>
        </div>
      )}

      {(deskSettings.taxShieldReadout ||
        deskSettings.washSaleTickers ||
        typeof deskSettings.maxOptionSpreadPct === 'number') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-4">
          {deskSettings.taxShieldReadout && (
            <div>
              <div className="font-mono-code text-[10px] uppercase tracking-[0.12em] text-[var(--color-subtle)] mb-1">
                Tax Shield Readout
              </div>
              <p className="font-mono-code tabular-nums text-[12.5px] text-[var(--color-ink)]">
                {deskSettings.taxShieldReadout}
              </p>
            </div>
          )}
          {deskSettings.washSaleTickers && (
            <div>
              <div className="font-mono-code text-[10px] uppercase tracking-[0.12em] text-[var(--color-warn)] mb-1">
                Wash-Sale Blackout
                {deskSettings.washSaleBlackoutThrough
                  ? ` (Thru ${deskSettings.washSaleBlackoutThrough})`
                  : ''}
              </div>
              <p className="font-mono-code text-[12px] text-[var(--color-muted)]">
                {deskSettings.washSaleTickers}
              </p>
            </div>
          )}
          {typeof deskSettings.maxOptionSpreadPct === 'number' && (
            <div>
              <div className="font-mono-code text-[10px] uppercase tracking-[0.12em] text-[var(--color-subtle)] mb-1">
                Max Option Spread Gate
              </div>
              <p className="font-mono-code tabular-nums text-[12.5px] text-[var(--color-ink)]">
                ≤ {deskSettings.maxOptionSpreadPct}% bid-ask width
              </p>
            </div>
          )}
        </div>
      )}

      {guardrails.length > 0 && (
        <div>
          <div className="font-mono-code text-[10px] uppercase tracking-[0.14em] text-[var(--color-subtle)] mb-2.5">
            Standing Execution Guardrails
          </div>
          <dl className="divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
            {guardrails.map((g, idx) => (
              <div
                key={`${g.code}-${idx}`}
                className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4"
              >
                <dt className="font-mono-code text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)] sm:w-44 shrink-0">
                  {g.code}
                </dt>
                <dd className="text-[13px] leading-[1.55] text-[var(--color-muted)]">
                  {g.rule}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {icSeats.length > 0 && (
        <div>
          <div className="font-mono-code text-[10px] uppercase tracking-[0.14em] text-[var(--color-subtle)] mb-2.5">
            Configured Investment Committee Roster ({icSeats.length} seats)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {icSeats.map((seat) => (
              <div
                key={seat.seatKey}
                className="border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-3"
              >
                <div className="text-[13px] font-semibold text-[var(--color-ink)]">
                  {seat.displayName}
                </div>
                <div className="font-mono-code text-[10px] uppercase tracking-[0.08em] text-[var(--color-accent)] mt-0.5 mb-1.5">
                  {seat.archetype}
                </div>
                <p className="text-[12px] leading-[1.5] text-[var(--color-muted)]">
                  {seat.mandate}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
