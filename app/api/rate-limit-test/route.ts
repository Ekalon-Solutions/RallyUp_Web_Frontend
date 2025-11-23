import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter } from '@/lib/rate-limiter'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const { allowed, remaining, resetTime } = apiRateLimiter.check(ip)
  
  if (!allowed) {
    return NextResponse.json(
      { 
        error: 'Too many requests',
        message: 'Please try again later',
        resetTime: new Date(resetTime).toISOString(),
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        }
      }
    )
  }
  
  const response = NextResponse.json({
    success: true,
    message: 'Request successful',
    rateLimit: {
      remaining,
      resetTime: new Date(resetTime).toISOString(),
    }
  })
  
  response.headers.set('X-RateLimit-Limit', '60')
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetTime.toString())
  
  return response
}
