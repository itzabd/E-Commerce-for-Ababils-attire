# Production Deployment & Smoke Test Checklist
**Ababil’s Attire by Sanjida Bethi**

This document serves as the pre-launch and post-deployment verification checklist for production releases.

---

## 1. Environment & Infrastructure Verification

- [ ] **Environment Variables**
  - [ ] `VITE_SUPABASE_URL` points to production Supabase instance.
  - [ ] `VITE_SUPABASE_ANON_KEY` is the public anon key (verify no `service_role` key is used).
  - [ ] `.env` is NOT tracked in git (verified in `.gitignore`).
  - [ ] `VITE_STUDIO_BKASH_NUMBER` has valid recipient bKash number.
  - [ ] `VITE_STUDIO_WHATSAPP_NUMBER` has international formatted phone.

- [ ] **Database & Migrations**
  - [ ] `20260924000001_initial_schema.sql` applied cleanly.
  - [ ] `20260924000002_rls_policies.sql` applied cleanly (RLS enabled on all 10 tables).
  - [ ] `20260924000003_functions_and_rpc.sql` applied cleanly (SECURITY DEFINER with authorization).
  - [ ] `20260924000004_storage_setup.sql` applied cleanly (`product-images` bucket public read, admin write).
  - [ ] `20260925000001_store_settings_and_manual_order.sql` applied cleanly (`store_settings` seeded).
  - [ ] Production superadmin user created in `auth.users` and linked in `admin_users`.

- [ ] **Hosting & SPA Routing**
  - [ ] Vercel: `vercel.json` rewrites `/(.*)` to `/index.html`.
  - [ ] Netlify / Cloudflare: `public/_redirects` routes `/*` to `/index.html 200`.
  - [ ] Direct deep-link access to `/admin/orders` or `/track-order/AB-260925-1042` reloads without 404.

---

## 2. Customer Storefront Smoke Tests

- [ ] **Home Page (`/`)**
  - [ ] Hero banner and visual identity loads cleanly.
  - [ ] Featured dresses and cakes carousel renders.
  - [ ] Direct order tracking bar accepts invoice number and redirects to `/track-order?invoice=...`.
  - [ ] Footer links and WhatsApp concierge links work.

- [ ] **Dresses Catalog (`/dresses`)**
  - [ ] Filter chips (All, Made to Order, Ready to Ship) filter products.
  - [ ] Search input matches product name and fabric description.
  - [ ] Price sorting (Low to High, High to Low) functions accurately.
  - [ ] Product cards display correct prices (৳) and stock badges.

- [ ] **Dress Details (`/dresses/:id`)**
  - [ ] Image gallery thumbnail switching and fullscreen modal work.
  - [ ] Size selector chips toggle correctly (0-3M to 4-5Y, custom sizing).
  - [ ] Size guide modal opens and closes via button, backdrop click, or `Escape` key.
  - [ ] "Add to Bag" updates cart count indicator in header navigation.
  - [ ] "Message Sanjida" opens WhatsApp with prefilled product message.

- [ ] **Cakes Catalog (`/cakes`)**
  - [ ] Filter chips filter celebration cakes.
  - [ ] Dhaka-only delivery restriction banner is displayed.
  - [ ] Minimum 48-hour notice policy is clearly communicated.

- [ ] **Cake Details (`/cakes/:id`)**
  - [ ] Weight selector tiers (0.5 lb Bento, 1.0 lb, 1.5 lb, 2.0 lb, 3.0 lb) update unit price.
  - [ ] Flavor profile chips select flavor.
  - [ ] Custom inscription field accepts cake message with live character counter.
  - [ ] Delivery date picker enforces 48-hour advance notice.

- [ ] **My Bag (`/bag`)**
  - [ ] Line items display correct sizes, cake weights, flavors, and inscriptions.
  - [ ] Quantity increment/decrement recalculates line subtotal.
  - [ ] Remove item opens confirmation modal with `Escape` support.
  - [ ] Combined dress + cake bag computes bundled delivery charge.
  - [ ] Cart state persists across page reload.

- [ ] **Checkout (`/checkout`)**
  - [ ] Mandatory fields: Full Name, Phone (BD format `01XXXXXXXXX`), Address, Delivery Area.
  - [ ] Delivery zone selection calculates Dhaka (৳80), Outside Dhaka (৳150), or Chilled Van (৳250).
  - [ ] Payment breakdown: `Subtotal + Delivery = Total`.
  - [ ] Advance requirement: ৳ 500 minimum bKash advance.
  - [ ] COD calculation: `Total - Advance = Cash Due`.
  - [ ] bKash fields: TrxID (required), sender last 4 digits (required, 4 digits), reference name.
  - [ ] Order submission creates order and clears customer cart.

- [ ] **Order Confirmed (`/order-confirmed/:invoiceNumber`)**
  - [ ] Displays invoice code in `AB-YYMMDD-####` format.
  - [ ] Shows copy invoice button with tactile feedback.
  - [ ] Direct button navigates to live order tracking.

- [ ] **Track Order (`/track-order`)**
  - [ ] Guest tracking operates with invoice number alone.
  - [ ] Case-insensitive lookup (e.g. `ab-260925-1042`, `#AB-260925-1042`).
  - [ ] Status progression displays current stage and completed milestones.
  - [ ] Customer privacy: Only first name initial and delivery area displayed.
  - [ ] Payment privacy: Public tracking never leaks payment TrxID or sender phone.
  - [ ] Admin privacy: Internal staff notes never leaked.

- [ ] **Contact Page (`/contact`)**
  - [ ] Contact details, studio hours, and physical address displayed.
  - [ ] Inquiry form submits with client-side validation.
  - [ ] Direct WhatsApp button initiates chat with Sanjida.

---

## 3. Admin Operations Smoke Tests

- [ ] **Admin Authentication (`/admin/login`)**
  - [ ] Non-admin accounts receive unauthorized access message.
  - [ ] Active admin account successfully signs in and receives JWT session.
  - [ ] Direct access to `/admin` without session redirects to `/admin/login`.
  - [ ] Sign out button clears session and returns to login screen.

- [ ] **Admin Dashboard (`/admin`)**
  - [ ] Summary cards: Total Revenue, Active Orders, Pending Advances, Total Customers.
  - [ ] Recent orders table lists incoming orders.
  - [ ] Quick action opens Manual Order creation dialog.

- [ ] **Product Management (`/admin/products`)**
  - [ ] Filter by category (Dresses / Cakes) and status (Published, Draft, Made to Order, Out of Stock).
  - [ ] Add New Dress / Cake modal opens with clean form fields and `Escape` support.
  - [ ] Image upload stores into `product-images` bucket with 5MB validation.
  - [ ] Status toggle (Publish / Hide / Out of Stock) updates database record.
  - [ ] Duplicate product clones specifications into a draft safely.

- [ ] **Order Management & bKash Matching (`/admin/orders`)**
  - [ ] Order list displays invoice, customer name, items, delivery date, total, advance, and status.
  - [ ] bKash TrxID Matching Tool reconciles incoming transaction IDs against pending orders.
  - [ ] "Confirm Advance" updates order payment status to verified and order to confirmed.
  - [ ] Order Details drawer opens with complete customer history, delivery slip, and status transitions.
  - [ ] Delivery Slip modal generates formatted printable docket with Banani Studio branding.

- [ ] **Customer Directory (`/admin/customers`)**
  - [ ] Search by name, phone, area, or invoice number.
  - [ ] Customer cohorts: All, Dress Buyers, Cake Lovers, Repeat Regulars.
  - [ ] Lifetime metrics: Average order value, repeat rate, total spend.
  - [ ] Admin-only operational notes section with categorization (Child Sizing, Dietary, Delivery).
  - [ ] One-click WhatsApp and Phone call integration.

- [ ] **Manual Order Creation (Modal)**
  - [ ] Supports both existing client lookup and new client registration.
  - [ ] Line item builder allows custom items or catalog presets.
  - [ ] Instant invoice generation (`AB-YYMMDD-####`) and insertion into database.

- [ ] **Store Settings (`/admin/settings`)**
  - [ ] Store contact info, studio address, social links.
  - [ ] bKash recipient number, minimum advance amount, instructions.
  - [ ] Delivery rates for Inside Dhaka, Outside Dhaka, Chilled Van.
  - [ ] Preconfigured sizing presets and cake weights.
  - [ ] Password update form enforces minimum length and updates Supabase auth.

---

## 4. Final Security & Performance Audits

- [ ] `npm test`: All 9 test suites pass (65+ individual assertions).
- [ ] `npm run lint`: 0 warnings, 0 errors across all 58 files.
- [ ] `npm run build`: Zero compilation warnings; code-split chunks built.
- [ ] `robots.txt`: Blocks search engines from crawling `/admin` or `/admin/*`.
- [ ] RLS: Direct table queries from unauthorized anon sessions return empty sets or permission denied.
