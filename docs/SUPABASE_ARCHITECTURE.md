# Ababil’s Attire by Sanjida Bethi — Supabase Backend & Data Foundation

This document details the production-ready backend and data foundation built with Supabase for **Ababil’s Attire by Sanjida Bethi** (Bespoke Handmade Dresses & Celebration Cakes, Dhaka, Bangladesh).

---

## 1. Architecture Overview

```
                      +------------------------------------+
                      |    Client (React 19 + Vite 8)      |
                      +-----------------+------------------+
                                        |
                 +----------------------+----------------------+
                 | (Anon / Public Storefront)                  | (Authenticated Admin)
                 v                                             v
+----------------------------------+          +----------------------------------+
| - Read Published Products & Media|          | - Manage Products & Details      |
| - Guest Checkout (Atomic RPC)    |          | - bKash TrxID Matching Tool      |
| - Safe Order Tracking by Invoice |          | - Order Logistics & Status Flow  |
+-----------------+----------------+          +-----------------+----------------+
                  |                                             |
                  +----------------------+----------------------+
                                         v
                         +-------------------------------+
                         | Supabase PostgreSQL + RLS     |
                         | - admin_users                 |
                         | - products & product_images   |
                         | - dress_details, cake_details |
                         | - customers, orders           |
                         | - order_items, payments       |
                         | - order_status_history        |
                         +---------------+---------------+
                                         |
                                         v
                         +-------------------------------+
                         | Supabase Storage              |
                         | Bucket: 'product-images'      |
                         |   ├── dresses/                |
                         |   └── cakes/                  |
                         +-------------------------------+
```

---

## 2. Supabase Database Schema

### 2.1 Table Structure & Constraints

| Table Name | Purpose | Primary Key | Key Foreign Keys | Key Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **`admin_users`** | Staff/Admin authorization | `id` (UUID) | `auth.users(id)` ON DELETE CASCADE | `email` UNIQUE, `role` IN ('superadmin', 'admin', 'staff') |
| **`products`** | Unified catalog (dresses & cakes) | `id` (UUID) | None | `product_code` UNIQUE, `category` IN ('dress', 'cake'), `status` IN ('published', 'draft', 'made_to_order', 'out_of_stock', 'hidden'), `price >= 0` |
| **`product_images`**| Multi-angle gallery images | `id` (UUID) | `products(id)` ON DELETE CASCADE | `sort_order` default 0 (0 = primary cover) |
| **`dress_details`** | 1-to-1 extension for dresses | `product_id` (UUID)| `products(id)` ON DELETE CASCADE | `available_sizes` TEXT[] ('0-3M', '3-6M', etc.) |
| **`cake_details`**  | 1-to-1 extension for cakes | `product_id` (UUID)| `products(id)` ON DELETE CASCADE | `weight_options` JSONB, `flavor_options` TEXT[] |
| **`customers`**     | Guest & returning customer directory| `id` (UUID) | None | Indexed on `phone` and `area` |
| **`orders`**        | Core order header | `id` (UUID) | `customers(id)` ON DELETE RESTRICT | `invoice_number` UNIQUE (`AB-YYMMDD-####`), `status` CHECK, `advance_status` CHECK |
| **`order_items`**   | Snapshotted items in an order | `id` (UUID) | `orders(id)` ON DELETE CASCADE, `products(id)` ON DELETE SET NULL | `quantity > 0`, `unit_price >= 0` |
| **`payments`**      | bKash advance & COD settlement | `id` (UUID) | `orders(id)` ON DELETE CASCADE, `matched_by` -> `auth.users(id)` | `status` IN ('pending_match', 'matched', 'mismatched', 'rejected') |
| **`order_status_history`** | Immutable lifecycle audit trail | `id` (UUID) | `orders(id)` ON DELETE CASCADE | Automatic trigger on `orders.status` change |

### 2.2 Automated Invoice Generation Trigger

Invoice numbers are generated automatically in Bangladesh Standard Time (UTC+6) in the required format:
$$\text{AB-YYMMDD-####}$$
*Example:* `AB-260924-0001`

A database `BEFORE INSERT` trigger calculates the daily sequence number for `orders`, ensuring uniqueness and concurrency safety.

---

## 3. Row Level Security (RLS) & Privacy Guarantee

All tables have RLS explicitly enabled:
1. **Public Storefront Access (`anon` & `authenticated`):**
   - **`products`**: Can only `SELECT` rows where `status = 'published'`.
   - **`product_images`**, **`dress_details`**, **`cake_details`**: Can only `SELECT` rows for published products.
   - **`customers`**, **`orders`**, **`order_items`**, **`payments`**, **`order_status_history`**: **ZERO DIRECT PUBLIC ACCESS**. Direct table queries return empty / permission denied.
2. **Admin Access (`is_admin()` = true):**
   - Authenticated users with an active record in `admin_users` have full CRUD on all tables.
3. **Guest Operations via Secure RPCs (`SECURITY DEFINER`):**
   - **`create_guest_order(...)`**: Atomically creates customer, order, items, and initial bKash payment record without exposing table insert permissions to anon users.
   - **`track_order_by_invoice(...)`**: Allows tracking without logging in; returns sanitized public data only (no customer phone numbers, full addresses, internal notes, or other customers' information).

---

## 4. Payment Workflow: Cash on Delivery + Mandatory bKash Advance

### 4.1 Customer Checkout Submission
- Customers select: **Cash on Delivery with mandatory ৳ 500 bKash advance**.
- Studio displays the bKash personal/merchant number (`01712-345678`) with a 1-click copy button.
- Customer sends ৳ 500 and submits:
  1. **bKash TrxID** (10 alphanumeric characters e.g. `9K8A4M29PX`)
  2. **Sender Mobile (Last 4 Digits)** (e.g. `4567`)
  3. **Reference Name** (e.g. `Ayesha Rahman (Inaya Cake)`)
- System creates the order in status `'review_required'` with payment in `'pending_match'`.

### 4.2 Admin bKash TrxID Matching Tool (7-Step Workflow)
> [!IMPORTANT]
> **No Fake bKash API Claims:** This system matches the customer-submitted TrxID against internal stored order/payment records and reconciles it against the studio's physical bKash SMS statement. It does not falsely claim a live automated bKash gateway.

1. **Step 1 — Paste TrxID:** Admin pastes the TrxID into the matching tool (`paymentsService.findByTrxId(trxId)`).
2. **Step 2 — Locate Record:** System executes `find_order_by_trx_id(p_trx_id)`, querying payment, order, and customer records.
3. **Step 3 — Display Summary:** Admin screen shows:
   - Order ID & Invoice Number (`AB-260923-1042`)
   - Customer Name & Area (Ayesha Rahman, Banani)
   - Expected Advance (`৳ 500`) vs Total (`৳ 7,600`) vs COD Balance Due (`৳ 7,100`)
   - Order Items snapshot (Dress sizes & Cake flavor/message).
4. **Step 4 — Compare Details:** Admin compares the submitted TrxID, sender last 4 digits (`4567`), and reference against their bKash statement.
5. **Step 5 — Confirm Advance:** Admin clicks **"Confirm bKash Match (৳ 500)"** (`paymentsService.matchPayment(trxId, true, note)`).
6. **Step 6 — Record Confirmation:** Database updates:
   - `payments.status` $\rightarrow$ `'matched'`
   - `payments.matched_at` $\rightarrow$ `NOW()`
   - `payments.matched_by` $\rightarrow$ Admin UUID (`auth.uid()`)
   - `orders.advance_status` $\rightarrow$ `'verified'`
   - `orders.status` $\rightarrow$ `'advance_verified'`.
7. **Step 7 — Audit Trail:** Database trigger appends an immutable entry to `order_status_history`:
   *"bKash Advance Verified (TrxID: 9K8A4M29PX, Sender: •••• 4567). Matched against studio statement."*

---

## 5. Storage Strategy for Product Images

- **Bucket:** `product-images` (Public read, Admin-only write/update/delete)
- **Folder Structure:**
  - `dresses/{product_code}_{timestamp}_{sort_order}.webp`
  - `cakes/{product_code}_{timestamp}_{sort_order}.webp`
- **Ordering:** Controlled via the `sort_order` integer column in `product_images` (`0` is primary showcase image, `1, 2, ...` for secondary gallery).
- **Replacement:** `storageService.replaceProductImage()` uploads the new image, updates the database URL, and removes the superseded storage file.
- **Deletion:** `storageService.deleteProductImage()` deletes both the storage object and the corresponding database row.

---

## 6. Invoice Generation Specification

The system compiles invoice data via `invoiceService.getInvoiceData()` for two distinct outputs:

1. **Customer Digital Invoice:**
   - Monogram crest & atelier typography (`Bodoni Moda`)
   - Invoice Number (`AB-YYMMDD-####`)
   - Itemized list with customization details (Dress size, Cake weight, flavor, piped message)
   - Settlement breakdown: Subtotal + Chilled Delivery = Total, minus ৳ 500 bKash Advance = **Cash on Delivery Due**
   - Care & storage instructions (Mascarpone refrigeration guidelines & hand-smocking wash care).
2. **Admin A4 Delivery Slip / Printable PDF:**
   - Constrained to standard 210mm clean white layout (`@page { size: A4; margin: 12mm 15mm; }`)
   - High-contrast typography for thermal/inkjet studio printing
   - Van dispatch instructions, recipient phone & delivery address, and clear COD collection badge (`৳ 7,100`).

---

## 7. Short Implementation Plan for Frontend Phase

Based on the Stitch screens handoff:

1. **Phase 1 (Completed):** Backend & Data Foundation (Supabase SQL migrations, RLS, Storage setup, TypeScript types, and service layer).
2. **Phase 2:** Design System & Shared Components Setup:
   - Bodoni Moda & Plus Jakarta Sans typography
   - Atelier Curated Heirloom color tokens (`#5c3e36`, `#fbf9f5`, `#f5ede9`)
   - TopAppBar, BottomNavBar, and PriceDisplay (Bangladeshi Taka `৳` formatter).
3. **Phase 3:** Customer Storefront Integration:
   - Homepage with curated capsules (Dresses vs Cakes)
   - Product catalogs with size & cake weight selectors
   - Unified Bag with mixed preparation alert (Tailoring vs Fresh Baking).
4. **Phase 4:** Checkout, bKash Advance & Order Tracking:
   - Mobile Checkout with bKash advance form
   - Order Confirmation & Digital Invoice view
   - Unauthenticated Order Tracking timeline.
5. **Phase 5:** Admin Panel & bKash Matching Tool:
   - Admin Login & Dashboard
   - TrxID Matching Tool interface
   - Product Catalog CRUD & Image upload to Supabase Storage
   - A4 Printable Delivery Slip view.
