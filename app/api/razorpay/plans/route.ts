import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay credentials not configured' }, { status: 500 })
    }

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const response = await fetch('https://api.razorpay.com/v1/plans?count=100', {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json({ error: err?.error?.description || 'Failed to fetch plans' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ plans: data.items ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch plans' }, { status: 500 })
  }
}
