'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'

export function LivePreviewListener() {
  const router = useRouter()
  const serverURL =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')

  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={serverURL} />
}
