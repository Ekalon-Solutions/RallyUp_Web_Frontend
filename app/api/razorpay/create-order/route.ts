import { NextRequest, NextResponse } from 'next/server'

const getRazorpay = async () => {
  const Razorpay = (await import('razorpay')).default
  return Razorpay
}

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, orderId, orderNumber } = await request.json()

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

    const options = {
      amount: Math.round(amount * 100),
      currency: currency.toUpperCase(),
      receipt: `rcpt_${orderId}`,
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
