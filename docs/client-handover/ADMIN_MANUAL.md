# Admin User Manual

Welcome to the Admin Dashboard for Ababil's Attire by Sanjida Bethi. This manual will guide you through managing your online store.

## 1. Admin Login & Logout
- **Login:** Navigate to `/admin` or click the Admin login link (if available on the site). Enter your admin email and password.
- **Logout:** In the admin dashboard sidebar, click the "Logout" button to securely end your session.

## 2. Dashboard Overview
Upon logging in, you will see the **Dashboard**. It provides a quick glance at:
- **Total Orders:** The overall number of orders placed.
- **Recent Orders:** A list of the latest orders that need your attention.
- **Key Metrics:** Summary of active products and customers.

## 3. Product Management (Dresses & Cakes)
You can manage both Dresses and Cakes from the **Products** section.
- **Adding a Product:**
  1. Go to the "Products" tab in the admin sidebar.
  2. Click "Add Product" or the equivalent button.
  3. Fill in the product details: title, description, category (Dress or Cake), price, and any options (like size or flavor).
  4. Upload product images.
  5. Save the product. It will immediately appear on the storefront.
- **Editing a Product:** Click on any existing product in the list to update its details, stock status, or images.

## 4. Order Management
The **Orders** section is where you process customer purchases.
- **Viewing Orders:** You can see a list of all orders with their statuses (e.g., Pending, Processing, Shipped, Delivered, Cancelled).
- **Order Details:** Click on an order to see what the customer bought, their delivery address, and payment information.
- **Updating Status:** As you work on an order, update its status so the customer can track it accurately.
- **Manual Orders:** If a customer orders via Facebook or phone, you can manually enter their order details from the Admin Orders page to keep all records in one place.

## 5. bKash Advance & Payment Reconciliation
**Important:** The store does *not* automatically deduct money via a bKash integration.
- When a customer checks out, they are asked to send a minimum advance (or full payment) to your bKash merchant/personal number.
- They submit their **TrxID**, **Last 4 Digits** of their number, and a **Reference Name**.
- **Reconciliation:** When you receive a new order, you must manually check your bKash app or SMS to confirm the TrxID and amount match the order. Once verified, you can update the order status to "Processing".

## 6. Customer Management
- Go to the **Customers** tab to see a list of everyone who has placed an order.
- You can view a customer's order history and contact details, making it easy to assist them or reach out if there is an issue with their delivery.

## 7. Delivery & Production Workflow
- **Pending:** Order received, payment unverified.
- **Processing:** Payment verified, item is being prepared (baking cake or tailoring dress).
- **Shipped:** Handed over to the delivery service.
- **Delivered:** Customer received the item.
- Use the provided **Invoice/Delivery Slip** feature (if applicable) to print details to stick on the delivery package.

## 8. Store Settings
- The **Settings** page allows you to configure basic store information.
- Here you might update contact information, social links, or delivery fees that appear on the customer-facing site.

## 9. Common Mistakes & Troubleshooting
- **Unverified Payments:** Never ship an item before verifying the bKash TrxID manually.
- **Wrong Status:** If an order status is updated by mistake, simply click the order and change it back.
- **Lost Admin Password:** If you forget your password, contact technical support to reset it via Supabase, as self-service admin resets may not be fully configured.
