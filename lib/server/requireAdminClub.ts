import 'server-only'

import type { NextRequest } from 'next/server'
import { getApiUrl } from '@/lib/config'

export async function isAuthorizedClubAdmin(request: NextRequest, clubId: unknown): Promise<boolean> {
  const authorization = request.headers.get('authorization')
  const normalizedClubId = typeof clubId === 'string' ? clubId.trim() : ''
  if (!authorization?.startsWith('Bearer ') || !/^[a-f0-9]{24}$/i.test(normalizedClubId)) return false

  try {
    const response = await fetch(
      getApiUrl(`/admin/authorize-club/${encodeURIComponent(normalizedClubId)}`),
      { headers: { Authorization: authorization }, cache: 'no-store' },
    )
    return response.ok
  } catch {
    return false
  }
}

