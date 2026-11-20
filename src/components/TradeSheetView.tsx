'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import type {
  TradeSheetKpi,
  TradeSheetStrategy,
  TradeTicketRow,
} from '@/lib/trade-sheets'

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
}: TradeSheetViewProps) {
  const [activeTab, setActiveTab] = useState<'strategy' | 'blotter'>(initialTab)
  const [blotterFilter, setBlotterFilter] = useState<string>('ALL')
  const [tickets, setTickets] = useState<TradeTicketRow[]>(initialTickets)
  const [checkedSet, setCheckedSet] = useState<Set<string>>(() => new Set(initialCheckedIds))
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [refreshingQuotes, setRefreshingQuotes] = useState(false)
  const [quotesUpdatedAt, setQuotesUpdatedAt] = useState<string | null>(
    initialQuotesRefreshedAt ?? null,
  )
  const [syncStatus, setSyncStatus] = useState<string | null>(null)

  const custodians = useMemo(() => {
    const seen = new Set<string>()
    for (const t of tickets) {
      if (t.custodian) seen.add(t.custodian)
    }
    return Array.from(seen)
  }, [tickets])

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (blotterFilter === 'ALL') return true
      if (blotterFilter === 'WAVE1' || blotterFilter === 'WAVE2') return t.wave === blototterWave(blotterFilter)
      return t.custodian === blotterFilter
    })
  }, [tickets, blotterFilter])

  function blototterWave(f: string) {
    return f
  }

  const wave1Count = useMemo(() => tickets.filter((t) => t.wave === 'WAVE1').length, [tickets])
  const wave2Count = useMemo(() => tickets.filter((t) => t.wave === 'WAVE2').length, [tickets])

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

  async function copyChip(rawVal: string, chipId: string) {
    const clean = rawVal.replace(/^\$/, '').replace(/,/g, '').trim()
    if (!clean || clean.toLowerCase() === 'market') return
    try {
      await navigator.clipboard.writeText(clean)
      setCopiedKey(chipId)
      setTimeout(() => setCopiedKey((prev) => (prev === chipId ? null : prev)), 1100)
    } catch {
      // Ignore clipboard permission errors
    }
  }

  async function handleRefreshQuotes() {
    setRefreshingQuotes(true)
    setSyncStatus(null)
    try {
      const res = await fetch(`/api/trade-sheets/${encodeURIComponent(sheetDate)}/refresh-quotes`, {
        method: 'POST',
      })
      const data = (await res.json()) as {
        ok?: boolean
        refreshedCount?: number
        quotesRefreshedAt?: string
        ticketsJson?: TradeTicketRow[]
      }
      if (res.ok && data.ok && Array.isArray(data.ticketsJson)) {
        setTickets(data.ticketsJson)
        if (data.quotesRefreshedAt) setQuotesUpdatedAt(data.quotesRefreshedAt)
        setSyncStatus(`Refreshed ${data.refreshedCount ?? 0} live tickers`)
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
        <span className="inline-block rounded px-2 py-0.5 font-mono-code text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
          SELL
        </span>
      )
    }
    if (up === 'BUY') {
      return (
        <span className="inline-block rounded px-2 py-0.5 font-mono-code text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          BUY
        </span>
      )
    }
    return (
      <span className="inline-block rounded px-2 py-0.5 font-mono-code text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
        {up}
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

  return (
    <div className="space-y-7 lg:-mx-10 xl:-mx-16">
      {/* Header + Archive Date Switcher */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono-code text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              Private · Authenticated Wealth Desk
            </span>
            {formattedQuoteTime ? (
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 font-mono-code text-[11px] text-emerald-300/90">
                Quotes anchored: {formattedQuoteTime}
              </span>
            ) : null}
          </div>
          <h1 className="font-serif-display text-3xl sm:text-4xl text-[var(--ink)]">{title}</h1>
          {subtitle ? <p className="text-sm text-[var(--muted)] max-w-3xl">{subtitle}</p> : null}
        </div>

        {availableDates.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {availableDates.slice(0, 6).map((d) => {
              const active = d === sheetDate
              return (
                <Link
                  key={d}
                  href={`/trade/${d}`}
                  className={`rounded-md border px-2.5 py-1 font-mono-code text-xs transition-colors ${
                    active
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)] font-medium'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {d}
                </Link>
              )
            })}
          </div>
        ) : null}
      </div>

      {/* Execution Guardrail Banner */}
      {alertBanner ? (
        <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200/95">
          <strong className="font-semibold text-amber-100">Execution Sequence & Guardrails: </strong>
          {alertBanner}
        </div>
      ) : null}

      {/* KPI Cards */}
      {kpis.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, idx) => (
            <div
              key={`${kpi.label}-${idx}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-1"
            >
              <div className="font-mono-code text-[11px] uppercase tracking-wider text-[var(--muted)]">
                {kpi.label}
              </div>
              <div className="font-mono-code text-xl font-semibold text-[var(--ink)]">
                {kpi.value}
              </div>
              {kpi.sub ? <div className="text-xs text-[var(--muted)]">{kpi.sub}</div> : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* Primary 2-Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1">
          <button
            type="button"
            onClick={() => setActiveTab('strategy')}
            className={`rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'strategy'
                ? 'bg-[var(--ink)] text-[var(--bg)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            1. Strategy, Facts & Expected Result
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blotter')}
            className={`rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'blotter'
                ? 'bg-[var(--ink)] text-[var(--bg)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            2. Full Execution Blotter ({checkedSet.size}/{tickets.length})
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {syncStatus ? (
            <span className="font-mono-code text-xs text-emerald-300">{syncStatus}</span>
          ) : null}
          <button
            type="button"
            onClick={() => void handleRefreshQuotes()}
            disabled={refreshingQuotes}
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono-code text-xs text-[var(--ink)] hover:border-[var(--muted)] disabled:opacity-50 transition-colors"
          >
            {refreshingQuotes ? 'Refreshing Yahoo Quotes...' : '↻ Refresh Live Quotes'}
          </button>
        </div>
      </div>

      {/* TAB 1: STRATEGY, FACTS & EXPECTED RESULT */}
      {activeTab === 'strategy' ? (
        <div className="space-y-6">
          {/* Strategy Narrative */}
          <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
            <div className="space-y-1">
              <p className="font-mono-code text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                Part I · Today&apos;s Game Plan
              </p>
              <h2 className="font-serif-display text-2xl text-[var(--ink)]">
                {strategy.headline || 'Capital Rotation & Disciplined Yield Plan'}
              </h2>
            </div>

            {strategy.summaryBullets.length > 0 ? (
              <ul className="space-y-2.5 text-sm leading-relaxed text-[var(--ink)]/90 list-disc pl-5">
                {strategy.summaryBullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : null}

            {strategy.holdOffNotes && strategy.holdOffNotes.length > 0 ? (
              <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--bg)] p-4 space-y-2">
                <div className="font-mono-code text-xs uppercase tracking-wider text-amber-300">
                  Intentional Stand-Asides & Active Blackouts
                </div>
                <ul className="space-y-1.5 text-xs leading-relaxed text-[var(--muted)] list-disc pl-4">
                  {strategy.holdOffNotes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {/* Empirical Facts Table */}
          {strategy.facts.length > 0 ? (
            <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="border-b border-[var(--border)] px-6 py-4">
                <p className="font-mono-code text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  Part II · Empirical Evidence ([Measured])
                </p>
                <h2 className="font-serif-display text-2xl text-[var(--ink)]">
                  The Facts Driving Today&apos;s Trades
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--border)] bg-[var(--bg)] font-mono-code text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    <tr>
                      <th className="px-6 py-3">Pillar</th>
                      <th className="px-6 py-3">Measured Signal</th>
                      <th className="px-6 py-3">Why We Act</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {strategy.facts.map((f, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-3.5 font-mono-code text-xs text-[var(--ink)] whitespace-nowrap">
                          {f.pillar}
                        </td>
                        <td className="px-6 py-3.5 font-mono-code text-xs text-emerald-300 whitespace-nowrap">
                          {f.metric}
                        </td>
                        <td className="px-6 py-3.5 text-xs leading-relaxed text-[var(--muted)]">
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
            <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="border-b border-[var(--border)] px-6 py-4">
                <p className="font-mono-code text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  Part III · Portfolio Transformation
                </p>
                <h2 className="font-serif-display text-2xl text-[var(--ink)]">
                  Expected Result (Before → After)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--border)] bg-[var(--bg)] font-mono-code text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    <tr>
                      <th className="px-6 py-3">Dimension</th>
                      <th className="px-6 py-3">Before</th>
                      <th className="px-6 py-3">After</th>
                      <th className="px-6 py-3">Net Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {strategy.expectedResults.map((r, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-6 py-3.5 font-medium text-xs text-[var(--ink)]">
                          {r.metric}
                        </td>
                        <td className="px-6 py-3.5 font-mono-code text-xs text-[var(--muted)]">
                          {r.before}
                        </td>
                        <td className="px-6 py-3.5 font-mono-code text-xs text-[var(--ink)]">
                          {r.after}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-emerald-300">{r.impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('blotter')}
              className="rounded-lg bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--bg)] hover:opacity-90 transition-opacity"
            >
              Open Full Execution Blotter ({tickets.length} Tickets) →
            </button>
          </div>
        </div>
      ) : (
        /* TAB 2: FULL EXECUTION BLOTTER */
        <div className="space-y-4">
          {/* Blotter Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'ALL', label: `All (${tickets.length})` },
                { key: 'WAVE1', label: `1. Wave 1: Sells + Options (${wave1Count})` },
                { key: 'WAVE2', label: `2. Wave 2: Post-Fill Buys (${wave2Count})` },
                ...custodians.map((c) => ({ key: c, label: c })),
              ].map((tab) => {
                const active = blotterFilter === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setBlotterFilter(tab.key)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono-code text-xs text-[var(--muted)]">
                {checkedSet.size} / {tickets.length} entered
              </span>
              <button
                type="button"
                onClick={resetChecks}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 font-mono-code text-xs text-[var(--muted)] hover:text-[var(--ink)]"
              >
                Reset Checks
              </button>
            </div>
          </div>

          {/* Execution Table */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--border)] bg-[var(--bg)] font-mono-code text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  <tr>
                    <th className="w-10 px-3 py-3 text-center">Done</th>
                    <th className="px-3 py-3">Account</th>
                    <th className="px-3 py-3">Action</th>
                    <th className="px-3 py-3">Symbol / Contract</th>
                    <th className="px-3 py-3">Qty (Copy)</th>
                    <th className="px-3 py-3">Limit (Copy)</th>
                    <th className="px-3 py-3">Est. $</th>
                    <th className="px-3 py-3">Live Spot & Execution Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredTickets.map((t) => {
                    const done = checkedSet.has(t.id)
                    const isMarket = t.limitPrice.toLowerCase() === 'market'
                    const qtyChipId = `qty-${t.id}`
                    const limChipId = `lim-${t.id}`

                    return (
                      <tr
                        key={t.id}
                        className={`transition-opacity hover:bg-white/[0.02] ${
                          done ? 'opacity-40' : ''
                        }`}
                      >
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={() => toggleRow(t.id)}
                            className="h-4 w-4 cursor-pointer accent-emerald-400"
                          />
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="font-medium text-[var(--ink)]">{t.custodian}</div>
                          <div className="text-[11px] text-[var(--muted)]">{t.account}</div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {renderActionBadge(t.action)}
                        </td>
                        <td
                          className={`px-3 py-3 font-mono-code font-semibold text-[var(--ink)] whitespace-nowrap ${
                            done ? 'line-through' : ''
                          }`}
                        >
                          {t.symbol}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => void copyChip(t.qty, qtyChipId)}
                            title="Click to copy quantity"
                            className={`rounded border px-2 py-1 font-mono-code text-xs transition-colors ${
                              copiedKey === qtyChipId
                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                                : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--muted)]'
                            }`}
                          >
                            {copiedKey === qtyChipId ? 'Copied' : t.qty}
                          </button>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {isMarket ? (
                            <span className="font-mono-code text-[11px] text-[var(--muted)]">
                              Market
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void copyChip(t.limitPrice, limChipId)}
                              title="Click to copy limit price"
                              className={`rounded border px-2 py-1 font-mono-code text-xs transition-colors ${
                                copiedKey === limChipId
                                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                                  : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--muted)]'
                              }`}
                            >
                              {copiedKey === limChipId ? 'Copied' : t.limitPrice}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-3 font-mono-code text-[var(--ink)] whitespace-nowrap">
                          {t.estValue}
                        </td>
                        <td className="px-3 py-3 text-[11px] leading-relaxed text-[var(--muted)] min-w-[240px]">
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
