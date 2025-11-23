import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BLOCKED_USER_AGENTS = [
  'wget',
  'curl',
  'python-requests',
  'scrapy',
  'beautifulsoup',
  'selenium',
  'playwright',
  'puppeteer',
  'phantomjs',
  'headless',
  'bot',
  'crawler',
  'spider',
  'scraper',
  'axios',
  'node-fetch',
  'got',
  'httpx',
  'aiohttp',
]

const ALLOWED_BOTS = [
  'googlebot',
  'bingbot',
  'slackbot',
  'twitterbot',
  'facebookexternalhit',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
]

const requestCounts = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = {
  windowMs: 60 * 1000,
  maxRequests: 100,
}

function isBlockedUserAgent(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()
  
  if (ALLOWED_BOTS.some(bot => ua.includes(bot))) {
    return false
  }
  
  return BLOCKED_USER_AGENTS.some(blocked => ua.includes(blocked))
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = requestCounts.get(ip)
  
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    })
    return true
  }
  
  if (record.count >= RATE_LIMIT.maxRequests) {
    return false
  }
  
  record.count++
  return true
}

function hasValidBrowserHeaders(request: NextRequest): boolean {
  const headers = request.headers
  
  const hasAcceptLanguage = headers.has('accept-language')
  const hasAcceptEncoding = headers.has('accept-encoding')
  const hasAccept = headers.has('accept')
  const hasDnt = headers.has('dnt') || headers.has('sec-fetch-site')
  
  return hasAcceptLanguage && hasAcceptEncoding && hasAccept
}

function isSuspiciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  
  if (!userAgent) {
    return true
  }
  
  if (userAgent.includes('HeadlessChrome') || userAgent.includes('Headless')) {
    return true
  }
  
  if (userAgent.length < 20) {
    return true
  }
  
  if (!hasValidBrowserHeaders(request)) {
    return true
  }
  
  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next()
  }
  
  const userAgent = request.headers.get('user-agent') || ''
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  if (isBlockedUserAgent(userAgent)) {
    console.log(`🚫 Blocked scraping tool: ${userAgent} from ${ip}`)
    return new NextResponse('Access Denied', { status: 403 })
  }
  
  if (isSuspiciousRequest(request)) {
    console.log(`⚠️ Suspicious request detected: ${userAgent} from ${ip}`)
    return NextResponse.redirect(new URL('/challenge', request.url))
  }
  
  if (!checkRateLimit(ip)) {
    console.log(`🚨 Rate limit exceeded for ${ip}`)
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60',
      }
    })
  }
  
  const response = NextResponse.next()
  
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
