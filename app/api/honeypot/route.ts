import { NextRequest, NextResponse } from 'next/server'


export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // console.error('🍯 HONEYPOT TRIGGERED!', {
//     ip,
//     userAgent,
//     timestamp: new Date().toISOString(),
//     url: request.url,
//     headers: Object.fromEntries(request.headers.entries()),
//   })
  
  return NextResponse.json({
    success: false,
    message: 'This endpoint is for monitoring purposes only',
    data: Array.from({ length: 1000 }, (_, i) => ({
      id: `fake-${i}`,
      value: Math.random().toString(36),
    })),
  })
}

export async function POST(request: NextRequest) {
  return GET(request)
}
