import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    await payload.find({ collection: 'projects', limit: 1 })
    return NextResponse.json({
      ok: true,
      env: process.env.VERCEL_ENV || 'development',
      r2Bucket: process.env.R2_BUCKET || 'tannerchung-media',
      r2Configured: Boolean(
        process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY,
      ),
      turnstileConfigured: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'db check failed' },
      { status: 500 },
    )
  }
}
