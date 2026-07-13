# Security, Bot Mitigation & Request Middleware

This feature implements strict request filtering, user agent blocking, and rate limiting rules at the Next.js edge router layer to shield the club admin panels, ticketing endpoints, and payment workflows.

## 1. Concept & Middleware Orchestration
RallyUp employs an edge-level middleware that inspects each incoming HTTP request for standard botanical or crawler footprints before resolving Next.js bundle logic or dashboard pages.

- **Unauthenticated vs Authenticated paths**: Public pages are instantly bypassed. Admin dashboards (`/dashboard`) undergo strict browser header and fingerprint inspections.
- **Bot Mitigation**: Blocks known non-browser user agents (e.g. `python-requests`, `selenium`, `puppeteer`, `curl`) but whitelists standard search crawlers (e.g. `googlebot`, `whatsapp`) for metadata previews.

## 2. Key Files & Logic
- **Routing & Validation**:
  - `middleware.ts`: Orchestrates all middleware policies. Employs IP rate limiting via request records map and appends secure headers to the response context.
- **Verification Portal**:
  - `app/challenge/page.tsx`: Redirect target if headers are missing or suspicious. Prompts a user interaction verification. Saves a `verified: "true"` cookie.

## 3. Middleware Handlers & Validation Flows
1. **Public Paths Bypass**: Bypasses marketing/legal pages and static probes (e.g., `/`, `/about`, `/login`, `/privacy`, `/site.webmanifest`, `/sitemap.xml`) before any bot or rate-limit logic.
2. **Static Asset Bypass**: Paths under `/api/`, `/_next/`, `/static/`, and common static extensions (including `.json`, `.webmanifest`, fonts, images) skip middleware checks entirely.
3. **Cookie Inspection**: If `verified === "true"` cookie is active, the middleware proceeds directly, skipping bot challenge redirects.
4. **User Agent Audit**: Runs regex check using `isBlockedUserAgent(...)`. Rejects scrapers with `403 Access Denied`.
5. **Header Validation (`hasValidBrowserHeaders`)**: Checks for standard browser request metadata (`accept-language`, `accept-encoding`, `accept`). Refusing requests from customized scripted headers to `/dashboard`.
6. **IP Rate Limiter (`checkRateLimit`)**: Uses an in-memory `requestCounts` map. Enforces a maximum threshold of $100$ requests per $60$ seconds window (non-navigation), responding with `429 Too Many Requests`. Next.js RSC/prefetch navigations are excluded.
7. **Device Policy Injection**: Sets custom security frame headers, XSS protections, and dynamically adjusts the browser `Permissions-Policy` (e.g. restricts camera access to `/dashboard/events/scanner` only).

## 4. Gotchas & Edge Cases
- **In-Memory Rate Limiting**: The rate limiter is in-memory inside the Edge runtime context. Serverless functions or scale-up containers can have individual memory spaces, meaning request counts are isolated to specific runtime instances.
- **Static probes must stay bypassed**: Assets like `/site.webmanifest` should remain outside the rate-limit bucket to avoid browser `429`s during normal page loads.
- **Suspicious Request Redirects**: Legitimate developer testing using `curl` or automated testing scripts (Playwright) will trigger a `/challenge` redirect or `403` status. When performing E2E manual runs, ensure the cookie/headers simulate real browser clients.
