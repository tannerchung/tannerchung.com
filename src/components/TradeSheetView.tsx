'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import type {
  TradeSheetKpi,
  TradeSheetStrategy,
  TradeTicketRow,
} from '@/lib/trade-sheets'

export interface DeskSettingsSummary {
  cashFloorTarget?: string | null
  maxOptionSpreadPct?: number | null
  taxShieldReadout?: string | null
  washSaleBlackoutThrough?: string | null
  washSaleTickers?: string | null
}

export interface TradeSheetViewProps {
  sheetDate: string
  title: string
  subtitle?: string | null
  alertBanner?: string | null
  kpis: TradeSheetKpi[]
  strategy: TradeSheetStrategy
  initialTickets: TradeTicketRow[]
  initialCheckedIds: string[]
  initialQuotesRefreshedAt?: string | null
  availableDates: string[]
  initialTab?: 'strategy' | 'blotter'
  deskSettings?: DeskSettingsSummary
}

// Deterministic 64-bar procedural envelope (Signature Move #5: Meter Strip)
const METER_ENVELOPE: number[] = Array.from({ length: 64 }, (_, i) => {
  const x = (i / 63) * Math.PI * 2
  const primary = Math.sin(x * 1.5 + 0.4) * 0.34 + 0.52
  const harmonic = Math.cos(x * 4.2) * 0.16
  const fine = ((i * 17) % 11) / 55
  return Math.max(0.18, Math.min(0.98, Number((primary + harmonic + fine - 0.08).toFixed(2))))
})

const ACTION_VERBS = new Set([
  'rotate',
  'rotation',
  'exit',
  'harvest',
  'deploy',
  'redeploy',
  'trim',
  'compound',
  'execute',
  'execution',
  'rebalance',
  'write',
  'capture',
  'lock',
  'build',
  'shield',
])

function renderLowercaseLandmarkHeading(raw: string): React.ReactNode {
  const cleaned = raw.trim().toLowerCase()
  if (!cleaned) {
    return (
      <>
        built to <em className="lumen-landmark">execute</em> with institutional discipline.
      </>
    )
  }
  const tokens = cleaned.split(/\s+/)
  let verbIdx = tokens.findIndex((tok) => ACTION_VERBS.has(tok.replace(/[^a-z]/g, '')))
  if (verbIdx === -1 && tokens.length > 1) {
    verbIdx = 0
  }
  return tokens.map((tok, idx) => (
    <React.Fragment key={idx}>
      {idx > 0 ? ' ' : ''}
      {idx === verbIdx ? <em className="lumen-landmark">{tok}</em> : tok}
    </React.Fragment>
  ))
}

export function TradeSheetView({
  sheetDate,
  title,
  subtitle,
  alertBanner,
  kpis,
  strategy,
  initialTickets,
  initialCheckedIds,
  initialQuotesRefreshedAt,
  availableDates,
  initialTab = 'strategy',
  deskSettings,
}: TradeSheetViewProps) {
  const [activeTab, setActiveTab] = useState<'strategy' | 'blotter'>(initialTab)
  const [blotterFilter, setBlotterFilter] = useState<string>('ALL')
  const [tickets, setTickets] = useState<TradeTicketRow[]>(initialTickets)
  const [checkedSet, setCheckedSet] = useState<Set<string>>(() => new Set(initialCheckedIds))
  const [quotesUpdatedAt, setQuotesUpdatedAt] = useState<string | null>(
    initialQuotesRefreshedAt ?? null,
  )
  const [refreshingQuotes, setRefreshingQuotes] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const custodians = useMemo(() => {
    const seen = new Set<string>()
    for (const t of tickets) {
      if (t.custodian) seen.add(t.custodian)
    }
    return Array.from(seen)
  }, [tickets])

  const filteredTickets = useMemo(() => {
    if (blotterFilter === 'ALL') return tickets
    if (blotterFilter === 'WAVE1' || blotterFilter === 'WAVE2') {
      return tickets.filter((t) => t.wave === blotterFilter)
    }
    return tickets.filter((t) => t.custodian === blotterFilter)
  }, [tickets, blotterFilter])

  const wave1Tickets = useMemo(() => tickets.filter((t) => t.wave === 'WAVE1'), [tickets])
  const wave2Tickets = useMemo(() => tickets.filter((t) => t.wave === 'WAVE2'), [tickets])
  const wave1Done = useMemo(
    () => wave1Tickets.filter((t) => checkedSet.has(t.id)).length,
    [wave1Tickets, checkedSet],
  )
  const wave2Done = useMemo(
    () => wave2Tickets.filter((t) => checkedSet.has(t.id)).length,
    [wave2Tickets, checkedSet],
  )

  const completionRatio = tickets.length > 0 ? checkedSet.size / tickets.length : 0
  const activeMeterBars = Math.max(8, Math.round(completionRatio * 64))

  // Signature Move #7: Always 3 cells in the monument stat row
  const monumentStats = useMemo(() => kpis.slice(0, 3), [kpis])
  const fourthKpi = kpis[3] || null

  async function persistChecks(nextIds: string[]) {
    try {
      window.localStorage.setItem(`tc_checks_${sheetDate}`, JSON.stringify(nextIds))
    } catch {
      // Ignore sandboxed storage restrictions
    }
    try {
      const res = await fetch(`/api/trade-sheets/${encodeURIComponent(sheetDate)}/checks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkedRowIds: nextIds }),
      })
      if (!res.ok) throw new Error('Sync failed')
      setSyncStatus('Synced to Supabase')
      setTimeout(() => setSyncStatus(null), 1800)
    } catch {
      setSyncStatus('Saved locally (offline)')
      setTimeout(() => setSyncStatus(null), 2500)
    }
  }

  function toggleRow(id: string) {
    const next = new Set(checkedSet)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setCheckedSet(next)
    void persistChecks(Array.from(next))
  }

  function resetChecks() {
    setCheckedSet(new Set())
    void persistChecks([])
  }

  async function copyChip(rawVal: string, chipId: string, numericClean = true) {
    const clean = numericClean
      ? rawVal.replace(/^\$/, '').replace(/,/g, '').trim()
      : rawVal.trim()
    if (!clean || clean.toLowerCase() === 'market') return
    try {
      await navigator.clipboard.writeText(clean)
      setCopiedKey(chipId)
      setTimeout(() => {
        setCopiedKey((curr) => (curr === chipId ? null : curr))
      }, 1200)
    } catch {
      // Ignore clipboard permission denial
    }
  }

  async function handleRefreshQuotes() {
    setRefreshingQuotes(true)
    setSyncStatus(null)
    try {
      const res = await fetch(
        `/api/trade-sheets/${encodeURIComponent(sheetDate)}/refresh-quotes`,
        { method: 'POST' },
      )
      const data = (await res.json()) as {
        ok?: boolean
        refreshedCount?: number
        quotesRefreshedAt?: string
        ticketsJson?: TradeTicketRow[]
      }
      if (res.ok && data.ok && Array.isArray(data.ticketsJson)) {
        setTickets(data.ticketsJson)
        if (data.quotesRefreshedAt) setQuotesUpdatedAt(data.quotesRefreshedAt)
        setSyncStatus(`Anchored ${data.refreshedCount ?? 0} live tickers`)
        setTimeout(() => setSyncStatus(null), 3500)
      } else {
        setSyncStatus('Quote refresh unavailable right now')
      }
    } catch {
      setSyncStatus('Network error refreshing quotes')
    } finally {
      setRefreshingQuotes(false)
    }
  }

  function renderActionBadge(action: string) {
    const up = action.toUpperCase()
    if (up === 'SELL') {
      return (
        <span className="inline-flex items-center rounded px-2 py-0.5 font-mono-code text-[10.5px] font-medium uppercase tracking-wider bg-[var(--color-neg-soft)] text-[var(--color-neg)] border border-[var(--color-neg-rule)]">
          SELL
        </span>
      )
    }
    if (up === 'BUY') {
      return (
        <span className="inline-flex items-center rounded px-2 py-0.5 font-mono-code text-[10.5px] font-medium uppercase tracking-wider bg-[var(--color-pos-soft)] text-[var(--color-pos)] border border-[var(--color-pos-rule)]">
          BUY
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded px-2 py-0.5 font-mono-code text-[10.5px] font-medium uppercase tracking-wider bg-[var(--color-opt-soft)] text-[var(--color-opt)] border border-[var(--color-opt-rule)]">
        {up}
      </span>
    )
  }

  function renderWaveBadge(wave: string) {
    const isW1 = wave.toUpperCase() === 'WAVE1'
    return (
      <span
        className={`inline-flex items-center rounded px-2 py-0.5 font-mono-code text-[10px] uppercase tracking-[0.08em] border ${
          isW1
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold'
            : 'border-[var(--color-rule-2)] bg-[var(--color-paper-3)] text-[var(--color-muted)]'
        }`}
      >
        {isW1 ? 'W1' : 'W2'}
      </span>
    )
  }

  const formattedQuoteTime = useMemo(() => {
    if (!quotesUpdatedAt) return null
    try {
      return new Date(quotesUpdatedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    } catch {
      return quotesUpdatedAt
    }
  }, [quotesUpdatedAt])

  const maxSpread = deskSettings?.maxOptionSpreadPct ?? 8

  return (
    <div className="space-y-7">
      {/* MASTHEAD + SIGNATURE MOVE #1 (FILAMENT CHAMBER APPARATUS) + MOVE #4 (BLUEPRINT GRID) */}
      <section className="lumen-blueprint rounded-xl border border-[var(--color-rule)] overflow-hidden">
        <div className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-[1.45fr_0.85fr] gap-8 items-center">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="lumen-eyebrow">01 · PRIVATE EXECUTION APPARATUS</p>
              {formattedQuoteTime ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-pos-rule)] bg-[var(--color-pos-soft)] px-2.5 py-0.5 font-mono-code text-[10.5px] uppercase tracking-[0.06em] text-[var(--color-pos)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-pos)]" />
                  QUOTES ANCHORED · {formattedQuoteTime}
                </span>
              ) : null}
            </div>

            <h1 className="lumen-headline text-3xl sm:text-4xl lg:text-[2.75rem] text-[var(--color-ink)]">
              {renderLowercaseLandmarkHeading(title)}
            </h1>

            {subtitle ? (
              <p className="text-sm leading-relaxed text-[var(--color-muted)] max-w-2xl lowercase">
                {subtitle}
              </p>
            ) : null}

            {/* Archive Edition Switcher */}
            {availableDates.length > 0 ? (
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <span className="font-mono-code text-[10.5px] uppercase tracking-[0.1em] text-[var(--color-subtle)] mr-1">
                  EDITION
                </span>
                {availableDates.slice(0, 7).map((d) => {
                  const active = d === sheetDate
                  return (
                    <Link
                      key={d}
                      href={`/trade/${d}`}
                      className={`lumen-press inline-flex min-h-[34px] items-center rounded-md border px-2.5 py-1 font-mono-code text-xs tabular-nums ${
                        active
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-medium'
                          : 'border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-rule-2)]'
                      }`}
                    >
                      {d}
                    </Link>
                  )
                })}
              </div>
            ) : null}
          </div>

          {/* Hand-Engineered Filament Chamber + Real Mono Leader-Line Callouts */}
          <figure
            aria-label="Execution chamber telemetry"
            className="relative flex items-center justify-center py-3"
          >
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 w-full max-w-md">
              {/* Left Callouts */}
              <div className="space-y-7 text-right">
                <div className="relative pr-4">
                  <span className="block font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
                    WAVE 01
                  </span>
                  <span className="block font-mono-code text-xs uppercase tracking-[0.06em] text-[var(--color-ink-2)] tabular-nums">
                    {wave1Done}/{wave1Tickets.length} LEGS
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute right-0 top-1/2 w-3 h-px bg-[var(--color-rule-2)]"
                  />
                </div>
                <div className="relative pr-4">
                  <span className="block font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
                    OPT GATE
                  </span>
                  <span className="block font-mono-code text-xs uppercase tracking-[0.06em] text-[var(--color-accent)] tabular-nums">
                    &lt;={maxSpread.toFixed(1)}% SPR
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute right-0 top-1/2 w-3 h-px bg-[var(--color-rule-2)]"
                  />
                </div>
              </div>

              {/* Cylindrical Filament Chamber */}
              <div className="lumen-chamber w-[88px] h-[156px] shrink-0">
                <span className="lumen-electrode" style={{ top: '22%' }} />
                <span className="lumen-electrode" style={{ top: '42%' }} />
                <span className="lumen-electrode" style={{ top: '62%' }} />
                <span className="lumen-electrode" style={{ top: '82%' }} />
                <span className="lumen-filament" />
                <span className="absolute bottom-2.5 inset-x-0 text-center font-mono-code text-[9px] uppercase tracking-[0.14em] text-[var(--color-subtle)]">
                  SG-01
                </span>
              </div>

              {/* Right Callouts */}
              <div className="space-y-7 text-left">
                <div className="relative pl-4">
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 w-3 h-px bg-[var(--color-rule-2)]"
                  />
                  <span className="block font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
                    WAVE 02
                  </span>
                  <span className="block font-mono-code text-xs uppercase tracking-[0.06em] text-[var(--color-ink-2)] tabular-nums">
                    {wave2Done}/{wave2Tickets.length} LEGS
                  </span>
                </div>
                <div className="relative pl-4">
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 w-3 h-px bg-[var(--color-rule-2)]"
                  />
                  <span className="block font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
                    BLOTTER
                  </span>
                  <span className="block font-mono-code text-xs uppercase tracking-[0.06em] text-[var(--color-pos)] tabular-nums">
                    {checkedSet.size}/{tickets.length} DONE
                  </span>
                </div>
              </div>
            </div>
          </figure>
        </div>

        {/* SIGNATURE MOVE #5: PROCEDURAL SIGNAL METER STRIP */}
        <aside
          aria-label="Execution signal readout"
          className="lumen-meter px-6 sm:px-8 py-3 grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center gap-4"
        >
          <p className="font-mono-code text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-muted)] tabular-nums">
            SHEET · {sheetDate} · {tickets.length} TICKETS
          </p>
          <div className="hidden sm:flex items-end gap-[2px] h-6" aria-hidden="true">
            {METER_ENVELOPE.map((h, i) => {
              const lit = i < activeMeterBars
              return (
                <span
                  key={i}
                  style={{
                    height: `${Math.round(h * 100)}%`,
                    opacity: lit ? 0.88 : 0.22,
                  }}
                  className={`flex-1 min-w-[1px] rounded-[0.5px] ${
                    lit ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-muted)]'
                  }`}
                />
              )
            })}
          </div>
          <p className="font-mono-code text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-pos)] tabular-nums">
            {fourthKpi
              ? `${fourthKpi.label} · ${fourthKpi.value}`
              : 'GUARDRAILS · $95K FLOOR + 0 WASH SALES'}
          </p>
        </aside>
      </section>

      {/* SIGNATURE MOVE #7: THREE-STAT MONUMENT ROW (INSTRUMENT SERIF + TABULAR-NUMS) */}
      {monumentStats.length > 0 ? (
        <section
          aria-label="Session key figures"
          className={`lumen-card rounded-xl grid grid-cols-1 divide-y md:divide-y-0 md:divide-x divide-[var(--color-rule)] ${
            monumentStats.length === 3
              ? 'md:grid-cols-3'
              : monumentStats.length === 2
                ? 'md:grid-cols-2'
                : 'md:grid-cols-1'
          }`}
        >
          {monumentStats.map((kpi, idx) => (
            <div key={`${kpi.label}-${idx}`} className="p-6 sm:px-7 space-y-2">
              <div className="font-mono-code text-[11px] uppercase tracking-[0.11em] text-[var(--color-muted)]">
                0{idx + 1} · {kpi.label}
              </div>
              <div className="lumen-stat-num text-3xl sm:text-4xl text-[var(--color-ink)]">
                {kpi.value}
              </div>
              {kpi.sub ? (
                <div className="text-xs text-[var(--color-muted)] lowercase">{kpi.sub}</div>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {/* EXECUTION SEQUENCE & STANDING GUARDRAILS BANNER */}
      {alertBanner || deskSettings?.washSaleTickers ? (
        <div className="rounded-xl border border-[var(--color-warn-rule)] bg-[var(--color-warn-soft)] px-5 py-4 space-y-2">
          {alertBanner ? (
            <p className="text-xs sm:text-[13px] leading-relaxed text-[var(--color-ink-2)]">
              <span className="font-mono-code text-[10.5px] uppercase tracking-[0.1em] text-[var(--color-warn)] font-semibold mr-2">
                SEQUENCE &amp; GUARDRAILS //
              </span>
              {alertBanner}
            </p>
          ) : null}
          {deskSettings?.washSaleTickers ? (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 border-t border-[var(--color-warn-rule)] font-mono-code text-[10.5px] uppercase tracking-[0.07em] text-[var(--color-muted)]">
              {deskSettings.cashFloorTarget ? (
                <span>FLOOR: {deskSettings.cashFloorTarget}</span>
              ) : null}
              <span>
                TLH BLACKOUT THRU {deskSettings.washSaleBlackoutThrough || '2026-12-10'}:{' '}
                <strong className="text-[var(--color-ink-2)] font-medium">
                  {deskSettings.washSaleTickers}
                </strong>
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* PRIMARY 2-TAB SWITCHER + QUOTE ANCHOR ACTION (44px touch targets) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-rule)] pb-4">
        <div
          role="tablist"
          aria-label="Trade sheet views"
          className="inline-flex flex-wrap gap-1.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'strategy'}
            onClick={() => setActiveTab('strategy')}
            className={`lumen-press min-h-[42px] rounded-md px-4 py-2 text-xs sm:text-sm lowercase cursor-pointer ${
              activeTab === 'strategy'
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-semibold'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            01 · strategy, facts &amp; expected result
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'blotter'}
            onClick={() => setActiveTab('blotter')}
            className={`lumen-press min-h-[42px] rounded-md px-4 py-2 text-xs sm:text-sm lowercase tabular-nums cursor-pointer ${
              activeTab === 'blotter'
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-ink)] font-semibold'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            02 · full execution blotter ({checkedSet.size}/{tickets.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {syncStatus ? (
            <span className="font-mono-code text-[11px] uppercase tracking-[0.06em] text-[var(--color-pos)]">
              {syncStatus}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void handleRefreshQuotes()}
            disabled={refreshingQuotes}
            className="lumen-press min-h-[42px] rounded-lg border border-[var(--color-rule-2)] bg-[var(--color-paper-2)] px-4 py-2 font-mono-code text-[11px] uppercase tracking-[0.08em] text-[var(--color-ink)] hover:border-[var(--color-accent)] disabled:opacity-50 cursor-pointer"
          >
            {refreshingQuotes ? 'ANCHORING QUOTES...' : '↻ REFRESH LIVE QUOTES'}
          </button>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: STRATEGY, EMPIRICAL FACTS & EXPECTED RESULT
         ===================================================================== */}
      {activeTab === 'strategy' ? (
        <div className="space-y-6">
          {/* Strategy Narrative */}
          <section className="lumen-card rounded-xl p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <p className="lumen-eyebrow">02 · TODAY&apos;S GAME PLAN</p>
              <h2 className="lumen-headline text-2xl sm:text-3xl text-[var(--color-ink)]">
                {renderLowercaseLandmarkHeading(
                  strategy.headline || 'capital rotation & disciplined yield plan',
                )}
              </h2>
            </div>

            {strategy.summaryBullets.length > 0 ? (
              <ul className="space-y-3 text-sm leading-relaxed text-[var(--color-ink-2)]">
                {strategy.summaryBullets.map((b, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-mono-code text-xs text-[var(--color-accent)] pt-0.5 select-none">
                      0{i + 1}
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {strategy.holdOffNotes && strategy.holdOffNotes.length > 0 ? (
              <div className="mt-4 rounded-lg border border-[var(--color-rule-2)] bg-[var(--color-paper)] p-5 space-y-2.5">
                <div className="font-mono-code text-[11px] uppercase tracking-[0.11em] text-[var(--color-warn)]">
                  INTENTIONAL STAND-ASIDES &amp; ACTIVE BLACKOUTS
                </div>
                <ul className="space-y-2 text-xs sm:text-[13px] leading-relaxed text-[var(--color-muted)] list-disc pl-4">
                  {strategy.holdOffNotes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {/* Empirical Facts Table */}
          {strategy.facts.length > 0 ? (
            <section className="lumen-card rounded-xl overflow-hidden">
              <div className="border-b border-[var(--color-rule)] px-6 sm:px-8 py-5 space-y-1.5">
                <p className="lumen-eyebrow">03 · EMPIRICAL EVIDENCE ([MEASURED])</p>
                <h2 className="lumen-headline text-2xl sm:text-3xl text-[var(--color-ink)]">
                  the facts that <em className="lumen-landmark">justify</em> today&apos;s trades
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--color-rule)] bg-[var(--color-paper)] font-mono-code text-[10.5px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
                    <tr>
                      <th className="px-6 sm:px-8 py-3.5">PILLAR</th>
                      <th className="px-6 py-3.5">MEASURED SIGNAL</th>
                      <th className="px-6 sm:px-8 py-3.5">WHY WE ACT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-rule)]">
                    {strategy.facts.map((f, i) => (
                      <tr key={i} className="hover:bg-[var(--color-paper-3)]/45 transition-colors">
                        <td className="px-6 sm:px-8 py-4 font-mono-code text-xs uppercase tracking-[0.06em] text-[var(--color-ink)] whitespace-nowrap">
                          {f.pillar}
                        </td>
                        <td className="px-6 py-4 font-mono-code text-xs text-[var(--color-accent)] tabular-nums whitespace-nowrap">
                          {f.metric}
                        </td>
                        <td className="px-6 sm:px-8 py-4 text-xs sm:text-[13px] leading-relaxed text-[var(--color-muted)]">
                          {f.detail}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {/* Expected Result Table */}
          {strategy.expectedResults.length > 0 ? (
            <section className="lumen-card rounded-xl overflow-hidden">
              <div className="border-b border-[var(--color-rule)] px-6 sm:px-8 py-5 space-y-1.5">
                <p className="lumen-eyebrow">04 · PORTFOLIO TRANSFORMATION</p>
                <h2 className="lumen-headline text-2xl sm:text-3xl text-[var(--color-ink)]">
                  expected state once orders <em className="lumen-landmark">settle</em>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--color-rule)] bg-[var(--color-paper)] font-mono-code text-[10.5px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
                    <tr>
                      <th className="px-6 sm:px-8 py-3.5">DIMENSION</th>
                      <th className="px-6 py-3.5">BEFORE</th>
                      <th className="px-6 py-3.5">AFTER</th>
                      <th className="px-6 sm:px-8 py-3.5">NET IMPACT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-rule)]">
                    {strategy.expectedResults.map((r, i) => (
                      <tr key={i} className="hover:bg-[var(--color-paper-3)]/45 transition-colors">
                        <td className="px-6 sm:px-8 py-4 font-medium text-xs sm:text-[13px] text-[var(--color-ink)]">
                          {r.metric}
                        </td>
                        <td className="px-6 py-4 font-mono-code text-xs text-[var(--color-muted)] tabular-nums">
                          {r.before}
                        </td>
                        <td className="px-6 py-4 font-mono-code text-xs text-[var(--color-ink)] tabular-nums">
                          {r.after}
                        </td>
                        <td className="px-6 sm:px-8 py-4 text-xs sm:text-[13px] text-[var(--color-pos)] tabular-nums">
                          {r.impact}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('blotter')}
              className="lumen-press min-h-[44px] rounded-lg bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold lowercase text-[var(--color-accent-ink)] cursor-pointer"
            >
              open full execution blotter ({tickets.length} legs) →
            </button>
          </div>
        </div>
      ) : (
        /* =====================================================================
           TAB 2: FULL INTERACTIVE EXECUTION BLOTTER
           ===================================================================== */
        <div className="space-y-5">
          {/* Wave Progress Readout Strip */}
          <div className="lumen-card rounded-xl p-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-mono-code text-[11px] uppercase tracking-[0.08em]">
                <span className="text-[var(--color-accent)]">
                  WAVE 01 · SELLS &amp; OPTIONS (ENTER FIRST)
                </span>
                <span className="text-[var(--color-ink)] tabular-nums">
                  {wave1Done} / {wave1Tickets.length}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[var(--color-paper)] overflow-hidden">
                <div
                  className="h-full bg-[var(--color-accent)] transition-all duration-200"
                  style={{
                    width: `${
                      wave1Tickets.length > 0
                        ? Math.round((wave1Done / wave1Tickets.length) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-mono-code text-[11px] uppercase tracking-[0.08em]">
                <span className="text-[var(--color-muted)]">
                  WAVE 02 · COMPOUNDER BUYS (ENTER AFTER WAVE 01 FILLS)
                </span>
                <span className="text-[var(--color-ink)] tabular-nums">
                  {wave2Done} / {wave2Tickets.length}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[var(--color-paper)] overflow-hidden">
                <div
                  className="h-full bg-[var(--color-pos)] transition-all duration-200"
                  style={{
                    width: `${
                      wave2Tickets.length > 0
                        ? Math.round((wave2Done / wave2Tickets.length) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Filter & Reset Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'ALL', label: `all (${tickets.length})` },
                { key: 'WAVE1', label: `wave 01 (${wave1Tickets.length})` },
                { key: 'WAVE2', label: `wave 02 (${wave2Tickets.length})` },
                ...custodians.map((c) => ({ key: c, label: c.toLowerCase() })),
              ].map((tab) => {
                const active = blotterFilter === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setBlotterFilter(tab.key)}
                    className={`lumen-press min-h-[38px] rounded-md border px-3.5 py-1.5 text-xs lowercase tabular-nums cursor-pointer ${
                      active
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold'
                        : 'border-[var(--color-rule)] bg-[var(--color-paper-2)] text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-rule-2)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono-code text-xs uppercase tracking-[0.06em] text-[var(--color-muted)] tabular-nums">
                {checkedSet.size} / {tickets.length} ENTERED
              </span>
              <button
                type="button"
                onClick={resetChecks}
                className="lumen-press min-h-[36px] rounded-md border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-3 py-1.5 font-mono-code text-[11px] uppercase tracking-[0.08em] text-[var(--color-muted)] hover:text-[var(--color-ink)] cursor-pointer"
              >
                RESET CHECKS
              </button>
            </div>
          </div>

          {/* Blotter Table */}
          <div className="lumen-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead className="border-b border-[var(--color-rule)] bg-[var(--color-paper)] font-mono-code text-[10.5px] uppercase tracking-[0.09em] text-[var(--color-muted)]">
                  <tr>
                    <th className="w-12 px-3 py-3.5 text-center">DONE</th>
                    <th className="px-3 py-3.5">WAVE</th>
                    <th className="px-3 py-3.5">ACCOUNT</th>
                    <th className="px-3 py-3.5">ACTION</th>
                    <th className="px-3 py-3.5">SYMBOL / CONTRACT</th>
                    <th className="px-3 py-3.5">QTY (COPY)</th>
                    <th className="px-3 py-3.5">LIMIT (COPY)</th>
                    <th className="px-3 py-3.5">EST. $</th>
                    <th className="px-4 py-3.5">LIVE SPOT &amp; EXECUTION NOTE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-rule)]">
                  {filteredTickets.map((t) => {
                    const done = checkedSet.has(t.id)
                    const isMarket = t.limitPrice.toLowerCase() === 'market'
                    const symChipId = `sym-${t.id}`
                    const qtyChipId = `qty-${t.id}`
                    const limChipId = `lim-${t.id}`

                    return (
                      <tr
                        key={t.id}
                        className={`transition-colors hover:bg-[var(--color-paper-3)]/50 ${
                          done ? 'opacity-45' : ''
                        }`}
                      >
                        <td className="p-0 text-center">
                          <label className="flex min-h-[44px] min-w-[44px] items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={done}
                              onChange={() => toggleRow(t.id)}
                              aria-label={`Mark ${t.symbol} ${t.action} entered`}
                              className="h-4 w-4 cursor-pointer accent-[var(--color-accent)]"
                            />
                          </label>
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          {renderWaveBadge(t.wave)}
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <div className="font-medium text-[var(--color-ink)]">{t.custodian}</div>
                          <div className="font-mono-code text-[10.5px] text-[var(--color-muted)]">
                            {t.account}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          {renderActionBadge(t.action)}
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => void copyChip(t.symbol, symChipId, false)}
                            title="Click to copy symbol"
                            className={`lumen-press font-mono-code font-semibold text-left cursor-pointer ${
                              copiedKey === symChipId
                                ? 'text-[var(--color-pos)]'
                                : 'text-[var(--color-ink)] hover:text-[var(--color-accent)]'
                            } ${done ? 'line-through' : ''}`}
                          >
                            {copiedKey === symChipId ? 'COPIED ✓' : t.symbol}
                          </button>
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => void copyChip(t.qty, qtyChipId, true)}
                            title="Click to copy quantity"
                            className={`lumen-press min-h-[32px] rounded border px-2.5 py-1 font-mono-code text-xs cursor-pointer ${
                              copiedKey === qtyChipId
                                ? 'border-[var(--color-pos-rule)] bg-[var(--color-pos-soft)] text-[var(--color-pos)]'
                                : 'border-[var(--color-rule-2)] bg-[var(--color-paper)] text-[var(--color-ink)] hover:border-[var(--color-accent)]'
                            }`}
                          >
                            {copiedKey === qtyChipId ? 'COPIED ✓' : t.qty}
                          </button>
                        </td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          {isMarket ? (
                            <span className="font-mono-code text-[11px] uppercase text-[var(--color-muted)]">
                              MARKET
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void copyChip(t.limitPrice, limChipId, true)}
                              title="Click to copy limit price"
                              className={`lumen-press min-h-[32px] rounded border px-2.5 py-1 font-mono-code text-xs cursor-pointer ${
                                copiedKey === limChipId
                                  ? 'border-[var(--color-pos-rule)] bg-[var(--color-pos-soft)] text-[var(--color-pos)]'
                                  : 'border-[var(--color-rule-2)] bg-[var(--color-paper)] text-[var(--color-accent)] hover:border-[var(--color-accent)]'
                              }`}
                            >
                              {copiedKey === limChipId ? 'COPIED ✓' : t.limitPrice}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-3.5 font-mono-code text-[var(--color-ink)] whitespace-nowrap">
                          {t.estValue}
                        </td>
                        <td className="px-4 py-3.5 text-[11.5px] leading-relaxed text-[var(--color-muted)] min-w-[250px]">
                          {t.note}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
