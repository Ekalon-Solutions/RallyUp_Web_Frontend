# Events User Storyline & Flow

Welcome to the **RallyUp** Events documentation. This guide outlines the complete journey for a User interacting with Events on the Web Frontend.

## 1. Discovery & Browsing
* **Landing/Dashboard:** Upon logging in, users can navigate to their Event dashboard.
* **Event Listing:** Users see a comprehensive list of upcoming events.
  * They can filter events by club, category, or search for specific keywords.
  * Events are categorized visually so users can quickly distinguish between free, paid, or member-only events.

## 2. Event Details
* **Viewing an Event:** Clicking on an event opens the Event Details view.
* **Information Displayed:**
  * Title, Date, Time, and Venue.
  * Rich description of the event.
  * Ticket availability, pricing, and potential discounts (e.g., early bird, member discounts).
  * Waitlist status if the event is currently full.

## 3. Registration & Checkout Flow
* **Initiating Registration:** Users click the "Register" or "Buy Tickets" button.
* **Free Events:**
  * User confirms their details.
  * Registration is instantly confirmed, and they are added to the attendee list.
* **Paid Events:**
  * User selects ticket quantity and enters any applicable coupon codes.
  * The system calculates the final price, applying any member or early-bird discounts.
  * User proceeds to checkout via **Razorpay** integration.
  * Upon successful Payment Verification, the registration is confirmed.
* **Waitlists:**
  * If the event is full, the user can opt to join the waitlist.
  * They will be notified automatically if spots become available.

## 4. Managing Registrations
* **My Events:** Users have a dedicated section (`Dashboard -> User -> Events`) to view all their upcoming and past event registrations.
* **Cancellations:** If permitted, users can cancel their registration directly from their dashboard.
* **Tickets:** Digital tickets (e.g., QR codes) can be accessed here for quick check-in at the venue.

## 5. Notifications
* Users receive email confirmations (via SendGrid) or push notifications for:
  * Successful registration/payment.
  * Event reminders.
  * Waitlist openings.
  * Event updates or cancellations by the Admin.
