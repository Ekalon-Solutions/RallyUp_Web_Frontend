import { NextRequest, NextResponse } from 'next/server'
import { getApiUrl } from '@/lib/config'

/**
 * Presentment (USD/EUR/GBP vs INR fallback) lives on the backend create-order
 * handler so web and mobile charge the same way. This route forwards the body
 * and the caller's auth header.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get('authorization')
    const backendRes = await fetch(getApiUrl('/razorpay/create-order'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    })
    const payload = await backendRes.json().catch(() => ({ error: 'Failed to create payment order' }))
    return NextResponse.json(payload, { status: backendRes.status })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to create payment order',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
