import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { buildConfig, type Plugin } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import sharp from 'sharp'

import { Users } from '@/collections/Users'
import { Media } from '@/collections/Media'
import { Projects, Posts, Experiments, TradeNotes } from '@/collections/Content'
import { TradeSheets } from '@/collections/TradeSheets'
import { SiteSettings } from '@/globals/SiteSettings'
import { TradeDeskSettings } from '@/globals/TradeDeskSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: [path.resolve(dirname, '../.env.local'), path.resolve(dirname, '../.env')] })

function resolveDatabaseUri(): string | undefined {
  const isMigrateCli = process.argv.some((arg) => arg.includes('migrate'))
  const rawUri =
    process.env.DATABASE_URI ||
    (isMigrateCli ? process.env.POSTGRES_URL_NON_POOLING : undefined) ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  if (!rawUri) return rawUri
  try {
    const parsed = new URL(rawUri)
    if (parsed.hostname.endsWith('.pooler.supabase.com') && parsed.port === '5432' && !isMigrateCli) {
      parsed.port = '6543'
    }
    if (parsed.hostname.endsWith('.pooler.supabase.com') && parsed.port === '6543' && isMigrateCli) {
      parsed.port = '5432'
    }
    if (
      parsed.hostname.endsWith('.supabase.com') &&
      parsed.searchParams.get('sslmode') === 'require' &&
      !parsed.searchParams.has('uselibpqcompat')
    ) {
      parsed.searchParams.set('uselibpqcompat', 'true')
    }
    return parsed.toString()
  } catch {
    return rawUri
  }
}

const r2Configured = Boolean(
  process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY,
)

const plugins: Plugin[] = [
  seoPlugin({
    uploadsCollection: 'media',
    collections: ['projects', 'posts'],
  }),
  mcpPlugin({
    collections: {
      projects: { enabled: true },
      posts: { enabled: true },
      experiments: { enabled: true },
      'trade-notes': { enabled: true },
      'trade-sheets': { enabled: true },
    },
    globals: {
      'site-settings': { enabled: true },
      'trade-desk-settings': { enabled: true },
    },
  }),
]

if (r2Configured) {
  plugins.unshift(
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
          generateFileURL: ({ filename: fileName, prefix }) => {
            const base = process.env.R2_PUBLIC_URL || 'https://media.tannerchung.com'
            return `${base}/${prefix ? `${prefix}/` : ''}${fileName}`
          },
        },
      },
      bucket: process.env.R2_BUCKET || 'tannerchung-media',
      clientUploads: true,
      config: {
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        region: 'auto',
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  )
}

export default buildConfig({
  serverURL:
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  secret: process.env.PAYLOAD_SECRET || 'dev-only-secret-override-in-env',
  sharp,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' — tannerchung.com' },
  },
  editor: lexicalEditor(),
  db: postgresAdapter({
    idType: 'uuid',
    schemaName: 'payload',
    push: false,
    pool: {
      connectionString: resolveDatabaseUri(),
      max: process.env.VERCEL ? 2 : 5,
      idleTimeoutMillis: 10000,
    },
  }),
  collections: [Users, Media, Projects, Posts, Experiments, TradeNotes, TradeSheets],
  globals: [SiteSettings, TradeDeskSettings],
  plugins,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
