import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = await request.json()

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      return NextResponse.json({ error: 'Payment verification not configured' }, { status: 500 })
    }

    // Razorpay subscription signature: HMAC-SHA256(payment_id + "|" + subscription_id)
    const body = `${razorpay_payment_id}|${razorpay_subscription_id}`
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
      subscriptionId: razorpay_subscription_id,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 })
  }
}
