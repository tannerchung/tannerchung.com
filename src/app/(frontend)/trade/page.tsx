import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { TradeSheetView } from '@/components/TradeSheetView'
import type {
  TradeSheetKpi,
  TradeSheetStrategy,
  TradeTicketRow,
} from '@/lib/trade-sheets'

export const dynamic = 'force-dynamic'

export default async function TradeDeskPage(props: {
  searchParams: Promise<{ tab?: string }>
}) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user || (user as { role?: string }).role !== 'admin') {
    redirect('/admin/login?redirect=/trade')
  }

  const searchParams = await props.searchParams
  const initialTab = searchParams?.tab === 'blotter' ? 'blotter' : 'strategy'

  const sheetsRes = await payload.find({
    collection: 'trade-sheets',
    user,
    overrideAccess: false,
    sort: '-sheetDate',
    limit: 30,
  })

  const notesRes = await payload.find({
    collection: 'trade-notes',
    user,
    overrideAccess: false,
    sort: '-updatedAt',
    limit: 20,
  })

  const latest = sheetsRes.docs[0]
  const availableDates = sheetsRes.docs
    .map((d) => d.sheetDate)
    .filter((d): d is string => typeof d === 'string')

  return (
    <div className="space-y-12">
      {latest ? (
        <TradeSheetView
          sheetDate={latest.sheetDate}
          title={latest.title}
          subtitle={latest.subtitle}
          alertBanner={latest.alertBanner}
          kpis={(Array.isArray(latest.kpisJson) ? latest.kpisJson : []) as TradeSheetKpi[]}
          strategy={
            (latest.strategyJson &&
            typeof latest.strategyJson === 'object' &&
            !Array.isArray(latest.strategyJson)
              ? (latest.strategyJson as unknown as TradeSheetStrategy)
              : {
                  headline: '',
                  summaryBullets: [],
                  facts: [],
                  expectedResults: [],
                })
          }
          initialTickets={
            (Array.isArray(latest.ticketsJson) ? latest.ticketsJson : []) as TradeTicketRow[]
          }
          initialCheckedIds={
            (Array.isArray(latest.checkedRowIds) ? latest.checkedRowIds : []) as string[]
          }
          initialQuotesRefreshedAt={latest.quotesRefreshedAt}
          availableDates={availableDates}
          initialTab={initialTab}
        />
      ) : (
        <div className="space-y-3 border-b border-[var(--border)] pb-6">
          <p className="font-mono-code text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Private · Authenticated Wealth Desk
          </p>
          <h1 className="font-serif-display text-4xl">Daily Trade Desk</h1>
          <p className="text-sm text-[var(--muted)]">
            No daily trade sheets ingested yet. Run Stockbot&apos;s publisher to populate today&apos;s
            strategy and execution blotter.
          </p>
        </div>
      )}

      {notesRes.docs.length > 0 ? (
        <section className="space-y-4 border-t border-[var(--border)] pt-8 lg:-mx-10 xl:-mx-16">
          <h2 className="font-serif-display text-2xl">Research & Thesis Notes</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {notesRes.docs.map((note) => (
              <article
                key={note.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium">{note.title}</h3>
                  {note.ticker ? (
                    <span className="font-mono-code text-xs text-[var(--muted)]">
                      {note.ticker}
                    </span>
                  ) : null}
                </div>
                {note.strategy ? (
                  <p className="text-sm text-[var(--muted)]">{note.strategy}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
