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

/** Only apply challenge redirect on authenticated/app areas — not the public marketing site. */
function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/system-owner-login') ||
    pathname.startsWith('/admin')
  )
}

const PUBLIC_BYPASS_PATHS = new Set([
  '/',
  '/delete-account',
  '/challenge',
  '/privacy',
  '/terms',
  '/contact',
  '/refund',
  '/child-safety',
  '/login',
  '/register',
  '/splash',
  '/clubs',
  '/merchandise',
  '/membership-plans',
  '/robots.txt',
  '/sitemap.xml',
])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_BYPASS_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  if (request.cookies.get('verified')?.value === 'true') {
    return applySecurityHeaders(NextResponse.next(), pathname)
  }
  
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
    return new NextResponse('Access Denied', { status: 403 })
  }
  
  if (isProtectedPath(pathname) && isSuspiciousRequest(request)) {
    return NextResponse.redirect(new URL('/challenge', request.url))
  }
  
  if (!checkRateLimit(ip)) {
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60',
      }
    })
  }
  
  return applySecurityHeaders(NextResponse.next(), pathname)
}

function cameraPermissionsPolicy(pathname: string): string {
  if (
    pathname.startsWith('/dashboard/events/scanner') ||
    pathname.startsWith('/dashboard/quick-scanner') ||
    pathname.startsWith('/vendor/login') ||
    pathname.startsWith('/vendor/onboarding')
  ) {
    return 'camera=(self), geolocation=(self)'
  }
  return 'camera=()'
}

function applySecurityHeaders(response: NextResponse, pathname = '') {
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    `${cameraPermissionsPolicy(pathname)}, microphone=(), interest-cohort=()`
  )
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
