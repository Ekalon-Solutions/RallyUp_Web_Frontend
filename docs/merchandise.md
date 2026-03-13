# Merchandise User Storyline & Flow

Welcome to the **RallyUp** Merchandise documentation. This guide outlines the complete journey for a User browsing and purchasing merchandise on the Web Frontend.

## 1. Browsing the Store
* **Accessing the Store:** Users navigate to the Store section from their dashboard.
* **Product Catalog:**
  * Users can view all available merchandise items associated with their clubs.
  * Items can be filtered by category, price, or searched by keywords.
  * Featured items are highlighted at the top of the store.

## 2. Product Details
* **Viewing an Item:** Clicking a product card opens the detailed view.
* **Information Displayed:**
  * High-quality images of the merchandise.
  * Product name, description, and price.
  * Available variants (e.g., sizes, colors).
  * Real-time stock availability.

## 3. Shopping Cart Management
* **Adding to Cart:** Users select their desired variant/quantity and click "Add to Cart".
* **Viewing Cart:** The cart is accessible from any page in the store.
  * Users can review items, adjust quantities, or remove items.
  * Subtotal is dynamically calculated.

## 4. Checkout & Payment Flow
* **Initiating Checkout:** Users proceed to checkout from their cart.
* **Order Details:**
  * Users provide or confirm their shipping address.
  * Any necessary order notes can be added.
  * Users can apply promotional coupon codes.
* **Cost Calculation:**
  * The system calculates the final total, including subtotal, taxes, shipping costs, and discounts.
* **Payment:**
  * Users pay securely via the **Razorpay** integration.
* **Order Confirmation:**
  * Upon successful payment, an order is generated.
  * The user is shown an order confirmation screen with their Order Number.

## 5. Order Tracking & History
* **My Orders:** Users can navigate to their Orders section to view purchase history.
* **Order Status:** Each order displays its current status (e.g., Processing, Shipped, Delivered) and payment status.
* **Details:** Users can click on an order to see the full breakdown, including items purchased, shipping details, and tracking information if available.
