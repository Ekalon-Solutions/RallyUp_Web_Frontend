# Security, Bot Mitigation & Request Middleware

This feature implements strict request filtering, user agent blocking, and rate limiting rules at the Next.js edge router layer to shield the club admin panels, ticketing endpoints, and payment workflows.

## 1. Concept & Middleware Orchestration
RallyUp employs an edge-level middleware that inspects each incoming HTTP request for standard botanical or crawler footprints before resolving Next.js bundle logic or dashboard pages.

- **Public vs protected paths**: Public pages are bypassed. Admin dashboards (`/dashboard`) undergo strict browser header and fingerprint inspections. Authentication state never bypasses throttling.
- **Bot Mitigation**: Blocks known non-browser user agents (e.g. `python-requests`, `selenium`, `puppeteer`, `curl`) but whitelists standard search crawlers (e.g. `googlebot`, `whatsapp`) for metadata previews.

## 2. Key Files & Logic
- **Routing & Validation**:
- `middleware.ts`: Orchestrates all middleware policies. Uses the shared Upstash Redis counter and appends secure headers to the response context.
- **Verification Portal**:
- `app/challenge/page.tsx` + `app/api/challenge/route.ts`: Uses a server-signed arithmetic challenge and sets an HttpOnly HMAC-signed verification cookie after a correct answer.

## 3. Middleware Handlers & Validation Flows
1. **Public Paths Bypass**: Bypasses marketing/legal pages and static probes (e.g., `/`, `/about`, `/login`, `/privacy`, `/site.webmanifest`, `/sitemap.xml`) before any bot or rate-limit logic.
2. **Static Asset Bypass**: Paths under `/api/`, `/_next/`, `/static/`, and common static extensions (including `.json`, `.webmanifest`, fonts, images) skip middleware checks entirely.
3. **Cookie Inspection**: A valid, unexpired HMAC `verified` cookie skips only bot/challenge checks. Client-written values, auth marker cookies, and token-shaped query parameters grant no bypass.
4. **User Agent Audit**: Runs regex check using `isBlockedUserAgent(...)`. Rejects scrapers with `403 Access Denied`.
5. **Header Validation (`hasValidBrowserHeaders`)**: Checks for standard browser request metadata (`accept-language`, `accept-encoding`, `accept`). Refusing requests from customized scripted headers to `/dashboard`.
6. **IP Rate Limiter (`checkRateLimit`)**: Uses an atomic Redis Lua counter shared by all instances. It enforces 100 requests/minute generally and 400 requests/minute for dashboard traffic; Next.js RSC/prefetch navigations are excluded.
7. **Device Policy Injection**: Sets custom security frame headers, XSS protections, and dynamically adjusts the browser `Permissions-Policy` (e.g. restricts camera access to `/dashboard/events/scanner` only).

## 4. Gotchas & Edge Cases
- **Required secrets/services**: Production requires `CHALLENGE_COOKIE_SECRET`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`. Missing Redis configuration fails closed on protected traffic.
- **Static probes must stay bypassed**: Assets like `/site.webmanifest` should remain outside the rate-limit bucket to avoid browser `429`s during normal page loads.
- **Suspicious Request Redirects**: Legitimate developer testing using `curl` or automated testing scripts (Playwright) will trigger a `/challenge` redirect or `403` status. When performing E2E manual runs, ensure the cookie/headers simulate real browser clients.
