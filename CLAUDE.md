@../FEATURES.md

# RallyUp Web Frontend

## Stack
- Next.js 15 App Router + TypeScript
- Tailwind CSS + Radix UI + Lucide React + shadcn/ui (`components/ui/`)
- Firebase (auth), Razorpay (payments), Socket.io-client
- Forms: react-hook-form + zod

## Scripts
- `npm run dev` — Next.js dev server
- `npm run lint` — ESLint
- `npm run env:dev / env:staging / env:prod` — switch env

## Structure
```
app/                    # Next.js App Router pages
  dashboard/            # Club admin area (all protected)
    events/             # Admin event management
      create/           # Event creation wizard
      [id]/             # Event detail / edit
  events/               # Public event listings
  purchase/             # Member ticket purchase flow
components/
  ui/                   # shadcn primitives (Button, Dialog, Input, etc.)
  admin/                # Admin-only components
  modals/               # Modal components
lib/
  api.ts                # All backend API calls — ApiResponse<T> wrapper
  config.ts             # getApiUrl() helper
  utils.ts              # cn() and helpers
contexts/
  auth-context.tsx      # useAuth() — current user, token, club
  cart-context.tsx      # useCart() — shopping cart state
  socket-context.tsx    # useSocket()
hooks/                  # Custom hooks, all prefixed use*
```

## Coding Rules
- **Server Components by default** for pages in `app/`. Add `"use client"` only when needed (useState, useEffect, event handlers, context).
- **All API calls go through `lib/api.ts`** — never use raw fetch in components. Add new functions to api.ts.
- **Styling**: Tailwind classes only. Use `cn()` from `lib/utils.ts` for conditional classes.
- **Forms**: react-hook-form + zod schema validation. No uncontrolled inputs.
- **Auth**: `useAuth()` from `contexts/auth-context.tsx` gives `{ user, token, club, isAdmin }`.
- Admin pages live under `app/dashboard/` and are protected by middleware.
- Keep components small and focused. Split into subcomponents if a file exceeds ~150 lines.
- New UI components (non-primitive) go in `components/` with descriptive names.

## Key Patterns

### API call (client component)
```typescript
import { apiFunction } from '@/lib/api';
const result = await apiFunction(token, payload);
if (!result.success) { /* handle error */ }
```

### Protected admin page
```typescript
// app/dashboard/feature/page.tsx
import { getServerSession } from 'next-auth'; // or auth context
// wrap with admin check
```

### shadcn Dialog modal pattern
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
```

### Form with zod
```typescript
const schema = z.object({ field: z.string().min(1) });
const form = useForm({ resolver: zodResolver(schema) });
```

## Event Domain
- Admin creates/edits events: `app/dashboard/events/create/` and `app/dashboard/events/[id]/`
- Members browse + purchase: `app/events/` → `app/purchase/`
- Multi-venue/tier matrix: Admin sees a grid (venues as rows, tiers as columns). Member sees grouped ticket selectors.
- Cart allows multiple venue-tier combos before single checkout.
