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
  '/about',
  '/affiliations',
  '/delete-account',
  '/challenge',
  '/privacy',
  '/terms',
  '/contact',
  '/faqs',
  '/refund',
  '/child-safety',
  '/splash',
  '/clubs',
  '/merchandise',
  '/membership-plans',
  '/events',
  '/ppsa',
  '/robots.txt',
  '/sitemap.xml',
  '/site.webmanifest',
])

const STATIC_ASSET_RE =
  /\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|json|webmanifest|xml|txt|map|woff|woff2|ttf)$/i

function isStaticOrInternalPath(pathname: string): boolean {
  return (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    STATIC_ASSET_RE.test(pathname)
  )
}

// Club sites live at <slug>.<ROOT_DOMAIN> (e.g. democlub.wingman-pro.com). Unset = path URLs only (local dev).
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase()
const DNS_LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
// Pages that exist under app/clubs/[slug]; every other path on a club subdomain (login, _next, ...) is served as-is.
const CLUB_SITE_PATH_RE = /^\/(?:$|events\/|membership(?:\/|$)|refunds$|venue-switch$)/

function clubSlugFromHost(request: NextRequest): string | null {
  if (!ROOT_DOMAIN) return null
  const host = (request.headers.get('host') || '').toLowerCase()
  if (!host.endsWith(`.${ROOT_DOMAIN}`)) return null
  const slug = host.slice(0, -ROOT_DOMAIN.length - 1)
  return slug !== 'www' && DNS_LABEL_RE.test(slug) ? slug : null
}

/** /clubs/democlub/events/x on any host -> 308 to democlub.<ROOT_DOMAIN>/events/x */
function legacyClubPathRedirect(request: NextRequest): NextResponse | null {
  if (!ROOT_DOMAIN) return null
  const match = request.nextUrl.pathname.match(/^\/clubs\/([^/]+)(\/.*)?$/)
  const slug = match?.[1].toLowerCase()
  // Slugs that aren't valid DNS labels keep working on the old path until ops renames them.
  if (!slug || !DNS_LABEL_RE.test(slug)) return null
  const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '')
  const target = new URL(`${proto}://${slug}.${ROOT_DOMAIN}${match![2] || '/'}`)
  target.search = request.nextUrl.search
  return NextResponse.redirect(target, 308)
}

export function middleware(request: NextRequest) {
  const redirect = legacyClubPathRedirect(request)
  if (redirect) return redirect

  const clubSlug = clubSlugFromHost(request)
  const clubPath = clubSlug && CLUB_SITE_PATH_RE.test(request.nextUrl.pathname)
    ? `/clubs/${clubSlug}${request.nextUrl.pathname === '/' ? '' : request.nextUrl.pathname}`
    : null
  // Everything below checks the real app path; `pass()` serves the club page when on a club subdomain.
  const pathname = clubPath ?? request.nextUrl.pathname
  const pass = () => {
    if (!clubPath) return NextResponse.next()
    const url = request.nextUrl.clone()
    url.pathname = clubPath
    return NextResponse.rewrite(url)
  }

  // Public pages + static assets skip bot checks and rate limiting entirely
  if (PUBLIC_BYPASS_PATHS.has(pathname) || isStaticOrInternalPath(pathname)) {
    return pass()
  }

  if (
    request.cookies.get('verified')?.value === 'true' ||
    isAuthenticatedSession(request) ||
    request.nextUrl.searchParams.has('ssoTicket') ||
    request.nextUrl.searchParams.has('token') ||
    request.nextUrl.searchParams.has('authToken')
  ) {
    const res = applySecurityHeaders(pass(), pathname)
    if (request.nextUrl.searchParams.has('ssoTicket') || request.nextUrl.searchParams.has('token')) {
      res.cookies.set(AUTH_SESSION_COOKIE, '1', { path: '/' })
    }
    return res
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
  
  return applySecurityHeaders(pass(), pathname)
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
