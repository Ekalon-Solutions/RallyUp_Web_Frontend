# Venue-Tier Ticket Pricing, Allocations & Checkout Flow

This feature implements the core ticket pricing matrix and purchase checkout flow, supporting nested pricing tiers, club allocation splits, coupons, loyalty points, and Razorpay payment.

## 1. Concept & Data Structures
Events in RallyUp can support either single-pricing tier schemas or a multi-dimensional matrix of venues and tiers.

- **Venue-Tier Matrix**: Configured by admin via `VenueDraft[]` consisting of:
  - **Venue**: Represents a physical location or area.
  - **Tier**: A specific ticket category (e.g. "Early Bird", "VIP").
  - **Allocation**: The total seat capacity assigned to this venue/tier combination.
  - **Club Allocations**: For joint screenings, seat counts are split among partner clubs.

## 2. Key Files & Components
- **Configuration (Admin)**:
  - `components/admin/venue-tier-matrix-builder.tsx`: React-based drag-and-drop or form builder for managing venue and tier grids.
  - `lib/event-pricing-validation.ts`: Strictly validates prices ($\ge 0$), seat allocations ($\ge 1$), and that joint club allocations sum perfectly to the total tier seat count.
- **Cart & Selection (Member)**:
  - `contexts/cart-context.tsx`: Provides the shopping cart state (`items`, `totalPrice`, custom operations) utilizing browser `localStorage` for persistence.
  - `components/modals/venue-tier-cart-modal.tsx`: Complex modal that lets users browse, select, and combine tickets across different venues & tiers, validating available seats and per-club allotments.
- **Checkout, Discounts & Payment**:
  - `lib/transactionFees.ts`: Computes platform fees ($4.5\%$), PG charges ($2\%$), and GST ($18\%$) on top of fees. Handles `"pass_to_buyer"` vs `"absorb"` models.
  - `lib/points-redemption.ts`: Validates loyalty points applied at checkout.
  - `components/modals/payment-simulation-modal.tsx` & `event-checkout-modal.tsx`: Orchestrates the order submission and securely fires off Razorpay's overlay checkout handler.

## 3. Checkout Pipeline
1. **Selection**: User picks combinations of `venue` and `tier` in `venue-tier-cart-modal.tsx`.
2. **Availability Check**: Checks standard `tier.allocation - tier.sold` or queries joint allocations via `getJointScreeningClubNames()`.
3. **Discounts**:
   - Applies validated coupon discounts (`setCouponDiscount`).
   - Resolves points loyalty deduction (`validatePointsRedemptionInput`).
4. **Fees Calculation**: Calculates dynamic PG charges using `resolveCheckoutCharge(...)`.
5. **Razorpay Gate**: Submits a `POST /api/razorpay/create-order`, launches Razorpay client window, and confirms the signature on `/verify-payment` before routing to `/purchase/success`.

## 4. Gotchas & Edge Cases
- **Integer Rounding**: Razorpay accepts amounts in paise (multiply by 100). The frontend must use `Math.round()` to prevent float inaccuracies when validating transactions.
- **Joint Screening Split**: Ensure each partner club has at least 1 seat assigned if per-club allocations are enabled, and make sure home/guest clubs do not duplicate.
