import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { TradeSheetView, type DeskSettingsSummary } from '@/components/TradeSheetView'
import type {
  TradeSheetKpi,
  TradeSheetStrategy,
  TradeTicketRow,
} from '@/lib/trade-sheets'

export const dynamic = 'force-dynamic'

export default async function TradeSheetByDatePage(props: {
  params: Promise<{ date: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { date } = await props.params
  const searchParams = await props.searchParams
  const initialTab = searchParams?.tab === 'blotter' ? 'blotter' : 'strategy'

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user || (user as { role?: string }).role !== 'admin') {
    const qs = searchParams?.tab ? `?tab=${encodeURIComponent(searchParams.tab)}` : ''
    redirect(`/admin/login?redirect=${encodeURIComponent(`/trade/${date}${qs}`)}`)
  }

  if (date === 'today' || date === 'latest') {
    const latestRes = await payload.find({
      collection: 'trade-sheets',
      user,
      overrideAccess: false,
      sort: '-sheetDate',
      limit: 1,
    })
    if (latestRes.docs.length > 0) {
      const qs = searchParams?.tab ? `?tab=${encodeURIComponent(searchParams.tab)}` : ''
      redirect(`/trade/${latestRes.docs[0].sheetDate}${qs}`)
    }
    redirect('/trade')
  }

  const [targetRes, allDatesRes, deskGlobal] = await Promise.all([
    payload.find({
      collection: 'trade-sheets',
      where: { sheetDate: { equals: date } },
      user,
      overrideAccess: false,
      limit: 1,
    }),
    payload.find({
      collection: 'trade-sheets',
      user,
      overrideAccess: false,
      sort: '-sheetDate',
      limit: 30,
    }),
    payload
      .findGlobal({
        slug: 'trade-desk-settings',
        user,
        overrideAccess: false,
      })
      .catch(() => null),
  ])

  const doc = targetRes.docs[0]
  if (!doc) {
    notFound()
  }

  const availableDates = allDatesRes.docs
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
    <TradeSheetView
      key={doc.sheetDate}
      sheetDate={doc.sheetDate}
      title={doc.title}
      subtitle={doc.subtitle}
      alertBanner={doc.alertBanner}
      kpis={(Array.isArray(doc.kpisJson) ? doc.kpisJson : []) as TradeSheetKpi[]}
      strategy={
        (doc.strategyJson &&
        typeof doc.strategyJson === 'object' &&
        !Array.isArray(doc.strategyJson)
          ? (doc.strategyJson as unknown as TradeSheetStrategy)
          : {
              headline: '',
              summaryBullets: [],
              facts: [],
              expectedResults: [],
            })
      }
      initialTickets={
        (Array.isArray(doc.ticketsJson) ? doc.ticketsJson : []) as TradeTicketRow[]
      }
      initialCheckedIds={
        (Array.isArray(doc.checkedRowIds) ? doc.checkedRowIds : []) as string[]
      }
      initialQuotesRefreshedAt={doc.quotesRefreshedAt}
      availableDates={availableDates}
      initialTab={initialTab}
      deskSettings={deskSettings}
    />
  )
}
