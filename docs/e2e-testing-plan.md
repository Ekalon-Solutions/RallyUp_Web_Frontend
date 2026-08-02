# RallyUp — End-to-End Manual Testing Plan

> **How to use:** Check off `- [ ]` boxes as you test each item. Add notes in the `Notes` column.
> Run `npm run env:dev` + `npm run dev` before starting.

---

## Pre-Flight Checklist

- [ ] `npm run env:dev` — switched to dev environment
- [ ] `npm run dev` — frontend running locally
- [ ] Backend server running on expected port
- [ ] Firebase project connected (`.env.local` configured)
- [ ] Razorpay **test** keys set in env vars
- [ ] 3 test accounts ready:
  - [ ] System Owner account
  - [ ] Club Admin account
  - [ ] Regular Member account
- [ ] Browser DevTools → Network tab open to monitor API calls

---



## Testing Flow

```
PHASE 1        PHASE 2        PHASE 3        PHASE 4
Public Pages → Auth & Onboard → Club Admin → Membership & Plans
     │
PHASE 5        PHASE 6        PHASE 7        PHASE 8
Payments    → Events       → Store & Orders → Engagement
     │
PHASE 9        PHASE 10       PHASE 11
Volunteers  → Real-Time & API → Edge Cases & Security
```

---



## Phase 1 — Public Pages & Static Content


| Done  | Test Case                          | URL                 | Notes |
| ----- | ---------------------------------- | ------------------- | ----- |
| - [ ] | Landing page loads, hero renders   | `/`                 |       |
| - [ ] | Clubs listing page loads           | `/clubs`            |       |
| - [ ] | Club detail page resolves via slug | `/clubs/[slug]`     |       |
| - [ ] | Events public page loads           | `/events`           |       |
| - [ ] | Membership Plans page loads        | `/membership-plans` |       |
| - [ ] | Merchandise page loads             | `/merchandise`      |       |
| - [ ] | About page loads                   | `/about`            |       |
| - [ ] | Contact page loads                 | `/contact`          |       |
| - [ ] | FAQs page loads                    | `/faqs`             |       |
| - [ ] | Privacy policy page loads          | `/privacy`          |       |
| - [ ] | Terms page loads                   | `/terms`            |       |
| - [ ] | PPSA page loads                    | `/ppsa`             |       |
| - [ ] | Refund policy page loads           | `/refund`           |       |
| - [ ] | Child safety page loads            | `/child-safety`     |       |
| - [ ] | Splash screen renders              | `/splash`           |       |
| - [ ] | Affiliations page loads            | `/affiliations`     |       |
| - [ ] | Delete Account page renders        | `/delete-account`   |       |
| - [ ] | Invalid route returns 404          | `/xyz-invalid`      |       |


---



## Phase 2 — Authentication & Onboarding


| Done  | Test Case                                                    | URL                          | Notes         |
| ----- | ------------------------------------------------------------ | ---------------------------- | ------------- |
| - [ ] | Register new user (email + password) — Firebase user created | `/register`                  |               |
| - [ ] | Login with valid credentials — token stored correctly        | `/login`                     |               |
| - [ ] | Login with wrong password shows error                        | `/login`                     |               |
| - [ ] | Logout clears session and redirects to login                 | Dashboard                    |               |
| - [ ] | Accessing `/dashboard` unauthenticated redirects to login    | `/dashboard`                 | middleware.ts |
| - [ ] | System Owner login works                                     | `/system-owner-login`        |               |
| - [ ] | Notification preferences saved successfully                  | `/notifications/preferences` |               |
| - [ ] | User profile page loads and updates                          | `/dashboard/user/profile`    |               |
| - [ ] | User settings page saves correctly                           | `/dashboard/user-settings`   |               |


---



## Phase 3 — Club & Member Management (Admin)


| Done  | Test Case                              | URL                                | Notes |
| ----- | -------------------------------------- | ---------------------------------- | ----- |
| - [ ] | View all clubs in admin                | `/dashboard/clubs`                 |       |
| - [ ] | View specific club by ID               | `/dashboard/clubs/[clubId]`        |       |
| - [ ] | Club management settings save          | `/dashboard/club-management`       |       |
| - [ ] | Members list loads                     | `/dashboard/members`               |       |
| - [ ] | Add new member manually                | `/dashboard/members/add`           |       |
| - [ ] | Admin add-member demo works            | `/dashboard/admin/add-member-demo` |       |
| - [ ] | Staff list loads and roles are visible | `/dashboard/staff`                 |       |
| - [ ] | Settings page saves club config        | `/dashboard/settings`              |       |
| - [ ] | Admin-settings panel functional        | `/dashboard/admin-settings`        |       |
| - [ ] | Website builder saves sections         | `/dashboard/website`               |       |
| - [ ] | Sports management CRUD works           | `/dashboard/sports`                |       |
| - [ ] | Sessions list loads                    | `/dashboard/sessions`              |       |
| - [ ] | Help page loads                        | `/dashboard/help`                  |       |


---



## Phase 4 — Membership Plans & Cards


| Done  | Test Case                            | URL                               | Notes         |
| ----- | ------------------------------------ | --------------------------------- | ------------- |
| - [ ] | Create a new membership plan         | `/dashboard/membership-plans`     |               |
| - [ ] | Edit an existing membership plan     | `/dashboard/membership-plans`     |               |
| - [ ] | Delete a membership plan             | `/dashboard/membership-plans`     |               |
| - [ ] | Plans appear on public page          | `/membership-plans`               |               |
| - [ ] | User browses available plans         | `/dashboard/user/browse-plans`    |               |
| - [ ] | Membership card renders with QR code | `/dashboard/membership-cards`     | react-qr-code |
| - [ ] | User sees their own membership card  | `/dashboard/user/membership-card` |               |
| - [ ] | Membership card PDF download works   | `/dashboard/membership-cards`     | jspdf         |
| - [ ] | Create a coupon code                 | `/dashboard/coupons`              |               |
| - [ ] | Apply coupon to a plan purchase      | Plan purchase flow                |               |


---



## Phase 5 — Payments (Razorpay)

> Use Razorpay test card: **4111 1111 1111 1111**, CVV: **123**, Expiry: any future date.


| Done  | Test Case                                                          | Where                            | Notes |
| ----- | ------------------------------------------------------------------ | -------------------------------- | ----- |
| - [ ] | `POST /api/razorpay/create-order` returns `order_id`               | API / Postman                    |       |
| - [ ] | `POST /api/razorpay/verify-payment` validates signature correctly  | API / Postman                    |       |
| - [ ] | `POST /api/razorpay/create-subscription` returns `subscription_id` | API / Postman                    |       |
| - [ ] | `POST /api/razorpay/verify-subscription` validates correctly       | API / Postman                    |       |
| - [ ] | `GET /api/razorpay/plans` returns plan list                        | API / Postman                    |       |
| - [ ] | Club plan purchase flow completes → success page shown             | `/clubs/[slug]/purchase`         |       |
| - [ ] | Club plan purchase failure is handled gracefully                   | `/clubs/[slug]/purchase/failure` |       |
| - [ ] | General purchase success page displays                             | `/purchase/success`              |       |
| - [ ] | General purchase failure page displays                             | `/purchase/failure`              |       |
| - [ ] | Payment success page displays                                      | `/payment/success`               |       |
| - [ ] | Payment failure page displays                                      | `/payment/failure`               |       |
| - [ ] | Admin refund flow works                                            | `/dashboard/admin/refunds`       |       |
| - [ ] | Tampered payment signature is rejected                             | API                              |       |


---



## Phase 6 — Events


| Done  | Test Case                                         | URL                                           | Notes |
| ----- | ------------------------------------------------- | --------------------------------------------- | ----- |
| - [ ] | Create a new event                                | `/dashboard/events/create`                    |       |
| - [ ] | Event detail page loads                           | `/dashboard/events/[id]`                      |       |
| - [ ] | Edit event details                                | `/dashboard/events/[id]`                      |       |
| - [ ] | Attendees list is visible                         | `/dashboard/events/[id]/attendees`            |       |
| - [ ] | Attendance marking works                          | `/dashboard/events/attendance`                |       |
| - [ ] | QR scanner page functional (camera access prompt) | `/dashboard/events/scanner`                   |       |
| - [ ] | User views their booked events                    | `/dashboard/user/events`                      |       |
| - [ ] | External ticketing admin view loads               | `/dashboard/external-ticketing/admin`         |       |
| - [ ] | External ticketing club view loads                | `/dashboard/external-ticketing/club/[clubId]` |       |
| - [ ] | User external ticketing view loads                | `/dashboard/user/external-ticketing`          |       |
| - [ ] | Public events page loads                          | `/events`                                     |       |


---



## Phase 7 — Store & Orders


| Done  | Test Case                            | URL                                 | Notes |
| ----- | ------------------------------------ | ----------------------------------- | ----- |
| - [ ] | Store loads with product list        | `/dashboard/store`                  |       |
| - [ ] | Add a new product                    | `/dashboard/store/add-product`      |       |
| - [ ] | Merchandise public page loads        | `/merchandise`                      |       |
| - [ ] | Dashboard merchandise page loads     | `/dashboard/merchandise`            |       |
| - [ ] | Orders list loads for admin          | `/dashboard/orders`                 |       |
| - [ ] | User order history loads             | `/dashboard/user/orders`            |       |
| - [ ] | Redemption settings are configurable | `/dashboard/redemption/settings`    |       |
| - [ ] | Redemption per-member view loads     | `/dashboard/redemption/member/[id]` |       |


---



## Phase 8 — Engagement Features


| Done  | Test Case                         | URL                               | Notes |
| ----- | --------------------------------- | --------------------------------- | ----- |
| - [ ] | Create a poll                     | `/dashboard/polls`                |       |
| - [ ] | Vote on a poll                    | `/dashboard/user/polls`           |       |
| - [ ] | Leaderboard loads with rankings   | `/dashboard/leaderboard`          |       |
| - [ ] | User leaderboard view loads       | `/dashboard/user/leaderboard`     |       |
| - [ ] | Challenge page renders            | `/challenge`                      |       |
| - [ ] | Guess the score game works        | `/dashboard/user/guess-the-score` |       |
| - [ ] | Chants list loads (admin)         | `/dashboard/chants`               |       |
| - [ ] | User chants view loads            | `/dashboard/user/chants`          |       |
| - [ ] | Gallery — upload an image         | `/dashboard/gallery`              |       |
| - [ ] | Gallery — view uploaded images    | `/dashboard/gallery`              |       |
| - [ ] | User gallery view loads           | `/dashboard/user/gallery`         |       |
| - [ ] | Forum loads and create a post     | `/dashboard/forum`                |       |
| - [ ] | Content / news feed loads (admin) | `/dashboard/content`              |       |
| - [ ] | User news feed loads              | `/dashboard/user/news`            |       |
| - [ ] | Match center data displays        | `/dashboard/match-center`         |       |
| - [ ] | User members list visible         | `/dashboard/user/members`         |       |
| - [ ] | User my-clubs page loads          | `/dashboard/user/my-clubs`        |       |


---



## Phase 9 — Volunteers & Travel


| Done  | Test Case                       | URL                               | Notes |
| ----- | ------------------------------- | --------------------------------- | ----- |
| - [ ] | Volunteer signup flow completes | `/dashboard/volunteer`            |       |
| - [ ] | Volunteer management admin view | `/dashboard/volunteer-management` |       |
| - [ ] | Volunteers list view loads      | `/dashboard/volunteers`           |       |
| - [ ] | Travel page loads               | `/dashboard/travel`               |       |


---



## Phase 10 — Real-Time & Internal APIs

> Open DevTools → Network → WS tab to verify socket connections.


| Done  | Test Case                                                          | How                     | Notes              |
| ----- | ------------------------------------------------------------------ | ----------------------- | ------------------ |
| - [ ] | Socket.io connects on dashboard load                               | DevTools → Network → WS | socket-context.tsx |
| - [ ] | Messaging — send a message, other session receives it in real-time | Two browser tabs        | use-messaging.ts   |
| - [ ] | `GET /api/internal/sports/next-matches` returns match data         | API / Postman           |                    |
| - [ ] | `POST /api/data-deletion-request` form submits successfully        | `/delete-account`       |                    |
| - [ ] | Rate limiter blocks excessive requests                             | `/api/rate-limit-test`  |                    |
| - [ ] | Honeypot endpoint returns correct response                         | `/api/honeypot`         |                    |
| - [ ] | Firebase reads reflect in UI without page refresh                  | DevTools console        |                    |
| - [ ] | Firebase writes persist after page reload                          | DevTools console        |                    |


---



## Phase 11 — Edge Cases & Security


| Done  | Test Case                                                           | Notes                  |
| ----- | ------------------------------------------------------------------- | ---------------------- |
| - [ ] | Regular member cannot access `/dashboard/admin` routes              | Should redirect        |
| - [ ] | Club admin cannot access system owner routes                        | Check middleware.ts    |
| - [ ] | Direct URL access to admin route as regular user redirects          |                        |
| - [ ] | All forms show validation errors correctly (zod + react-hook-form)  | All forms              |
| - [ ] | Empty states render when no data exists (no clubs, members, events) |                        |
| - [ ] | Image upload enforces size and type limits                          | Gallery, merchandise   |
| - [ ] | Session expiry triggers auto-logout and redirect                    | Wait for token expiry  |
| - [ ] | Mobile responsiveness on all dashboard pages                        | DevTools → mobile view |
| - [ ] | Dark mode / theme switching works across pages                      | next-themes            |
| - [ ] | Back button navigation works without stale data                     |                        |
| - [ ] | Console has no critical errors on any page                          | DevTools → Console tab |


---



## Code-Audit Findings (2026-08-02)

> Static read-through of every phase below (no browser/test accounts available in this session — see note at end). 74 issues found. IDs are stable references, not fix priority order.



### ⚠️ Root cause — no server-side role authorization

**middleware.ts** performs zero role-based checks. Every role (member/club admin/system owner) sets the same `auth_session=1` cookie, and any request carrying it sails past every `/dashboard/admin/`*, `/dashboard/elevate-admin`, and system-owner check. RBAC is entirely delegated to a per-page `<ProtectedRoute>` client component — and most dashboard pages never add it. This single gap is why BUG-014, 043, 047, 054, 061, 069 all exist; fixing it in `middleware.ts` (read the role claim off the session and gate by path prefix) closes all of them at once instead of wrapping each page individually.

### Phase 1 — Public Pages


| ID  | Test Case           | File                                             | Sev    | Issue                                                                                                   |
| --- | ------------------- | ------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------- |
| 001 | Clubs listing       | `app/clubs/page.tsx:208,394,414,526,550,597,639` | Medium | Raw `fetch()` throughout instead of `lib/api.ts` (`apiClient.getPublicClubs()` already exists, unused). |
| 002 | Delete Account page | `app/delete-account/page.tsx:40`                 | Low    | `{""}` JSX interpolation eats the space before the mailto link — renders "...reach us atsupport@...".   |
| 003 | Invalid route → 404 | `app/`                                           | Low    | No custom `not-found.tsx`; falls back to generic unstyled Next.js 404.                                  |




### Phase 2 — Authentication & Onboarding


| ID  | Test Case                                         | File                                                          | Sev      | Issue                                                                                                                                                                                             |
| --- | ------------------------------------------------- | ------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 004 | Unauthenticated → `/dashboard` redirects to login | `middleware.ts:187-226`                                       | Critical | No redirect to `/login` exists anywhere. A protected path only redirects (to `/challenge`, not `/login`) if the request also looks bot-like; a normal logged-out browser passes straight through. |
| 005 | Unauthenticated → `/dashboard` redirects to login | `components/dashboard-layout.tsx`, `app/dashboard/layout.tsx` | Critical | Shared dashboard shell never checks `isAuthenticated` to redirect — enforcement is 100% delegated to each page opting into `<ProtectedRoute>`.                                                    |
| 006 | (same)                                            | `components/protected-route.tsx:31`                           | Medium   | Where `<ProtectedRoute>` *is* used, it redirects to `/` not `/login`.                                                                                                                             |
| 007 | Login with wrong password shows error             | `app/login/page.tsx`, `contexts/auth-context.tsx:24`          | Medium   | Checklist item doesn't map to real code — login is OTP-based, no password field exists anywhere in the login form state.                                                                          |
| 008 | Login form validation                             | `app/login/page.tsx`                                          | Medium   | Plain `useState` + manual `toast.error()` calls, no react-hook-form/zod (contradicts CLAUDE.md).                                                                                                  |




### Phase 3 — Club & Member Management (Admin)


| ID  | Test Case                       | File                                             | Sev      | Issue                                                                                                                                                             |
| --- | ------------------------------- | ------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 009 | View all clubs in admin         | `app/dashboard/clubs/`                           | Critical | No `page.tsx` for `/dashboard/clubs` itself — only `[clubId]` sub-route exists. 404s.                                                                             |
| 010 | View specific club by ID        | `app/dashboard/clubs/[clubId]/page.tsx:43,60-66` | Medium   | **Corrected 2026-08-02** (was reported High/orphaned): `contexts/auth-context.tsx:52,90` *does* write `sessionStorage.setItem('selectedClubId', clubId)` on every `setActiveClubId` call — the original grep only covered `app/` and `components/`. The page is reachable whenever `activeClubId` is set. Still no nav link points directly here, so it's undiscoverable via UI, just not orphaned/dead. |
| 011 | (same)                          | `app/dashboard/clubs/[clubId]/page.tsx:314-344`  | Medium   | Members/Events/Activity tabs are static "coming soon" placeholders.                                                                                               |
| 012 | Add new member manually         | `app/dashboard/members/add`                      | Medium   | Checklist URL doesn't exist as a route — feature is a modal (`AddMemberModal`) off the members list instead.                                                      |
| 013 | Admin add-member demo           | `app/dashboard/admin/add-member-demo/page.tsx`   | High     | Leftover marketing/demo copy page describing the modal in prose; shouldn't be reachable in production.                                                            |
| 014 | (same)                          | `app/dashboard/admin/add-member-demo/page.tsx`   | Critical | No `ProtectedRoute`/role check at all — combined with the middleware RBAC gap, any authenticated member can reach it and trigger the admin-only `AddMemberModal`. |
| 015 | Staff list loads                | `app/dashboard/staff`                            | Critical | Route doesn't exist anywhere — not in `app/dashboard/`, not in nav. No equivalent page maps to this checklist item.                                               |
| 016 | Settings page saves club config | `app/dashboard/settings/page.tsx:345-432`        | Medium   | "Club Information" card is read-only display text — no edit form/save button for club config exists on this page at all.                                          |
| 017 | Club management settings save   | `app/dashboard/club-management/page.tsx:230-260` | Low      | Hand-rolled regex validation instead of zod.                                                                                                                      |
| 018 | Sports management CRUD          | `app/dashboard/sports/page.tsx:66-90`            | Low      | Raw `fetch()` to external TheSportsDB API instead of via `lib/api.ts`.                                                                                            |
| 019 | (same)                          | `app/dashboard/sports/page.tsx:92-254`           | Medium   | Only Create/Update/Read — no Delete action, doesn't satisfy "CRUD" as the checklist states.                                                                       |




### Phase 4 — Membership Plans & Cards


| ID  | Test Case                            | File                                                                        | Sev      | Issue                                                                                                                                                             |
| --- | ------------------------------------ | --------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 020 | Membership card renders with QR code | `components/membership-card.tsx`, `app/dashboard/membership-cards/page.tsx` | Critical | `react-qr-code` (a listed dependency) is never rendered anywhere for membership cards; the card customizer uses a literal placeholder string `'PREVIEW-QR-CODE'`. |
| 021 | Membership card PDF download         | `app/dashboard/membership-cards/page.tsx:293-305`                           | Critical | `jspdf` (a listed dependency) is never imported anywhere in the codebase. `handleExportCards` is a no-op stub not even wired to a button.                         |
| 022 | Plans appear on public page          | `app/membership-plans/MembershipPlansClient.tsx:55-70`                      | Medium   | `load()` has no `catch` — API failure is an unhandled rejection with no error shown.                                                                              |
| 023 | (same)                               | `app/membership-plans/MembershipPlansClient.tsx:144-186`                    | Medium   | "Browse Clubs" CTA is commented out in 3 places — page is a dead end when visited without a `clubId` query param.                                                 |
| 024 | Create a membership plan             | `app/dashboard/membership-plans/page.tsx:224-311`                           | Low      | Manual if/toast validation chain instead of zod.                                                                                                                  |
| 025 | Create a coupon code                 | `components/modals/create-coupon-modal.tsx`                                 | Low      | Plain `useState`, no zod schema.                                                                                                                                  |
| 026 | (same)                               | `components/tabs/coupons-tab.tsx`                                           | Low      | Coupon eligibility has no explicit "membership plan" option, though the apply-side validates coupons against `purchaseType: "membership"`.                        |




### Phase 5 — Payments (Razorpay)


| ID  | Test Case                            | File                                                                                           | Sev      | Issue                                                                                                                                                                                                         |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 027 | Club plan purchase flow              | `app/clubs/[slug]/purchase/`                                                                   | Critical | Directory has zero `page.tsx` files anywhere in its tree — dead, unreferenced route. Real flow lives at `/clubs/[slug]/membership`.                                                                           |
| 028 | Club plan purchase failure           | `app/clubs/[slug]/purchase/failure/`                                                           | Critical | Same — empty directory.                                                                                                                                                                                       |
| 029 | Payment success page                 | `app/payment/success`                                                                          | Critical | Route doesn't exist — `app/payment/` directory is absent.                                                                                                                                                     |
| 030 | Payment failure page                 | `app/payment/failure`                                                                          | Critical | Same.                                                                                                                                                                                                         |
| 031 | `verify-payment` validates signature | `app/api/razorpay/verify-payment/route.ts:39`                                                  | Medium   | HMAC is correctly recomputed and checked, but uses plain `===` instead of `crypto.timingSafeEqual` (timing side-channel).                                                                                     |
| 032 | `verify-subscription` validates      | `app/api/razorpay/verify-subscription/route.ts:24`                                             | Medium   | Same non-constant-time comparison.                                                                                                                                                                            |
| 033 | Tampered signature rejected          | `app/api/razorpay/create-order/route.ts:22,32-43`                                              | High     | No server-side cross-check of the client-supplied `amount` against a reference price — checkout modals compute the charge amount in-browser, so a tampered low amount can still get a validly-signed payment. |
| 034 | Razorpay API hardening               | `create-order`, `create-subscription`, `verify-payment`, `verify-subscription`, `plans` routes | Medium   | None check auth/session — any unauthenticated caller can hit them directly with the site's live Razorpay credentials.                                                                                         |
| 035 | (same)                               | `app/api/razorpay/test/route.ts`                                                               | Medium   | Unauthenticated diagnostic endpoint reveals key config and full `error.stack` traces.                                                                                                                         |
| 036 | Tampered signature — client UX       | `components/modals/venue-tier-cart-modal.tsx`                                                  | Low      | `verify-payment` call result is discarded (`.catch(() => {})`), never blocks or surfaces a failure — inconsistent with `payment-simulation-modal.tsx`, which does check.                                      |
| 037 | Admin refund flow                    | `app/dashboard/admin/refunds/page.tsx`                                                         | Medium   | Raw `fetch()` + manual `localStorage` token throughout instead of the matching (unused) `lib/api.ts` functions (`listRefundsAdmin`, etc).                                                                     |




### Phase 6 — Events


| ID  | Test Case                    | File                                                            | Sev      | Issue                                                                                                           |
| --- | ---------------------------- | --------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| 038 | Event detail / edit page     | `app/dashboard/events/[id]/`                                    | Critical | Directory empty, no `page.tsx` — 404s. Events list instead routes edits to `/dashboard/events/create?edit=...`. |
| 039 | Attendees list visible       | `app/dashboard/events/[id]/attendees/`                          | Critical | Empty, no `page.tsx`, and no attendees-list component exists anywhere else in the codebase either.              |
| 040 | Create a new event           | `app/dashboard/events/create/page.tsx`                          | Medium   | 1457-line wizard uses plain `useState` + custom validators, not react-hook-form + zod.                          |
| 041 | External ticketing club view | `app/dashboard/external-ticketing/club/[clubId]/page.tsx:28-35` | Low      | Failed fetch only shows a toast — no distinct error state, looks identical to the legitimate empty state.       |




### Phase 7 — Store & Orders


| ID  | Test Case                             | File                                                                                               | Sev      | Issue                                                                                                                                                                             |
| --- | ------------------------------------- | -------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 042 | Store loads with product list         | `app/dashboard/store/page.tsx:23-63`                                                               | Critical | Hardcoded `sampleProducts` array + fake stat cards, zero `apiClient` calls, no auth guard. Real working equivalent is `/dashboard/merchandise`.                                   |
| 043 | Add a new product                     | `app/dashboard/store/add-product/page.tsx:306-315`, `components/modals/add-product-modal.tsx:47`   | Critical | Submit button/handler in both the page and the modal never calls any API — entered product data is always silently discarded.                                                     |
| 044 | (same)                                | `app/dashboard/store/add-product/page.tsx`                                                         | Medium   | Plain `useState`, no zod schema.                                                                                                                                                  |
| 045 | User order history — continue payment | `app/dashboard/user/orders/page.tsx:594,616`                                                       | High     | Member page self-reports payment success to an admin-namespaced endpoint (`PATCH /orders/admin/:id/payment-status`) from client JS with no visible server-side verification step. |
| 046 | Redemption settings configurable      | `components/admin/settings/redemption-settings-tab.tsx`                                            | Medium   | Plain `useState`; a blank numeric field becomes `NaN` and is sent straight to the backend on save.                                                                                |
| 047 | Orders/redemption admin pages         | `app/dashboard/orders/page.tsx`, `redemption/settings/page.tsx`, `redemption/member/[id]/page.tsx` | High     | None wrapped in `<ProtectedRoute>` — combined with the middleware RBAC gap, financial/order data is reachable by an unauthenticated or non-admin session.                         |
| 048 | Redemption per-member view            | `app/dashboard/redemption/member/[id]/page.tsx`                                                    | Medium   | No `try/catch` around the fetch and `loading` state is never rendered — a thrown error leaves the page stuck on an infinite spinner with no error shown.                          |




### Phase 8 — Engagement Features


| ID  | Test Case                   | File                                                                       | Sev      | Issue                                                                                                                                                                      |
| --- | --------------------------- | -------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 049 | Forum loads / create a post | `app/dashboard/forum/page.tsx`, `components/modals/create-topic-modal.tsx` | Critical | Entire forum is hardcoded mock arrays, zero `apiClient` calls, no auth guard. "Create Topic" only resets local state — never persists.                                     |
| 050 | Match center data displays  | `app/dashboard/match-center/page.tsx`                                      | Critical | Entirely hardcoded mock fixtures, zero `apiClient` usage, no auth guard; action buttons have no handlers.                                                                  |
| 051 | Challenge page renders      | `app/challenge/page.tsx:26-31`                                             | Medium   | No input field for the math answer — `handleVerify` unconditionally sets the `verified` cookie regardless of any answer. The anti-bot challenge is cosmetic (see BUG-074). |
| 052 | Gallery upload validation   | `app/dashboard/gallery/page.tsx:66-114`                                    | Medium   | Size limits are properly enforced, but file MIME type is never checked against an allow-list — only via the `accept=` hint, which is bypassable.                           |
| 053 | Create a poll               | `components/modals/create-poll-modal.tsx`                                  | Low      | Manual if-checks instead of zod (works correctly, just inconsistent with convention).                                                                                      |
| 054 | Volunteers list view        | `app/dashboard/volunteers/page.tsx:105-137`                                | Low      | Admin tab gated to `super_admin`/`system_owner` only — excludes plain club `admin` role, may not match intended access.                                                    |




### Phase 9 — Volunteers & Travel


| ID  | Test Case                                | File                                                  | Sev    | Issue                                                                                                                                                                       |
| --- | ---------------------------------------- | ----------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 055 | Travel page loads                        | `app/dashboard/travel/page.tsx`                       | High   | Entirely hardcoded mock data (bookings, hotels, stats), zero `apiClient` calls, no auth guard.                                                                              |
| 056 | Travel — book travel                     | `components/modals/travel-booking-modal.tsx:43-59`    | High   | Submit handler never calls any API — booking entered is silently discarded.                                                                                                 |
| 057 | Travel — action buttons                  | `app/dashboard/travel/page.tsx`                       | Medium | "Manage"/"Book Hotel"/"Book Group Flight" buttons have no `onClick` handlers.                                                                                               |
| 058 | Volunteer management — edit opportunity  | `app/dashboard/volunteer-management/page.tsx:44-58`   | High   | Editing always resets `date` to today instead of `initialData.date`, and only reads `timeSlots[0]` — saving an edit silently corrupts the event date and drops extra slots. |
| 059 | (same)                                   | `app/dashboard/volunteer-management/page.tsx:762-773` | Low    | "Debug Volunteers" button left in production admin UI; response is discarded, does nothing visible.                                                                         |
| 060 | Volunteers list vs. volunteer-management | `app/dashboard/volunteers/page.tsx`                   | Medium | Overlaps/duplicates `/dashboard/volunteer-management`; the file's own comment identifies it as demo/scaffold code.                                                          |
| 061 | (same)                                   | `app/dashboard/volunteers/page.tsx`                   | Medium | Not wrapped in `<DashboardLayout>` (or `<ProtectedRoute>`) — renders without the nav/sidebar shell, unlike sibling pages.                                                   |
| 062 | Volunteers list — admin fetch            | `components/volunteer/admin-volunteer-list.tsx:79-94` | High   | Raw `fetch()` + `localStorage` token instead of the existing `apiClient.getVolunteers()`.                                                                                   |
| 063 | Volunteer signup flow                    | `components/volunteer/volunteer-opt-in-widget.tsx`    | High   | Three raw `fetch()` calls duplicate existing `apiClient` volunteer-profile functions used correctly elsewhere.                                                              |
| 064 | (same)                                   | `components/volunteer/volunteer-signup-modal.tsx`     | Medium | Plain `useState`, no validation — can submit with all fields empty.                                                                                                         |




### Phase 10 — Real-Time & Internal APIs


| ID  | Test Case                              | File                        | Sev  | Issue                                                                                                                                                         |
| --- | -------------------------------------- | --------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 065 | Rate limiter blocks excessive requests | `lib/rate-limiter.ts`       | Low  | `strictRateLimiter`/`authRateLimiter` are defined but never used anywhere — dead code, not protecting login/OTP endpoints.                                    |
| 066 | Honeypot endpoint                      | `app/api/honeypot/route.ts` | Low  | All logging is commented out — triggering it produces zero server-side visibility/alerting.                                                                   |
| 067 | Firebase reads/writes reflect in UI    | *(architecture)*            | Info | App only uses `firebase/auth` — no Firestore/`onSnapshot` anywhere. Real-time UI is Socket.io. This checklist item doesn't map to anything testable; skip it. |


Socket lifecycle (`contexts/socket-context.tsx`), messaging listeners (`hooks/use-messaging.ts`), and the data-deletion-request route were all checked and are correctly implemented — no findings.

### Phase 11 — Edge Cases & Security


| ID  | Test Case                                                | File                                                                                                                | Sev      | Issue                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 068 | Member cannot access `/dashboard/admin` / role isolation | `middleware.ts`                                                                                                     | Critical | See root-cause callout above — no role-based authorization exists at the edge at all.                                                                                                                                                                                                                                                                                                     |
| 069 | (same)                                                   | `app/dashboard/admin/refunds/page.tsx`, `app/dashboard/admin/add-member-demo/page.tsx`                              | High     | Neither wrapped in `<ProtectedRoute>`, unlike sibling admin pages (e.g. `feature-limits` uses `requireSystemOwner`).                                                                                                                                                                                                                                                                      |
| 070 | Forms show validation errors (zod + react-hook-form)     | repo-wide                                                                                                           | High     | `react-hook-form` used in exactly 2 files, `zod` in exactly 1, out of 45+ dashboard pages — the checklist's own assumption doesn't hold for nearly the whole app.                                                                                                                                                                                                                         |
| 071 | Image upload enforces size/type (merchandise)            | `app/dashboard/store/add-product/page.tsx:187-203`                                                                  | Critical | "Upload Image" button has no `onClick`, no file input, no `image` field in state — the feature doesn't exist at all.                                                                                                                                                                                                                                                                      |
| 072 | Session expiry triggers auto-logout                      | `lib/api.ts:1168-1231`                                                                                              | Critical | `ApiClient.request()` never throws on non-OK responses — the app's two 401-based auto-logout `catch` blocks are dead code that can never fire. On a 401 the error body gets assigned into `.data`, so pages silently render empty instead of logging out. No global 401 interceptor exists. Only real forced-logout path is an explicit backend-pushed Socket.io event.                   |
| 073 | Console has no critical errors                           | `app/dashboard/page.tsx`, `guess-the-score/page.tsx`, `event-fee-management-section.tsx`, `league-table-widget.tsx` | Medium   | Active `console.log` statements in production paths, including one dumping full API responses via `JSON.stringify`.                                                                                                                                                                                                                                                                       |
| 074 | Rate limiter / bot detection                             | `app/challenge/page.tsx:28`, `middleware.ts:195-198`                                                                | Critical | The `verified` cookie that skips bot-detection and rate-limiting is set client-side with no server signature — any script can send `Cookie: verified=true` on its first request and bypass everything in `docs/features/security-middleware.md`. Also: any authenticated session bypasses the rate limiter for its entire session — exactly when `/dashboard` admin panels are reachable. |


### Phase 12 — Role-Based Access Control (follow-up audit, 2026-08-02)

> Full sweep of all 101 `app/dashboard/**/page.tsx` files for role gating, plus the elevate/demote privilege-escalation flow. Root cause is still the same one from Phase 11 (BUG-068: `middleware.ts` does no role check) — these are the specific pages that fall through it with no page-level `<ProtectedRoute>` backstop either.

| ID | Test Case | File | Sev | Issue |
|----|-----------|------|-----|-------|
| 075 | Role isolation | `app/dashboard/sessions/page.tsx` | Critical | Zero auth of any kind on a platform-wide session-admin tool — any authenticated user can view every user's sessions (name/email/IP/device/role) and force-logout any user by ID. |
| 076 | Admin refund flow | `app/dashboard/admin/refunds/page.tsx` | Critical | No role check at all — any authenticated user with an active-club context can approve/reject refunds and edit cancellation policy text. |
| 077 | External ticketing club view | `app/dashboard/external-ticketing/club/[clubId]/page.tsx` | Critical | No role check *and* no verification the visiting admin belongs to `[clubId]` — any authenticated user can approve/deny ticket requests for any club by editing the URL. |
| 078 | Billing tiers | `app/dashboard/billing-tiers/page.tsx:95`, `billing-tiers/[clubId]/page.tsx:49` | Critical | Gated with `requiredRole="admin"` when the page shows platform-wide MRR/billing "for all clubs" — should be `requireSystemOwner`. The `[clubId]` detail variant also has no check that the admin's own club matches the URL's clubId. |
| 079 | Volunteer management admin view | `app/dashboard/volunteer-management/page.tsx` | High | No role check on opportunity CRUD or on viewing all volunteer signups (PII). |
| 080 | Website builder saves sections | `app/dashboard/website/page.tsx` | High | No role check — any authenticated user can view/save the club's public website design and copy. |
| 081 | Admin add-member demo | `app/dashboard/admin/add-member-demo/page.tsx` | High | Confirms BUG-014 from a second angle — zero role check on a live (not actually "demo") user + membership-plan creation page. |
| 082 | Billing auditor / settings / feature matrix | `billing-auditor/page.tsx`, `billing-settings/page.tsx`, `feature-matrix/page.tsx` | High | Role gate is an inline check placed *after* the component's hooks — the `useEffect` data-fetches (cross-club billing/feature data) fire on mount for any authenticated user before the conditional render suppresses the UI. The network call already happened. |
| 083 | Redemption settings configurable | `app/dashboard/redemption/settings/page.tsx`, `components/admin/settings/redemption-settings-tab.tsx` | High | No role check on a club-wide financial config (points value, expiry policy). |
| 084 | Redemption per-member view | `app/dashboard/redemption/member/[id]/page.tsx` | High | No role/ownership check — any authenticated user can view another member's points balance/history by guessing the ID in the URL. |
| 085 | Events revenue reconciliation | `app/dashboard/events/revenue-reconciliation/page.tsx` | High | No role check on financial reconciliation data; could expose it to the `vendor` role, which per its own onboarding copy is meant to be scan-only. |
| 086 | Volunteers list view | `app/dashboard/volunteers/page.tsx` | Medium | File's own comment calls it a demo page, but its "Admin" tab (full roster + contact info) has no role gate distinguishing who can open it. |
| 087 | Create a new event / club detail page | `app/dashboard/events/create/page.tsx`, `app/dashboard/clubs/[clubId]/page.tsx` | Medium | No role check, unlike the events *listing* page which correctly requires admin. |
| 088 | Store / forum / match center / travel | `app/dashboard/store/*`, `forum/page.tsx`, `match-center/page.tsx`, `travel/page.tsx` | Medium | Admin-shaped UIs with no role check. Not currently exploitable (still hardcoded mock data per Phase 7-9 findings), but will become one the moment they're wired to real endpoints — already inconsistent with every sibling admin page. |
| 089 | Help page access | `app/dashboard/help/page.tsx:65-83` | Low | Inconsistent hardcoded check blocks only `super_admin` from this page (not `admin`/`vendor`); over-restrictive rather than a security hole, but looks like a logic mistake worth a product sanity check. |
| 090 | Orders list loads for admin | `app/dashboard/orders/page.tsx:255` | Low | `isAdmin` check omits `system_owner` — a system owner sees no order data on this page at all (functional bug, not a leak). |

Confirmed clean: vendor-role restriction to `/dashboard/quick-scanner` + `/dashboard/vendor-reports` is consistent and correctly enforced app-wide; no case-mismatched role strings anywhere; the elevate/demote flow (`admin-permissions`, `elevate-admin`) is server-verified end-to-end with no self-escalation path and no client-exposed route to `system_owner`.

### Phase 13 — Reports & Audit Log (follow-up audit, 2026-08-02)

> The `reports/` section (27 pages) turned out to be well-built — real data, real pagination/export, a centralized fail-closed `useReportAuthorization` RBAC system. These are the exceptions, plus the dedicated audit-log/privilege-escalation surface (`admin-audit`, `billing-auditor`, `vendor-reports`, `elevate-admin`, `feature-matrix`).

| ID | Test Case | File | Sev | Issue |
|----|-----------|------|-----|-------|
| 091 | Vendor reports scoped to own club | `app/dashboard/vendor-reports/page.tsx:54`, `lib/api.ts` `getVendorAttendanceDashboard` | High | Own-data scoping relies on a plain client-writable `localStorage.activeClubId`, not a session-bound value. If the backend trusts the supplied clubId without independently checking the vendor's assignment, editing devtools storage could pull another club's attendee PII. Backend enforcement unverifiable from this repo. |
| 092 | Reports RBAC enforcement | all 27 `app/dashboard/reports/**`, `hooks/useReportAuthorization.ts` | Medium | Role gating is entirely client-side (a bespoke hook, not `<ProtectedRoute>`, and `middleware.ts` doesn't check role either). If backend report endpoints don't independently re-check role, financial/governance data is reachable via a direct API call from any authenticated token. Backend enforcement unverifiable from this repo — top risk to confirm. |
| 093 | Three separate admin-audit implementations | `app/dashboard/admin-audit/page.tsx`, `reports/admin-audit/page.tsx`, `reports/super-admin-audit-log/page.tsx` | Medium | Three independent implementations of "who changed admin roles," each hitting a different backend endpoint with its own gating logic. Not currently a cross-tenant leak (verified correctly scoped), but a fix or redaction rule applied to one won't propagate to the others. |
| 094 | Member directory report | `app/dashboard/reports/member-directory/page.tsx:134` | Medium | `setData(res.data.data)` with no `Array.isArray` guard — the project's own `components/reports/REPORT_PAGE_PATTERN.md` names this exact file as a prior "data.map is not a function" crash that was fixed on a sibling report but never on this one. |
| 095 | Admin audit report | `app/dashboard/reports/admin-audit/page.tsx:131` | Medium | Same missing-guard regression, on the same page the internal doc separately flags as historically broken. |
| 096 | Member directory PII export | `app/dashboard/reports/member-directory/page.tsx` | Medium | Exports raw government ID numbers and full home address for every member to any plain club admin — no `financialAdminOnly` restriction on this report despite the PII sensitivity. |
| 097 | Reward points granted report | `app/dashboard/reports/reward-points-granted/page.tsx:220,230` | Low | Double-encoded UTF-8 mojibake (`Ã¢â‚¬â€`) instead of "—" for empty values — cosmetic only. |
| 098 | Ads reports | `reports/ads-config`, `ads-generated-vs-money`, `ads-performance` | Low | Honest non-functional stubs (Ad Platform backend doesn't exist yet, per code comment) — correctly gated to system_owner, just nothing to see. |
| 099 | Audit-log pages access | `reports/admin-audit/page.tsx`, `reports/super-admin-audit-log/page.tsx` | Low | Rely solely on `useReportAuthorization`, skipping `<ProtectedRoute>`'s redirect-to-`/` for fully logged-out visitors. No data leak, just an inconsistent pattern vs. the rest of the app. |
| 100 | Billing auditor alerts list | `app/dashboard/billing-auditor/page.tsx:226-229` | Low | `getBillingAlerts` hardcapped at `limit: 200` with no pagination controls — alerts beyond 200 are silently unreachable. |

Confirmed clean: audit-log entries are genuinely immutable (no edit/delete UI anywhere, explicit "write-once, cannot be modified or deleted by any user, including root admins" copy in the detail view); the elevate/demote privilege-escalation flow is server-verified per club with no self-escalation path; `feature-matrix` correctly gates to system_owner and adds a 15-minute inactivity session lock as an extra control.

### Phase 14 — Account/Role Switching (follow-up audit, 2026-08-02)

> New auth-boundary area, not touched by any prior pass. Traced `contexts/auth-context.tsx` `switchRole`/`activeClubId` state machine, `components/dashboard-layout.tsx`'s account-switcher UI, and `lib/clubContext.ts`'s reconciliation logic directly (agent-based audit for this phase hit a session usage cap mid-run; done via direct read-through instead — narrower than Phases 1-13, see gaps noted below).

| ID | Test Case | File | Sev | Issue |
|----|-----------|------|-----|-------|
| 101 | Switch account role | `contexts/auth-context.tsx:361-368` (`switchRole`) | Low | `setUser(accountData)` fires with the raw switch-response payload before the async `hydrateUserProfile()` resolves — for a brief window `user` holds an incomplete account object (no `clubs`/`memberships` yet), so anything reading `user` synchronously (e.g. `buildAccessibleClubs`) can compute against stale/incomplete data until the second `setUser(hydrated)` call lands. Self-corrects; a transient flicker, not a security issue. |
| 102 | Switch account role — post-switch navigation | `components/dashboard-layout.tsx:605-610` (`handleRoleSwitch`) | Low | Uses `router.push('/dashboard')` with no `router.refresh()`, unlike the club-switch path (`handleClubSwitch`, line 631/645) which explicitly calls `router.refresh()`. Inconsistent — worth confirming no Next.js router-cached data from the previous account is visible until the next navigation. |

**Confirmed clean** (worth recording, since this was the highest-value unaudited area — a privilege-escalation-shaped feature that turned out to be well-built):
- `switchRole` obtains a genuinely new, server-issued token per switch (`auth-context.tsx:343-348`) — not a client-side relabel of the existing token, so a stale token can't be reused to act with a previously-held role's permissions.
- The switchable-accounts list comes from a server endpoint (`apiClient.getAvailableRoles()`, `dashboard-layout.tsx:597`); the current account is deliberately excluded server-side per an explicit code comment referencing a prior bug fix — no client-constructed path to switch into an arbitrary `accountId`.
- For `admin`/`user` roles, `activeClubId` is clamped through `reconcileActiveClubId()` (`lib/clubContext.ts:74-81`) against a club list derived strictly from the server-returned profile (`buildAccessibleClubs`) — a tampered `localStorage.activeClubId` pointing at an inaccessible club is silently rejected and reset to the first genuinely accessible one. This generalizes and closes the localStorage-trust concern raised for `vendor-reports` in Phase 13 (BUG-091) — that finding stands only because vendor scoping doesn't go through this same reconciliation path.
- One explicit, by-design exception: `system_owner` accounts skip this reconciliation entirely (`buildAccessibleClubs` returns `[]` for system_owner; `activeClubId` is taken directly from `localStorage` for that role, per an explicit comment at `auth-context.tsx:69-75`). This makes sense given system owners have blanket cross-club access, but it means every club-scoped API call made while acting as system_owner must independently re-verify access server-side — the frontend performs zero membership check for this one role. Not a bug, just the one path where the client fully trusts a writable value; flagging so backend enforcement can be confirmed.

### Phase 15 — Event Flow, end-to-end (follow-up audit, 2026-08-02)

> Full trace of create→edit→browse→checkout→check-in→refund→external-ticketing. Excludes Phase 6/RBAC items already reported.

| ID | Test Case | File | Sev | Issue |
|----|-----------|------|-----|-------|
| 103 | Joint-screening tier allocation | `app/dashboard/events/create/page.tsx:226-249` | Critical | Adding/removing a partner club recomputes each club's per-club seat split and then derives the tier's total `allocation` *from that split* — so the one validation guard that checks `clubTotal === tier.allocation` always passes trivially. A 2-club 101-seat tier becomes 134 seats the moment a 3rd club is added, with no warning. |
| 104 | Editing an event with tickets already sold | `app/dashboard/events/create/page.tsx:440-457`, `lib/event-pricing-validation.ts` | Critical | Edit-mode never loads `sold`/`currentAttendees` into the draft, and validation only checks `allocation >= 1` — never against tickets already sold. An admin can shrink a tier's allocation below its sold count with zero warning; the event goes live oversold. |
| 105 | QR scanner doesn't check ticket belongs to this event | `app/dashboard/events/scanner/page.tsx`, `app/dashboard/events/page.tsx:528` | Critical | The "Scan QR" link implies a per-event session (`?eventId=`), but the scanner page never reads that param, and the QR payload only encodes `registrationId`+`attendeeId` — no `eventId`. A ticket for Event A scanned in Event B's session is accepted and can be marked attended. The vendor scanner (`components/vendor/quick-scanner-view.tsx:313`) *does* have this exact cross-check — it just isn't reused here. |
| 106 | Duplicate-event mode | `app/dashboard/events/create/page.tsx:442-456,538-548` | High | Duplicate mode reuses edit-mode hydration, which sets `id`/`_id` from the *source* event's venues/tiers, and the create payload sends those ids as-is — risking id collision with or accidental mutation of the original event's subdocuments. |
| 107 | Dashboard-staff scanner skips event cross-check | `components/vendor/quick-scanner-view.tsx:313-316`, `app/dashboard/quick-scanner/page-inner.tsx:140-165` | High | The wrong-event guard (BUG-105's fix elsewhere) is gated on `activeAssignment`, which vendors always have (forced through an assignment picker) but dashboard-staff users don't — so staff using the same scanner component get zero event cross-check. |
| 108 | Refund rejection has no frontend path | `app/dashboard/admin/refunds/page.tsx:213-221`, `components/modals/refund-details-modal.tsx`, `refund-button.tsx:118-121` | High | A ticket is cancelled synchronously the moment a member *requests* a refund (not on admin approval), but there is no "reject" action anywhere in the admin UI — only "Mark as Processed" — despite `'rejected'` being a modeled state. If a refund is ever rejected, there's no way to reissue the member's already-cancelled ticket. |
| 109 | Simple-event checkout capacity race | `components/modals/venue-tier-cart-modal.tsx:884-891,1081-1085`, `components/modals/event-checkout-modal.tsx:193-207,431-438` | High | Remaining-seat capacity for simple (non-multi-venue) paid events is fetched once on modal open and never re-checked before Razorpay opens — unlike the multi-venue flow, which explicitly re-fetches and re-validates capacity right before payment. This is the concrete, reachable instance of the "two buyers, last ticket" race. |
| 110 | List/detail field merge overwrites instead of preserving | `app/clubs/[slug]/events/[eventSlug]/page.tsx:196-203` | High | Code comment says list-enriched fields (e.g. `platformFeePercent`) are "preserved" when hydrating with the detail response, but the merge spreads the detail response last, overwriting them — the opposite of what's documented. `event-checkout-modal.tsx` works around it by manually preferring the list value, but the merge itself was never fixed. |
| 111 | verify-payment result discarded (2nd instance) | `components/modals/event-checkout-modal.tsx:619-642` | Medium | A second, distinct case of BUG-036's bug family: a non-OK signature-verification response is logged but doesn't abort — registration proceeds regardless. |
| 112 | Duplicate-scan detection via string match | `app/dashboard/events/attendance/page.tsx:90-99` | Medium | Classifies "already marked" by `.includes('already marked'/'already attended')` on the human-readable message instead of checking the structured `code` field the backend actually returns — a slightly different message wording would misclassify a real duplicate scan as a generic error. |
| 113 | "Mark Attendance" stays enabled on a known duplicate | `app/dashboard/events/attendance/page.tsx:195-220` | Medium | The preview screen already knows `preview.attended === true` and shows a badge for it, but the "Mark Attendance" button stays clickable regardless — unlike the vendor scanner, which pre-emptively blocks before even calling the API. |
| 114 | External ticketing status update ignores failure | `app/dashboard/external-ticketing/admin/page.tsx:507-517` | Medium | The status-change handler never checks `resp.success` (and `ApiClient.request()` doesn't throw on non-2xx) — a server-side rejection is swallowed and the admin sees "Status updated" regardless. Sibling handlers in the same feature area correctly check this. |
| 115 | No ceiling on external ticket request quantity | `app/dashboard/user/external-ticketing/page.tsx:40,397-399`, `lib/api.ts` `ExternalTicketFixture` | Medium | The request form only enforces `>= 1` (dropdown goes to 500); the fixture type has no `capacity`/`maxTickets` field, and approval never cross-checks the requested quantity against anything. |
| 116 | External ticketing approval is purely a status flip | `lib/api.ts:2340-2356` | Medium | Confirms it end-to-end: approving a request only PATCHes its status. No ticket, registration, or confirmation artifact is ever created anywhere in the frontend's data flow. |
| 117 | Multi-ticket toggle leaves a stale single-ticket cap | `app/dashboard/events/create/page.tsx:506` | Medium | `maxAttendees` is cleared when multi-ticket mode is switched *off*, but never cleared when switched *on* — it stays hidden in the UI but is still sent in the submit payload, so a 50-cap can silently coexist with 200 seats of tier inventory. |
| 118 | Points reservation not invalidated when cart shrinks | `components/modals/venue-tier-cart-modal.tsx:155-159,440,574-601,2380-2415` | Low | A reserved points discount is locked against the cart subtotal at reserve time; reducing ticket quantity afterward just clamps `netAmount` to 0 instead of re-validating/invalidating the reservation. |
| 119 | Guest checkout drops waitlist association | `lib/api.ts:2513-2541,2651-2689` | Low | `waitlistToken` is threaded through the authenticated booking functions but absent from their guest equivalents — a guest converting from a waitlist link silently loses that association. Low-impact today since this path is only reached from an authenticated page. |

**Confirmed clean:** the multi-venue/tier checkout flow *does* re-fetch and re-validate live capacity immediately before payment (`handleTierMatrixPayment`) — the capacity-race gap (BUG-109) is specific to the simpler single-venue checkout path, not the whole system.

### Phase 16 — Merchandise & Commerce, end-to-end (follow-up audit, 2026-08-02)

| ID | Test Case | File | Sev | Issue |
|----|-----------|------|-----|-------|
| 121 | Order total is client-computed and trusted | `components/modals/checkout-modal.tsx:790-843`, `app/dashboard/user/orders/page.tsx:539-570`, `lib/api.ts:3650-3665` | Critical | `finalAmount`/tax/fees are computed entirely in React state and posted as authoritative fields on order creation and payment-status update — nothing in the frontend indicates the server independently recomputes and validates this before charging. |
| 122 | Signature verification not threaded into payment-status update | `components/modals/checkout-modal.tsx:870-894`, `payment-simulation-modal.tsx:188-224`, `app/api/razorpay/verify-payment/route.ts:9-91` | Critical | The Next.js route correctly HMAC-verifies the signature, but that result never reaches the actual state-mutating call — a *separate* `PATCH /orders/admin/{id}/payment-status` request re-sends the same IDs with no proof-of-verification token. That endpoint must itself re-verify or it's callable directly with fabricated IDs to mark any order paid. |
| 123 | Dismissing the payment modal orphans the order | `components/modals/checkout-modal.tsx:1864-1873` (vs. button state `1813-1830`) | High | Closing just the payment sub-modal resets local state only — it never cancels the already-created backend order. Since `loading` was already reset, "Proceed to Payment" is immediately clickable again, letting a user create a second order for the same cart while the first sits orphaned/unpaid. |
| 124 | Reservation confirm/cancel failures swallowed | `checkout-modal.tsx:870-894`, `app/dashboard/user/orders/page.tsx:586-604` | High | `confirmReservation`/`cancelReservation` errors are caught and ignored; the order is marked paid regardless. If `confirmReservation` fails after a successful payment, the points discount was already applied to the charge but the points may never actually be deducted — a silent points leak. |
| 125 | No re-entrancy guard on checkout submit | `checkout-modal.tsx:780-868` | Medium | Only a React state flag disables the submit button, which doesn't commit synchronously — a fast double-click can fire two `POST /orders` calls before it takes effect, with no idempotency key to let the backend dedupe. |
| 126 | Points "Reserve" button has no in-flight guard | `checkout-modal.tsx:1645-1691` (contrast with the coupon "Apply" button) | Medium | Every other async button in this file disables while in flight; this one doesn't — a double-click fires two concurrent reservations, orphaning the first. |
| 127 | Admin "Cancel Order" has no confirmation or in-flight lock | `app/dashboard/orders/page.tsx:520-546` (contrast with `merchandise/page.tsx:267-281`, which does confirm) | Medium | No confirm dialog and no per-row disable while the cancel request is in flight — an accidental or double click could double-fire the cancel, a potential double-restock vector if the backend doesn't gate on current order status. |
| 128 | Cart stock snapshot never refreshes | `contexts/cart-context.tsx:54-97`, `cart-modal.tsx:226-249`, `product-view-modal.tsx:362-385` | Low | Stock enforcement in the cart is checked against a `stockQuantity` snapshot captured once at add-to-cart time and cached in `localStorage` indefinitely — no "this item is now out of stock" signal before checkout. |
| 129 | No SKU/variant modeling or duplicate-name check | `create-merchandise-modal.tsx` (whole file), `merchandise/page.tsx:58-82` | Low | No size/color variants exist in the schema (flat `stockQuantity` only), and no duplicate-product-name check runs before create/update. Stock/price ≥0 validation is present and correct. |
| 130 | False "added to cart" confirmation | `product-view-modal.tsx:116-130` | Low | `handleAddToCart` always shows a success toast even when the cart context's stock guard silently no-ops some/all of the additions — the user isn't told anything was blocked. |

**Confirmed clean:** the points-redemption reserve→confirm/cancel pattern (`lib/api.ts:2729-2750`) is a genuine server-held reservation, not a client-trusted balance check — the right design to prevent double-spend.

### Phase 17 — Membership Lifecycle, end-to-end (follow-up audit, 2026-08-02)

| ID | Test Case | File | Sev | Issue |
|----|-----------|------|-----|-------|
| 131 | No way to cancel an active membership | `lib/api.ts:3947-3952` | Critical | The only "cancel"-named function cancels an *in-progress, pre-payment* purchase attempt, not an active membership. There is no admin or member-side action anywhere that transitions an active membership to `'cancelled'` — even though that status is a first-class value used elsewhere for display/filtering. |
| 132 | No refund path for membership purchases | `lib/api.ts:6132-6178`, `app/dashboard/admin/refunds/page.tsx:28,499` | Critical | `sourceType` in the whole refunds subsystem is hard-typed to `'event_ticket' \| 'store_order'` — membership isn't a supported source at all. Combined with BUG-131: a paid membership has no cancellation path and no refund path anywhere in the frontend. |
| 133 | Client-computed discounted total sent as the charge amount | `components/modals/join-membership-modal.tsx:380-395,514-564`, `payment-simulation-modal.tsx:136-153` | High | Same pattern as BUG-121/033: plan price − coupon discount + fees is assembled entirely client-side and sent verbatim as the Razorpay order amount; `subscribeMembershipPlan` (which activates the membership after payment) never sends an amount for the server to cross-check against. |
| 134 | Add Member modal can't complete for a plan-less club | `components/modals/add-member-modal.tsx:152-166` vs `:613-646` | High | Dead code exists intending to let admins skip plan selection when a club has zero plans, but the actual footer button is wired directly to submit and gated on `disabled={isLoading \|\| !selectedPlan}` — with zero plans, `selectedPlan` can never be truthy, so member creation is permanently blocked for such a club. |
| 135 | Plan price edits give no indication of impact on existing subscribers | `app/dashboard/membership-plans/page.tsx:802-811` vs `:872-883` | Medium | The adjacent "End Date" field explicitly documents that changing it updates all members on the plan; the Price field has no equivalent warning, no "apply to new members only" option, and no visibility into how many active subscribers exist before submitting. |
| 136 | "Auto-Renew" is a UI label with no backing mechanism | `app/dashboard/reports/membership-renewals/page.tsx:38-39` | Medium | Membership renewal is 100% manual re-purchase — Razorpay's recurring subscription routes are wired up only for an unrelated Gallery storage add-on. The renewals report nonetheless renders a distinct "Auto-Renew" badge as if it's a real state, and there's consequently no grace-period/failed-charge/access-revocation flow anywhere, because no recurring charge exists to fail. |
| 137 | Membership card status is a freeform, uncross-checked field | `app/dashboard/membership-cards/page.tsx:610-716` | Medium | `card.status` (active/expired/transferred) is directly editable via dropdown and saved as-is with no check against `card.expiryDate` or the member's actual membership record. |
| 138 | Membership card has no consumer anywhere | `app/dashboard/events/scanner/page.tsx:15-71` + repo-wide grep | Medium | Beyond the already-known missing QR/PDF: no scanner, check-in, or "verify card" flow anywhere in the codebase reads a membership card ID or status at all — confirmed purely cosmetic even setting aside the rendering bugs. |
| 139 | Membership write paths typed `any` | `lib/api.ts:3910-3916,3935` | Low | `subscribeMembershipPlan`/`createPendingMembershipPurchase` both type their payload as `userMembership: any`, removing any static guarantee that the direct-subscribe and pending-purchase paths write the same shape to the member record. |

### Phase 18 — Club Management, functional correctness (follow-up audit, 2026-08-02)

| ID | Test Case | File | Sev | Issue |
|----|-----------|------|-----|-------|
| 140 | Sports management has no club scoping at all | `app/dashboard/sports/page.tsx:16-42,152-186` | Critical | The page fetches the *full platform club list* into a plain dropdown and is gated only by `requireAdmin` (satisfied by any plain club admin, not just system owners) — unlike every sibling settings page, it never uses `activeClubId`. A club-A admin can pick club B from the dropdown and silently overwrite club B's sports/team integration. |
| 141 | Three uncoordinated editors of the same website/design data | `app/dashboard/website/page.tsx`, `components/admin/settings/website-setup-tab.tsx`, `components/admin/settings/design-settings-tab.tsx` | High | All three load a snapshot once and save it back as a whole-object PUT with no version/ETag check. Saving a logo via admin-settings → Design, then saving an already-open `/dashboard/website` page with its stale in-memory settings, silently reverts the just-saved logo/colors — a lost-update race. |
| 142 | "Refresh League Table" is platform-wide, not club-scoped | `app/dashboard/sports/page.tsx:136-150`, `lib/api.ts:5984-5986` | Medium | The button sits inside a per-club panel next to a club selector, but the underlying call takes no clubId at all — any admin reaching this page triggers a global refresh. |
| 143 | Logo upload has no size compression, unlike hero image | `components/admin/settings/design-settings-tab.tsx:133-153` | Medium | 25MB cap with the raw file base64-encoded straight into the settings JSON PUT — the sibling hero-image uploader caps at 5MB and downsamples via canvas first. A near-25MB logo becomes a ~33MB request body, risking document-size limits. |
| 144 | Support ticket form is entirely non-functional | `app/dashboard/help/page.tsx:206-238` | Medium | Subject/Priority/Message inputs have no state wiring and the Submit button has no handler — clicking it does nothing, not even a toast. (The system-status half of the same page is real and correctly polls every 30s.) |
| 145 | Public club page fails silently | `app/clubs/[slug]/page.tsx:326-360` | Low | An empty `catch` block on the data-load call means a network/server error just renders whatever partial data exists, with no user-facing error state. |
| 146 | Club creation: no slug pre-check, server error not mapped to field | `app/dashboard/club-management/page.tsx:216-303` | Low | Only local regex validation runs before submit; a duplicate-slug rejection from the server surfaces as a generic toast instead of highlighting the slug field. Also mutates `createForm.slug` directly instead of via `setCreateForm` (works today only because it's read synchronously right after). |
| 147 | Website builder logo has no upload UI on that page | `app/dashboard/website/page.tsx:52-177` | Low | `designSettings.logo` is loaded and round-tripped on every save from this page, but only the admin-settings Design tab actually has a file input for it — inconsistent coverage between the two surfaces. |
| 148 | Sessions admin tool discards partial fetch success | `app/dashboard/sessions/page.tsx:84-102` | Low | Requires all three parallel calls (`getAllSessions`/`getSessionStats`/`getSuspiciousSessions`) to succeed before rendering any of them — one failure blanks all three with a generic toast. |

**Confirmed clean:** `settings` (personal profile + read-only club info) and `admin-settings` (club config: website/design/notifications/address/feature-limits/help/refund-policy/WhatsApp) are genuinely distinct, not duplicates — the real duplication is admin-settings' own Website/Design tabs vs. the standalone `/dashboard/website` page (BUG-141). Staff/roster management (`components/admin/club-admin-roster.tsx`) is correctly wired to real, club-scoped APIs with server-verified elevation context. `EditClubModal` correctly scopes edits per-row with no cross-club risk.

### Phase 19 — Billing, Feature & Limits: does it actually enforce anything? (follow-up audit, 2026-08-02)

> Headline answer: **hybrid system.** Feature on/off toggles are genuinely enforced app-wide (real-time socket sync, tamper-detected offline cache, fail-safe locked states — well built, 15+ pages checked). Tier *changes* and numeric *usage limits* are display/labeling only — nothing blocks a downgrade or an over-limit creation.

| ID | Test Case | File | Sev | Issue |
|----|-----------|------|-----|-------|
| 150 | Tier downgrade has no usage check | `components/admin/feature-selector.tsx:104-124` | High | Changing a club's tier (including downgrades) is a bare API call with zero check for whether the club currently exceeds the new tier's limits, and no upgrade-vs-downgrade confirmation. |
| 151 | Per-club feature/constraint editor: same gap | `components/feature-matrix/club-feature-sheet.tsx:189-256` | High | `billing_tier` and numeric `feature_constraints` (e.g. `max_merch_items`) can be lowered independently with no check against the club's actual current usage — only a feature-*dependency* guard exists, not a usage-vs-limit one. |
| 152 | Bulk tier reassignment has no confirmation or per-club check | `components/feature-matrix/bulk-feature-panel.tsx:41-57` | High | Fires immediately on click across N selected clubs — a single misclick can downgrade many clubs at once with no undo/warning. |
| 153 | Usage limits are display-only everywhere they're checked | `merchandise/page.tsx`, `gallery/page.tsx`, `content/page.tsx`, `leaderboard/page.tsx`, `volunteer-management/page.tsx`, `components/feature-gate/usage-meter.tsx` | High | `getFeatureConstraint()` is consumed only by a pure progress-bar component with no `disabled`/callback — none of the actual create handlers read the constraint before calling the create API. A club at or over its limit can keep creating without any frontend block. `coupons/page.tsx` doesn't even fetch its `max_coupons` constraint. |
| 154 | Three overlapping backend namespaces for the same club billing/feature data | `lib/api.ts:4819-4958` vs `:6701-6735` vs `:6561-6583` | Medium | `/club-features/*`, `/feature-selector/*`, and `/feature-limit-requests/*` all independently read/write overlapping tier and constraint data, including two separate tier-mutation endpoints with no visible frontend reconciliation between them. |
| 155 | Two independent "MRR" numbers that can legitimately disagree | `billing-tiers/page.tsx:143`, `feature-matrix/page.tsx:131,234` vs `reports/subscription-billing/page.tsx:116,124-129` | Medium | One is a live, real-time tier+add-on *estimate*; the other is actual generated invoice records. Both are presented as "what clubs owe" with no UI distinction between estimated-live and actually-invoiced-historical. |
| 156 | Two independent implementations of the billing-alerts feature | `app/dashboard/billing-auditor/page.tsx` vs `components/admin/billing-auditor-dashboard.tsx` | Low | Same class of issue as BUG-093 (three admin-audit implementations) — both hit identical endpoints from separate code, so a fix to one won't propagate. |
| 157 | "Unresolved Alerts" stat is hardcoded to 0 | `app/dashboard/billing-tiers/page.tsx:49` | Low | `unresolvedAlerts: 0, // TODO: fetch from auditor` — always renders 0/green regardless of the real count, even though the real count is correctly fetched elsewhere in the same feature set. |

**Confirmed clean:** `handleResolve` on the billing auditor is genuinely read-only (flips a resolved flag, no cross-club risk, no downstream billing action). The feature on/off toggle system (`useClubFeatures`/`isFeatureEnabled`) is real, not cosmetic. `billing-settings` doesn't configure payment/tax/invoicing (the audit's initial premise didn't match this codebase) — it's a system-owner-only pricing/bundle/limit config screen with reasonable range validation on what it does store. The WhatsApp billing credit/debit note action is the one place a UI action here does something consequential to money owed, and it's reasonably guarded client-side.

**Severity totals — all phases combined: 32 Critical · 35 High · 54 Medium · 35 Low · 1 Info** (157 total: 74 from Phases 1-11 + 26 from the RBAC/reports/audit-log follow-up + 2 from Phase 14 + 55 from Phases 15-19)

**Not covered by any pass**: live payment completion with Razorpay test cards, mobile responsiveness, dark-mode visual regressions, Firebase/Socket.io behavior under real network conditions, and — the common thread across many Critical/High findings above (BUG-121, 122, 133, 150-153, and others) — whether the backend independently re-validates client-computed amounts, signatures, roles, and limits. None of that is verifiable from this frontend-only repo; it needs either backend source access or a live 4-role (System Owner / Club Admin / Member / Vendor) test session.

---

## Fix Log

### Batch 1 — missing/wrong RBAC guards (2026-08-02)

First fix pass: the subset of findings that were purely "add or correct a `<ProtectedRoute>` guard," with no product ambiguity and no backend dependency. Verified with `npx tsc --noEmit` across every touched file — zero new type errors introduced (see note on BUG-075 below for the one pre-existing issue the typecheck surfaced).

| ID | Fix |
|----|-----|
| BUG-013 / BUG-014 | Deleted `app/dashboard/admin/add-member-demo/` outright (confirmed zero references anywhere in the codebase first) rather than gating it — it was explicitly leftover demo copy that shouldn't exist in production. |
| BUG-075 | Added `<ProtectedRoute requireSystemOwner>` to `/dashboard/sessions`. **New finding surfaced while fixing this**: `npx tsc --noEmit` shows the page calls six `apiClient` methods that don't exist anywhere in `lib/api.ts` (`getAllSessions`, `getSessionStats`, `getSuspiciousSessions`, `forceLogoutSession`, `forceLogoutUser`, `cleanupExpiredSessions`) — pre-existing, not introduced by this fix. This page was already non-functional at runtime regardless of who could reach it (the project's `next.config.mjs` has `typescript.ignoreBuildErrors: true`, so this never blocked a build). Needs its own fix pass — not attempted here since it requires knowing the real backend endpoint shapes. |
| BUG-076 | Added `<ProtectedRoute requireAdmin>` around `RefundsPage`'s existing `<Suspense><RefundsPageInner /></Suspense>`. |
| BUG-077 | Added `<ProtectedRoute requireAdmin>` **and** a real clubId-ownership check (`buildAccessibleClubs(user)` from `lib/clubContext.ts`, same helper the account-switcher uses) — an admin whose accessible clubs don't include the URL's `clubId` now sees an "Access denied" state instead of the club's ticket requests, and the fetch itself is gated on that check too. |
| BUG-078 | `billing-tiers/page.tsx` and `billing-tiers/[clubId]/page.tsx`: `requiredRole="admin"` → `requireSystemOwner`. Since system owners have blanket cross-club access by design, this also closes the adjacent "no clubId ownership check on the `[clubId]` variant" concern raised alongside it — there's no ownership boundary to enforce once only system owners can reach it. |
| BUG-079 | Added `<ProtectedRoute requireAdmin>` to both return branches of `/dashboard/volunteer-management`. |
| BUG-080 | Added `<ProtectedRoute requireAdmin>` to all three return branches of `/dashboard/website`. |
| BUG-082 | Root-caused, not just patched: the issue wasn't a missing wrapper, it was that each page's data-fetching `useEffect` fired unconditionally on mount regardless of what the later conditional `return` decided to render. Fixed by gating the `useEffect`s themselves on `!authLoading && user?.role === "system_owner"` in `billing-auditor`, `billing-settings`, and `feature-matrix` (two effects there — the alert-count fetch and the club-matrix fetch) — the network calls no longer fire at all for a non-system-owner, not just the rendering. |
| BUG-083 | Added `<ProtectedRoute requireAdmin>` to `/dashboard/redemption/settings`. |
| BUG-084 | Added `<ProtectedRoute requireAdmin>` to `/dashboard/redemption/member/[id]`. |
| BUG-085 | Added `<ProtectedRoute requireAdmin>` to `/dashboard/events/revenue-reconciliation`. |
| BUG-087 | Added `<ProtectedRoute requireAdmin>` to `/dashboard/events/create` (wrapping the existing `Suspense`) and split `/dashboard/clubs/[clubId]/page.tsx` into an inner component + a `ProtectedRoute`-wrapped default export (that page had three separate top-level returns with no shared wrapper, so the split was the smallest diff). |
| BUG-140 | Root-caused: for a plain club admin, `/dashboard/sports` now builds its club list from `buildAccessibleClubs(user)` (their own clubs only) instead of calling `getClubs({ limit: 200 })` (every club on the platform). System owners still get the full platform list, since cross-club management is legitimate for that role. Added a matching guard in `handleSave` as defense-in-depth in case `selectedClubId` is ever set to something outside the visible list. `BUG-142` (the platform-wide "Refresh League Table" button) was **not** fixed — the underlying `refreshLeagueTables()` API takes no clubId parameter at all, so a real fix needs a backend change, not just a frontend guard. |

**Not fixed in this batch** (deferred, with why): BUG-068/074 (`middleware.ts` has no role-based check at all) — this app carries its JWT in `localStorage`, not a cookie, so Edge middleware has no role-bearing session to read; a real fix means changing how the session is carried (a cookie-based or signed-role-cookie approach), not a one-line patch, and affects the whole auth architecture. BUG-020/021 (membership card QR/PDF), BUG-131/132 (no cancel/refund path for memberships), BUG-042/049/050/055 (store/forum/match-center/travel are hardcoded mock pages) — all of these are missing *features*, not broken guards; building them is a product-scoped decision, not a bug fix. Anything requiring backend re-validation (BUG-121, 122, 133, 150-153, etc.) can't be fixed from this frontend-only repo at all.

### Batch 2 — targeted correctness/security fixes (2026-08-02)

Second pass: individually-scoped Critical/High findings that were fixable from the frontend alone, no product decision required. Verified with `npx tsc --noEmit` — zero new type errors in any touched file.

| ID | Fix |
|----|-----|
| BUG-002 | `app/delete-account/page.tsx`: `{""}` → `{" "}` — the missing-space typo before the support email link. |
| BUG-027 / BUG-028 | Deleted `app/clubs/[slug]/purchase/` (and its empty `success`/`failure` subdirectories) — confirmed zero references anywhere first. It contained no `page.tsx` at any level; the real purchase flow lives at `/clubs/[slug]/membership`. |
| BUG-072 | Root cause fixed, not patched per-page: `ApiClient.request()` never threw on non-OK responses, so the app's existing 401-based auto-logout `catch` blocks were dead code. Added a `SESSION_EXPIRED_EVENT` custom event (`lib/api.ts`) dispatched whenever a request with a token gets a 401 back, **excluding** the known endpoints where a 401 is an expected, non-fatal outcome (OTP send/verify/resend, `role-switch/switch`, and the three profile-discovery endpoints `checkAuth()` deliberately probes). `contexts/auth-context.tsx` now listens for that event and calls the existing `logout()`. One global fix closes the gap for every page, instead of auditing each 401-handling call site individually. |
| BUG-090 | `app/dashboard/orders/page.tsx`: `isAdmin` check now includes `system_owner` — a system owner previously saw no order data on this page at all. |
| BUG-105 | `app/dashboard/events/scanner` now reads `?eventId=` (already sent by the events list's "Scan QR" link) and forwards it to the attendance page. `app/dashboard/events/attendance` compares the scanned ticket's `preview.eventId` against the expected one and blocks with a clear message on mismatch, instead of accepting any valid ticket regardless of which event's scanner session it came from. |
| BUG-112 / BUG-113 | Same file, fixed alongside 105 since they're the same flow: attendance marking now also checks the backend's structured `response.code === 'ALREADY_SCANNED'` (in addition to the existing message-string match, matching the more defensive pattern already used in the vendor scanner), and the "Mark Attendance" button is now actually `disabled` (with an "Already Attended" label) when the preview already shows `attended: true`, instead of staying clickable. |
| BUG-036 | `components/modals/venue-tier-cart-modal.tsx`'s four Razorpay handlers: the `verify-payment` fetch was `.catch(() => {})` with the result fully discarded, silently and inconsistently with the sibling `event-checkout-modal.tsx`. Made all four match that file's already-documented, intentional pattern: log a warning on failure but don't block booking, with a comment explaining why (the endpoint is stateless — no DB write — and the actual security boundary is the backend booking endpoint re-validating the signature server-side). |
| BUG-114 | `app/dashboard/external-ticketing/admin/page.tsx`: the status-change handler now checks `resp.success` before showing "Status updated" — a rejected update no longer reports success. |

**Assessed and intentionally left unchanged**: BUG-111 (`event-checkout-modal.tsx`) turned out, on reading it, to already be the *correct*, documented reference pattern (comment explicitly explains the backend re-verifies) — the audit flagged it without weight given to that in-code rationale; no change made. BUG-121/122 (merchandise `checkout-modal.tsx` posts straight to the payment-status PATCH with no client-side `verify-payment` call at all) was reconsidered rather than papered over: adding a client-side verify call here wouldn't close the actual gap, since a malicious client can simply skip calling it and hit the PATCH endpoint directly — the real fix has to be that backend endpoint independently re-validating the Razorpay signature before marking an order paid, which is outside this repo. Adding a cosmetic frontend check would risk implying it's fixed when it isn't, so it's left as an explicitly open, backend-owned item.

**Not fixed in this batch**: BUG-107 (dashboard-staff using the vendor quick-scanner get no wrong-event check, since `activeAssignment` is only populated for vendors) — would need a staff-facing event-assignment concept that doesn't currently exist in that flow; a real fix is closer to a small feature than a bug patch, so it's deferred rather than rushed.

### Batch 3 — auth-redirect gap and scattered correctness fixes (2026-08-02)

Third pass: closed the specific part of BUG-004/005 that *was* fixable from the frontend (the shared dashboard shell had no auth check at all, unlike the `middleware.ts` cookie-architecture gap in BUG-068/074, which is still deferred), plus a batch of small, independently-scoped correctness/security bugs that needed no product decision. Verified with `npx tsc --noEmit` — zero new type errors in any touched file (pre-existing errors are all in files this batch didn't touch: `dashboard/sessions`, `comment-section.tsx`, `news-comment.tsx`, `news-like-button.tsx`, `admin-leaderboard.tsx`, already noted as unrelated pre-existing gaps).

| ID | Fix |
|----|-----|
| BUG-004 / BUG-005 | Root-caused the frontend-fixable half: `components/dashboard-layout.tsx`'s shared shell never checked auth state at all. Added an effect that `router.replace('/login')`s once `useAuth()` finishes loading with no user, and gated the chrome's render behind `authLoading \|\| !isAuthenticated` (a spinner, matching `ProtectedRoute`'s own loading state) so the sidebar/nav never flashes for a logged-out visitor. This closes the gap for every dashboard page that doesn't separately wrap itself in `<ProtectedRoute>`. The other half of BUG-004 — `middleware.ts` has no redirect either — is still the deferred edge-cookie-vs-localStorage-JWT architecture issue from Batch 1, unchanged. |
| BUG-006 | `components/protected-route.tsx`: unauthenticated redirect target `"/"` → `"/login"`, consistent with the fix above. |
| BUG-029 / BUG-030 | Deleted `app/payment/success/` and `app/payment/failure/` — confirmed empty (no `page.tsx`) and zero references anywhere in the codebase first, same dead-route pattern as BUG-027/028 in Batch 2. |
| BUG-031 / BUG-032 | `verify-payment` and `verify-subscription` routes: HMAC signature comparison now uses `crypto.timingSafeEqual` over equal-length buffers (falling back to `false` on a length mismatch, since `timingSafeEqual` throws rather than returning false for unequal lengths) instead of `===`, closing the timing side-channel. |
| BUG-046 | `redemption-settings-tab.tsx`: `handleSave` now validates `points`/`currencyAmount`/`expiryMonths` with `Number.isFinite` before building the payload and shows an error toast instead of silently sending `NaN` (the field defaults to `undefined` before the settings load, so `Number(undefined)` is the actual `NaN` source, not `Number("")` which is `0`). |
| BUG-048 | `app/dashboard/redemption/member/[id]/page.tsx`: wrapped the fetch in `try/catch/finally` so a thrown error surfaces a toast and always resets `loading`, and the `loading` state (previously computed but never rendered) now actually gates a loading placeholder. |
| BUG-058 | `volunteer-management/page.tsx`'s `OpportunityForm`: edit mode now seeds the date field from `initialData.date` instead of always defaulting to today, and `handleSubmit` preserves the first slot's `_id`/`volunteersAssigned` and any slots beyond index 0 instead of rebuilding a single fresh slot from scratch — the previous code both reset the date and silently dropped extra slots and existing volunteer assignments on every save. |
| BUG-094 / BUG-095 | `reports/member-directory/page.tsx` and `reports/admin-audit/page.tsx`: added the `Array.isArray(res.data.data) ? res.data.data : []` guard already used by every sibling report (per `REPORT_PAGE_PATTERN.md`'s own note that these two were the exceptions), preventing the documented "data.map is not a function" crash. |
| BUG-097 | `reports/reward-points-granted/page.tsx`: fixed the double-encoded UTF-8 mojibake (`Ã¢â‚¬â€`) back to `—` in both empty-value fallbacks. |
| BUG-117 | `events/create/page.tsx`'s `enableMultiTicketMatrix`: now clears `maxAttendees` when multi-ticket mode is switched on (it was already cleared on switch-off), so a leftover single-ticket cap can no longer silently coexist with the tier matrix's real capacity in the submit payload. |

**Not fixed in this batch**: BUG-009 (`/dashboard/clubs` has no `page.tsx`) — investigated and left alone: zero nav links point at the bare path anywhere (`dashboard-layout.tsx`'s only nearby link, "Browse Clubs", is commented out and pointed at a different route anyway), so unlike BUG-027/028/029/030 this isn't a stray dead directory to delete, and building a real listing page here is a product decision (what should it show, who's it for) rather than a bug fix.

### Batch 4 — raw-fetch cleanups, dead debug code, and scattered correctness fixes (2026-08-03)

Fourth pass: continued down the list picking frontend-only, no-product-ambiguity findings — mostly the "raw `fetch()` instead of `lib/api.ts`" and "silently swallowed error" family, plus a few standalone correctness/UX bugs. Verified with `npx tsc --noEmit` — zero new type errors in any of the 15 touched files.

| ID | Fix |
|----|-----|
| BUG-022 | `MembershipPlansClient.tsx`'s `load()` now has a `catch` (previously only `finally`) so an API failure is a handled state (`club` stays `null`, surfacing the existing "Club not found" card) instead of an unhandled promise rejection. |
| BUG-037 | `app/dashboard/admin/refunds/page.tsx`: replaced all 7 raw `fetch()` + manual `localStorage` token call sites with `apiClient` calls. Reused the 4 existing-but-unused methods (`listRefundsAdmin`, `getRefundRecalculate`, `markRefundProcessed`, `getRefundPolicyModalAnalytics`) and added 3 new ones (`getRefundPolicyText`, `updateRefundPolicyText`, `updateRefundGrandfathering`) for the endpoints that had no wrapper yet. Along the way, fixed a latent bug in the 4 reused methods: their declared return types assumed a flat response body, but the original raw-fetch code proved (via its own `data.data.refunds` etc. access) that this backend route family nests payloads under an extra `data` key — so the dormant methods would have silently returned the wrong shape the first time anything called them. Added the same unwrap-if-nested pattern already used by `getEventRefundPolicy`. This also gives the page BUG-072's global 401-triggers-logout handling, which raw `fetch()` bypassed entirely. |
| BUG-059 | Deleted the "Debug Volunteers" button in `volunteer-management/page.tsx` — its `onClick` called `apiClient.debugVolunteers()` and did nothing with the response (no logging, no UI update), a dead leftover. |
| BUG-062 | `admin-volunteer-list.tsx`: raw `fetch()` + manual token → `apiClient.getVolunteers({ club: clubId })`, the existing unused wrapper for the same endpoint. |
| BUG-063 | `volunteer-opt-in-widget.tsx`: all 3 raw `fetch()` calls → the existing `apiClient.getVolunteerProfile`/`createVolunteerProfile`/`updateVolunteerProfile`. Also corrects a latent payload bug found while doing this: the raw fetch sent `club: clubId`, but the wrapper's (and backend's) actual field name is `clubId` — the old code was likely failing to resolve the club context on profile create/update. |
| BUG-066 | `app/api/honeypot/route.ts`: uncommented the trigger log (trimmed to ip/userAgent/timestamp/url — dropped the full raw-headers dump from the original commented block, since logging every header, potentially including cookies, to server logs is unnecessary exposure for what this endpoint needs). |
| BUG-073 | Removed all flagged `console.log` debug statements: `dashboard/page.tsx`, `league-table-widget.tsx`, `guess-the-score/page.tsx` (5 statements tracing socket lifecycle), and `event-fee-management-section.tsx` (8 statements, including the one dumping the full API response via `JSON.stringify`). |
| BUG-102 | `dashboard-layout.tsx`'s `handleRoleSwitch`: added `router.refresh()` after the role-switch navigation, matching `handleClubSwitch`'s existing pattern, so no stale Next.js router-cached data from the previous account can linger. |
| BUG-110 | `app/clubs/[slug]/events/[eventSlug]/page.tsx`: the list→detail hydration merge now actually preserves `platformFeePercent` from the list response as its own comment already claimed, instead of letting the later `...fullRes.data` spread silently overwrite it. |
| BUG-125 | `checkout-modal.tsx`'s `handleSubmit`: added a `submittingRef` guard checked synchronously at the top of the handler (the `loading` state alone doesn't protect against a fast double-click, since state updates aren't synchronous within the same event handler). |
| BUG-126 | `checkout-modal.tsx`'s points "Reserve" button: added `disabled={reserving}` — the state already existed and was being set, just never wired to the button. |
| BUG-127 | `app/dashboard/orders/page.tsx`'s "Cancel Order": now opens a confirmation dialog (mirroring the existing "Mark as Refunded" dialog already in the same dropdown) instead of firing immediately on click, and `handleCancelOrder` now guards against concurrent calls and disables the dialog's confirm button while in flight. |
| BUG-145 | `app/clubs/[slug]/page.tsx`'s `loadClubData`: empty `catch {}` → a toast, so a failure partway through (e.g. after `club`/`settings` already loaded successfully but `loadContent` throws) tells the user something didn't load instead of silently rendering an incomplete page with no signal. |
| BUG-146 | `club-management/page.tsx`'s `handleCreateClub`: replaced the direct `createForm.slug = slugValue` mutation with a local `formToSubmit` object built via `setCreateForm`, and switched the rest of the validation block and the `createClub` payload to read from it — removes the reliance on same-tick object-mutation-then-reread, which happened to work today only because nothing re-rendered in between. |

**Not fixed in this batch**: BUG-065 (rate limiters defined but never wired to any endpoint) — deciding which endpoints get which limiter is a product/security-posture decision, not a mechanical fix. BUG-089 (help page role check) — flagged by the audit itself as needing a product sanity check on intended access, not a clear-cut bug. BUG-108 (no refund-rejection path in the admin UI) and BUG-123/124 (orphaned orders on modal dismiss, swallowed reservation confirm/cancel failures) — all need a new UI flow or backend coordination, not a scoped patch.

---



## Bug Report Log

> Copy and fill this template for each bug found during live manual testing (separate from the code-audit findings above).

```
BUG #:
Phase: [e.g. Phase 5 — Payments]
Test Case: [e.g. 5.2 verify-payment]
Steps to reproduce:
  1.
  2.
  3.
Expected result:
Actual result:
Console error (if any):
Screenshot path:
Severity: [ ] Critical  [ ] High  [ ] Medium  [ ] Low
Status: [ ] Open  [ ] Fixed  [ ] Won't Fix
```

---



## Progress Tracker


| Phase                              | Total   | Done  | Status                                                                           |
| ---------------------------------- | ------- | ----- | -------------------------------------------------------------------------------- |
| Phase 1 — Public Pages             | 18      | 0     | Code-audited — 3 issues (BUG-001–003)                                            |
| Phase 2 — Auth & Onboarding        | 11      | 0     | Code-audited — 5 issues, 2 Critical (BUG-004–008)                                |
| Phase 3 — Club & Member Mgmt       | 13      | 0     | Code-audited — 11 issues, 3 Critical (BUG-009–019)                               |
| Phase 4 — Membership Plans & Cards | 10      | 0     | Code-audited — 7 issues, 2 Critical (BUG-020–026)                                |
| Phase 5 — Payments                 | 13      | 0     | Code-audited — 11 issues, 4 Critical (BUG-027–037)                               |
| Phase 6 — Events                   | 11      | 0     | Code-audited — 4 issues, 2 Critical (BUG-038–041)                                |
| Phase 7 — Store & Orders           | 8       | 0     | Code-audited — 7 issues, 2 Critical (BUG-042–048)                                |
| Phase 8 — Engagement               | 16      | 0     | Code-audited — 6 issues, 2 Critical (BUG-049–054)                                |
| Phase 9 — Volunteers & Travel      | 4       | 0     | Code-audited — 10 issues (BUG-055–064)                                           |
| Phase 10 — Real-Time & APIs        | 8       | 0     | Code-audited — 3 issues, mostly clean (BUG-065–067)                              |
| Phase 11 — Edge Cases & Security   | 11      | 0     | Code-audited — 7 issues, 4 Critical (BUG-068–074)                                |
| **TOTAL**                          | **123** | **0** | **74 code-audit findings — live manual testing (Done column) still not started** |


