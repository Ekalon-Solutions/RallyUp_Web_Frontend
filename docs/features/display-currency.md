# Display currency

Member- and admin-facing listed prices convert from the catalog currency (usually INR) into a display currency derived from location, with a profile override. Checkout collects in USD/EUR/GBP when Razorpay international is enabled; other display currencies fall back to INR with a notice. FX-expiry failures show a retry path.

## Resolution
`GET /api/currency/session` (timezone + locale from the browser). Order: saved override → profile country → IP → phone dial code → timezone → locale → **INR**.

Override is edited in Settings (`CurrencyPreferenceCard`). Guests store it in `localStorage`.

## Formatting
`formatMoney(amount, sourceCurrency)` converts with the session FX table (mid-market plus Razorpay FX markup) and formats via `Intl.NumberFormat`. Checkout posts `presentmentCurrency` to create-order; the Razorpay order amount is that converted figure.

Receipts keep the charged currency via `formatChargedMoney`.

## Checkout lock
While the merch cart has items, or a ticket/membership checkout UI is open (`useCheckoutCurrencyLock`), the display currency and FX snapshot freeze in `sessionStorage` so travelling does not change totals mid-checkout.
