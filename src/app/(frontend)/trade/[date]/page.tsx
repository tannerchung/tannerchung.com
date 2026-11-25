import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { parseTradeSheetRecord } from '@/lib/trade-sheets'
import {
  enrichSheetWithPublishedTradeNotes,
  loadTradeDeskSettings,
  loadTradeSheetHistory,
  normalizeTabParam,
} from '@/lib/trade-desk-loader'
import { TradeSheetView } from '@/components/TradeSheetView'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export const dynamic = 'force-dynamic'

export default async function TradeSheetDatePage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>
  searchParams: Promise<{ tab?: string | string[] }>
}) {
  const { date } = await params
  const sp = await searchParams
  const initialTab = normalizeTabParam(sp?.tab)
  const tabQuery = initialTab ? `?tab=${encodeURIComponent(initialTab)}` : ''

  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers }).catch(() => ({ user: null }))

  if (!user || (user as { role?: string }).role !== 'admin') {
    redirect(`/admin/login?redirect=${encodeURIComponent(`/trade/${date}${tabQuery}`)}`)
  }

  if (date === 'today' || date === 'latest') {
    const latestRes = await payload.find({
      collection: 'trade-sheets',
      user,
      overrideAccess: false,
      sort: '-sheetDate',
      limit: 1,
      depth: 0,
      select: {
        sheetDate: true,
      },
    })
    if (latestRes.docs.length > 0 && typeof latestRes.docs[0].sheetDate === 'string') {
      redirect(`/trade/${latestRes.docs[0].sheetDate}${tabQuery}`)
    }
    redirect(`/trade${tabQuery}`)
  }

  const [targetRes, history, deskSettings] = await Promise.all([
    payload.find({
      collection: 'trade-sheets',
      user,
      overrideAccess: false,
      where: { sheetDate: { equals: date } },
      limit: 1,
      depth: 1,
    }),
    loadTradeSheetHistory(payload, user),
    loadTradeDeskSettings(payload, user),
  ])

  if (targetRes.docs.length === 0) {
    notFound()
  }

  const sheet = parseTradeSheetRecord(
    targetRes.docs[0] as unknown as Record<string, unknown>,
  )
  await enrichSheetWithPublishedTradeNotes(payload, user, sheet)

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
