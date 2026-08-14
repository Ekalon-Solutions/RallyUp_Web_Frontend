import { NextRequest, NextResponse } from 'next/server'
import { getApiUrl } from '@/lib/config'

/** Convert major currency units to the smallest unit using round-half-to-even. */
function bankRoundToSmallestUnit(amount: number): number {
  const scaled = amount * 100
  const lower = Math.floor(scaled)
  const fraction = scaled - lower
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(scaled)) * 4

  if (fraction < 0.5 - tolerance) return lower
  if (fraction > 0.5 + tolerance) return lower + 1
  return lower % 2 === 0 ? lower : lower + 1
}

const getRazorpay = async () => {
  const Razorpay = (await import('razorpay')).default
  return Razorpay
}

// A merchandise order id is a real Mongo ObjectId; event/membership purchases
// pass a synthetic string instead (no persisted record exists yet at this
// point in their flow). Only merchandise orders can be cross-checked here.
const isMongoObjectId = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value)

export async function POST(request: NextRequest) {
  try {
    let { amount, currency, orderId, orderNumber } = await request.json()

    // console.log('Create order request:', { amount, currency, orderId, orderNumber })

    if (currency == null || currency === '' || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { error: 'Amount must be a number greater than or equal to 0' },
        { status: 400 }
      )
    }
    if (amount === 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0 to create a payment order' },
        { status: 400 }
      )
    }

    // For a real merchandise order, don't trust the client-computed amount —
    // look up what the order actually costs and charge that instead. This is
    // what stops a tampered-low amount from getting a validly-signed payment.
    // The lookup works for guest checkout too (no Authorization header) since
    // the backend only exposes the amount, not the rest of the order, for an
    // order with no logged-in owner on file.
    if (isMongoObjectId(orderId)) {
      const authHeader = request.headers.get('authorization')
      const orderRes = await fetch(getApiUrl(`/orders/${orderId}/payable-amount`), {
        headers: authHeader ? { Authorization: authHeader } : undefined,
      })
      const orderBody = await orderRes.json().catch(() => null)
      if (!orderRes.ok || !orderBody?.success || typeof orderBody?.data?.finalAmount !== 'number') {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      amount = orderBody.data.finalAmount
      currency = orderBody.data.currency || currency
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    // console.log('Environment check:', {
    //   hasKeyId: !!keyId,
    //   hasKeySecret: !!keySecret,
    //   keyIdPrefix: keyId?.substring(0, 8)
    // })

    if (!keyId || !keySecret) {
      // console.error('Razorpay credentials not configured')
      return NextResponse.json(
        { error: 'Payment system not configured. Please check environment variables.' },
        { status: 500 }
      )
    }

    const Razorpay = await getRazorpay()
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    // Razorpay receipt field has a max length of 40 characters
    const receiptRaw = `rcpt_${(orderNumber ?? orderId).toString().replace(/[^a-zA-Z0-9-_]/g, '')}`
    const receipt = receiptRaw.length > 40 ? receiptRaw.slice(0, 40) : receiptRaw

    const options = {
      amount: bankRoundToSmallestUnit(amount),
      currency: currency.toUpperCase(),
      receipt,
      notes: {
        orderId: orderId,
        orderNumber: orderNumber,
      },
    }

    // console.log('Creating Razorpay order with options:', options)

    const razorpayOrder = await razorpay.orders.create(options)

    // console.log('Razorpay order created successfully:', razorpayOrder.id)

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    })
  } catch (error: any) {
    // console.error('Razorpay order creation error:', {
//       message: error.message,
//       statusCode: error.statusCode,
//       error: error.error,
//       stack: error.stack
//     })
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment order',
        details: error.message || 'Unknown error',
        razorpayError: error.error?.description || null
      },
      { status: 500 }
    )
  }
}
