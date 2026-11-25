import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  extractEquityTicker,
  reanchorTicketWithSpot,
  type TradeTicketRow,
} from '@/lib/trade-sheets'

export const dynamic = 'force-dynamic'

async function fetchYahooSpot(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      chart?: { result?: Array<{ meta?: { regularMarketPrice?: number } }> }
    }
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice
    return typeof price === 'number' && Number.isFinite(price) && price > 0 ? price : null
  } catch {
    return null
  }
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ date: string }> },
) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || (user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { date } = await context.params
  const existing = await payload.find({
    collection: 'trade-sheets',
    where: { sheetDate: { equals: date } },
    limit: 1,
    user,
    overrideAccess: false,
  })

  if (existing.docs.length === 0) {
    return NextResponse.json({ ok: false, error: 'Sheet not found' }, { status: 404 })
  }

  const doc = existing.docs[0]
  const tickets = (Array.isArray(doc.ticketsJson) ? doc.ticketsJson : []) as TradeTicketRow[]
  const uniqueTickers = Array.from(
    new Set(
      tickets
        .map((t) => extractEquityTicker(t.symbol))
        .filter((s): s is string => Boolean(s)),
    ),
  )
  const requestedCount = uniqueTickers.length
  const prevRefreshedAt =
    typeof doc.quotesRefreshedAt === 'string' ? doc.quotesRefreshedAt : null

  if (requestedCount === 0) {
    return NextResponse.json({
      ok: true,
      refreshedCount: 0,
      requestedCount: 0,
      failedTickers: [],
      quotesRefreshedAt: prevRefreshedAt,
      ticketsJson: tickets,
    })
  }

  const quoteEntries = await Promise.all(
    uniqueTickers.map(async (sym) => [sym, await fetchYahooSpot(sym)] as const),
  )
  const quoteMap = new Map<string, number>()
  for (const [sym, px] of quoteEntries) {
    if (px !== null) quoteMap.set(sym, px)
  }

  const failedTickers = uniqueTickers.filter((sym) => !quoteMap.has(sym))

  if (quoteMap.size === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Upstream quote provider returned 0 live prices. Previous quotes preserved.',
        refreshedCount: 0,
        requestedCount,
        failedTickers,
        quotesRefreshedAt: prevRefreshedAt,
      },
      { status: 502 },
    )
  }

  const nowIso = new Date().toISOString()
  const updatedTickets = tickets.map((t) => {
    const sym = extractEquityTicker(t.symbol)
    const spot = sym ? quoteMap.get(sym) : undefined
    return spot ? reanchorTicketWithSpot(t, spot, nowIso) : t
  })

  const updated = await payload.update({
    collection: 'trade-sheets',
    id: doc.id,
    depth: 0,
    user,
    overrideAccess: false,
    data: {
      ticketsJson: updatedTickets,
      quotesRefreshedAt: nowIso,
    },
  })

  return NextResponse.json({
    ok: true,
    refreshedCount: quoteMap.size,
    requestedCount,
    failedTickers,
    quotesRefreshedAt: updated.quotesRefreshedAt,
    ticketsJson: updated.ticketsJson,
  })
}
