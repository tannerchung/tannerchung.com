import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let projects: Array<{ id: string; title: string; slug: string; summary: string; statusLabel?: string | null }> = []
  let posts: Array<{ id: string; title: string; slug: string; excerpt?: string | null; publishedAt?: string | null }> = []

  try {
    const payload = await getPayload({ config })
    const [projRes, postRes] = await Promise.all([
      payload.find({ collection: 'projects', where: { _status: { equals: 'published' } }, limit: 6 }),
      payload.find({ collection: 'posts', where: { _status: { equals: 'published' } }, sort: '-publishedAt', limit: 4 }),
    ])
    projects = projRes.docs
    posts = postRes.docs
  } catch {
    // Graceful render before initial content seed
  }

  return (
    <div className="space-y-16">
      <section className="space-y-5 max-w-2xl">
        <p className="font-mono-code text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          Field Engineering · Applied AI · Market Systems
        </p>
        <h1 className="font-serif-display text-4xl sm:text-5xl leading-[1.08] tracking-tight">
          Building high-leverage knowledge systems, agentic tools, and disciplined capital workflows.
        </h1>
        <p className="text-[var(--muted)] text-base leading-relaxed">
          Personal workspace, technical notes, shipped builds, and interactive experiments by Tanner Chung.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-3">
          <h2 className="font-mono-code text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Selected Projects
          </h2>
          <Link href="/projects" className="text-xs font-mono-code text-[var(--muted)] hover:text-[var(--ink)]">
            All →
          </Link>
        </div>
        {projects.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            CMS initialized. Publish projects from{' '}
            <Link href="/admin" className="underline underline-offset-4 text-[var(--ink)]">
              /admin
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <div key={p.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-[var(--ink)]">{p.title}</h3>
                  {p.statusLabel ? (
                    <span className="font-mono-code text-[11px] text-[var(--muted)]">{p.statusLabel}</span>
                  ) : null}
                </div>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{p.summary}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-3">
          <h2 className="font-mono-code text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Recent Writing
          </h2>
          <Link href="/blog" className="text-xs font-mono-code text-[var(--muted)] hover:text-[var(--ink)]">
            Archive →
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No published essays yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {posts.map((post) => (
              <li key={post.id} className="py-4 flex flex-col gap-1">
                <span className="font-medium text-[var(--ink)]">{post.title}</span>
                {post.excerpt ? <span className="text-sm text-[var(--muted)]">{post.excerpt}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
