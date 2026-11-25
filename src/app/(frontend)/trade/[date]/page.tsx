import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  extractSheetTickers,
  parseTradeSheetRecord,
  type DeskSettingsSummary,
  type LinkedTradeNote,
} from '@/lib/trade-sheets'
import { DEFAULT_IC_SEATS, type IcSeatConfig } from '@/globals/TradeDeskSettings'
import { TradeSheetView } from '@/components/TradeSheetView'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export const dynamic = 'force-dynamic'

function normalizeTabParam(
  raw?: string | string[],
): 'blotter' | 'strategy' | 'briefing' | 'citations' | undefined {
  const val = Array.isArray(raw) ? raw[0] : raw
  if (val === 'blotter' || val === 'strategy' || val === 'briefing' || val === 'citations') {
    return val
  }
  return undefined
}

function normalizeDeskSettings(raw: Record<string, unknown> | null): DeskSettingsSummary | null {
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

export default async function TradeSheetDatePage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>
  searchParams: Promise<{ tab?: string | string[] }>
}) {
  const { date } = await params
  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers }).catch(() => ({ user: null }))

  if (!user || (user as { role?: string }).role !== 'admin') {
    redirect(`/admin/login?redirect=/trade/${encodeURIComponent(date)}`)
  }

  if (date === 'today' || date === 'latest') {
    const latestRes = await payload.find({
      collection: 'trade-sheets',
      user,
      overrideAccess: false,
      sort: '-sheetDate',
      limit: 1,
      depth: 0,
    })
    if (latestRes.docs.length > 0 && typeof latestRes.docs[0].sheetDate === 'string') {
      redirect(`/trade/${latestRes.docs[0].sheetDate}`)
    }
    redirect('/trade')
  }

  const sp = await searchParams
  const initialTab = normalizeTabParam(sp?.tab)

  const [targetRes, historyRes, settingsRaw] = await Promise.all([
    payload.find({
      collection: 'trade-sheets',
      user,
      overrideAccess: false,
      where: { sheetDate: { equals: date } },
      limit: 1,
      depth: 1,
    }),
    payload.find({
      collection: 'trade-sheets',
      user,
      overrideAccess: false,
      sort: '-sheetDate',
      limit: 30,
      depth: 0,
    }),
    payload
      .findGlobal({
        slug: 'trade-desk-settings',
        user,
        overrideAccess: false,
      })
      .catch(() => null),
  ])

  if (targetRes.docs.length === 0) {
    notFound()
  }

  const sheet = parseTradeSheetRecord(
    targetRes.docs[0] as unknown as Record<string, unknown>,
  )
  const deskSettings = normalizeDeskSettings(
    settingsRaw as unknown as Record<string, unknown> | null,
  )

  const tickers = extractSheetTickers(sheet.tickets, sheet.briefingBlocks)
  if (tickers.length > 0) {
    const notesRes = await payload
      .find({
        collection: 'trade-notes',
        user,
        overrideAccess: false,
        where: {
          and: [
            { ticker: { in: tickers } },
            { _status: { equals: 'published' } },
          ],
        },
        limit: 30,
        depth: 0,
      })
      .catch(() => ({ docs: [] }))

    const existingIds = new Set(sheet.relatedTradeNotes.map((n) => n.id))
    for (const rawNote of notesRes.docs) {
      const note = rawNote as unknown as Record<string, unknown>
      if (typeof note.id === 'string' && !existingIds.has(note.id)) {
        existingIds.add(note.id)
        sheet.relatedTradeNotes.push({
          id: note.id,
          title: String(note.title ?? ''),
          ticker: typeof note.ticker === 'string' ? note.ticker : null,
          conviction:
            note.conviction === 'high' ||
            note.conviction === 'medium' ||
            note.conviction === 'watch' ||
            note.conviction === 'avoid'
              ? note.conviction
              : null,
          valuationZone:
            note.valuationZone === 'buy_zone' ||
            note.valuationZone === 'hold_zone' ||
            note.valuationZone === 'trim_zone'
              ? note.valuationZone
              : null,
          strategy: typeof note.strategy === 'string' ? note.strategy : null,
          thesis: note.thesis ?? null,
          metricsJson:
            note.metricsJson && typeof note.metricsJson === 'object'
              ? (note.metricsJson as Record<string, unknown>)
              : null,
          sheetUrl: typeof note.sheetUrl === 'string' ? note.sheetUrl : null,
          updatedAt: typeof note.updatedAt === 'string' ? note.updatedAt : null,
        } satisfies LinkedTradeNote)
      }
    }
  }

  const history = historyRes.docs.map((doc) => {
    const rec = parseTradeSheetRecord(doc as unknown as Record<string, unknown>)
    return {
      sheetDate: rec.sheetDate,
      title: rec.title,
      ticketCount: rec.tickets.length,
      completedCount: rec.checkedRowIds.length,
    }
  })

  return (
    <div className="min-h-screen">
      <LivePreviewListener />
      <TradeSheetView
        key={sheet.sheetDate}
        sheet={sheet}
        history={history}
        deskSettings={deskSettings}
        initialTab={initialTab}
      />
    </div>
  )
}
