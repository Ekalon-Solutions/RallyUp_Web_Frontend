# RallyUp Web Frontend Agent Guide (AGENTS.md)

Welcome, agent! This is the memory layer for the **RallyUp_Web_Frontend** directory. Please read this file to understand the stack, architecture, and developer conventions of this project.

## Overview & Stack
This directory contains the web-based member portal and club administrator dashboard for RallyUp, a sports fan club engagement, ticketing, and merchandise checkout platform.
- **Framework**: Next.js 15 App Router (with React 18 & TypeScript).
- **Styling**: Tailwind CSS + shadcn/ui primitives (Radix UI) + Lucide icons.
- **State & Context**: React Context for Auth, Shopping Cart, Socket connections, and Club Features.
- **Third-Party Integrations**: Firebase Client SDK for user authentication, Razorpay SDK for subscription/order payments, and Socket.io-client for real-time messaging.
- **Forms & Validation**: `react-hook-form` integrated with `zod` schema resolvers.

---

## Commands
Execute these inside the `RallyUp_Web_Frontend/` directory:
- **Switch Environment**: `npm run env:dev` (localhost:5000), `npm run env:staging` (staging server), or `npm run env:prod` (production server). Updates the current configuration dynamically in `lib/config.ts`.
- **Start Dev Server**: `npm run dev`
- **Build Application**: `npm run build` (runs version generator first, then `next build`)
- **Lint Code**: `npm run lint`

---

## Critical conventions
1. **Server vs Client Components**: Keep components Server-First by default in `app/`. Add `"use client"` only at the top of files that rely on React hooks (`useState`, `useEffect`), browser APIs (`localStorage`), or UI-only event handlers.
2. **API Calls**: **All backend API calls must go through `lib/api.ts`** or utilize the instantiated `apiClient`. Never make raw `fetch` calls in application components.
3. **Responsive & Accessible Styling**: Use Tailwind CSS utility classes exclusively. Merge classes dynamically using `cn(...)` from `lib/utils.ts`. Respect system-wide dark/light theme options using `next-themes`.
4. **Form Controls**: Use controlled form fields powered by `react-hook-form` coupled with `zod` schema-based validation. Never use uncontrolled inputs.
5. **Session & Security Hooks**: Use `useAuth()` from `@/contexts/auth-context` to retrieve session metadata (`user`, `token`, `club`, `isAdmin`). Authenticated app areas are governed by `middleware.ts`.

---

## Key Entry Points & Architecture
- **Middleware Routing (`middleware.ts`)**: Rejects suspicious headers/crawlers, enforces IP-based rate-limits, sets security response headers (CSP, Permissions-Policy), and redirects unverified dashboard hits to `/challenge`.
- **Auth Provider (`contexts/auth-context.tsx`)**: Attaches Firebase auth token, tracks signed-in member state, and synchronizes session status.
- **Real-Time Gateway (`contexts/socket-context.tsx`)**: Establishes a raw WebSocket connection via `socket.io-client` by resolving the Base API URL and appending authentication.
- **Club-specific Themes (`lib/clubThemeButton.ts`)**: Customizes standard action buttons based on the user's current club dashboard colors.

---

## Feature Docs (On-Demand Loading)
To avoid overloading your context, do **not** scan the source files for complex flows unless your task directly requests modifications to them. Instead, read **ONLY** the relevant doc from `@RallyUp_Web_Frontend/docs/features/` as needed:

1. **Venue-Tier Ticket Pricing & Checkout Matrix**
   - **Path**: `@RallyUp_Web_Frontend/docs/features/venue-tier-checkout.md`
   - **Reason to read**: High-complexity ticket configuration (venues, tiers, seat limits), joint screenings, club-based seat splits, Razorpay integrations, coupon codes, and loyalty points redemption.
2. **Security & Request Mitigation Middleware**
   - **Path**: `@RallyUp_Web_Frontend/docs/features/security-middleware.md`
   - **Reason to read**: Enforces browser header checks, rate-limiting, blocked user agent regex, and camera permission controls for ticket scanning.

---

## Maintenance Rule
If your task modifies or enhances any of the features documented under `docs/features/`, you **MUST** update the respective feature markdown file to reflect the changes. Keep them lean, factual, and strictly under 150 lines. Do not add general documentation to the `AGENTS.md` file; keep it compact.
