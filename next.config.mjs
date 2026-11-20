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
    return [{ source: '/:path*', headers: baseHeaders }]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
