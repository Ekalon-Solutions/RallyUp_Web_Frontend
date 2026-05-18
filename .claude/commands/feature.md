Implement the following feature in the RallyUp Web Frontend end-to-end.

TICKET:
$ARGUMENTS

---

Follow this process exactly:

1. **Read first, code second.** Identify which existing pages and components are relevant. Read them before writing anything.

2. **Frontend implementation order:**
   a. Add API function(s) to `lib/api.ts`
   b. Build or extend page(s) in `app/` (Server Component by default)
   c. Build interactive components with `"use client"` only where required
   d. Wire up forms with react-hook-form + zod

3. **Follow existing patterns:**
   - Look at a nearby page/component for structure reference
   - Use `cn()` for conditional Tailwind classes
   - Use shadcn/ui primitives from `components/ui/` — do not build primitives from scratch
   - Get auth from `useAuth()` in `contexts/auth-context.tsx`

4. **Admin UI** lives under `app/dashboard/`. Member-facing UI lives under `app/events/` or `app/purchase/`.

5. **Matrix/grid UIs** — use a CSS grid or table with Tailwind. Each cell is a venue-tier combo.

6. At the end, output:
   - Files changed (list)
   - How to test manually (navigation steps + what to look for)
   - Edge cases to verify during QA
   - Anything blocked or needs backend first
