# Events Feature — End-to-End Documentation

## Overview

The Events feature is the core engagement tool in RallyUp, allowing clubs to create, manage, and monetize events. Members discover upcoming events, register (free or paid), receive digital QR tickets, check in at the venue, and optionally request refunds.

**Platforms:** Web (Next.js 15), Mobile App (React Native/Expo), Backend API (Express/TypeScript)

---

## 1. Architecture & Tech Stack

| Layer | Technology | Key Files |
|-------|-----------|-----------|
| **Backend** | Express + TypeScript + Mongoose | `src/models/Event.ts`, `src/controllers/eventController.ts`, `src/routes/eventRoutes.ts`, `src/services/eventService.ts` |
| **Web Frontend** | Next.js 15 App Router + Tailwind CSS | `app/dashboard/events/*`, `app/dashboard/user/events/*`, `app/events/*`, `components/modals/event-*.tsx` |
| **Mobile App** | React Native / Expo | `app/(tabs)/(user)/events/*`, `app/(tabs)/(admin)/admin-events/*` |
| **Payments** | Razorpay SDK | Order creation, verification, refunds |
| **Real-Time** | Socket.io | Live refund policy updates, registration status changes |
| **Notifications** | SendGrid (email) + In-App + WhatsApp | Registration confirmations, reminders, waitlist notifications |
| **Storage** | AWS S3 | Event poster images (400px list + 1080px detail variants) |

---

## 2. Roles & Permissions

Events use the **Permission Matrix** system (`src/utils/permissionMatrixDefinition.ts`):

| Admin Tier | Events Module Access |
|-----------|---------------------|
| **super_admin** | Full view + edit |
| **sub_admin** | Full view + edit |
| **events_manager** | View + edit (dashboard, events, gallery, external ticketing) |
| **vendor** | Scanner only (`eventScanner`) + read-only vendor reports |
| **venue_partner / store_manager** | No events access |
| **content_manager** | No events access |

**Feature Gating:** Events are gated behind the `events` club feature flag. If disabled, admin dashboard shows `LockedFeaturePage` with upgrade prompt.

---

## 3. Admin: Event Management (Dashboard)

### 3.1 Events List (`/dashboard/events`)

- **Data Source:** `apiClient.getEventsByClub(clubId)` → `GET /api/events/club?clubId=xxx`
- **Columns:** Event (image + title + description + price), Category, Date & Time, Location, Attendance count, Status (Active/Inactive/LIVE/Refundable), Actions
- **Filters:** Search (title/description/venue), Category dropdown, Status (Active/Inactive), Time (Upcoming/Live/Past)
- **Actions (dropdown):** Edit, Duplicate, Scan QR, Activate/Deactivate, Toggle Refunds, Refund Report, Delete

### 3.2 Create/Edit Event — 3-Step Wizard (`/dashboard/events/create`)

**Step 1: Event Details**
- Title, Category (13 categories), Currency
- Start/End time (datetime-local pickers)
- Description
- Event Poster (optional dual-upload: 400px list + 1080px detail, max 10MB each)
- Joint Screening toggle (partner with other clubs)

**Step 2: Pricing & Logistics**
- Multi-ticket toggle — enables Venue-Tier matrix builder
- Single mode: Venue name, Ticket price, Max attendees
- Multi mode: `VenueTierMatrixBuilder` with per-venue tiers, allocations, club allocations
- Fee Handling: `pass_to_buyer` (default) vs `absorb` (financial-admin gated)
- Refund Policy: Toggle on/off, Cutoff hours, Refund tiers (graduated % schedule)

**Step 3: Schedule & Publish**
- Booking window (open/close times)
- Members-only toggle
- Attendance Points (awarded upon QR scan)
- Waitlist: Enable + size % + purchase window hours
- Early Bird Discount: Type (% or fixed), value, schedule, members-only
- **Preview sidebar** (`EventCreatePreview`) — live preview as admin fills form

**Submission Flow:**
1. Validate all steps
2. `POST /api/events` (create) or `PUT /api/events/:id` (update)
3. If images uploaded → `POST /api/events/:id/image` (multi-part with `image400`/`image1080` fields)
4. On successful create → bulk email + in-app notification to all club members
5. Redirect to `/dashboard/events`

**Duplicate Mode:** Pre-fills form from source event, prepends "Copy of" to title, clears image reference.

### 3.3 Event Image Upload

- Endpoint: `POST /api/events/:id/image` (multipart: `image`, `image400`, `image1080`)
- Generates WebP variants stored on S3 with UUID-based keys
- `imageVersion` is incremented on each upload → CDN cache invalidation
- Real-time push via socket `event:image-updated`
- Delete: `DELETE /api/events/:id/image` — removes S3 objects

### 3.4 Toggle Event Status

- `PATCH /api/events/:id/toggle-status` with `{ isActive: boolean }`
- Deactivated events are hidden from public listings but remain in admin dashboard

### 3.5 Delete Event

- `DELETE /api/events/:id` — permanently removes the event document

---

## 4. Admin: Refund Policy Management

### Refund Policy Toggle (`RefundPolicyToggle` component)

Admins can enable/disable refunds per event via the dropdown menu. Changing refund policy mid-event:
1. Triggers `RefundPolicyImpactDialog` warning about live ticket holders
2. Requires a `refund_policy_change_reason` (audited)
3. `PATCH /api/events/:id/refund-policy`
4. Policy changes are broadcast via socket `event:refund-policy-updated`
5. Changes are logged in `EventMetadata` collection with full audit trail (`GET /api/events/:id/refund-policy/history`)

### Refund Tiers

Admins can configure graduated refund schedules per event:
```ts
refundTiers: [
  { hoursBefore: 72, refundPercentage: 100 },  // 100% refund 3+ days before
  { hoursBefore: 24, refundPercentage: 50 },   // 50% refund 1+ day before
]
```

### Policy at Purchase Snapshot

Each registration captures the refund policy in effect at time of purchase (`policyAtPurchase`), grandfathering buyers from retroactive policy changes.

---

## 5. Admin: Fee Management

- **pass_to_buyer:** Payment gateway fees + platform fees are added to ticket price at checkout
- **absorb:** Club absorbs fees; buyer pays base price only
- **Constraint:** Only Primary Owners / Financial Admins can toggle. Once the first ticket is sold, the fee model is LOCKED.
- Fee reminder dialog shown on change

---

## 6. Admin: Attendance & QR Scanning

### QR Scanner (`/dashboard/events/scanner`)

Built with `@zxing/browser`:
1. Requests camera permission, auto-selects rear camera
2. Decodes QR codes from ticket URLs: `https://...?registrationId=xxx&attendeeId=yyy`
3. Parses `registrationId` + `attendeeId` from URL params
4. Navigates to attendance confirmation page

**Manual Entry:** Paste full ticket URL as fallback when camera is unavailable.

### Attendance Confirmation (`/dashboard/events/attendance`)

1. `GET /api/events/scan-preview?registrationId=xxx&attendeeId=yyy` — fetches attendee name, event title, venue items, ticket details
2. Shows "Confirm Ticket" card with attendee info + venue/tier details
3. Admin clicks "Mark Attendance" → `POST /api/events/scan` 
4. On success: Points awarded notification, navigate to scanner for next scan
5. Edge cases: Already attended (shows yellow warning), cancelled ticket (error), wrong venue (reject & rescan)

### Attendance Award Flow

When attendance is marked:
1. `Attendance` record created (prevents duplicate points)
2. `PointAdjustment` recorded
3. `PointBatch` created with `sourceType: 'attendance'`
4. In-app notification + leaderboard update via `incrementUserAttendance`
5. Points capped at: `min(ticketValue, membershipPlan.price)` per transaction

---

## 7. Admin: Revenue Reconciliation (`/dashboard/events/revenue-reconciliation`)

- Groups event registrations by `attributed_club` (for joint screening events)
- Shows total revenue, ticket count per partner club
- Data from `GET /api/events/revenue-reconciliation`
- Used by clubs to settle revenue splits from joint events

---

## 8. Member: Browsing & Discovery (`/dashboard/user/events`)

- **Data Source:** `GET /api/events/public?clubId=xxx` (authenticated) or `api/events/public` (unauthenticated)
- Displays:
  - **My Waitlist Status** cards (position, status, purchase/decline actions)
  - **Ongoing Events** section (events user registered for that are happening now)
  - **Upcoming Events** grid (sorted chronologically) with capacity bars, pricing, category badges
  - **Past Events** grid (collapsed with event count)
- Filters: Search + Category dropdown
- Key utilities: `formatEventPriceDisplay()`, `getEventCapacity()`, `isEventPaid()`, `hasVenueTierMatrix()`

---

## 9. Member: Event Detail (Public Page `/clubs/[slug]/events/[eventSlug]`)

SEO-friendly public event page showing:
- Hero banner (1080px variant with lazy loading)
- Breadcrumb navigation
- Event info sidebar: Date, Time, Venue, Booking window, Reward points, Capacity, Ticket price
- Tickets section (venue × tier breakdown)
- Refund Policy Badge (live via socket updates)
- "Buy Tickets" / "Register Now" CTA (greys out when full)

---

## 10. Member: Registration & Checkout

### Free Events
1. User clicks "Register"
2. `POST /api/events/:id/register` with attendee details
3. Instant confirmation

### Paid Events — Venue-Tier Cart Flow (`VenueTierCartModal`)
1. User selects venue + tier combinations with quantity
2. Real-time allocation check (`tier.allocation - tier.sold`)
3. Joint screening club selection (for partnered events)
4. Apply coupon code → validated server-side
5. Calculate platform fees (4.5%) + PG fees (2%) + GST (18%)
6. Points redemption (loyalty points capped per transaction)
7. Create Razorpay order → launch checkout SDK
8. Pending registration created → payment verification → registration confirmed
9. `POST /api/events/:id/book-matrix` for Venue-Tier checkout

### Guest Registration (Public Events)
- Guests register via `POST /api/events/public/:id/register`
- Requires name + phone + optional email
- Phone-deduplication check on attendee numbers
- Walk-in phone registration flow: `GET /api/events/public/:id/check-registration-by-phone`

### Pending Registration Flow
- `POST /api/events/:id/register/pending` — creates a pending entry
- On Razorpay success webhook → `POST /api/events/:id/register` with `orderID` to confirm
- Atomic `findOneAndUpdate` with `$elemMatch` guard prevents double-confirmation

### Registration Validation
- Event must be active
- Member-only events require active membership
- Booking window must be open
- Event cannot be full (unless waitlist purchase)
- No duplicate phone numbers per registration
- No duplicate confirmed registrations per user

---

## 11. Member: Waitlist Flow

1. User joins waitlist when event is full: `POST /api/events/:id/waitlist`
2. Waitlist entry created in `EventWaitlist` model with position
3. When spots open (cancellation or capacity increase):
   - `onRegistrationCancelled` or `onCapacityIncreased` triggers advancement
   - Notified users get a `purchaseToken` + time-limited purchase window
4. User purchases via deep link: `/dashboard/user/events?eventId=xxx&waitlistToken=yyy`
5. `validatePurchaseToken` checks expiry + ownership
6. User can decline: `POST /api/events/:id/waitlist/decline` → next person notified
7. Waitlist status shown in dashboard "My Waitlist Status" section

---

## 12. Member: Cancellation & Refunds

### Refund Estimation Flow
1. User clicks refund/cancel on their event card
2. `GET /api/refunds/estimate` with `{ sourceType: 'event_ticket', eventId }`
3. System checks `policyAtPurchase`, `isRefundAllowed`, `refundCutoffHours`
4. If multi-attendee → `AttendeeTicketSelectModal` to pick which ticket
5. Shows `RefundConfirmationModal` with estimated refund amount + deduction breakdown

### Refund Policy Checks
- Non-refundable event (`isRefundAllowed = false`) → blocked with "Policy restriction" toast
- Event cancelled by club → auto-processing message
- Refund window closed (past `refundCutoffHours` before event) → blocked with "window closed" toast
- Free events → direct cancellation (no refund estimate)

### Refund Request
- `POST /api/refunds/request` with `{ sourceType: 'event_ticket', eventId, attendeeId }`
- Successful: toast "Refund will be processed in 5-7 working days"
- Attendee cancellation uses `eventAttendeeCancellationService` for per-ticket granularity

### Admin-Initiated Cancellation
- `POST /api/events/club/registrations/:registrationId/cancel` — admin can cancel any registration with optional reason
- Requires `attendeeId` when cancelling one of multiple tickets
- Releases seats → triggers waitlist advancement

---

## 13. Joint Screening Events

Joint screening allows two or more clubs to co-host an event with shared seat allocation:

- Configurable via admin wizard: toggle + add partner club names
- Each tier's allocation can be split among home club + partner clubs (`clubAllocations`)
- At checkout, users select their club affiliation
- Revenue reconciliation groups registrations by `attributed_club`
- Allocation sync: when partner clubs change, seat splits are recalculated proportionally

---

## 14. Real-Time Updates (Socket.io)

| Event | Direction | Trigger |
|-------|-----------|---------|
| `event:refund-policy-updated` | Server → Clients | Admin toggles refund policy |
| `event:image-updated` | Server → Clients | Admin uploads/changes event poster |
| `ticket_status_changed` | Server → Recipient | Registration confirmed / cancelled |

---

## 15. API Endpoints Reference

### Public (optional auth / no auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/public` | List active upcoming events |
| GET | `/api/events/public/:id` | Get event by ID |
| GET | `/api/events/public/:id/image-urls` | Presigned image URLs |
| GET | `/api/events/public/:id/check-registration` | Check if user/guest is registered |
| GET | `/api/events/public/:id/check-registration-by-phone` | Check registration by phone |
| POST | `/api/events/public/:id/register` | Guest registration |
| POST | `/api/events/public/:id/register/pending` | Guest pending registration |
| POST | `/api/events/public/:id/book-matrix` | Guest venue-tier booking |

### Authenticated (Member)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/events/:id/register` | Register for event |
| POST | `/api/events/:id/register/pending` | Create pending registration |
| POST | `/api/events/:id/book-matrix` | Venue-tier checkout |
| POST | `/api/events/:id/book-matrix/pending` | Pending venue-tier checkout |
| DELETE | `/api/events/:id/register` | Cancel registration |
| GET | `/api/events/my-registrations` | User's event registrations |
| GET | `/api/events/waitlist/my-status` | User's waitlist positions |
| GET | `/api/events/waitlist/validate-token` | Validate waitlist purchase token |
| POST | `/api/events/:id/waitlist` | Join waitlist |
| POST | `/api/events/:id/waitlist/decline` | Decline waitlist offer |
| POST | `/api/events/my/registrations/:id/resend-ticket` | Resend own ticket |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/` | All events |
| GET | `/api/events/club/` | Events by club |
| GET | `/api/events/club/registrations` | All registrations for club |
| GET | `/api/events/revenue-reconciliation` | Revenue grouped by club |
| GET | `/api/events/scan-preview` | Preview before marking attendance |
| POST | `/api/events/` | Create event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| PATCH | `/api/events/:id/toggle-status` | Activate/deactivate |
| POST | `/api/events/:id/image` | Upload event image |
| DELETE | `/api/events/:id/image` | Delete event image |
| GET | `/api/events/:id/registrations` | Get event registrations |
| POST | `/api/events/scan` | QR scan attendance |
| POST | `/api/events/admin/attendance` | Manual attendance |
| GET | `/api/events/:id/refund-policy/history` | Refund policy audit log |
| PATCH | `/api/events/:id/refund-policy` | Update refund policy |
| POST | `/api/events/club/registrations/:id/resend-ticket` | Admin resend ticket |
| POST | `/api/events/club/registrations/:id/cancel` | Admin cancel registration |

---

## 16. Database Model (Mongoose `Event`)

```ts
interface IEvent {
  title: string;
  category: enum;              // 13 categories
  startTime: Date;
  endTime?: Date;
  venue: string;
  description: string;
  maxAttendees?: number;
  ticketPrice: number;
  currency: string;            // INR, USD, EUR, GBP, AUD, JPY, etc.
  requiresTicket: boolean;
  memberOnly: boolean;
  feeHandlingType: 'pass_to_buyer' | 'absorb';
  eventImage?: string;         // Full-res URL
  eventImageVariants?: {       // WebP S3 variants
    list400?: { url: string; key: string };
    full1080?: { url: string; key: string };
  };
  imageVersion: number;        // Bumped on image change → cache bust
  clubId?: ObjectId;
  isActive: boolean;
  isRefundAllowed: boolean;
  refundCutoffHours: number;   // Default 24
  refundTiers?: Array<{
    daysBefore: number; hoursBefore?: number; unit?: 'days' | 'hours';
    refundPercentage: number;
  }>;
  bookingStartTime: Date;
  bookingEndTime: Date;
  earlyBirdDiscount?: { enabled, type, value, startTime, endTime, membersOnly };
  memberDiscount?: { enabled, type, value };
  groupDiscount?: { enabled, type, value, minQuantity };
  attendancePoints?: number;
  waitlist?: { enabled, percentage, purchaseWindowHours };
  jointScreening?: { enabled, homeTeam, awayTeam, partnerClubNames[] };
  venues?: IEventVenue[];      // Multi-venue tier matrix
  registrations: IRegistration[]; // Embedded sub-documents
  currentAttendees: number;
  attendees?: ObjectId[];
  refundPolicyLastUpdated?: Date;
}
```

---

## 17. Key Flows & Edge Cases

### Registration Race Condition Prevention
- Pending registration + Razorpay webhook → atomic `findOneAndUpdate` with `$elemMatch` guard
- `pushFilter` prevents duplicate `orderID` entries: `{ 'registrations.razorpayOrderId': { $ne: orderID } }`
- If race is detected, re-reads event and returns fresh data

### Ticket Oversell Prevention
- Venue-tier matrix: atomic `$inc` with `$gte` check on allocation
- Simple events: `currentAttendees + numToAdd <= maxAttendees` before creation

### Cancellation — Partial vs Full
- Multi-attendee registrations support per-ticket cancellation
- `attendeeId` parameter required when cancelling one of multiple tickets
- `allCancelled` flag in response; triggers `syncFullyCancelledRegistrations` to clean up

### Waitlist — Capacity Increase
- When admin increases `maxAttendees`, `onCapacityIncreased` auto-notifies next N waitlisted users
- Notified users get a `purchaseToken` embedded in a deep link

### Refund Policy Changes — Grandfathering
- Each registration stores `policyAtPurchase` snapshot at time of booking
- `processEventRefundPolicyUpdate` checks for "Cannot Modify Historical Policies" if tickets are sold
- Live policy changes with ticket holders require admin acknowledgment

### Image Workflow
- Admin uploads in create/edit wizard → submitted after event save to ensure event ID exists
- S3 keys are UUID-based → no filename collisions
- `imageVersion` bump triggers `event:image-updated` socket event → instant client cache invalidation

### Guest User Handling
- Guest email fallback: `normalizePhone@guest.rallyup.local`
- Guest userId format: `guest:{normalizedEmail}`
- Guest registrations cannot be retrieved from "my registrations" (no logged-in user)
