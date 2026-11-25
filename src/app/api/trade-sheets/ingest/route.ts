import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  extractSheetTickers,
  mergeIngestBriefingBlocks,
  sanitizeTradeSheetInput,
  verifyIngestBearerToken,
  type TradeBriefingBlock,
} from '@/lib/trade-sheets'

export const dynamic = 'force-dynamic'

const MAX_INGEST_BYTES = 262_144

function extractNoteId(entry: unknown): string | null {
  if (typeof entry === 'string' && entry.trim()) return entry.trim()
  if (entry && typeof entry === 'object' && typeof (entry as { id?: unknown }).id === 'string') {
    return (entry as { id: string }).id
  }
  return null
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!verifyIngestBearerToken(authHeader, process.env.TRADE_INGEST_SECRET)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const contentLength = Number(req.headers.get('content-length') || '0')
  if (Number.isFinite(contentLength) && contentLength > MAX_INGEST_BYTES) {
    return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 })
  }

  let body: unknown
  try {
    const rawText = await req.text()
    if (Buffer.byteLength(rawText, 'utf8') > MAX_INGEST_BYTES) {
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
    depth: 0,
    overrideAccess: true,
  })

  const explicitQuoteIso =
    body &&
    typeof body === 'object' &&
    typeof (body as Record<string, unknown>).quotesRefreshedAt === 'string' &&
    !Number.isNaN(Date.parse((body as Record<string, unknown>).quotesRefreshedAt as string))
      ? new Date(
          Date.parse((body as Record<string, unknown>).quotesRefreshedAt as string),
        ).toISOString()
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

  // Auto-link published TradeNotes matching any sheet ticker
  const sheetTickers = extractSheetTickers(cleaned.ticketsJson, cleaned.compiledBlocks)
  const noteIdSet = new Set<string>(cleaned.relatedTradeNotes ?? [])
  if (sheetTickers.length > 0) {
    try {
      const notesRes = await payload.find({
        collection: 'trade-notes',
        where: {
          and: [
            { ticker: { in: sheetTickers } },
            { _status: { equals: 'published' } },
          ],
        },
        limit: 50,
        depth: 0,
        overrideAccess: true,
      })
      for (const n of notesRes.docs) {
        if (n && typeof n.id === 'string') noteIdSet.add(n.id)
      }
    } catch {
      // Non-fatal: proceed with sheet upsert even if trade-notes query fails
    }
  }

  if (existing.docs.length > 0) {
    const prev = existing.docs[0]
    const validTicketIds = new Set(cleaned.ticketsJson.map((t) => t.id))
    const preservedChecks = cleaned.resetChecks
      ? []
      : Array.isArray(prev.checkedRowIds)
        ? (prev.checkedRowIds as unknown[]).filter(
            (x): x is string => typeof x === 'string' && validTicketIds.has(x),
          )
        : []

    const prevBlocks = Array.isArray(prev.briefingBlocks)
      ? (prev.briefingBlocks as unknown as TradeBriefingBlock[])
      : []

    const mergedBlocks =
      cleaned.hasStructuredBriefing || prevBlocks.length === 0
        ? mergeIngestBriefingBlocks(prevBlocks, cleaned.compiledBlocks)
        : prevBlocks

    const mergedCitations = cleaned.hasStructuredBriefing
      ? cleaned.compiledCitations
      : Array.isArray(prev.citations) && prev.citations.length > 0
        ? prev.citations
        : cleaned.compiledCitations

    if (Array.isArray(prev.relatedTradeNotes)) {
      for (const entry of prev.relatedTradeNotes) {
        const id = extractNoteId(entry)
        if (id) noteIdSet.add(id)
      }
    }
    const mergedNoteIds = Array.from(noteIdSet)

    const updated = await payload.update({
      collection: 'trade-sheets',
      id: prev.id,
      overrideAccess: true,
      data: {
        title: cleaned.title,
        subtitle: cleaned.subtitle,
        alertBanner: cleaned.alertBanner,
        sourceMode: cleaned.sourceMode,
        kpisJson: cleaned.kpisJson,
        strategyJson: cleaned.strategyJson,
        ticketsJson: cleaned.ticketsJson,
        briefingBlocks: mergedBlocks as never,
        citations: mergedCitations as never,
        relatedTradeNotes: mergedNoteIds as never,
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
      briefingBlockCount: mergedBlocks.length,
      citationCount: mergedCitations.length,
      linkedTradeNoteCount: mergedNoteIds.length,
      url: `https://trade.tannerchung.com/${updated.sheetDate}`,
    })
  }

  const relatedTradeNotes = Array.from(noteIdSet)
  const created = await payload.create({
    collection: 'trade-sheets',
    overrideAccess: true,
    data: {
      sheetDate: cleaned.sheetDate,
      title: cleaned.title,
      subtitle: cleaned.subtitle,
      alertBanner: cleaned.alertBanner,
      sourceMode: cleaned.sourceMode,
      kpisJson: cleaned.kpisJson,
      strategyJson: cleaned.strategyJson,
      ticketsJson: cleaned.ticketsJson,
      briefingBlocks: cleaned.compiledBlocks as never,
      citations: cleaned.compiledCitations as never,
      relatedTradeNotes: relatedTradeNotes as never,
      checkedRowIds: [],
      quotesRefreshedAt: effectiveQuotesRefreshedAt,
    },
  })

  return NextResponse.json({
    ok: true,
    action: 'created',
    id: created.id,
    sheetDate: created.sheetDate,
    briefingBlockCount: cleaned.compiledBlocks.length,
    citationCount: cleaned.compiledCitations.length,
    linkedTradeNoteCount: relatedTradeNotes.length,
    url: `https://trade.tannerchung.com/${created.sheetDate}`,
  })
}
