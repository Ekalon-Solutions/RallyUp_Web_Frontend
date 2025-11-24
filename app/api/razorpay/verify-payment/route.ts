import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const getRazorpay = async () => {
  const Razorpay = (await import('razorpay')).default
  return Razorpay
}

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay secret key not configured')
      return NextResponse.json(
        { error: 'Payment verification not configured' },
        { status: 500 }
      )
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    const isAuthentic = expectedSignature === razorpay_signature

    if (!isAuthentic) {
      console.error('Payment signature verification failed')
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    try {
      const Razorpay = await getRazorpay()
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })

      const payment = await razorpay.payments.fetch(razorpay_payment_id)
      
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
        orderId: orderId,
        paymentDetails: {
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          email: payment.email,
          contact: payment.contact,
        }
      })
    } catch (fetchError) {
      console.warn('Could not fetch payment details:', fetchError)
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
        orderId: orderId,
      })
    }
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { 
        error: 'Payment verification failed',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
