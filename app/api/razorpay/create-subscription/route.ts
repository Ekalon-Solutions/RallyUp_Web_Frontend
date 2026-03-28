import { NextRequest, NextResponse } from 'next/server'

const TOTAL_COUNT: Record<string, number> = {
  monthly: 120,   // 10 years
  quarterly: 40,  // 10 years
  annual: 10,     // 10 years
}

export async function POST(request: NextRequest) {
  try {
    const { planId, billingCycle, clubId, storageGb } = await request.json()

    if (!planId || !billingCycle) {
      return NextResponse.json({ error: 'planId and billingCycle are required' }, { status: 400 })
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay credentials not configured' }, { status: 500 })
    }

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const body = {
      plan_id: planId,
      total_count: TOTAL_COUNT[billingCycle] ?? 120,
      quantity: 1,
      notes: {
        storageGb: String(storageGb ?? ''),
        billingCycle,
        clubId: clubId ?? '',
      },
    }

    const response = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json(
        { error: err?.error?.description || 'Failed to create subscription' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ subscriptionId: data.id, status: data.status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create subscription' }, { status: 500 })
  }
}
