import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const getRazorpay = async () => {
  const Razorpay = (await import('razorpay')).default
  return Razorpay
}

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id } = await request.json()
    if (!razorpay_order_id) {
      return NextResponse.json(
        { success: false, error: 'Missing razorpay_order_id' },
        { status: 400 }
      )
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { success: false, error: 'Payment system not configured' },
        { status: 500 }
      )
    }

    const Razorpay = await getRazorpay()
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
    const order = await razorpay.orders.fetch(razorpay_order_id)

    let paymentItems: any[] = []
    try {
      const byOrder: any = await (razorpay.orders as any).fetchPayments(razorpay_order_id)
      paymentItems = Array.isArray(byOrder?.items) ? byOrder.items : []
    } catch {
      const all: any = await razorpay.payments.all({ count: 20 } as any)
      const raw = Array.isArray(all?.items) ? all.items : []
      paymentItems = raw.filter((payment: any) => payment.order_id === razorpay_order_id)
    }
    paymentItems = paymentItems.filter((payment: any) => payment.order_id === razorpay_order_id)

    const usable = paymentItems.find(
      (payment: any) =>
        (payment.status === 'captured' || payment.status === 'authorized') &&
        typeof payment.id === 'string' &&
        payment.id.startsWith('pay_')
    )

    if (usable) {
      const razorpay_payment_id = usable.id
      const body = razorpay_order_id + '|' + razorpay_payment_id
      const razorpay_signature = crypto
        .createHmac('sha256', keySecret)
        .update(body)
        .digest('hex')

      return NextResponse.json({
        success: true,
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
      })
    }

    const latest = paymentItems[0]
    return NextResponse.json({
      success: false,
      status: order.status,
      paymentStatus: latest?.status,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to check order',
      },
      { status: 500 }
    )
  }
}
