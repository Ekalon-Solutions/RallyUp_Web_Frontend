import { NextRequest, NextResponse } from 'next/server'

const getRazorpay = async () => {
  const Razorpay = (await import('razorpay')).default
  return Razorpay
}

export async function GET(request: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

    // console.log('Environment variables check:', {
//       hasKeyId: !!keyId,
//       hasKeySecret: !!keySecret,
//       hasPublicKeyId: !!publicKeyId,
//       keyIdPrefix: keyId?.substring(0, 8),
//       publicKeyIdPrefix: publicKeyId?.substring(0, 8)
    })

    if (!keyId || !keySecret) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured',
        details: {
          RAZORPAY_KEY_ID: !!keyId,
          RAZORPAY_KEY_SECRET: !!keySecret,
          NEXT_PUBLIC_RAZORPAY_KEY_ID: !!publicKeyId
        }
      })
    }

    const Razorpay = await getRazorpay()
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    return NextResponse.json({
      success: true,
      message: 'Razorpay configuration is valid',
      details: {
        keyIdPrefix: keyId.substring(0, 8),
        razorpayInitialized: true
      }
    })
  } catch (error: any) {
    // console.error('Razorpay test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
