# Ababil’s Attire by Sanjida Bethi

> A bespoke boutique e-commerce web application for handmade children's dresses and artisanal celebration cakes in Dhaka, Bangladesh.

---

## 1. Project Overview

**Ababil’s Attire by Sanjida Bethi** is a high-touch, photography-driven e-commerce platform built specifically for the local Bangladeshi market. It combines two artisanal craft disciplines:
1. **Handmade Girls’ Dresses**: Hand-smocked, made-to-order, and ready-to-ship dresses (0-3M to 4-5Y, custom sizing) crafted from muslin, voile, and cotton.
2. **Fresh Celebration Cakes**: Freshly baked, temperature-sensitive cakes delivered via chilled vans exclusively within Dhaka (0.5 lb to 3.0 lb tiered).

### Core Architectural Principles
- **100% Guest-First Experience**: Customers do **not** need to create accounts or remember passwords. Customers browse, build unified bags, checkout, and track orders using their invoice number (`AB-YYMMDD-####`).
- **bKash Advance + Cash on Delivery (COD)**: Orders require a minimum advance (default ৳ 500) via personal bKash to secure fabric cutting or baking slots, with the remaining balance collected upon delivery.
- **Admin Operations Suite**: Dedicated admin portal (`/admin`) for Sanjida and studio staff to manage catalog inventory, reconcile bKash advance payments, monitor customer cohorts, and create manual phone/in-person orders.

---

## 2. Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Router v6
- **Styling**: Tailored Design System with Vanilla CSS tokens (Warm cream `#fbf9f5`, deep cocoa `#432821`, blush accents `#e7d5cf`)
- **Backend & Database**: Supabase (PostgreSQL 15)
- **Security & Authorization**: Row Level Security (RLS) on all tables, `SECURITY DEFINER` RPC functions with strict validation, Supabase Auth for staff
- **Media Storage**: Supabase Storage (`product-images` bucket with 5MB upload limit, MIME type guards)
- **Testing & Quality**: Node test runner (`node --experimental-strip-types`), Oxlint linter

---

## 3. Local Setup & Installation

### Prerequisites
- Node.js 18.x or 20.x LTS
- npm 9+ or pnpm 8+

### Step-by-Step Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/itzabd/E-Commerce-for-Ababils-attire.git
   cd E-Commerce-for-Ababils-attire
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your Supabase project credentials (see below).

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## 4. Environment Variables

Create a `.env` file in the root directory. Only the public anon key is used in frontend client code. **Never put your Supabase `service_role` key in frontend code or environment files.**

| Variable | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | String | Supabase project URL | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | String | Supabase public anonymous API key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `VITE_STUDIO_NAME` | String | Public store display name | `Ababil’s Attire by Sanjida Bethi` |
| `VITE_STUDIO_BKASH_NUMBER` | String | Personal bKash recipient number | `01712-345678` |
| `VITE_STUDIO_WHATSAPP_NUMBER`| String | International WhatsApp contact | `+8801712345678` |
| `VITE_STUDIO_ADDRESS` | String | Physical studio location | `Banani, Dhaka, Bangladesh` |
| `VITE_DEFAULT_ADVANCE_AMOUNT`| Number | Standard minimum advance in BDT | `500` |

---

## 5. Supabase Setup & Database Migrations

Apply the migration scripts in the `supabase/migrations/` directory sequentially:

1. **`20260924000001_initial_schema.sql`**
   - Creates extensions (`pgcrypto`, `uuid-ossp`).
   - Tables: `admin_users`, `products`, `product_images`, `dress_details`, `cake_details`, `customers`, `orders`, `order_items`, `payments`, `order_status_history`.
   - Triggers for automatic invoice numbering (`AB-YYMMDD-####`) and status timeline history.

2. **`20260924000002_rls_policies.sql`**
   - Enables RLS across all tables.
   - Restricts direct customer, order, payment, and history table access to active admins.
   - Exposes published products and details to public anonymous users.

3. **`20260924000003_functions_and_rpc.sql`**
   - `create_guest_order`: Atomic guest order creation RPC with customer deduplication.
   - `track_order_by_invoice`: Public safe tracking RPC (zero leakage of private customer data, full phone numbers, or admin notes).
   - `find_order_by_trx_id`: Admin TrxID matching tool.
   - `match_bkash_payment`: Payment reconciliation and status transition function.

4. **`20260924000004_storage_setup.sql`**
   - Configures the `product-images` storage bucket (public read, admin-only write/update/delete).

5. **`20260925000001_store_settings_and_manual_order.sql`**
   - Creates `store_settings` table for configurable delivery rates, bKash instructions, and sizing presets.
   - `create_manual_order`: Admin RPC for creating walk-in and phone orders.

### Creating Initial Admin User
To provision the first administrator:
1. In the Supabase dashboard, navigate to **Authentication → Users** and create a user (e.g. `sanjida@ababilsattire.com`).
2. Run the following SQL query in the Supabase SQL Editor:
   ```sql
   INSERT INTO public.admin_users (id, email, full_name, role, is_active)
   VALUES (
     '<USER_UUID_FROM_AUTH_USERS>',
     'sanjida@ababilsattire.com',
     'Sanjida Bethi',
     'superadmin',
     TRUE
   );
   ```

---

## 6. Development & Quality Commands

```bash
# Run unit & integration test suites
npm test

# Run code linter (Oxlint)
npm run lint

# Compile TypeScript & build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 7. bKash Advance Workflow (Manual Reconciliation)

> [!IMPORTANT]
> There is **no automated bKash Payment Gateway (PGW) API** integration. Payment reconciliation follows the standard and trusted Bangladeshi boutique process:

```
Customer Places Order
  │
  ├─ Sends ৳ 500 advance via personal bKash "Send Money"
  ├─ Enters TrxID, sender's last 4 digits, & reference name
  └─ Order created in "review_required" / "pending_advance"
       │
Admin Reconciliation (/admin/orders)
  │
  ├─ Staff opens bKash statement on business handset/app
  ├─ Staff enters incoming TrxID in the Admin Matching Tool
  ├─ System matches TrxID against pending customer docket
  └─ Admin clicks "Confirm Advance (৳500)"
       │
Order Confirmed
  │
  ├─ Advance status marked "verified"
  ├─ Order status advances to "confirmed"
  └─ Remaining balance collected as Cash on Delivery (COD)
```

---

## 8. Order Lifecycle & Status Progression

| Status | Stage Meaning | Next Actions |
| :--- | :--- | :--- |
| `review_required` | Order submitted; awaiting bKash advance match | Match TrxID or flag mismatch |
| `confirmed` | Advance verified; order accepted | Queue in studio / bakery schedule |
| `in_production` | Fabric cut / cake queued for baking | Prepare delivery slip |
| `out_for_delivery` | Handed over to courier (Pathao / Paperfly / Chilled Van) | Rider collects cash due |
| `delivered` | Customer received package and paid COD balance | Order complete |
| `cancelled` | Order cancelled by admin (with audit note) | Advance refunded or voided |

---

## 9. Customer Data Privacy & Security

1. **Guest Isolation**: Public customers never query private tables directly. All order creation and tracking route through `SECURITY DEFINER` stored procedures.
2. **Zero Leakage Tracking**: Public tracking returns only the customer's first name initial, delivery area, items, and sanitized timeline. Sensitive fields (full phone number, street address, payment TrxID, sender last 4, internal admin notes) are strictly omitted.
3. **Admin Guarding**: Admin routes (`/admin/*`) require an active Supabase session validated against `admin_users` where `is_active = TRUE`.

---

## 10. Production Deployment

### Vercel Deployment
1. Import repository into Vercel.
2. Set Framework Preset to **Vite**.
3. Configure Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc.).
4. The included `vercel.json` automatically handles SPA routing rewrites:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

### Netlify / Cloudflare Pages Deployment
- Build Command: `npm run build`
- Output Directory: `dist`
- The included `public/_redirects` ensures `/* /index.html 200` rewrite.

---

## 11. Known Limitations

- **No Automated bKash PGW API**: Payments are reconciled manually by matching the customer's submitted TrxID with the merchant handset.
- **No Customer Accounts**: The storefront intentionally operates in guest mode for simplicity and zero customer signup friction.
- **Dhaka-Only Cake Delivery**: Fresh cakes cannot be shipped outside Dhaka due to heat sensitivity and delicate tiered structures.
