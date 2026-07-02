import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_SESSION_COOKIE } from '@/lib/auth-session-cookie'

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

const RATE_LIMITS = {
  default: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },
  dashboard: {
    windowMs: 60 * 1000,
    maxRequests: 400,
  },
} as const

function isBlockedUserAgent(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()
  
  if (ALLOWED_BOTS.some(bot => ua.includes(bot))) {
    return false
  }
  
  return BLOCKED_USER_AGENTS.some(blocked => ua.includes(blocked))
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

function checkRateLimit(
  ip: string,
  bucket: keyof typeof RATE_LIMITS,
): boolean {
  const { windowMs, maxRequests } = RATE_LIMITS[bucket]
  const key = `${bucket}:${ip}`
  const now = Date.now()
  const record = requestCounts.get(key)
  
  if (!record || now > record.resetTime) {
    requestCounts.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }
  
  if (record.count >= maxRequests) {
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

function isAuthenticatedSession(request: NextRequest): boolean {
  return request.cookies.get(AUTH_SESSION_COOKIE)?.value === '1'
}

function isNextJsNavigationRequest(request: NextRequest): boolean {
  return (
    request.headers.has('rsc') ||
    request.headers.has('next-router-prefetch') ||
    request.headers.get('purpose') === 'prefetch'
  )
}

function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/system-owner-login') ||
    pathname.startsWith('/admin')
  )
}

function isDashboardPath(pathname: string): boolean {
  return pathname.startsWith('/dashboard')
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

  if (
    request.cookies.get('verified')?.value === 'true' ||
    isAuthenticatedSession(request)
  ) {
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
  const ip = getClientIp(request)
  
  if (isBlockedUserAgent(userAgent)) {
    return new NextResponse('Access Denied', { status: 403 })
  }
  
  if (isProtectedPath(pathname) && isSuspiciousRequest(request)) {
    return NextResponse.redirect(new URL('/challenge', request.url))
  }

  if (!isNextJsNavigationRequest(request)) {
    const bucket = isDashboardPath(pathname) ? 'dashboard' : 'default'
    if (!checkRateLimit(ip, bucket)) {
      const retryAfterSec = Math.ceil(RATE_LIMITS[bucket].windowMs / 1000)
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
        }
      })
    }
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
