import crypto from 'node:crypto'

export type TradeSheetKpi = {
  label: string
  value: string
  sub?: string
}

export type StrategyFactRow = {
  pillar: string
  metric: string
  detail: string
}

export type ExpectedResultRow = {
  metric: string
  before: string
  after: string
  impact: string
}

export type TradeSheetStrategy = {
  headline: string
  summaryBullets: string[]
  holdOffNotes?: string[]
  facts: StrategyFactRow[]
  expectedResults: ExpectedResultRow[]
}

export type TradeTicketRow = {
  id: string
  wave: 'WAVE1' | 'WAVE2' | string
  custodian: string
  account: string
  action: 'SELL' | 'BUY' | 'STO CALL' | 'STO PUT' | string
  symbol: string
  qty: string
  limitPrice: string
  estValue: string
  note: string
  liveQuote?: number | null
  quoteUpdatedAt?: string | null
}

export interface SanitizedTradeSheetInput {
  sheetDate: string
  title: string
  subtitle: string
  alertBanner: string
  kpisJson: TradeSheetKpi[]
  strategyJson: TradeSheetStrategy
  ticketsJson: TradeTicketRow[]
  resetChecks?: boolean
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const RAW_ACCT_NUM_RE = /\b\d{8,}\b/g

export function scrubSensitiveText(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.replace(RAW_ACCT_NUM_RE, '[REDACTED-ACCT]').trim()
}

export function verifyIngestBearerToken(
  authHeader: string | null | undefined,
  expectedSecret: string | undefined,
): boolean {
  if (!authHeader || !expectedSecret || expectedSecret.length < 16) return false
  const prefix = 'Bearer '
  if (!authHeader.startsWith(prefix)) return false
  const provided = authHeader.slice(prefix.length).trim()
  if (!provided) return false

  const hProvided = crypto.createHash('sha256').update(provided, 'utf8').digest()
  const hExpected = crypto.createHash('sha256').update(expectedSecret.trim(), 'utf8').digest()
  return crypto.timingSafeEqual(hProvided, hExpected)
}

export function sanitizeTradeSheetInput(raw: unknown): SanitizedTradeSheetInput {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Payload must be a JSON object')
  }
  const obj = raw as Record<string, unknown>
  const sheetDate = scrubSensitiveText(obj.sheetDate)
  if (!DATE_RE.test(sheetDate)) {
    throw new Error('sheetDate must match YYYY-MM-DD')
  }
  const title = scrubSensitiveText(obj.title) || `Daily Trade Sheet — ${sheetDate}`
  const subtitle = scrubSensitiveText(obj.subtitle)
  const alertBanner = scrubSensitiveText(obj.alertBanner)

  const rawKpis = Array.isArray(obj.kpisJson) ? obj.kpisJson : []
  const kpisJson: TradeSheetKpi[] = rawKpis.slice(0, 8).map((k) => {
    const item = (k && typeof k === 'object' ? k : {}) as Record<string, unknown>
    return {
      label: scrubSensitiveText(item.label),
      value: scrubSensitiveText(item.value),
      sub: scrubSensitiveText(item.sub),
    }
  })

  const rawStrat = (obj.strategyJson && typeof obj.strategyJson === 'object'
    ? obj.strategyJson
    : {}) as Record<string, unknown>
  const strategyJson: TradeSheetStrategy = {
    headline: scrubSensitiveText(rawStrat.headline),
    summaryBullets: Array.isArray(rawStrat.summaryBullets)
      ? rawStrat.summaryBullets.map((b) => scrubSensitiveText(b)).filter(Boolean)
      : [],
    holdOffNotes: Array.isArray(rawStrat.holdOffNotes)
      ? rawStrat.holdOffNotes.map((b) => scrubSensitiveText(b)).filter(Boolean)
      : [],
    facts: Array.isArray(rawStrat.facts)
      ? rawStrat.facts.map((f) => {
          const item = (f && typeof f === 'object' ? f : {}) as Record<string, unknown>
          return {
            pillar: scrubSensitiveText(item.pillar),
            metric: scrubSensitiveText(item.metric),
            detail: scrubSensitiveText(item.detail),
          }
        })
      : [],
    expectedResults: Array.isArray(rawStrat.expectedResults)
      ? rawStrat.expectedResults.map((r) => {
          const item = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>
          return {
            metric: scrubSensitiveText(item.metric),
            before: scrubSensitiveText(item.before),
            after: scrubSensitiveText(item.after),
            impact: scrubSensitiveText(item.impact),
          }
        })
      : [],
  }

  const rawTickets = Array.isArray(obj.ticketsJson) ? obj.ticketsJson : []
  const ticketsJson: TradeTicketRow[] = rawTickets.slice(0, 150).map((t, idx) => {
    const item = (t && typeof t === 'object' ? t : {}) as Record<string, unknown>
    return {
      id: scrubSensitiveText(item.id) || `row-${idx}`,
      wave: scrubSensitiveText(item.wave) || 'WAVE1',
      custodian: scrubSensitiveText(item.custodian),
      account: scrubSensitiveText(item.account),
      action: scrubSensitiveText(item.action).toUpperCase(),
      symbol: scrubSensitiveText(item.symbol),
      qty: scrubSensitiveText(item.qty),
      limitPrice: scrubSensitiveText(item.limitPrice),
      estValue: scrubSensitiveText(item.estValue),
      note: scrubSensitiveText(item.note),
      liveQuote: typeof item.liveQuote === 'number' ? item.liveQuote : null,
      quoteUpdatedAt: typeof item.quoteUpdatedAt === 'string' ? item.quoteUpdatedAt : null,
    }
  })

  return {
    sheetDate,
    title,
    subtitle,
    alertBanner,
    kpisJson,
    strategyJson,
    ticketsJson,
    resetChecks: Boolean(obj.resetChecks),
  }
}

export function extractEquityTicker(symbolOrContract: string): string | null {
  const m = symbolOrContract.trim().match(/^([A-Z]{1,6}(?:-[A-Z])?)\b/)
  return m ? m[1] : null
}

function roundMarketableLimit(price: number): number {
  if (price >= 500) return Math.round(price * 4) / 4 // $0.25 increments
  if (price >= 20) return Math.round(price * 20) / 20 // $0.05 increments
  return Math.round(price * 100) / 100 // $0.01 increments
}

function formatUsd(val: number, decimals = 2): string {
  return (
    '$' +
    val.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  )
}

export function reanchorTicketWithSpot(
  ticket: TradeTicketRow,
  spot: number,
  updatedAtIso: string,
): TradeTicketRow {
  if (!Number.isFinite(spot) || spot <= 0) return ticket
  const act = ticket.action.toUpperCase()
  const qtyNum = parseFloat(ticket.qty.replace(/[^0-9.]/g, '')) || 0

  if (act === 'SELL' || act === 'BUY') {
    const mult = act === 'SELL' ? 0.996 : 1.004
    const newLim = roundMarketableLimit(spot * mult)
    const estDollars = qtyNum > 0 ? Math.round(qtyNum * newLim) : null
    const cleanNote = ticket.note.replace(/Live \$[0-9,.]+/i, `Live ${formatUsd(spot, 2)}`)
    const finalNote =
      cleanNote === ticket.note ? `Live ${formatUsd(spot, 2)} · ${ticket.note}` : cleanNote

    return {
      ...ticket,
      limitPrice: formatUsd(newLim, 2),
      estValue: estDollars !== null ? formatUsd(estDollars, 0) : ticket.estValue,
      note: finalNote,
      liveQuote: spot,
      quoteUpdatedAt: updatedAtIso,
    }
  }

  // Option rows: preserve option strike/premium limit while updating underlying live spot note
  const cleanOptNote = ticket.note.replace(/Live \$[0-9,.]+/i, `Live ${formatUsd(spot, 2)}`)
  return {
    ...ticket,
    note: cleanOptNote,
    liveQuote: spot,
    quoteUpdatedAt: updatedAtIso,
  }
}
