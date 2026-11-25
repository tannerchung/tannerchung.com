import type { Payload } from 'payload'
import {
  computeTradeSheetSummary,
  extractSheetTickers,
  parseLinkedTradeNotes,
  type DeskSettingsSummary,
  type TradeSheetRecord,
  type TradeTicketRow,
} from '@/lib/trade-sheets'
import { DEFAULT_IC_SEATS, type IcSeatConfig } from '@/globals/TradeDeskSettings'

export interface TradeSheetHistoryItem {
  sheetDate: string
  title: string
  ticketCount: number
  completedCount: number
}

export function normalizeTabParam(
  raw?: string | string[],
): 'blotter' | 'strategy' | 'briefing' | 'citations' | undefined {
  const val = Array.isArray(raw) ? raw[0] : raw
  if (val === 'blotter' || val === 'strategy' || val === 'briefing' || val === 'citations') {
    return val
  }
  return undefined
}

export function normalizeDeskSettings(
  raw: Record<string, unknown> | null,
): DeskSettingsSummary | null {
  if (!raw) return null
  const guardrails = Array.isArray(raw.standingGuardrails)
    ? raw.standingGuardrails
        .filter(
          (g): g is { code: string; rule: string } =>
            Boolean(g) &&
            typeof g === 'object' &&
            typeof (g as { code?: unknown }).code === 'string' &&
            typeof (g as { rule?: unknown }).rule === 'string',
        )
        .map((g) => ({ code: g.code, rule: g.rule }))
    : []
  const rawIps =
    raw.ipsTargets && typeof raw.ipsTargets === 'object'
      ? (raw.ipsTargets as Record<string, unknown>)
      : null
  const icSeats: IcSeatConfig[] =
    Array.isArray(raw.icSeats) && raw.icSeats.length > 0
      ? raw.icSeats
          .filter(
            (s): s is IcSeatConfig =>
              Boolean(s) &&
              typeof s === 'object' &&
              typeof (s as { seatKey?: unknown }).seatKey === 'string' &&
              typeof (s as { displayName?: unknown }).displayName === 'string',
          )
          .map((s) => ({
            seatKey: s.seatKey,
            displayName: s.displayName,
            archetype: s.archetype || '',
            mandate: s.mandate || '',
          }))
      : DEFAULT_IC_SEATS

  return {
    deskLabel:
      typeof raw.deskLabel === 'string' && raw.deskLabel
        ? raw.deskLabel
        : 'sovereign wealth & execution desk',
    cashFloorTarget: typeof raw.cashFloorTarget === 'string' ? raw.cashFloorTarget : null,
    maxOptionSpreadPct:
      typeof raw.maxOptionSpreadPct === 'number' ? raw.maxOptionSpreadPct : 8,
    taxShieldReadout: typeof raw.taxShieldReadout === 'string' ? raw.taxShieldReadout : null,
    washSaleBlackoutThrough:
      typeof raw.washSaleBlackoutThrough === 'string' ? raw.washSaleBlackoutThrough : null,
    washSaleTickers: typeof raw.washSaleTickers === 'string' ? raw.washSaleTickers : null,
    standingGuardrails: guardrails,
    ipsTargets: rawIps
      ? {
          targetBetaMax:
            typeof rawIps.targetBetaMax === 'number' ? rawIps.targetBetaMax : null,
          minCashFloorUsd:
            typeof rawIps.minCashFloorUsd === 'number' ? rawIps.minCashFloorUsd : null,
          coreAllocationTargetPct:
            typeof rawIps.coreAllocationTargetPct === 'number'
              ? rawIps.coreAllocationTargetPct
              : null,
          satelliteMaxSingleWeightPct:
            typeof rawIps.satelliteMaxSingleWeightPct === 'number'
              ? rawIps.satelliteMaxSingleWeightPct
              : null,
        }
      : null,
    icSeats,
  }
}

/**
 * Lightweight history query projected to scalar columns only (`depth: 0` + `select`).
 * Avoids hydrating child block tables or relationships across 30 rows over Supavisor `:6543`.
 */
export async function loadTradeSheetHistory(
  payload: Payload,
  user: unknown,
): Promise<TradeSheetHistoryItem[]> {
  const historyRes = await payload.find({
    collection: 'trade-sheets',
    user: user as never,
    overrideAccess: false,
    sort: '-sheetDate',
    limit: 30,
    depth: 0,
    select: {
      sheetDate: true,
      title: true,
      status: true,
      sourceMode: true,
      executionProgress: true,
      ticketsJson: true,
      checkedRowIds: true,
      kpisJson: true,
    },
  })

  return historyRes.docs.map((rawDoc) => {
    const doc = rawDoc as unknown as Record<string, unknown>
    const tickets = Array.isArray(doc.ticketsJson) ? (doc.ticketsJson as TradeTicketRow[]) : []
    const checkedRowIds = Array.isArray(doc.checkedRowIds)
      ? doc.checkedRowIds.filter((v): v is string => typeof v === 'string')
      : []
    const summary = computeTradeSheetSummary(tickets, checkedRowIds)
    return {
      sheetDate: String(doc.sheetDate ?? ''),
      title: String(doc.title ?? 'Trade Execution Sheet'),
      ticketCount: summary.totalTickets,
      completedCount: summary.completedTickets,
    }
  })
}

export async function loadTradeDeskSettings(
  payload: Payload,
  user: unknown,
): Promise<DeskSettingsSummary | null> {
  const settingsRaw = await payload
    .findGlobal({
      slug: 'trade-desk-settings',
      user: user as never,
      overrideAccess: false,
    })
    .catch(() => null)

  return normalizeDeskSettings(settingsRaw as unknown as Record<string, unknown> | null)
}

export async function enrichSheetWithPublishedTradeNotes(
  payload: Payload,
  user: unknown,
  sheet: TradeSheetRecord,
): Promise<void> {
  const tickers = extractSheetTickers(sheet.tickets, sheet.briefingBlocks)
  if (tickers.length === 0) return

  const notesRes = await payload
    .find({
      collection: 'trade-notes',
      user: user as never,
      overrideAccess: false,
      where: {
        and: [{ ticker: { in: tickers } }, { _status: { equals: 'published' } }],
      },
      limit: 30,
      depth: 0,
    })
    .catch(() => ({ docs: [] }))

  const existingIds = new Set(sheet.relatedTradeNotes.map((n) => n.id))
  const parsedNotes = parseLinkedTradeNotes(notesRes.docs)
  for (const note of parsedNotes) {
    if (!existingIds.has(note.id)) {
      existingIds.add(note.id)
      sheet.relatedTradeNotes.push(note)
    }
  }
}
