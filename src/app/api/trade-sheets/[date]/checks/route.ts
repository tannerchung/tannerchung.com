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
  let body: { checkedRowIds?: unknown; rowId?: unknown; checked?: unknown }
  try {
    body = (await req.json()) as { checkedRowIds?: unknown; rowId?: unknown; checked?: unknown }
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const hasAtomicToggle =
    typeof body.rowId === 'string' &&
    body.rowId.trim().length > 0 &&
    typeof body.checked === 'boolean'
  const hasFullList = Array.isArray(body.checkedRowIds)

  if (!hasAtomicToggle && !hasFullList) {
    return NextResponse.json(
      { ok: false, error: 'Provide either { rowId, checked } or { checkedRowIds: string[] }' },
      { status: 400 },
    )
  }

  const existing = await payload.find({
    collection: 'trade-sheets',
    where: { sheetDate: { equals: date } },
    limit: 1,
    depth: 0,
    select: {
      checkedRowIds: true,
    },
    user,
    overrideAccess: false,
  })

  if (existing.docs.length === 0) {
    return NextResponse.json({ ok: false, error: 'Sheet not found' }, { status: 404 })
  }

  let nextCheckedRowIds: string[]
  if (hasAtomicToggle) {
    const targetRowId = String(body.rowId).trim()
    const currentRaw = existing.docs[0].checkedRowIds
    const currentIds = Array.isArray(currentRaw)
      ? currentRaw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      : []
    const nextSet = new Set(currentIds)
    if (body.checked) {
      nextSet.add(targetRowId)
    } else {
      nextSet.delete(targetRowId)
    }
    nextCheckedRowIds = Array.from(nextSet).slice(0, 200)
  } else {
    nextCheckedRowIds = Array.from(
      new Set(
        (body.checkedRowIds as unknown[])
          .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
          .map((x) => x.trim()),
      ),
    ).slice(0, 200)
  }

  const updated = await payload.update({
    collection: 'trade-sheets',
    id: existing.docs[0].id,
    depth: 0,
    user,
    overrideAccess: false,
    data: { checkedRowIds: nextCheckedRowIds },
  })

  return NextResponse.json({
    ok: true,
    checkedRowIds: updated.checkedRowIds,
  })
}
