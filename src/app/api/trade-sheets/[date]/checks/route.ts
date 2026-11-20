import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  context: { params: Promise<{ date: string }> },
) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || (user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { date } = await context.params
  let body: { checkedRowIds?: unknown }
  try {
    body = (await req.json()) as { checkedRowIds?: unknown }
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const checkedRowIds = Array.isArray(body.checkedRowIds)
    ? body.checkedRowIds.filter((x): x is string => typeof x === 'string').slice(0, 200)
    : []

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

  const updated = await payload.update({
    collection: 'trade-sheets',
    id: existing.docs[0].id,
    user,
    overrideAccess: false,
    data: { checkedRowIds },
  })

  return NextResponse.json({
    ok: true,
    checkedRowIds: updated.checkedRowIds,
  })
}
