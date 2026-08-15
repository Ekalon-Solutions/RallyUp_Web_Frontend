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

function buildCallbackResponse(params: {
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
  .icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: #142175; display: flex; align-items: center;
    justify-content: center; margin: 0 auto 20px;
  }
  .icon svg { width: 32px; height: 32px; fill: #fff; }
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
  <div class="icon">
    <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
  </div>
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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  return buildCallbackResponse({
    razorpay_payment_id: firstValue(searchParams.get('razorpay_payment_id')),
    razorpay_order_id: firstValue(searchParams.get('razorpay_order_id')),
    razorpay_signature: firstValue(searchParams.get('razorpay_signature')),
  })
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
  return buildCallbackResponse({
    razorpay_payment_id: firstValue(
      searchParams.get('razorpay_payment_id') || body.razorpay_payment_id
    ),
    razorpay_order_id: firstValue(
      searchParams.get('razorpay_order_id') || body.razorpay_order_id
    ),
    razorpay_signature: firstValue(
      searchParams.get('razorpay_signature') || body.razorpay_signature
    ),
  })
}
