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

| Done | Test Case | URL | Notes |
|------|-----------|-----|-------|
| - [ ] | Landing page loads, hero renders | `/` | |
| - [ ] | Clubs listing page loads | `/clubs` | |
| - [ ] | Club detail page resolves via slug | `/clubs/[slug]` | |
| - [ ] | Events public page loads | `/events` | |
| - [ ] | Membership Plans page loads | `/membership-plans` | |
| - [ ] | Merchandise page loads | `/merchandise` | |
| - [ ] | About page loads | `/about` | |
| - [ ] | Contact page loads | `/contact` | |
| - [ ] | FAQs page loads | `/faqs` | |
| - [ ] | Privacy policy page loads | `/privacy` | |
| - [ ] | Terms page loads | `/terms` | |
| - [ ] | PPSA page loads | `/ppsa` | |
| - [ ] | Refund policy page loads | `/refund` | |
| - [ ] | Child safety page loads | `/child-safety` | |
| - [ ] | Splash screen renders | `/splash` | |
| - [ ] | Affiliations page loads | `/affiliations` | |
| - [ ] | Delete Account page renders | `/delete-account` | |
| - [ ] | Invalid route returns 404 | `/xyz-invalid` | |

---

## Phase 2 — Authentication & Onboarding

| Done | Test Case | URL | Notes |
|------|-----------|-----|-------|
| - [ ] | Register new user (email + password) — Firebase user created | `/register` | |
| - [ ] | Login with valid credentials — token stored correctly | `/login` | |
| - [ ] | Login with wrong password shows error | `/login` | |
| - [ ] | Logout clears session and redirects to login | Dashboard | |
| - [ ] | Accessing `/dashboard` unauthenticated redirects to login | `/dashboard` | middleware.ts |
| - [ ] | System Owner login works | `/system-owner-login` | |
| - [ ] | Club Onboarding flow completes end-to-end | `/dashboard/onboarding` | |
| - [ ] | Notification preferences saved successfully | `/notifications/preferences` | |
| - [ ] | User profile page loads and updates | `/dashboard/user/profile` | |
| - [ ] | User settings page saves correctly | `/dashboard/user-settings` | |

---

## Phase 3 — Club & Member Management (Admin)

| Done | Test Case | URL | Notes |
|------|-----------|-----|-------|
| - [ ] | View all clubs in admin | `/dashboard/clubs` | |
| - [ ] | View specific club by ID | `/dashboard/clubs/[clubId]` | |
| - [ ] | Club management settings save | `/dashboard/club-management` | |
| - [ ] | Members list loads | `/dashboard/members` | |
| - [ ] | Add new member manually | `/dashboard/members/add` | |
| - [ ] | Admin add-member demo works | `/dashboard/admin/add-member-demo` | |
| - [ ] | Staff list loads and roles are visible | `/dashboard/staff` | |
| - [ ] | Settings page saves club config | `/dashboard/settings` | |
| - [ ] | Admin-settings panel functional | `/dashboard/admin-settings` | |
| - [ ] | Website builder saves sections | `/dashboard/website` | |
| - [ ] | Sports management CRUD works | `/dashboard/sports` | |
| - [ ] | Sessions list loads | `/dashboard/sessions` | |
| - [ ] | Help page loads | `/dashboard/help` | |

---

## Phase 4 — Membership Plans & Cards

| Done | Test Case | URL | Notes |
|------|-----------|-----|-------|
| - [ ] | Create a new membership plan | `/dashboard/membership-plans` | |
| - [ ] | Edit an existing membership plan | `/dashboard/membership-plans` | |
| - [ ] | Delete a membership plan | `/dashboard/membership-plans` | |
| - [ ] | Plans appear on public page | `/membership-plans` | |
| - [ ] | User browses available plans | `/dashboard/user/browse-plans` | |
| - [ ] | Membership card renders with QR code | `/dashboard/membership-cards` | react-qr-code |
| - [ ] | User sees their own membership card | `/dashboard/user/membership-card` | |
| - [ ] | Membership card PDF download works | `/dashboard/membership-cards` | jspdf |
| - [ ] | Create a coupon code | `/dashboard/coupons` | |
| - [ ] | Apply coupon to a plan purchase | Plan purchase flow | |

---

## Phase 5 — Payments (Razorpay)

> Use Razorpay test card: **4111 1111 1111 1111**, CVV: **123**, Expiry: any future date.

| Done | Test Case | Where | Notes |
|------|-----------|-------|-------|
| - [ ] | `POST /api/razorpay/create-order` returns `order_id` | API / Postman | |
| - [ ] | `POST /api/razorpay/verify-payment` validates signature correctly | API / Postman | |
| - [ ] | `POST /api/razorpay/create-subscription` returns `subscription_id` | API / Postman | |
| - [ ] | `POST /api/razorpay/verify-subscription` validates correctly | API / Postman | |
| - [ ] | `GET /api/razorpay/plans` returns plan list | API / Postman | |
| - [ ] | Club plan purchase flow completes → success page shown | `/clubs/[slug]/purchase` | |
| - [ ] | Club plan purchase failure is handled gracefully | `/clubs/[slug]/purchase/failure` | |
| - [ ] | General purchase success page displays | `/purchase/success` | |
| - [ ] | General purchase failure page displays | `/purchase/failure` | |
| - [ ] | Payment success page displays | `/payment/success` | |
| - [ ] | Payment failure page displays | `/payment/failure` | |
| - [ ] | Admin refund flow works | `/dashboard/admin/refunds` | |
| - [ ] | Tampered payment signature is rejected | API | |

---

## Phase 6 — Events

| Done | Test Case | URL | Notes |
|------|-----------|-----|-------|
| - [ ] | Create a new event | `/dashboard/events/create` | |
| - [ ] | Event detail page loads | `/dashboard/events/[id]` | |
| - [ ] | Edit event details | `/dashboard/events/[id]` | |
| - [ ] | Attendees list is visible | `/dashboard/events/[id]/attendees` | |
| - [ ] | Attendance marking works | `/dashboard/events/attendance` | |
| - [ ] | QR scanner page functional (camera access prompt) | `/dashboard/events/scanner` | |
| - [ ] | User views their booked events | `/dashboard/user/events` | |
| - [ ] | External ticketing admin view loads | `/dashboard/external-ticketing/admin` | |
| - [ ] | External ticketing club view loads | `/dashboard/external-ticketing/club/[clubId]` | |
| - [ ] | User external ticketing view loads | `/dashboard/user/external-ticketing` | |
| - [ ] | Public events page loads | `/events` | |

---

## Phase 7 — Store & Orders

| Done | Test Case | URL | Notes |
|------|-----------|-----|-------|
| - [ ] | Store loads with product list | `/dashboard/store` | |
| - [ ] | Add a new product | `/dashboard/store/add-product` | |
| - [ ] | Merchandise public page loads | `/merchandise` | |
| - [ ] | Dashboard merchandise page loads | `/dashboard/merchandise` | |
| - [ ] | Orders list loads for admin | `/dashboard/orders` | |
| - [ ] | User order history loads | `/dashboard/user/orders` | |
| - [ ] | Redemption settings are configurable | `/dashboard/redemption/settings` | |
| - [ ] | Redemption per-member view loads | `/dashboard/redemption/member/[id]` | |

---

## Phase 8 — Engagement Features

| Done | Test Case | URL | Notes |
|------|-----------|-----|-------|
| - [ ] | Create a poll | `/dashboard/polls` | |
| - [ ] | Vote on a poll | `/dashboard/user/polls` | |
| - [ ] | Leaderboard loads with rankings | `/dashboard/leaderboard` | |
| - [ ] | User leaderboard view loads | `/dashboard/user/leaderboard` | |
| - [ ] | Challenge page renders | `/challenge` | |
| - [ ] | Guess the score game works | `/dashboard/user/guess-the-score` | |
| - [ ] | Chants list loads (admin) | `/dashboard/chants` | |
| - [ ] | User chants view loads | `/dashboard/user/chants` | |
| - [ ] | Gallery — upload an image | `/dashboard/gallery` | |
| - [ ] | Gallery — view uploaded images | `/dashboard/gallery` | |
| - [ ] | User gallery view loads | `/dashboard/user/gallery` | |
| - [ ] | Forum loads and create a post | `/dashboard/forum` | |
| - [ ] | Content / news feed loads (admin) | `/dashboard/content` | |
| - [ ] | User news feed loads | `/dashboard/user/news` | |
| - [ ] | Match center data displays | `/dashboard/match-center` | |
| - [ ] | User members list visible | `/dashboard/user/members` | |
| - [ ] | User my-clubs page loads | `/dashboard/user/my-clubs` | |

---

## Phase 9 — Volunteers & Travel

| Done | Test Case | URL | Notes |
|------|-----------|-----|-------|
| - [ ] | Volunteer signup flow completes | `/dashboard/volunteer` | |
| - [ ] | Volunteer management admin view | `/dashboard/volunteer-management` | |
| - [ ] | Volunteers list view loads | `/dashboard/volunteers` | |
| - [ ] | Travel page loads | `/dashboard/travel` | |

---

## Phase 10 — Real-Time & Internal APIs

> Open DevTools → Network → WS tab to verify socket connections.

| Done | Test Case | How | Notes |
|------|-----------|-----|-------|
| - [ ] | Socket.io connects on dashboard load | DevTools → Network → WS | socket-context.tsx |
| - [ ] | Messaging — send a message, other session receives it in real-time | Two browser tabs | use-messaging.ts |
| - [ ] | `GET /api/internal/sports/next-matches` returns match data | API / Postman | |
| - [ ] | `POST /api/data-deletion-request` form submits successfully | `/delete-account` | |
| - [ ] | Rate limiter blocks excessive requests | `/api/rate-limit-test` | |
| - [ ] | Honeypot endpoint returns correct response | `/api/honeypot` | |
| - [ ] | Firebase reads reflect in UI without page refresh | DevTools console | |
| - [ ] | Firebase writes persist after page reload | DevTools console | |

---

## Phase 11 — Edge Cases & Security

| Done | Test Case | Notes |
|------|-----------|-------|
| - [ ] | Regular member cannot access `/dashboard/admin` routes | Should redirect |
| - [ ] | Club admin cannot access system owner routes | Check middleware.ts |
| - [ ] | Direct URL access to admin route as regular user redirects | |
| - [ ] | All forms show validation errors correctly (zod + react-hook-form) | All forms |
| - [ ] | Empty states render when no data exists (no clubs, members, events) | |
| - [ ] | Image upload enforces size and type limits | Gallery, merchandise |
| - [ ] | Session expiry triggers auto-logout and redirect | Wait for token expiry |
| - [ ] | Mobile responsiveness on all dashboard pages | DevTools → mobile view |
| - [ ] | Dark mode / theme switching works across pages | next-themes |
| - [ ] | Back button navigation works without stale data | |
| - [ ] | Console has no critical errors on any page | DevTools → Console tab |

---

## Bug Report Log

> Copy and fill this template for each bug found.

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

| Phase | Total | Done | Status |
|-------|-------|------|--------|
| Phase 1 — Public Pages | 18 | 0 | Not started |
| Phase 2 — Auth & Onboarding | 11 | 0 | Not started |
| Phase 3 — Club & Member Mgmt | 13 | 0 | Not started |
| Phase 4 — Membership Plans & Cards | 10 | 0 | Not started |
| Phase 5 — Payments | 13 | 0 | Not started |
| Phase 6 — Events | 11 | 0 | Not started |
| Phase 7 — Store & Orders | 8 | 0 | Not started |
| Phase 8 — Engagement | 16 | 0 | Not started |
| Phase 9 — Volunteers & Travel | 4 | 0 | Not started |
| Phase 10 — Real-Time & APIs | 8 | 0 | Not started |
| Phase 11 — Edge Cases & Security | 11 | 0 | Not started |
| **TOTAL** | **123** | **0** | |
