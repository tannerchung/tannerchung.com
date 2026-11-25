import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sanitizeTradeSheetInput, verifyIngestBearerToken } from '@/lib/trade-sheets'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!verifyIngestBearerToken(authHeader, process.env.TRADE_INGEST_SECRET)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const contentLength = Number(req.headers.get('content-length') || '0')
  if (Number.isFinite(contentLength) && contentLength > 262_144) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 })
  }

  let body: unknown
  try {
    const rawText = await req.text()
    if (Buffer.byteLength(rawText, 'utf8') > 262_144) {
      return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 })
    }
    body = JSON.parse(rawText)
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  let cleaned
  try {
    cleaned = sanitizeTradeSheetInput(body)
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Validation failed' },
      { status: 400 },
    )
  }

  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'trade-sheets',
    where: { sheetDate: { equals: cleaned.sheetDate } },
    limit: 1,
    overrideAccess: true,
  })

  const explicitQuoteIso =
    body &&
    typeof body === 'object' &&
    typeof (body as Record<string, unknown>).quotesRefreshedAt === 'string' &&
    !Number.isNaN(Date.parse((body as Record<string, unknown>).quotesRefreshedAt as string))
      ? new Date(Date.parse((body as Record<string, unknown>).quotesRefreshedAt as string)).toISOString()
      : null

  let latestTicketQuoteMs = -Infinity
  let latestTicketQuoteIso: string | null = null
  for (const t of cleaned.ticketsJson) {
    if (typeof t.quoteUpdatedAt === 'string') {
      const ms = Date.parse(t.quoteUpdatedAt)
      if (!Number.isNaN(ms) && ms > latestTicketQuoteMs) {
        latestTicketQuoteMs = ms
        latestTicketQuoteIso = new Date(ms).toISOString()
      }
    }
  }
  const effectiveQuotesRefreshedAt = explicitQuoteIso ?? latestTicketQuoteIso

  if (existing.docs.length > 0) {
    const prev = existing.docs[0]
    const validTicketIds = new Set(cleaned.ticketsJson.map((t) => t.id))
    const preservedChecks = cleaned.resetChecks
      ? []
      : Array.isArray(prev.checkedRowIds)
        ? (prev.checkedRowIds as unknown[])
            .filter((x): x is string => typeof x === 'string' && validTicketIds.has(x))
        : []

    const updated = await payload.update({
      collection: 'trade-sheets',
      id: prev.id,
      overrideAccess: true,
      data: {
        title: cleaned.title,
        subtitle: cleaned.subtitle,
        alertBanner: cleaned.alertBanner,
        kpisJson: cleaned.kpisJson,
        strategyJson: cleaned.strategyJson,
        ticketsJson: cleaned.ticketsJson,
        checkedRowIds: preservedChecks,
        quotesRefreshedAt:
          effectiveQuotesRefreshedAt ??
          (typeof prev.quotesRefreshedAt === 'string' ? prev.quotesRefreshedAt : null),
      },
    })

    return NextResponse.json({
      ok: true,
      action: 'updated',
      id: updated.id,
      sheetDate: updated.sheetDate,
      url: `https://trade.tannerchung.com/${updated.sheetDate}`,
    })
  }

  const created = await payload.create({
    collection: 'trade-sheets',
    overrideAccess: true,
    data: {
      sheetDate: cleaned.sheetDate,
      title: cleaned.title,
      subtitle: cleaned.subtitle,
      alertBanner: cleaned.alertBanner,
      kpisJson: cleaned.kpisJson,
      strategyJson: cleaned.strategyJson,
      ticketsJson: cleaned.ticketsJson,
      checkedRowIds: [],
      quotesRefreshedAt: effectiveQuotesRefreshedAt,
    },
  })

  return NextResponse.json({
    ok: true,
    action: 'created',
    id: created.id,
    sheetDate: created.sheetDate,
    url: `https://trade.tannerchung.com/${created.sheetDate}`,
  })
}
