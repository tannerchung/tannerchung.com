import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'media.tannerchung.com' }],
  },
  async headers() {
    const isProd = process.env.VERCEL_ENV === 'production'
    const baseHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ]
    if (!isProd) {
      baseHeaders.push({ key: 'X-Robots-Tag', value: 'noindex, nofollow' })
    }
    const tradePreviewHeaders = [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ]
    if (!isProd) {
      tradePreviewHeaders.push({ key: 'X-Robots-Tag', value: 'noindex, nofollow' })
    }
    return [
      { source: '/:path*', headers: baseHeaders },
      { source: '/trade', headers: tradePreviewHeaders },
      { source: '/trade/:path*', headers: tradePreviewHeaders },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
