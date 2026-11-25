import React from 'react'
import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
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

export default async function TradeDeskPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>
}) {
  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers }).catch(() => ({ user: null }))

  if (!user || (user as { role?: string }).role !== 'admin') {
    redirect('/admin/login?redirect=/trade')
  }

  const sp = await searchParams
  const initialTab = normalizeTabParam(sp?.tab)

  const [latestRes, history, deskSettings] = await Promise.all([
    payload.find({
      collection: 'trade-sheets',
      user,
      overrideAccess: false,
      sort: '-sheetDate',
      limit: 1,
      depth: 1,
    }),
    loadTradeSheetHistory(payload, user),
    loadTradeDeskSettings(payload, user),
  ])

  if (latestRes.docs.length === 0) {
    return (
      <div className="min-h-screen">
        <LivePreviewListener />
        <main className="mx-auto max-w-[680px] px-6 py-24 text-center">
          <p className="font-mono-code text-[11px] uppercase tracking-[0.14em] text-[var(--color-subtle)] mb-3">
            {deskSettings?.deskLabel || 'sovereign wealth & execution desk'}
          </p>
          <h1
            className="font-serif-display text-[32px] leading-[1.15] text-[var(--color-ink)] mb-3"
            style={{ fontStyle: 'normal' }}
          >
            No Trade Sheets Published Yet
          </h1>
          <p className="text-[14px] text-[var(--color-muted)] mb-6">
            No daily execution sheet has been published yet. Publish a session briefing or create one directly in the Admin Desk.
          </p>
          <Link
            href="/admin/collections/trade-sheets"
            className="inline-flex items-center px-4 py-2 border border-[var(--color-accent)] font-mono-code text-[11px] uppercase tracking-[0.1em] text-[var(--color-accent)]"
          >
            Open Admin Desk →
          </Link>
        </main>
      </div>
    )
  }

  const latest = parseTradeSheetRecord(
    latestRes.docs[0] as unknown as Record<string, unknown>,
  )
  await enrichSheetWithPublishedTradeNotes(payload, user, latest)

  return (
    <div className="min-h-screen">
      <LivePreviewListener />
      <TradeSheetView
        key={latest.sheetDate}
        sheet={latest}
        history={history}
        deskSettings={deskSettings}
        initialTab={initialTab}
      />
    </div>
  )
}
