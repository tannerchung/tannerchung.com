import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 50,
  })

  return (
    <div className="space-y-8">
      <div className="space-y-2 border-b border-[var(--border)] pb-6">
        <p className="font-mono-code text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Essays & Field Notes</p>
        <h1 className="font-serif-display text-4xl">Writing</h1>
      </div>
      {docs.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No published essays yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {docs.map((post) => (
            <li key={post.id} className="py-5 space-y-1.5">
              <h2 className="text-lg font-medium">{post.title}</h2>
              {post.excerpt ? <p className="text-sm text-[var(--muted)]">{post.excerpt}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
