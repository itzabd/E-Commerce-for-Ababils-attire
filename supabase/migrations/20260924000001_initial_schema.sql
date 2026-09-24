-- ==============================================================================
-- Ababil’s Attire by Sanjida Bethi
-- Migration: 20260924000001_initial_schema.sql
-- Description: Core tables, constraints, sequences, triggers, and indices
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing triggers & functions if re-running
DROP TRIGGER IF EXISTS trigger_set_order_invoice_number ON orders;
DROP TRIGGER IF EXISTS trigger_orders_status_history ON orders;
DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON products;
DROP TRIGGER IF EXISTS trigger_update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON orders;

-- 3. Utility Function: Timestamp updater
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Admin Users Table (Links to Supabase auth.users)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'staff')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for admin_users timestamp
CREATE TRIGGER trigger_update_admin_users_updated_at
BEFORE UPDATE ON admin_users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('dress', 'cake')),
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'made_to_order', 'out_of_stock', 'hidden')),
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    new_arrival BOOLEAN NOT NULL DEFAULT FALSE,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    lead_time_days INTEGER NOT NULL DEFAULT 0 CHECK (lead_time_days >= 0),
    minimum_notice_hours INTEGER NOT NULL DEFAULT 0 CHECK (minimum_notice_hours >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON products(new_arrival) WHERE new_arrival = TRUE;

CREATE TRIGGER trigger_update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    alt_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON product_images(product_id, sort_order);

-- 7. Dress Details Table (1-to-1 extension of products for category = 'dress')
CREATE TABLE IF NOT EXISTS dress_details (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    available_sizes TEXT[] NOT NULL DEFAULT '{}',
    fabric_details TEXT,
    care_instructions TEXT
);

-- 8. Cake Details Table (1-to-1 extension of products for category = 'cake')
CREATE TABLE IF NOT EXISTS cake_details (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    weight_options JSONB NOT NULL DEFAULT '[]'::jsonb,
    flavor_options TEXT[] NOT NULL DEFAULT '{}',
    customization_options TEXT,
    storage_instructions TEXT
);

-- 9. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    area TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_area ON customers(area);

CREATE TRIGGER trigger_update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'review_required' CHECK (status IN (
        'review_required',    -- Awaiting bKash manual TrxID match
        'advance_verified',   -- ৳ 500 advance verified by admin
        'in_production',      -- Dress tailoring or cake baking in progress
        'dispatch_ready',     -- Packed with delivery slip
        'out_for_delivery',   -- Dispatched via chilled delivery van
        'delivered',          -- Delivered & cash on delivery collected
        'cancelled'           -- Order cancelled
    )),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    delivery_charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_charge >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    advance_amount NUMERIC(10, 2) NOT NULL DEFAULT 500.00 CHECK (advance_amount >= 0),
    advance_status TEXT NOT NULL DEFAULT 'pending' CHECK (advance_status IN ('pending', 'verified', 'rejected')),
    cash_due NUMERIC(10, 2) NOT NULL CHECK (cash_due >= 0),
    delivery_date DATE NOT NULL,
    delivery_time TEXT,
    delivery_address TEXT NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON orders(invoice_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_advance_status ON orders(advance_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);

CREATE TRIGGER trigger_update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Invoice Number Generation Logic: AB-YYMMDD-####
-- Generated in Bangladesh Standard Time (UTC+6)
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    v_date_str TEXT;
    v_seq_num INTEGER;
    v_candidate_invoice TEXT;
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        -- Date format: YYMMDD using Asia/Dhaka time zone
        v_date_str := TO_CHAR(NOW() AT TIME ZONE 'Asia/Dhaka', 'YYMMDD');
        
        -- Count existing invoices for today to compute next sequence number
        SELECT COUNT(*) + 1 INTO v_seq_num
        FROM orders
        WHERE invoice_number LIKE ('AB-' || v_date_str || '-%');
        
        v_candidate_invoice := 'AB-' || v_date_str || '-' || LPAD(v_seq_num::TEXT, 4, '0');
        
        -- Ensure uniqueness in rare case of concurrency collision
        WHILE EXISTS (SELECT 1 FROM orders WHERE invoice_number = v_candidate_invoice) LOOP
            v_seq_num := v_seq_num + 1;
            v_candidate_invoice := 'AB-' || v_date_str || '-' || LPAD(v_seq_num::TEXT, 4, '0');
        END LOOP;
        
        NEW.invoice_number := v_candidate_invoice;
    END IF;
    
    -- Ensure cash_due is accurately calculated: total_amount - advance_amount
    IF NEW.cash_due IS NULL THEN
        NEW.cash_due := GREATEST(0, NEW.total_amount - NEW.advance_amount);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_invoice_number
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- 12. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    selected_size TEXT,
    cake_weight TEXT,
    cake_flavor TEXT,
    cake_message TEXT,
    customization_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 13. Payments Table (bKash Advance & COD Reconciliation)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    method TEXT NOT NULL DEFAULT 'bkash' CHECK (method IN ('bkash', 'cash_on_delivery', 'manual_adjustment')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    trx_id TEXT NOT NULL,
    sender_last4 TEXT NOT NULL,
    reference_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending_match' CHECK (status IN (
        'pending_match',   -- Customer submitted; pending admin manual match
        'matched',         -- Admin verified against bKash statement
        'mismatched',      -- TrxID / amount / sender mismatch
        'rejected'         -- Fraudulent or cancelled
    )),
    matched_at TIMESTAMPTZ,
    matched_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_trx_id ON payments(trx_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 14. Order Status History Table
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

-- Trigger: Automatically log status changes in order_status_history
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO order_status_history (order_id, status, note, created_at)
        VALUES (
            NEW.id,
            NEW.status,
            CASE 
                WHEN TG_OP = 'INSERT' THEN 'Order placed with initial status: ' || NEW.status
                ELSE 'Status updated from ' || OLD.status || ' to ' || NEW.status
            END,
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orders_status_history
AFTER INSERT OR UPDATE OF status ON orders
FOR EACH ROW EXECUTE FUNCTION log_order_status_change();
