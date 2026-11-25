'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  compileBriefingToPayloadBlocks,
  computeTradeSheetSummary,
  extractEquityTicker,
  formatSheetDate,
  type DeskAnnotationBlockData,
  type DeskSettingsSummary,
  type LinkedTradeNote,
  type MoveRationalesBlockData,
  type NewsCatalystsBlockData,
  type PanelDebatesBlockData,
  type TradeBriefingBlock,
  type TradeSheetRecord,
  type TradeTicketRow,
} from '@/lib/trade-sheets'
import {
  CitationRefChips,
  CitationsLedger,
  DeskAnnotationBlockView,
  RenderTradeBriefingBlocks,
  StandingGuardrailsView,
  TradeNoteThesisCard,
} from '@/components/trade-blocks'

export type TradeDeskRoom = 'blotter' | 'briefing' | 'citations'

export interface TradeSheetHistoryItem {
  sheetDate: string
  title: string
  ticketCount: number
  completedCount: number
}

export interface TradeSheetViewProps {
  sheet: TradeSheetRecord
  history: TradeSheetHistoryItem[]
  deskSettings?: DeskSettingsSummary | null
  initialTab?: 'blotter' | 'strategy' | 'briefing' | 'citations'
}

function normalizeInitialRoom(
  tab?: 'blotter' | 'strategy' | 'briefing' | 'citations',
): TradeDeskRoom {
  if (tab === 'strategy' || tab === 'briefing') return 'briefing'
  if (tab === 'citations') return 'citations'
  return 'blotter'
}

function formatPrice(val?: number | null): string {
  if (typeof val !== 'number' || !Number.isFinite(val)) return '—'
  return `$${val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatTimestamp(iso?: string | null): string {
  if (!iso) return 'Not refreshed'
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(parsed)
}

function ticketBaseTicker(ticket: TradeTicketRow): string {
  return (
    extractEquityTicker(ticket.symbol.toUpperCase()) ??
    ticket.symbol.trim().toUpperCase().split(/[\s/]+/)[0]
  )
}

function actionBadgeStyle(action: string): React.CSSProperties {
  const upper = action.toUpperCase()
  if (upper.includes('SELL') || upper.includes('CANCEL')) {
    return {
      color: 'var(--color-neg)',
      borderColor: 'color-mix(in oklch, var(--color-neg) 38%, transparent)',
      backgroundColor: 'color-mix(in oklch, var(--color-neg) 8%, transparent)',
    }
  }
  if (upper.includes('BUY')) {
    return {
      color: 'var(--color-pos)',
      borderColor: 'color-mix(in oklch, var(--color-pos) 38%, transparent)',
      backgroundColor: 'color-mix(in oklch, var(--color-pos) 8%, transparent)',
    }
  }
  if (upper.includes('ROLL') || upper.includes('STO')) {
    return {
      color: 'var(--color-accent)',
      borderColor: 'color-mix(in oklch, var(--color-accent) 38%, transparent)',
      backgroundColor: 'color-mix(in oklch, var(--color-accent) 8%, transparent)',
    }
  }
  return {
    color: 'var(--color-muted)',
    borderColor: 'var(--color-rule-2)',
    backgroundColor: 'var(--color-paper-3)',
  }
}

function sourceModeLabel(mode?: 'curated' | 'auto_vm' | 'manual'): string {
  if (mode === 'auto_vm') return 'AUTO VM'
  if (mode === 'manual') return 'MANUAL'
  return 'CURATED'
}

export function TradeSheetView({
  sheet,
  history,
  deskSettings,
  initialTab,
}: TradeSheetViewProps) {
  const router = useRouter()
  const [activeRoom, setActiveRoom] = useState<TradeDeskRoom>(() =>
    normalizeInitialRoom(initialTab),
  )
  const [tickets, setTickets] = useState<TradeTicketRow[]>(sheet.tickets)
  const [checkedIds, setCheckedIds] = useState<string[]>(sheet.checkedRowIds)
  const [savingRowId, setSavingRowId] = useState<string | null>(null)
  const [refreshingQuotes, setRefreshingQuotes] = useState(false)
  const [quotesRefreshedAt, setQuotesRefreshedAt] = useState<string | null>(
    sheet.quotesRefreshedAt ?? null,
  )
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('ALL')
  const [waveFilter, setWaveFilter] = useState<'ALL' | 'WAVE1' | 'WAVE2'>('ALL')
  const [custodianFilter, setCustodianFilter] = useState<string>('ALL')
  const [hideStaged, setHideStaged] = useState(false)

  // Inspector selection (desktop sticky pane) & mobile inline drawers
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    sheet.tickets[0]?.id ?? null,
  )
  const [expandedMobileIds, setExpandedMobileIds] = useState<Record<string, boolean>>({})
  const [highlightedCitation, setHighlightedCitation] = useState<number | null>(null)

  // Sync if sheet prop changes (e.g., Live Preview refresh or navigation)
  useEffect(() => {
    setTickets(sheet.tickets)
    setCheckedIds(sheet.checkedRowIds)
    setQuotesRefreshedAt(sheet.quotesRefreshedAt ?? null)
    setSelectedTicketId((prev) =>
      prev && sheet.tickets.some((t) => t.id === prev) ? prev : (sheet.tickets[0]?.id ?? null),
    )
  }, [sheet])

  const effectiveBlocks = useMemo<TradeBriefingBlock[]>(() => {
    if (Array.isArray(sheet.briefingBlocks) && sheet.briefingBlocks.length > 0) {
      return sheet.briefingBlocks
    }
    if (sheet.strategy) {
      return compileBriefingToPayloadBlocks(null, sheet.strategy).briefingBlocks
    }
    return []
  }, [sheet.briefingBlocks, sheet.strategy])

  const citations = sheet.citations ?? []
  const relatedNotes = sheet.relatedTradeNotes ?? []
  const checkedSet = useMemo(() => new Set(checkedIds), [checkedIds])
  const summary = useMemo(
    () => computeTradeSheetSummary(tickets, checkedIds),
    [tickets, checkedIds],
  )

  const custodians = useMemo(() => {
    const set = new Set<string>()
    for (const t of tickets) {
      if (t.custodian) set.add(t.custodian)
    }
    return Array.from(set).sort()
  }, [tickets])

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (actionFilter !== 'ALL') {
        const act = t.action.toUpperCase()
        if (actionFilter === 'OPTIONS') {
          if (!act.includes('STO') && !act.includes('ROLL')) return false
        } else if (act !== actionFilter) {
          return false
        }
      }
      if (waveFilter !== 'ALL' && t.wave.toUpperCase() !== waveFilter) return false
      if (custodianFilter !== 'ALL' && t.custodian !== custodianFilter) return false
      if (hideStaged && checkedSet.has(t.id)) return false
      return true
    })
  }, [tickets, actionFilter, waveFilter, custodianFilter, hideStaged, checkedSet])

  const wave1Tickets = useMemo(
    () => filteredTickets.filter((t) => t.wave.toUpperCase() !== 'WAVE2'),
    [filteredTickets],
  )
  const wave2Tickets = useMemo(
    () => filteredTickets.filter((t) => t.wave.toUpperCase() === 'WAVE2'),
    [filteredTickets],
  )

  const selectedTicket = useMemo(() => {
    return (
      filteredTickets.find((t) => t.id === selectedTicketId) ??
      tickets.find((t) => t.id === selectedTicketId) ??
      filteredTickets[0] ??
      tickets[0] ??
      null
    )
  }, [filteredTickets, tickets, selectedTicketId])

  const switchRoom = useCallback((room: TradeDeskRoom) => {
    setActiveRoom(room)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (room === 'blotter') {
        url.searchParams.delete('tab')
      } else {
        url.searchParams.set('tab', room)
      }
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  const handleSelectCitation = useCallback(
    (index: number) => {
      setHighlightedCitation(index)
      switchRoom('citations')
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          const el = document.getElementById(`citation-${index}`)
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        })
      }
    },
    [switchRoom],
  )

  const handleSelectTickerFromBriefing = useCallback(
    (ticker: string) => {
      const upper = ticker.trim().toUpperCase()
      const match = tickets.find(
        (t) => t.symbol.toUpperCase() === upper || ticketBaseTicker(t) === upper,
      )
      if (match) {
        setSelectedTicketId(match.id)
      }
      switchRoom('blotter')
    },
    [tickets, switchRoom],
  )

  // Keyboard navigation j/k in blotter room
  useEffect(() => {
    if (activeRoom !== 'blotter' || filteredTickets.length === 0) return
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key !== 'j' && e.key !== 'k') return

      const ordered = [...wave1Tickets, ...wave2Tickets]
      if (ordered.length === 0) return
      const idx = ordered.findIndex((t) => t.id === selectedTicket?.id)
      const nextIdx =
        e.key === 'j'
          ? Math.min(ordered.length - 1, idx < 0 ? 0 : idx + 1)
          : Math.max(0, idx <= 0 ? 0 : idx - 1)
      if (ordered[nextIdx]) {
        e.preventDefault()
        setSelectedTicketId(ordered[nextIdx].id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeRoom, filteredTickets.length, wave1Tickets, wave2Tickets, selectedTicket])

  const handleToggleChecked = useCallback(
    async (rowId: string) => {
      const prev = checkedIds
      const isChecked = prev.includes(rowId)
      const next = isChecked ? prev.filter((id) => id !== rowId) : [...prev, rowId]
      setCheckedIds(next)
      setSavingRowId(rowId)
      setStatusMessage(null)

      try {
        const res = await fetch(
          `/api/trade-sheets/${encodeURIComponent(sheet.sheetDate)}/checks`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkedRowIds: next }),
          },
        )
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const json = (await res.json()) as { checkedRowIds?: string[] }
        if (Array.isArray(json.checkedRowIds)) {
          setCheckedIds(json.checkedRowIds)
        }
      } catch {
        setCheckedIds(prev)
        setStatusMessage('Failed to save execution checkbox state. Reverted.')
      } finally {
        setSavingRowId(null)
      }
    },
    [checkedIds, sheet.sheetDate],
  )

  const handleRefreshQuotes = useCallback(async () => {
    setRefreshingQuotes(true)
    setStatusMessage(null)
    try {
      const res = await fetch(
        `/api/trade-sheets/${encodeURIComponent(sheet.sheetDate)}/refresh-quotes`,
        { method: 'POST' },
      )
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const json = (await res.json()) as {
        ticketsJson?: TradeTicketRow[]
        quotesRefreshedAt?: string
      }
      if (Array.isArray(json.ticketsJson)) {
        setTickets(json.ticketsJson)
      }
      if (json.quotesRefreshedAt) {
        setQuotesRefreshedAt(json.quotesRefreshedAt)
      }
      setStatusMessage('Live market quotes refreshed and limits re-anchored.')
    } catch {
      setStatusMessage('Quote refresh unavailable right now.')
    } finally {
      setRefreshingQuotes(false)
    }
  }, [sheet.sheetDate])

  // Contextual data resolver for a given ticket (shared by Desktop Sticky Inspector & Mobile inline drawer)
  const getTicketContext = useCallback(
    (ticket: TradeTicketRow) => {
      const base = ticketBaseTicker(ticket)
      const exact = ticket.symbol.trim().toUpperCase()

      const moveRationale = effectiveBlocks
        .filter((b): b is MoveRationalesBlockData => b.blockType === 'moveRationales')
        .flatMap((b) => b.items ?? [])
        .find((item) => {
          const itemTicker = item.ticker.trim().toUpperCase()
          return itemTicker === exact || itemTicker === base
        })

      const tickerAnnotations = effectiveBlocks.filter(
        (b): b is DeskAnnotationBlockData =>
          b.blockType === 'deskAnnotation' &&
          Boolean(b.ticker) &&
          (b.ticker!.trim().toUpperCase() === exact || b.ticker!.trim().toUpperCase() === base),
      )

      const debateBlocks = effectiveBlocks.filter(
        (b): b is PanelDebatesBlockData => b.blockType === 'panelDebates',
      )
      const matchingSeats = debateBlocks.flatMap((d) =>
        (d.seats ?? [])
          .filter(
            (s) =>
              s.thesis.toUpperCase().includes(base) ||
              (s.objection && s.objection.toUpperCase().includes(base)) ||
              d.topic.toUpperCase().includes(base),
          )
          .map((s) => ({ ...s, topic: d.topic })),
      )
      const primaryDebate = debateBlocks[0] ?? null

      const matchingCatalysts = effectiveBlocks
        .filter((b): b is NewsCatalystsBlockData => b.blockType === 'newsCatalysts')
        .flatMap((b) => b.items ?? [])
        .filter((c) => c.ticker && c.ticker.trim().toUpperCase() === base)

      const matchingNotes: LinkedTradeNote[] = relatedNotes.filter(
        (n) => n.ticker && n.ticker.trim().toUpperCase() === base,
      )

      const matchingCitations = citations.filter(
        (c) => c.ticker && c.ticker.trim().toUpperCase() === base,
      )

      return {
        base,
        moveRationale: moveRationale ?? null,
        tickerAnnotations,
        matchingSeats,
        primaryDebate,
        matchingCatalysts,
        matchingNotes,
        matchingCitations,
      }
    },
    [effectiveBlocks, relatedNotes, citations],
  )

  const renderInspectorBody = (ticket: TradeTicketRow, isMobileDrawer = false) => {
    const ctx = getTicketContext(ticket)

    return (
      <div className={isMobileDrawer ? 'space-y-4 pt-3' : 'space-y-5'}>
        {/* Selected Ticket Summary Header */}
        <div className="border-b border-[var(--color-rule)] pb-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono-code text-[16px] font-semibold text-[var(--color-ink)]">
                {ticket.symbol}
              </span>
              <span
                className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono-code font-semibold uppercase tracking-[0.08em] border"
                style={actionBadgeStyle(ticket.action)}
              >
                {ticket.action}
              </span>
            </div>
            <span className="font-mono-code text-[10px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
              {ticket.custodian} · {ticket.account}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono-code tabular-nums text-[11.5px] mt-2.5">
            <div>
              <div className="text-[9.5px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
                Limit Price
              </div>
              <div className="text-[var(--color-ink)] font-semibold">{ticket.limitPrice || '—'}</div>
            </div>
            <div>
              <div className="text-[9.5px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
                Qty / Est. Value
              </div>
              <div className="text-[var(--color-ink)] font-semibold">{ticket.qty || '—'}</div>
              <div className="text-[10px] text-[var(--color-subtle)]">{ticket.estValue || '—'}</div>
            </div>
            <div>
              <div className="text-[9.5px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
                Live Spot
              </div>
              <div className="text-[var(--color-ink)] font-semibold">
                {formatPrice(ticket.liveQuote)}
              </div>
            </div>
          </div>

          {ticket.note && (
            <div className="mt-2.5 border-l-2 border-[var(--color-rule-2)] pl-2.5 py-0.5 text-[12px] text-[var(--color-muted)]">
              {ticket.note}
            </div>
          )}
        </div>

        {/* Pinned / Ticker-scoped Desk Annotations */}
        {ctx.tickerAnnotations.map((ann, idx) => (
          <DeskAnnotationBlockView key={ann.id ?? idx} block={ann} />
        ))}

        {/* Action Rationale */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-mono-code text-[10px] uppercase tracking-[0.12em] text-[var(--color-subtle)]">
              Action Rationale
            </span>
            {ctx.moveRationale?.citationRefs && (
              <CitationRefChips
                refs={ctx.moveRationale.citationRefs}
                citations={citations}
                onSelectCitation={handleSelectCitation}
              />
            )}
          </div>
          <p className="text-[13px] leading-[1.6] text-[var(--color-ink)]">
            {ctx.moveRationale?.rationale || ticket.note || 'No rationale recorded.'}
          </p>
          {ctx.moveRationale?.keyRisks && (
            <p className="mt-2 text-[12px] leading-[1.55] text-[var(--color-muted)]">
              <span className="font-mono-code text-[10px] uppercase tracking-[0.08em] text-[var(--color-warn)] mr-1.5">
                Key Risk
              </span>
              {ctx.moveRationale.keyRisks}
            </p>
          )}
        </div>

        {/* Linked TradeNote Research Thesis */}
        {ctx.matchingNotes.length > 0 && (
          <div className="space-y-3">
            <div className="font-mono-code text-[10px] uppercase tracking-[0.12em] text-[var(--color-subtle)]">
              Linked TradeNote Thesis ({ctx.matchingNotes.length})
            </div>
            {ctx.matchingNotes.map((note) => (
              <TradeNoteThesisCard key={note.id} note={note} compact />
            ))}
          </div>
        )}

        {/* IC Panel Context */}
        {(ctx.matchingSeats.length > 0 || ctx.primaryDebate) && (
          <div className="border-t border-[var(--color-rule)] pt-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono-code text-[10px] uppercase tracking-[0.12em] text-[var(--color-subtle)]">
                IC Panel Debate Context
              </span>
              <button
                type="button"
                onClick={() => switchRoom('briefing')}
                className="font-mono-code text-[10px] uppercase tracking-[0.08em] text-[var(--color-accent)] hover:underline cursor-pointer"
              >
                Full Briefing →
              </button>
            </div>
            {ctx.matchingSeats.length > 0 ? (
              <div className="space-y-2.5">
                {ctx.matchingSeats.slice(0, 3).map((seat, idx) => (
                  <div
                    key={seat.id ?? `${seat.seatKey}-${idx}`}
                    className="border-l-2 border-[var(--color-rule-2)] pl-3 py-0.5"
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[12px] font-semibold text-[var(--color-ink)]">
                        {seat.seatName}
                      </span>
                      <span className="font-mono-code text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)]">
                        {seat.stance}
                      </span>
                    </div>
                    <p className="text-[12px] leading-[1.5] text-[var(--color-muted)]">
                      {seat.thesis}
                    </p>
                  </div>
                ))}
              </div>
            ) : ctx.primaryDebate ? (
              <div className="text-[12.5px] leading-[1.55] text-[var(--color-muted)]">
                <div className="font-medium text-[var(--color-ink)] mb-1">
                  {ctx.primaryDebate.topic}
                </div>
                {ctx.primaryDebate.dissentHeadline || ctx.primaryDebate.consensusSummary}
              </div>
            ) : null}
          </div>
        )}

        {/* Matching Catalysts */}
        {ctx.matchingCatalysts.length > 0 && (
          <div className="border-t border-[var(--color-rule)] pt-4">
            <div className="font-mono-code text-[10px] uppercase tracking-[0.12em] text-[var(--color-subtle)] mb-2">
              Corroborated Catalysts ({ctx.base})
            </div>
            <ul className="space-y-2">
              {ctx.matchingCatalysts.map((cat, idx) => (
                <li
                  key={cat.id ?? idx}
                  className="text-[12.5px] leading-[1.5] text-[var(--color-ink)]"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span>{cat.headline}</span>
                    {typeof cat.citationIndex === 'number' && cat.citationIndex > 0 && (
                      <CitationRefChips
                        indices={[cat.citationIndex]}
                        citations={citations}
                        onSelectCitation={handleSelectCitation}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Direct Citations for Ticker */}
        {ctx.matchingCitations.length > 0 && (
          <div className="border-t border-[var(--color-rule)] pt-3.5 flex flex-wrap items-center gap-2">
            <span className="font-mono-code text-[10px] uppercase tracking-[0.12em] text-[var(--color-subtle)]">
              Sources:
            </span>
            <CitationRefChips
              indices={ctx.matchingCitations.map((c) => c.index)}
              citations={citations}
              onSelectCitation={handleSelectCitation}
            />
          </div>
        )}
      </div>
    )
  }

  const renderTicketRow = (ticket: TradeTicketRow) => {
    const isChecked = checkedSet.has(ticket.id)
    const isSelected = selectedTicket?.id === ticket.id
    const isMobileExpanded = Boolean(expandedMobileIds[ticket.id])

    return (
      <div
        key={ticket.id}
        data-ticket-id={ticket.id}
        data-selected={isSelected ? 'true' : 'false'}
        className="border-b border-[var(--color-rule)] transition-colors"
        style={
          isSelected
            ? {
                backgroundColor: 'color-mix(in oklch, var(--color-accent) 5%, transparent)',
                boxShadow: 'inset 2px 0 0 var(--color-accent)',
              }
            : undefined
        }
      >
        <div className="flex items-start gap-3 px-3 py-3">
          {/* Independent Staged Checkbox */}
          <div className="pt-0.5 shrink-0">
            <input
              type="checkbox"
              aria-label={`Mark ${ticket.symbol} ${ticket.action} as staged`}
              checked={isChecked}
              disabled={savingRowId === ticket.id}
              onChange={() => handleToggleChecked(ticket.id)}
              className="h-4 w-4 accent-[var(--color-accent)] cursor-pointer"
            />
          </div>

          {/* Clickable Ticket Row Body for Inspector Selection */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedTicketId(ticket.id)}
                className="text-left min-w-0 flex-1 cursor-pointer focus:outline-none"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`font-mono-code text-[14px] font-semibold tracking-tight ${
                      isChecked
                        ? 'line-through text-[var(--color-subtle)]'
                        : 'text-[var(--color-ink)]'
                    }`}
                  >
                    {ticket.symbol}
                  </span>
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono-code font-semibold uppercase tracking-[0.08em] border"
                    style={actionBadgeStyle(ticket.action)}
                  >
                    {ticket.action}
                  </span>
                  <span className="font-mono-code text-[11px] text-[var(--color-muted)]">
                    {ticket.custodian} · {ticket.account}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono-code tabular-nums text-[12px]">
                  <span className="text-[var(--color-ink)] font-medium">{ticket.qty}</span>
                  <span className="text-[var(--color-muted)]">Limit {ticket.limitPrice}</span>
                  {ticket.estValue && (
                    <span className="text-[var(--color-ink)]">{ticket.estValue}</span>
                  )}
                  {typeof ticket.liveQuote === 'number' && (
                    <span className="text-[var(--color-muted)]">
                      Spot {formatPrice(ticket.liveQuote)}
                    </span>
                  )}
                </div>

                {ticket.note && (
                  <p className="mt-1.5 text-[12.5px] leading-[1.5] text-[var(--color-muted)] line-clamp-2">
                    {ticket.note}
                  </p>
                )}
              </button>

              {/* Mobile-only Why & IC inline drawer toggle */}
              <button
                type="button"
                aria-expanded={isMobileExpanded}
                onClick={() => {
                  setSelectedTicketId(ticket.id)
                  setExpandedMobileIds((prev) => ({
                    ...prev,
                    [ticket.id]: !prev[ticket.id],
                  }))
                }}
                className="lg:hidden shrink-0 px-2 py-1 font-mono-code text-[10px] uppercase tracking-[0.08em] border border-[var(--color-rule-2)] bg-[var(--color-paper-2)] text-[var(--color-ink)] cursor-pointer"
              >
                {isMobileExpanded ? 'Hide IC' : 'Why & IC'}
              </button>
            </div>

            {isMobileExpanded && (
              <div className="lg:hidden mt-3 border-t border-[var(--color-rule)] bg-[var(--color-paper-2)] p-3">
                {renderInspectorBody(ticket, true)}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const hasActiveFilters =
    actionFilter !== 'ALL' ||
    waveFilter !== 'ALL' ||
    custodianFilter !== 'ALL' ||
    hideStaged

  return (
    <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-[var(--color-ink)]">
      {/* Top Session Masthead */}
      <header className="border-b border-[var(--color-rule)] pb-5 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono-code text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-subtle)]">
              {deskSettings?.deskLabel || 'sovereign wealth & execution desk'}
            </span>
            <span className="font-mono-code text-[10px] uppercase tracking-[0.1em] px-1.5 py-0.5 border border-[var(--color-rule)] bg-[var(--color-paper-3)] text-[var(--color-muted)]">
              {sourceModeLabel(sheet.sourceMode)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {history.length > 0 && (
              <label className="inline-flex items-center gap-1.5 font-mono-code text-[11px] text-[var(--color-muted)]">
                <span className="sr-only">Select trade sheet date</span>
                <select
                  aria-label="Session history"
                  value={sheet.sheetDate}
                  onChange={(e) => {
                    if (e.target.value && e.target.value !== sheet.sheetDate) {
                      router.push(`/trade/${e.target.value}`)
                    }
                  }}
                  className="border border-[var(--color-rule-2)] bg-[var(--color-paper-2)] px-2 py-1 font-mono-code tabular-nums text-[11px] text-[var(--color-ink)]"
                >
                  {history.map((h) => (
                    <option key={h.sheetDate} value={h.sheetDate}>
                      {h.sheetDate} ({h.completedCount}/{h.ticketCount})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Link
              href={
                sheet.id
                  ? `/admin/collections/trade-sheets/${sheet.id}`
                  : '/admin/collections/trade-sheets'
              }
              className="px-2.5 py-1 border border-[var(--color-rule-2)] bg-[var(--color-paper-2)] font-mono-code text-[10.5px] uppercase tracking-[0.08em] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
            >
              Payload Studio
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="min-w-0">
            <h1
              className="font-display text-[30px] sm:text-[38px] leading-[1.12] tracking-[-0.02em] text-[var(--color-ink)]"
              style={{ fontStyle: 'normal' }}
            >
              {sheet.title}
            </h1>
            <p className="mt-1.5 text-[13.5px] text-[var(--color-muted)]">
              <span className="font-mono-code tabular-nums text-[12px] text-[var(--color-ink)] mr-2">
                {formatSheetDate(sheet.sheetDate)}
              </span>
              {sheet.subtitle ? `· ${sheet.subtitle}` : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="font-mono-code tabular-nums text-[12px] text-[var(--color-muted)]">
              <span className="font-semibold text-[var(--color-ink)]">
                {summary.completedTickets} / {summary.totalTickets}
              </span>{' '}
              staged
            </div>
            <button
              type="button"
              onClick={handleRefreshQuotes}
              disabled={refreshingQuotes}
              className="px-3 py-1.5 font-mono-code text-[11px] font-semibold uppercase tracking-[0.08em] border transition-colors cursor-pointer disabled:opacity-50"
              style={{
                borderColor: 'var(--color-accent)',
                color: 'var(--color-accent)',
                backgroundColor: 'color-mix(in oklch, var(--color-accent) 6%, transparent)',
              }}
            >
              {refreshingQuotes ? 'Refreshing…' : 'Refresh Live Quotes'}
            </button>
          </div>
        </div>

        {/* Desk Guardrail Strip */}
        {(deskSettings?.cashFloorTarget ||
          deskSettings?.taxShieldReadout ||
          (deskSettings?.standingGuardrails && deskSettings.standingGuardrails.length > 0)) && (
          <div className="mt-4 pt-3 border-t border-[var(--color-rule)] flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono-code tabular-nums text-[11px] text-[var(--color-muted)]">
            {deskSettings.cashFloorTarget && (
              <span>
                <span className="text-[var(--color-subtle)] uppercase mr-1.5">Floor</span>
                {deskSettings.cashFloorTarget}
              </span>
            )}
            {deskSettings.taxShieldReadout && (
              <span>
                <span className="text-[var(--color-subtle)] uppercase mr-1.5">Tax</span>
                {deskSettings.taxShieldReadout}
              </span>
            )}
            {deskSettings.standingGuardrails && deskSettings.standingGuardrails.length > 0 && (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                {deskSettings.standingGuardrails.slice(0, 3).map((g) => (
                  <span
                    key={g.code}
                    title={g.rule}
                    className="px-1.5 py-0.5 text-[10px] border border-[var(--color-rule)] bg-[var(--color-paper-3)] text-[var(--color-muted)]"
                  >
                    {g.code}
                  </span>
                ))}
              </span>
            )}
            <span className="ml-auto text-[var(--color-subtle)]">
              Quotes: {formatTimestamp(quotesRefreshedAt)}
            </span>
          </div>
        )}
      </header>

      {/* Alert Banner */}
      {sheet.alertBanner && (
        <div
          role="status"
          className="mb-5 border border-[var(--color-rule)] border-l-2 bg-[var(--color-paper-2)] px-4 py-3 text-[13px] leading-[1.55] text-[var(--color-ink)]"
          style={{ borderLeftColor: 'var(--color-warn)' }}
        >
          <span className="font-mono-code text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-warn)] mr-2">
            Desk Alert
          </span>
          {sheet.alertBanner}
        </div>
      )}

      {statusMessage && (
        <div
          role="status"
          className="mb-4 px-3 py-2 border border-[var(--color-rule)] bg-[var(--color-paper-3)] font-mono-code text-[11.5px] text-[var(--color-muted)]"
        >
          {statusMessage}
        </div>
      )}

      {/* KPI Strip */}
      {sheet.kpis.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-[var(--color-rule)] bg-[var(--color-paper-2)] divide-y lg:divide-y-0 lg:divide-x divide-[var(--color-rule)] mb-6">
          {sheet.kpis.map((kpi, idx) => (
            <div key={`${kpi.label}-${idx}`} className="px-4 py-3">
              <div className="font-mono-code text-[10px] uppercase tracking-[0.12em] text-[var(--color-subtle)]">
                {kpi.label}
              </div>
              <div className="font-mono-code tabular-nums text-[20px] font-semibold text-[var(--color-ink)] mt-1">
                {kpi.value}
              </div>
              {kpi.sub && (
                <div className="font-mono-code text-[11px] text-[var(--color-subtle)] mt-0.5">
                  {kpi.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3-Room Tab Navigation */}
      <nav
        role="tablist"
        aria-label="Trade Desk Rooms"
        className="flex flex-wrap items-center gap-6 border-b border-[var(--color-rule)] mb-6"
      >
        {(
          [
            {
              id: 'blotter' as const,
              label: '01 · Execution Blotter',
              badge: `${summary.completedTickets}/${summary.totalTickets}`,
            },
            {
              id: 'briefing' as const,
              label: '02 · IC Briefing & Dissent',
              badge: effectiveBlocks.length > 0 ? String(effectiveBlocks.length) : undefined,
            },
            {
              id: 'citations' as const,
              label: '03 · Citations & Telemetry',
              badge: String(citations.length),
            },
          ] as const
        ).map((tab) => {
          const active = activeRoom === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => switchRoom(tab.id)}
              className="relative pb-3 pt-1 font-mono-code text-[11.5px] uppercase tracking-[0.1em] transition-colors cursor-pointer flex items-center gap-2"
              style={{
                color: active ? 'var(--color-ink)' : 'var(--color-muted)',
                fontWeight: active ? 600 : 400,
              }}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="tabular-nums text-[10px] px-1.5 py-0.5 border border-[var(--color-rule)] bg-[var(--color-paper-3)] text-[var(--color-muted)]">
                  {tab.badge}
                </span>
              )}
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 right-0 bottom-0 h-[2px]"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* ROOM 01: EXECUTION BLOTTER + CONTEXTUAL IC INSPECTOR */}
      {activeRoom === 'blotter' && (
        <div role="tabpanel" aria-label="Execution Blotter">
          {/* Blotter Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--color-rule)]">
            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'SELL', 'BUY', 'OPTIONS', 'WATCH'] as const).map((act) => {
                const active = actionFilter === act
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setActionFilter(act)}
                    className="px-2.5 py-1 font-mono-code text-[10.5px] uppercase tracking-[0.08em] border transition-colors cursor-pointer"
                    style={
                      active
                        ? {
                            borderColor: 'var(--color-ink)',
                            backgroundColor: 'var(--color-ink)',
                            color: 'var(--color-paper)',
                          }
                        : {
                            borderColor: 'var(--color-rule)',
                            backgroundColor: 'var(--color-paper-2)',
                            color: 'var(--color-muted)',
                          }
                    }
                  >
                    {act}
                  </button>
                )
              })}

              <select
                aria-label="Filter by wave"
                value={waveFilter}
                onChange={(e) => setWaveFilter(e.target.value as 'ALL' | 'WAVE1' | 'WAVE2')}
                className="border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-2 py-1 font-mono-code text-[10.5px] text-[var(--color-ink)]"
              >
                <option value="ALL">All Waves</option>
                <option value="WAVE1">Wave 1</option>
                <option value="WAVE2">Wave 2</option>
              </select>

              {custodians.length > 1 && (
                <select
                  aria-label="Filter by custodian"
                  value={custodianFilter}
                  onChange={(e) => setCustodianFilter(e.target.value)}
                  className="border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-2 py-1 font-mono-code text-[10.5px] text-[var(--color-ink)]"
                >
                  <option value="ALL">All Custodians</option>
                  {custodians.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}

              <label className="inline-flex items-center gap-1.5 font-mono-code text-[10.5px] text-[var(--color-muted)] ml-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideStaged}
                  onChange={(e) => setHideStaged(e.target.checked)}
                  className="accent-[var(--color-accent)]"
                />
                <span>Hide Staged</span>
              </label>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setActionFilter('ALL')
                    setWaveFilter('ALL')
                    setCustodianFilter('ALL')
                    setHideStaged(false)
                  }}
                  className="font-mono-code text-[10.5px] text-[var(--color-accent)] hover:underline cursor-pointer ml-1"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 font-mono-code tabular-nums text-[11px] text-[var(--color-subtle)]">
              <span>
                Remaining:{' '}
                <strong className="text-[var(--color-ink)]">{summary.remainingTickets}</strong>
              </span>
              <span className="hidden lg:inline">Keys: j / k to inspect</span>
            </div>
          </div>

          {/* Hybrid A+B Split Workbench: 58% Blotter / 42% Sticky Inspector on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] gap-6 items-start">
            <div className="space-y-6 min-w-0">
              {filteredTickets.length === 0 ? (
                <div className="border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-5 py-8 text-[13.5px] text-[var(--color-muted)]">
                  No tickets match the active filter set.
                </div>
              ) : (
                <>
                  {wave1Tickets.length > 0 && (
                    <section aria-label="Wave 1 Execution Tickets">
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--color-rule-2)]">
                        <span className="font-mono-code text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink)]">
                          Wave 1 · Priority Liquidity &amp; Risk Trims
                        </span>
                        <span className="font-mono-code tabular-nums text-[11px] text-[var(--color-subtle)]">
                          {summary.wave1Done}/{summary.wave1Total} staged
                        </span>
                      </div>
                      <div className="bg-[var(--color-paper-2)] border-x border-[var(--color-rule)]">
                        {wave1Tickets.map(renderTicketRow)}
                      </div>
                    </section>
                  )}

                  {wave2Tickets.length > 0 && (
                    <section aria-label="Wave 2 Execution Tickets">
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--color-rule-2)]">
                        <span className="font-mono-code text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink)]">
                          Wave 2 · Conditional Deployment &amp; Option Rolls
                        </span>
                        <span className="font-mono-code tabular-nums text-[11px] text-[var(--color-subtle)]">
                          {summary.wave2Done}/{summary.wave2Total} staged
                        </span>
                      </div>
                      <div className="bg-[var(--color-paper-2)] border-x border-[var(--color-rule)]">
                        {wave2Tickets.map(renderTicketRow)}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>

            {/* Sticky Contextual IC & Citation Inspector (Desktop >= 1024px) */}
            <aside
              aria-label="Contextual IC and Citation Inspector"
              className="hidden lg:block sticky top-6 border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-5 min-w-0"
            >
              <div className="font-mono-code text-[10px] uppercase tracking-[0.14em] text-[var(--color-subtle)] mb-3">
                Contextual IC &amp; Citation Inspector
              </div>
              {selectedTicket ? (
                renderInspectorBody(selectedTicket, false)
              ) : (
                <p className="text-[13px] text-[var(--color-muted)]">
                  Select any ticket row to inspect its IC rationale, linked TradeNote thesis, and corroborated citations.
                </p>
              )}
            </aside>
          </div>
        </div>
      )}

      {/* ROOM 02: IC BRIEFING & DISSENT (EDITORIAL SPINE) */}
      {activeRoom === 'briefing' && (
        <div role="tabpanel" aria-label="IC Briefing and Dissent" className="max-w-[780px]">
          {effectiveBlocks.length > 0 ? (
            <RenderTradeBriefingBlocks
              blocks={effectiveBlocks}
              citations={citations}
              icSeats={deskSettings?.icSeats ?? []}
              onSelectCitation={handleSelectCitation}
              activeTicker={selectedTicket ? ticketBaseTicker(selectedTicket) : null}
              onSelectTicker={handleSelectTickerFromBriefing}
            />
          ) : (
            <div className="border border-[var(--color-rule)] bg-[var(--color-paper-2)] px-5 py-8 text-[14px] text-[var(--color-muted)]">
              No structured IC briefing blocks have been published for this session yet. Add blocks in Payload Studio or re-run daily ingest.
            </div>
          )}

          {/* Legacy Strategy Facts & Expected Results Tables (if present) */}
          {sheet.strategy &&
            (sheet.strategy.facts.length > 0 || sheet.strategy.expectedResults.length > 0) && (
              <section
                aria-label="Portfolio Risk Pillars and Expected Impact"
                className="border-t border-[var(--color-rule)] pt-7 mt-8 space-y-6"
              >
                {sheet.strategy.facts.length > 0 && (
                  <div>
                    <div className="font-mono-code text-[10px] uppercase tracking-[0.14em] text-[var(--color-subtle)] mb-3">
                      Portfolio Quantitative Pillars
                    </div>
                    <div className="border border-[var(--color-rule)] bg-[var(--color-paper-2)] divide-y divide-[var(--color-rule)]">
                      {sheet.strategy.facts.map((fact, idx) => (
                        <div
                          key={`${fact.pillar}-${idx}`}
                          className="grid grid-cols-1 sm:grid-cols-[160px_140px_1fr] gap-2 px-4 py-2.5 text-[13px]"
                        >
                          <div className="font-mono-code text-[11px] uppercase tracking-[0.06em] text-[var(--color-subtle)]">
                            {fact.pillar}
                          </div>
                          <div className="font-mono-code tabular-nums font-semibold text-[var(--color-ink)]">
                            {fact.metric}
                          </div>
                          <div className="text-[var(--color-muted)]">{fact.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sheet.strategy.expectedResults.length > 0 && (
                  <div>
                    <div className="font-mono-code text-[10px] uppercase tracking-[0.14em] text-[var(--color-subtle)] mb-3">
                      Expected Post-Execution Impact
                    </div>
                    <div className="border border-[var(--color-rule)] bg-[var(--color-paper-2)] divide-y divide-[var(--color-rule)] font-mono-code tabular-nums text-[12px]">
                      {sheet.strategy.expectedResults.map((row, idx) => (
                        <div
                          key={`${row.metric}-${idx}`}
                          className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 py-2.5"
                        >
                          <div className="text-[var(--color-ink)] font-semibold">{row.metric}</div>
                          <div className="text-[var(--color-subtle)]">{row.before}</div>
                          <div className="text-[var(--color-ink)]">{row.after}</div>
                          <div className="text-[var(--color-accent)]">{row.impact}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

          {/* Linked TradeNotes Section */}
          {relatedNotes.length > 0 && (
            <section
              aria-label="Linked Trade Notes"
              className="border-t border-[var(--color-rule)] pt-7 mt-8 space-y-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono-code text-[10px] uppercase tracking-[0.14em] text-[var(--color-subtle)]">
                  06 · Linked Research Notes (TradeNotes)
                </span>
                <span className="font-mono-code tabular-nums text-[11px] text-[var(--color-subtle)]">
                  {relatedNotes.length} {relatedNotes.length === 1 ? 'note' : 'notes'}
                </span>
              </div>
              <div className="space-y-4">
                {relatedNotes.map((note) => (
                  <TradeNoteThesisCard key={note.id} note={note} />
                ))}
              </div>
            </section>
          )}

          {/* Standing Desk Guardrails */}
          {deskSettings && (
            <div className="mt-8">
              <StandingGuardrailsView deskSettings={deskSettings} />
            </div>
          )}
        </div>
      )}

      {/* ROOM 03: CITATIONS, GUARDRAILS & TELEMETRY */}
      {activeRoom === 'citations' && (
        <div role="tabpanel" aria-label="Citations and Telemetry" className="max-w-[920px] space-y-8">
          <CitationsLedger
            citations={citations}
            highlightedIndex={highlightedCitation}
            onClearHighlight={() => setHighlightedCitation(null)}
          />

          <StandingGuardrailsView deskSettings={deskSettings} />

          <section
            aria-label="Session Telemetry"
            className="border-t border-[var(--color-rule)] pt-6"
          >
            <div className="font-mono-code text-[10px] uppercase tracking-[0.14em] text-[var(--color-subtle)] mb-3">
              Session Telemetry &amp; Audit Metadata
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-4 font-mono-code tabular-nums text-[12px]">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
                  Sheet Date
                </dt>
                <dd className="text-[var(--color-ink)] mt-1">{sheet.sheetDate}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
                  Source Mode
                </dt>
                <dd className="text-[var(--color-ink)] mt-1">{sourceModeLabel(sheet.sourceMode)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
                  Execution Progress
                </dt>
                <dd className="text-[var(--color-ink)] mt-1">
                  {sheet.executionProgress || `${summary.completedTickets} / ${summary.totalTickets} staged`}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-subtle)]">
                  Quotes Refreshed
                </dt>
                <dd className="text-[var(--color-ink)] mt-1">
                  {formatTimestamp(quotesRefreshedAt)}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </div>
  )
}
