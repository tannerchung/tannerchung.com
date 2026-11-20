import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'projects',
    where: { _status: { equals: 'published' } },
    limit: 50,
  })

  return (
    <div className="space-y-8">
      <div className="space-y-2 border-b border-[var(--border)] pb-6">
        <p className="font-mono-code text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Index</p>
        <h1 className="font-serif-display text-4xl">Projects</h1>
      </div>
      {docs.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No published projects yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {docs.map((project) => (
            <article key={project.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-medium">{project.title}</h2>
                {project.statusLabel ? (
                  <span className="font-mono-code text-xs text-[var(--muted)]">{project.statusLabel}</span>
                ) : null}
              </div>
              <p className="text-sm text-[var(--muted)]">{project.summary}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
