import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { TradeSheetView, type DeskSettingsSummary } from '@/components/TradeSheetView'
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

  const [sheetsRes, notesRes, deskGlobal] = await Promise.all([
    payload.find({
      collection: 'trade-sheets',
      user,
      overrideAccess: false,
      sort: '-sheetDate',
      limit: 30,
    }),
    payload.find({
      collection: 'trade-notes',
      user,
      overrideAccess: false,
      sort: '-updatedAt',
      limit: 20,
    }),
    payload
      .findGlobal({
        slug: 'trade-desk-settings',
        user,
        overrideAccess: false,
      })
      .catch(() => null),
  ])

  const latest = sheetsRes.docs[0]
  const availableDates = sheetsRes.docs
    .map((d) => d.sheetDate)
    .filter((d): d is string => typeof d === 'string')

  const deskSettings: DeskSettingsSummary | undefined = deskGlobal
    ? {
        cashFloorTarget: deskGlobal.cashFloorTarget,
        maxOptionSpreadPct: deskGlobal.maxOptionSpreadPct,
        taxShieldReadout: deskGlobal.taxShieldReadout,
        washSaleBlackoutThrough: deskGlobal.washSaleBlackoutThrough,
        washSaleTickers: deskGlobal.washSaleTickers,
      }
    : undefined

  return (
    <div className="space-y-12">
      {latest ? (
        <TradeSheetView
          key={latest.sheetDate}
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
          deskSettings={deskSettings}
        />
      ) : (
        <div className="lumen-card rounded-xl p-8 space-y-3">
          <p className="lumen-eyebrow">01 · PRIVATE EXECUTION APPARATUS</p>
          <h1 className="lumen-headline text-4xl">
            daily desk ready to <em className="lumen-landmark">ingest</em>
          </h1>
          <p className="text-sm text-[var(--color-muted)] lowercase">
            no daily trade sheets ingested yet. run stockbot&apos;s publisher to populate today&apos;s
            strategy and execution blotter.
          </p>
        </div>
      )}

      {notesRes.docs.length > 0 ? (
        <section className="space-y-4 border-t border-[var(--color-rule)] pt-8">
          <p className="lumen-eyebrow">05 · STANDING RESEARCH MEMOS</p>
          <h2 className="lumen-headline text-2xl sm:text-3xl">
            conviction &amp; <em className="lumen-landmark">track</em> notes
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {notesRes.docs.map((note) => (
              <article key={note.id} className="lumen-card rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium text-[var(--color-ink)]">{note.title}</h3>
                  {note.ticker ? (
                    <span className="font-mono-code text-xs text-[var(--color-accent)]">
                      {note.ticker}
                    </span>
                  ) : null}
                </div>
                {note.strategy ? (
                  <p className="text-sm text-[var(--color-muted)]">{note.strategy}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
