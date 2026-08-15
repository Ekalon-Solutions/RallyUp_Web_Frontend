import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function firstValue(value: string | null | undefined): string {
  return typeof value === 'string' ? value : ''
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isPaidCallback(paymentId: string, signature: string): boolean {
  return paymentId.startsWith('pay_') && signature.length >= 32
}

function incompletePaymentHtml(): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Wingman Pro — Payment not completed</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f0f2f5; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:20px; }
  .card { background:#fff; border-radius:16px; padding:40px 32px; max-width:360px; text-align:center; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
  h1 { font-size:20px; color:#142175; margin:0 0 8px; }
  p { font-size:14px; color:#555; line-height:1.5; }
</style>
</head>
<body>
<div class="card">
  <h1>Payment not completed</h1>
  <p>No payment was received. You can close this window and return to the app to try again.</p>
</div>
</body>
</html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    }
  )
}

function paidCallbackResponse(params: {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}): NextResponse {
  const appUrl =
    `wingmanpro://razorpay-callback` +
    `?razorpay_payment_id=${encodeURIComponent(params.razorpay_payment_id)}` +
    `&razorpay_order_id=${encodeURIComponent(params.razorpay_order_id)}` +
    `&razorpay_signature=${encodeURIComponent(params.razorpay_signature)}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="refresh" content="0; url=${escapeHtml(appUrl)}">
<title>Wingman Pro — Payment Successful</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: #f0f2f5;
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh; padding: 20px;
  }
  .card {
    background: #fff; border-radius: 16px; padding: 40px 32px;
    max-width: 360px; width: 100%; text-align: center;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  }
  h1 { font-size: 20px; color: #142175; margin-bottom: 8px; font-weight: 700; }
  p { font-size: 14px; color: #555; line-height: 1.5; }
  .spinner {
    width: 32px; height: 32px; margin: 24px auto 0;
    border: 3px solid #e0e0e0; border-top-color: #142175;
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .btn {
    display: inline-block; margin-top: 20px; padding: 12px 24px;
    background: #142175; color: #fff; text-decoration: none;
    border-radius: 8px; font-size: 14px; font-weight: 600;
  }
</style>
</head>
<body>
<div class="card">
  <h1>Payment Successful</h1>
  <p>Redirecting you back to<br><strong>Wingman Pro</strong>...</p>
  <div class="spinner"></div>
  <a class="btn" href="${escapeHtml(appUrl)}">Return to App</a>
</div>
<script>window.location.replace(${JSON.stringify(appUrl)});</script>
</body>
</html>`

  return new NextResponse(html, {
    status: 302,
    headers: {
      Location: appUrl,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function fromParams(paymentId: string, orderId: string, signature: string): NextResponse {
  if (!isPaidCallback(paymentId, signature)) return incompletePaymentHtml()
  return paidCallbackResponse({
    razorpay_payment_id: paymentId,
    razorpay_order_id: orderId,
    razorpay_signature: signature,
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  return fromParams(
    firstValue(searchParams.get('razorpay_payment_id')),
    firstValue(searchParams.get('razorpay_order_id')),
    firstValue(searchParams.get('razorpay_signature'))
  )
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''
  let body: Record<string, string> = {}

  try {
    if (contentType.includes('application/json')) {
      body = (await request.json()) as Record<string, string>
    } else {
      const form = await request.formData()
      form.forEach((value, key) => {
        if (typeof value === 'string') body[key] = value
      })
    }
  } catch {
    body = {}
  }

  const { searchParams } = request.nextUrl
  return fromParams(
    firstValue(searchParams.get('razorpay_payment_id') || body.razorpay_payment_id),
    firstValue(searchParams.get('razorpay_order_id') || body.razorpay_order_id),
    firstValue(searchParams.get('razorpay_signature') || body.razorpay_signature)
  )
}
