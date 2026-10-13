import { NextRequest, NextResponse } from 'next/server'
import { getApiUrl } from '@/lib/config'

/**
 * The backend created the Razorpay order, so only its secret can verify the
 * signature. Forward to it (same pattern as create-order) instead of checking
 * with this deployment's own key, which may belong to a different account.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authHeader = request.headers.get('authorization')
    const backendRes = await fetch(getApiUrl('/razorpay/verify-payment'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    })
    const payload = await backendRes.json().catch(() => ({ error: 'Payment verification failed' }))
    return NextResponse.json(payload, { status: backendRes.status })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Payment verification failed', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
