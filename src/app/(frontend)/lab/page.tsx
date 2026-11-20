import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export default async function LabPage() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'experiments',
    where: {
      and: [{ _status: { equals: 'published' } }, { visibility: { equals: 'public' } }],
    },
    limit: 50,
  })

  return (
    <div className="space-y-8">
      <div className="space-y-2 border-b border-[var(--border)] pb-6">
        <p className="font-mono-code text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Sandbox</p>
        <h1 className="font-serif-display text-4xl">Lab & Experiments</h1>
      </div>
      {docs.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No public experiments published yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {docs.map((exp) => (
            <div key={exp.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-medium">{exp.title}</h2>
                <span className="font-mono-code text-xs text-[var(--muted)]">{exp.category}</span>
              </div>
              <p className="font-mono-code text-xs text-[var(--muted)]">key: {exp.componentKey}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
