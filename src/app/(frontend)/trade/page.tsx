import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export default async function TradeDeskPage() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user || (user as { role?: string }).role !== 'admin') {
    redirect('/admin/login?redirect=/trade')
  }

  const { docs } = await payload.find({
    collection: 'trade-notes',
    user,
    overrideAccess: false,
    limit: 50,
  })

  return (
    <div className="space-y-8">
      <div className="space-y-2 border-b border-[var(--border)] pb-6">
        <p className="font-mono-code text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
          Private · Authenticated Desk
        </p>
        <h1 className="font-serif-display text-4xl">Trade & Options Notes</h1>
      </div>
      {docs.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No trade notes logged yet.</p>
      ) : (
        <div className="space-y-4">
          {docs.map((note) => (
            <article key={note.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-medium">{note.title}</h2>
                {note.ticker ? (
                  <span className="font-mono-code text-xs text-[var(--muted)]">{note.ticker}</span>
                ) : null}
              </div>
              {note.strategy ? <p className="text-sm text-[var(--muted)]">{note.strategy}</p> : null}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
