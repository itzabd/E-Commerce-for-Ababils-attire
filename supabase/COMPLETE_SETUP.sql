-- ==============================================================================
-- Ababil’s Attire by Sanjida Bethi - COMPLETE ALL-IN-ONE SUPABASE DEPLOYMENT
-- Includes:
-- 1. All Tables, Triggers, Indexes & Constraints
-- 2. Complete RLS Policies & Security Controls
-- 3. Stored Procedures, Functions & Guest Checkout RPC
-- 4. Storage Buckets (product-images) & Permissions
-- 5. Store Settings, Reviews, and Manual Order RPC
-- 6. Superadmin User Insertion (ababils@attire.com)
-- 7. Initial Seed Catalog (Dresses, Cakes & Store Settings)
-- ==============================================================================


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20260924000001_initial_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- Ababil’s Attire by Sanjida Bethi
-- Migration: 20260924000001_initial_schema.sql
-- Description: Core tables, constraints, sequences, triggers, and indices
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Utility Function: Timestamp updater
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Admin Users Table (Links to Supabase auth.users)
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
DROP TRIGGER IF EXISTS trigger_update_admin_users_updated_at ON admin_users;
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

DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON products;
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

DROP TRIGGER IF EXISTS trigger_update_customers_updated_at ON customers;
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

DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON orders;
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

DROP TRIGGER IF EXISTS trigger_set_order_invoice_number ON orders;
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

DROP TRIGGER IF EXISTS trigger_orders_status_history ON orders;
CREATE TRIGGER trigger_orders_status_history
AFTER INSERT OR UPDATE OF status ON orders
FOR EACH ROW EXECUTE FUNCTION log_order_status_change();



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20260924000002_rls_policies.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- Ababil’s Attire by Sanjida Bethi
-- Migration: 20260924000002_rls_policies.sql
-- Description: Row Level Security (RLS) policies for zero-leak public access & admin controls
-- ==============================================================================

-- 1. Helper function to check if current authenticated user is an active admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE id = auth.uid()
            AND is_active = TRUE
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE dress_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE cake_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. ADMIN USERS TABLE POLICIES (No recursion)
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can view admin accounts" ON admin_users;
DROP POLICY IF EXISTS "Superadmins can manage admin accounts" ON admin_users;
DROP POLICY IF EXISTS "Users can view their own admin profile" ON admin_users;
DROP POLICY IF EXISTS "Superadmins can insert admin accounts" ON admin_users;
DROP POLICY IF EXISTS "Superadmins can update admin accounts" ON admin_users;
DROP POLICY IF EXISTS "Superadmins can delete admin accounts" ON admin_users;

-- Users can view their own admin record directly by auth.uid() (Zero recursion)
CREATE POLICY "Users can view their own admin profile"
    ON admin_users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.admin_users
    WHERE id = auth.uid() AND is_active = TRUE;
    RETURN COALESCE(v_role, '') = 'superadmin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE POLICY "Superadmins can insert admin accounts"
    ON admin_users
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_superadmin());

CREATE POLICY "Superadmins can update admin accounts"
    ON admin_users
    FOR UPDATE
    TO authenticated
    USING (public.is_superadmin())
    WITH CHECK (public.is_superadmin());

CREATE POLICY "Superadmins can delete admin accounts"
    ON admin_users
    FOR DELETE
    TO authenticated
    USING (public.is_superadmin());

-- ==============================================================================
-- 4. PRODUCTS & DETAILS POLICIES
-- ==============================================================================

-- Products: Public can read published products only; Admins can do everything
DROP POLICY IF EXISTS "Public can view published products" ON products;
CREATE POLICY "Public can view published products"
    ON products
    FOR SELECT
    USING (status = 'published');

DROP POLICY IF EXISTS "Admins have full access to products" ON products;
CREATE POLICY "Admins have full access to products"
    ON products
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Product Images: Public can view images for published products; Admins have full access
DROP POLICY IF EXISTS "Public can view published product images" ON product_images;
CREATE POLICY "Public can view published product images"
    ON product_images
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = product_images.product_id
            AND products.status = 'published'
        )
    );

DROP POLICY IF EXISTS "Admins have full access to product images" ON product_images;
CREATE POLICY "Admins have full access to product images"
    ON product_images
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Dress Details: Public can view for published products; Admins have full access
DROP POLICY IF EXISTS "Public can view published dress details" ON dress_details;
CREATE POLICY "Public can view published dress details"
    ON dress_details
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = dress_details.product_id
            AND products.status = 'published'
        )
    );

DROP POLICY IF EXISTS "Admins have full access to dress details" ON dress_details;
CREATE POLICY "Admins have full access to dress details"
    ON dress_details
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Cake Details: Public can view for published products; Admins have full access
DROP POLICY IF EXISTS "Public can view published cake details" ON cake_details;
CREATE POLICY "Public can view published cake details"
    ON cake_details
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = cake_details.product_id
            AND products.status = 'published'
        )
    );

DROP POLICY IF EXISTS "Admins have full access to cake details" ON cake_details;
CREATE POLICY "Admins have full access to cake details"
    ON cake_details
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ==============================================================================
-- 5. CUSTOMERS POLICIES (Strictly Admin-Only for direct table access)
-- Note: Guest checkout writes via SECURITY DEFINER RPC function create_guest_order()
-- ==============================================================================
DROP POLICY IF EXISTS "Admins have full access to customers" ON customers;
CREATE POLICY "Admins have full access to customers"
    ON customers
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ==============================================================================
-- 6. ORDERS POLICIES (Strictly Admin-Only for direct table access)
-- Note: Guest checkout writes and guest tracking reads via SECURITY DEFINER RPC functions
-- ==============================================================================
DROP POLICY IF EXISTS "Admins have full access to orders" ON orders;
CREATE POLICY "Admins have full access to orders"
    ON orders
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ==============================================================================
-- 7. ORDER ITEMS POLICIES (Strictly Admin-Only for direct table access)
-- ==============================================================================
DROP POLICY IF EXISTS "Admins have full access to order items" ON order_items;
CREATE POLICY "Admins have full access to order items"
    ON order_items
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ==============================================================================
-- 8. PAYMENTS POLICIES (Strictly Admin-Only for direct table access)
-- ==============================================================================
DROP POLICY IF EXISTS "Admins have full access to payments" ON payments;
CREATE POLICY "Admins have full access to payments"
    ON payments
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ==============================================================================
-- 9. ORDER STATUS HISTORY POLICIES (Strictly Admin-Only for direct table access)
-- ==============================================================================
DROP POLICY IF EXISTS "Admins have full access to order status history" ON order_status_history;
CREATE POLICY "Admins have full access to order status history"
    ON order_status_history
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20260924000003_functions_and_rpc.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- Ababil’s Attire by Sanjida Bethi
-- Migration: 20260924000003_functions_and_rpc.sql
-- Description: Stored Procedures & RPCs for Guest Checkout, Safe Order Tracking, and Admin TrxID Matching Tool
-- ==============================================================================

-- ==============================================================================
-- 1. RPC: create_guest_order
-- Allows public guest users to place an order atomically without having an account.
-- Generates invoice_number, links or creates customer, snapshots items, and records bKash advance.
-- ==============================================================================
CREATE OR REPLACE FUNCTION create_guest_order(
    p_customer JSONB,
    p_order JSONB,
    p_items JSONB,
    p_payment JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_customer_id UUID;
    v_order_id UUID;
    v_invoice_number TEXT;
    v_total_amount NUMERIC(10, 2);
    v_subtotal NUMERIC(10, 2);
    v_delivery_charge NUMERIC(10, 2);
    v_advance_amount NUMERIC(10, 2);
    v_cash_due NUMERIC(10, 2);
    v_item JSONB;
    v_phone TEXT;
    v_customer_name TEXT;
    v_delivery_address TEXT;
    v_area TEXT;
    v_delivery_date DATE;
    v_trx_id TEXT;
    v_sender_last4 TEXT;
    v_reference_name TEXT;
BEGIN
    -- Extract and validate customer fields
    v_phone := TRIM(p_customer->>'phone');
    v_customer_name := TRIM(p_customer->>'name');
    v_delivery_address := TRIM(p_order->>'delivery_address');
    v_area := TRIM(COALESCE(p_customer->>'area', 'Other Dhaka'));
    
    IF v_phone IS NULL OR v_phone = '' THEN
        RAISE EXCEPTION 'Customer phone number is required';
    END IF;
    IF v_customer_name IS NULL OR v_customer_name = '' THEN
        RAISE EXCEPTION 'Customer name is required';
    END IF;
    IF v_delivery_address IS NULL OR v_delivery_address = '' THEN
        RAISE EXCEPTION 'Delivery address is required';
    END IF;

    -- Extract and validate payment fields (bKash advance)
    v_trx_id := UPPER(TRIM(p_payment->>'trx_id'));
    v_sender_last4 := TRIM(p_payment->>'sender_last4');
    v_reference_name := TRIM(COALESCE(p_payment->>'reference_name', ''));

    IF v_trx_id IS NULL OR v_trx_id = '' THEN
        RAISE EXCEPTION 'bKash Transaction ID (TrxID) is required';
    END IF;
    IF v_sender_last4 IS NULL OR LENGTH(v_sender_last4) < 4 THEN
        RAISE EXCEPTION 'Last 4 digits of bKash sender number are required';
    END IF;

    -- Extract delivery date
    v_delivery_date := (p_order->>'delivery_date')::DATE;
    IF v_delivery_date IS NULL THEN
        RAISE EXCEPTION 'Delivery date is required';
    END IF;

    -- Calculate financial amounts
    v_subtotal := COALESCE((p_order->>'subtotal')::NUMERIC, 0.00);
    v_delivery_charge := COALESCE((p_order->>'delivery_charge')::NUMERIC, 0.00);
    v_total_amount := v_subtotal + v_delivery_charge;
    v_advance_amount := COALESCE((p_order->>'advance_amount')::NUMERIC, 500.00);
    v_cash_due := GREATEST(0, v_total_amount - v_advance_amount);

    -- Find or create customer by phone
    SELECT id INTO v_customer_id FROM customers WHERE phone = v_phone LIMIT 1;
    
    IF v_customer_id IS NULL THEN
        INSERT INTO customers (name, phone, email, address, area, notes)
        VALUES (
            v_customer_name,
            v_phone,
            TRIM(p_customer->>'email'),
            v_delivery_address,
            v_area,
            p_customer->>'notes'
        )
        RETURNING id INTO v_customer_id;
    ELSE
        -- Update existing customer details if provided
        UPDATE customers
        SET name = v_customer_name,
            address = v_delivery_address,
            area = v_area,
            email = COALESCE(TRIM(p_customer->>'email'), email),
            updated_at = NOW()
        WHERE id = v_customer_id;
    END IF;

    -- Insert order (trigger will assign invoice_number and default cash_due)
    INSERT INTO orders (
        customer_id,
        status,
        subtotal,
        delivery_charge,
        total_amount,
        advance_amount,
        advance_status,
        cash_due,
        delivery_date,
        delivery_time,
        delivery_address,
        special_instructions
    )
    VALUES (
        v_customer_id,
        'review_required',
        v_subtotal,
        v_delivery_charge,
        v_total_amount,
        v_advance_amount,
        'pending',
        v_cash_due,
        v_delivery_date,
        p_order->>'delivery_time',
        v_delivery_address,
        p_order->>'special_instructions'
    )
    RETURNING id, invoice_number INTO v_order_id, v_invoice_number;

    -- Insert order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id,
            product_id,
            product_name_snapshot,
            quantity,
            unit_price,
            subtotal,
            selected_size,
            cake_weight,
            cake_flavor,
            cake_message,
            customization_details
        )
        VALUES (
            v_order_id,
            CASE WHEN (v_item->>'product_id') IS NOT NULL AND (v_item->>'product_id') <> ''
                 THEN (v_item->>'product_id')::UUID 
                 ELSE NULL 
            END,
            COALESCE(v_item->>'product_name_snapshot', 'Artisan Item'),
            GREATEST(1, COALESCE((v_item->>'quantity')::INTEGER, 1)),
            COALESCE((v_item->>'unit_price')::NUMERIC, 0.00),
            COALESCE((v_item->>'subtotal')::NUMERIC, 0.00),
            v_item->>'selected_size',
            v_item->>'cake_weight',
            v_item->>'cake_flavor',
            v_item->>'cake_message',
            v_item->>'customization_details'
        );
    END LOOP;

    -- Insert bKash payment record
    INSERT INTO payments (
        order_id,
        method,
        amount,
        trx_id,
        sender_last4,
        reference_name,
        status
    )
    VALUES (
        v_order_id,
        'bkash',
        v_advance_amount,
        v_trx_id,
        RIGHT(v_sender_last4, 4),
        v_reference_name,
        'pending_match'
    );

    -- Return safe confirmation payload for customer
    RETURN jsonb_build_object(
        'success', TRUE,
        'order_id', v_order_id,
        'invoice_number', v_invoice_number,
        'customer_name', v_customer_name,
        'subtotal', v_subtotal,
        'delivery_charge', v_delivery_charge,
        'total_amount', v_total_amount,
        'advance_amount', v_advance_amount,
        'advance_status', 'pending',
        'cash_due', v_cash_due,
        'delivery_date', v_delivery_date,
        'status', 'review_required',
        'created_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION create_guest_order(JSONB, JSONB, JSONB, JSONB) TO anon, authenticated, service_role;

-- ==============================================================================
-- 2. RPC: track_order_by_invoice
-- Allows public guest tracking by invoice number (e.g. 'AB-260923-1042').
-- Enforces privacy: returns sanitized info, no sensitive PII or internal admin notes.
-- ==============================================================================
CREATE OR REPLACE FUNCTION track_order_by_invoice(
    p_invoice_number TEXT,
    p_phone_last4 TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_items JSONB;
    v_timeline JSONB;
    v_clean_invoice TEXT;
BEGIN
    v_clean_invoice := UPPER(TRIM(p_invoice_number));

    IF v_clean_invoice IS NULL OR v_clean_invoice = '' THEN
        RETURN jsonb_build_object('found', FALSE, 'error', 'Invoice number is required');
    END IF;

    -- Query order joined with customer
    SELECT 
        o.id,
        o.invoice_number,
        o.status,
        o.subtotal,
        o.delivery_charge,
        o.total_amount,
        o.advance_amount,
        o.advance_status,
        o.cash_due,
        o.delivery_date,
        o.delivery_time,
        o.created_at,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.area AS customer_area
    INTO v_order
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.invoice_number = v_clean_invoice;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('found', FALSE, 'error', 'No order found with invoice ' || v_clean_invoice);
    END IF;

    -- Optional phone verification if provided
    IF p_phone_last4 IS NOT NULL AND p_phone_last4 <> '' THEN
        IF RIGHT(v_order.customer_phone, 4) <> RIGHT(TRIM(p_phone_last4), 4) THEN
            RETURN jsonb_build_object('found', FALSE, 'error', 'Phone verification did not match');
        END IF;
    END IF;

    -- Aggregate items
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', oi.id,
            'product_name', oi.product_name_snapshot,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal,
            'selected_size', oi.selected_size,
            'cake_weight', oi.cake_weight,
            'cake_flavor', oi.cake_flavor,
            'cake_message', oi.cake_message
        ) ORDER BY oi.created_at ASC
    ), '[]'::jsonb)
    INTO v_items
    FROM order_items oi
    WHERE oi.order_id = v_order.id;

    -- Aggregate sanitized timeline
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'status', osh.status,
            'created_at', osh.created_at,
            'note', osh.note
        ) ORDER BY osh.created_at ASC
    ), '[]'::jsonb)
    INTO v_timeline
    FROM order_status_history osh
    WHERE osh.order_id = v_order.id;

    -- Return safe public tracking payload
    RETURN jsonb_build_object(
        'found', TRUE,
        'invoice_number', v_order.invoice_number,
        'status', v_order.status,
        'customer_name_initial', SPLIT_PART(v_order.customer_name, ' ', 1),
        'delivery_area', v_order.customer_area,
        'delivery_date', v_order.delivery_date,
        'delivery_time', v_order.delivery_time,
        'subtotal', v_order.subtotal,
        'delivery_charge', v_order.delivery_charge,
        'total_amount', v_order.total_amount,
        'advance_amount', v_order.advance_amount,
        'advance_status', v_order.advance_status,
        'cash_due', v_order.cash_due,
        'created_at', v_order.created_at,
        'items', v_items,
        'timeline', v_timeline
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION track_order_by_invoice(TEXT, TEXT) TO anon, authenticated, service_role;

-- ==============================================================================
-- 3. RPC: find_order_by_trx_id (Admin TrxID Matching Tool)
-- Admin pastes TrxID -> Returns related payment, order, customer, and amounts to compare.
-- ==============================================================================
CREATE OR REPLACE FUNCTION find_order_by_trx_id(p_trx_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_clean_trx TEXT;
    v_result RECORD;
    v_items JSONB;
BEGIN
    -- Check admin permission
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin privileges required';
    END IF;

    v_clean_trx := UPPER(TRIM(p_trx_id));

    IF v_clean_trx IS NULL OR v_clean_trx = '' THEN
        RETURN jsonb_build_object('found', FALSE, 'error', 'TrxID is required');
    END IF;

    SELECT 
        p.id AS payment_id,
        p.trx_id,
        p.sender_last4,
        p.reference_name,
        p.amount AS payment_amount,
        p.status AS payment_status,
        p.matched_at,
        p.created_at AS payment_created_at,
        o.id AS order_id,
        o.invoice_number,
        o.status AS order_status,
        o.advance_amount AS expected_advance,
        o.advance_status,
        o.subtotal,
        o.delivery_charge,
        o.total_amount,
        o.cash_due,
        o.delivery_date,
        o.delivery_time,
        o.delivery_address,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.area AS customer_area,
        u.email AS matched_by_email
    INTO v_result
    FROM payments p
    JOIN orders o ON o.id = p.order_id
    JOIN customers c ON c.id = o.customer_id
    LEFT JOIN auth.users u ON u.id = p.matched_by
    WHERE UPPER(p.trx_id) = v_clean_trx
    ORDER BY p.created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('found', FALSE, 'error', 'No order found with TrxID: ' || v_clean_trx);
    END IF;

    -- Aggregate order items for preview
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'product_name', oi.product_name_snapshot,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal,
            'selected_size', oi.selected_size,
            'cake_weight', oi.cake_weight
        )
    ), '[]'::jsonb)
    INTO v_items
    FROM order_items oi
    WHERE oi.order_id = v_result.order_id;

    RETURN jsonb_build_object(
        'found', TRUE,
        'payment_id', v_result.payment_id,
        'trx_id', v_result.trx_id,
        'sender_last4', v_result.sender_last4,
        'reference_name', v_result.reference_name,
        'payment_amount', v_result.payment_amount,
        'payment_status', v_result.payment_status,
        'matched_at', v_result.matched_at,
        'matched_by_email', v_result.matched_by_email,
        'order_id', v_result.order_id,
        'invoice_number', v_result.invoice_number,
        'order_status', v_result.order_status,
        'expected_advance', v_result.expected_advance,
        'advance_status', v_result.advance_status,
        'total_amount', v_result.total_amount,
        'cash_due', v_result.cash_due,
        'delivery_date', v_result.delivery_date,
        'customer_name', v_result.customer_name,
        'customer_phone', v_result.customer_phone,
        'customer_area', v_result.customer_area,
        'delivery_address', v_result.delivery_address,
        'items', v_items
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION find_order_by_trx_id(TEXT) TO authenticated, service_role;

-- ==============================================================================
-- 4. RPC: match_bkash_payment (Admin TrxID Matching Tool Confirmation)
-- Admin compares details and confirms or rejects advance.
-- Updates payment, order advance status, logs to order_status_history with admin ID.
-- ==============================================================================
CREATE OR REPLACE FUNCTION match_bkash_payment(
    p_trx_id TEXT,
    p_confirm BOOLEAN,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_admin_id UUID;
    v_clean_trx TEXT;
    v_payment RECORD;
    v_order RECORD;
    v_history_note TEXT;
BEGIN
    -- Check admin permission
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin privileges required';
    END IF;

    v_admin_id := auth.uid();
    v_clean_trx := UPPER(TRIM(p_trx_id));

    -- Locate payment record
    SELECT * INTO v_payment
    FROM payments
    WHERE UPPER(trx_id) = v_clean_trx
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No payment found with TrxID: %', v_clean_trx;
    END IF;

    -- Locate order record
    SELECT * INTO v_order
    FROM orders
    WHERE id = v_payment.order_id;

    IF p_confirm THEN
        -- Confirm advance
        UPDATE payments
        SET status = 'matched',
            matched_at = NOW(),
            matched_by = v_admin_id
        WHERE id = v_payment.id;

        -- Update order status
        UPDATE orders
        SET advance_status = 'verified',
            status = CASE 
                WHEN status = 'review_required' THEN 'advance_verified' 
                ELSE status 
            END,
            updated_at = NOW()
        WHERE id = v_order.id;

        v_history_note := 'bKash Advance Verified (TrxID: ' || v_clean_trx || ', Sender: •••• ' || v_payment.sender_last4 || '). ' || COALESCE(p_note, 'Matched against studio statement.');

        INSERT INTO order_status_history (order_id, status, changed_by, note, created_at)
        VALUES (v_order.id, 'advance_verified', v_admin_id, v_history_note, NOW());
    ELSE
        -- Mark as mismatched/rejected
        UPDATE payments
        SET status = 'mismatched',
            matched_at = NOW(),
            matched_by = v_admin_id
        WHERE id = v_payment.id;

        UPDATE orders
        SET advance_status = 'rejected',
            updated_at = NOW()
        WHERE id = v_order.id;

        v_history_note := 'bKash TrxID Verification Failed: ' || COALESCE(p_note, 'TrxID or amount did not match statement.');

        INSERT INTO order_status_history (order_id, status, changed_by, note, created_at)
        VALUES (v_order.id, v_order.status, v_admin_id, v_history_note, NOW());
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'trx_id', v_clean_trx,
        'confirmed', p_confirm,
        'order_id', v_order.id,
        'invoice_number', v_order.invoice_number,
        'advance_status', CASE WHEN p_confirm THEN 'verified' ELSE 'rejected' END,
        'order_status', CASE WHEN p_confirm AND v_order.status = 'review_required' THEN 'advance_verified' ELSE v_order.status END,
        'matched_at', NOW(),
        'matched_by', v_admin_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION match_bkash_payment(TEXT, BOOLEAN, TEXT) TO authenticated, service_role;



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20260924000004_storage_setup.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- Ababil’s Attire by Sanjida Bethi
-- Migration: 20260924000004_storage_setup.sql
-- Description: Supabase Storage bucket creation and access policies for product images
-- ==============================================================================

-- 1. Create public storage bucket for product images if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    TRUE,
    5242880, -- 5 MB limit per image
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET public = TRUE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- 2. Storage RLS Policies for product-images bucket

-- Allow public read access to all product images
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'product-images');

-- Allow authenticated admins to upload images to dresses/ and cakes/
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'product-images' AND
        (
            auth.role() = 'authenticated' AND
            EXISTS (
                SELECT 1 FROM public.admin_users
                WHERE id = auth.uid()
                AND is_active = TRUE
            )
        )
    );

-- Allow authenticated admins to update product images
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'product-images' AND
        (
            auth.role() = 'authenticated' AND
            EXISTS (
                SELECT 1 FROM public.admin_users
                WHERE id = auth.uid()
                AND is_active = TRUE
            )
        )
    );

-- Allow authenticated admins to delete product images
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'product-images' AND
        (
            auth.role() = 'authenticated' AND
            EXISTS (
                SELECT 1 FROM public.admin_users
                WHERE id = auth.uid()
                AND is_active = TRUE
            )
        )
    );



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: 20260925000001_store_settings_and_manual_order.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- Ababil’s Attire by Sanjida Bethi
-- Migration: 20260925000001_store_settings_and_manual_order.sql
-- Description: Store configuration settings table, RLS policies, and Admin Manual Order RPC
-- ==============================================================================

-- 1. Create store_settings table
CREATE TABLE IF NOT EXISTS store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    store_name TEXT NOT NULL DEFAULT 'Ababil’s Attire by Sanjida Bethi',
    business_email TEXT NOT NULL DEFAULT 'sanjida@ababilsattire.com',
    contact_phone TEXT NOT NULL DEFAULT '+880 1712-345678',
    whatsapp_number TEXT NOT NULL DEFAULT '+880 1712-345678',
    workshop_address TEXT NOT NULL DEFAULT 'House 14, Road 7, Sector 3, Uttara, Dhaka - 1230',
    store_description TEXT NOT NULL DEFAULT 'Handmade dresses and fresh celebration cakes handcrafted with loving care in Dhaka.',
    studio_hours TEXT NOT NULL DEFAULT 'Sunday – Friday: 10:00 AM – 8:00 PM (Saturday Studio Closed / Delivery Only)',
    instagram_handle TEXT NOT NULL DEFAULT 'ababils.attire',
    facebook_url TEXT NOT NULL DEFAULT 'facebook.com/ababilsattire',
    
    -- bKash & Payments
    bkash_number TEXT NOT NULL DEFAULT '01712-345678',
    bkash_type TEXT NOT NULL DEFAULT 'personal' CHECK (bkash_type IN ('personal', 'merchant')),
    minimum_advance_amount NUMERIC(10, 2) NOT NULL DEFAULT 500.00 CHECK (minimum_advance_amount >= 0),
    payment_instructions TEXT NOT NULL DEFAULT 'Please Send Money of ৳ 500 to our bKash number and enter TrxID to lock your slot.',
    remaining_balance_policy TEXT NOT NULL DEFAULT 'Remaining balance is collected as Cash on Delivery (COD) by Pathao / Paperfly / Chilled Van courier.',
    require_trx_id BOOLEAN NOT NULL DEFAULT TRUE,
    require_sender_last4 BOOLEAN NOT NULL DEFAULT TRUE,
    require_reference_name BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Delivery & Logistics
    delivery_inside_dhaka NUMERIC(10, 2) NOT NULL DEFAULT 80.00 CHECK (delivery_inside_dhaka >= 0),
    delivery_outside_dhaka NUMERIC(10, 2) NOT NULL DEFAULT 150.00 CHECK (delivery_outside_dhaka >= 0),
    delivery_cake_van NUMERIC(10, 2) NOT NULL DEFAULT 250.00 CHECK (delivery_cake_van >= 0),
    cake_delivery_restriction TEXT NOT NULL DEFAULT 'Fresh celebration cakes are strictly delivered inside Dhaka via temperature-controlled vans to prevent melting or decorative damage.',
    available_delivery_days JSONB NOT NULL DEFAULT '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]'::jsonb,
    delivery_time_slots JSONB NOT NULL DEFAULT '[
        {"id": "slot_morning", "name": "Morning Slot (10 AM - 1 PM)", "start_time": "10:00", "end_time": "13:00"},
        {"id": "slot_afternoon", "name": "Afternoon Slot (2 PM - 6 PM)", "start_time": "14:00", "end_time": "18:00"},
        {"id": "slot_evening", "name": "Evening Slot (6 PM - 9 PM)", "start_time": "18:00", "end_time": "21:00"}
    ]'::jsonb,
    pickup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    pickup_address_note TEXT NOT NULL DEFAULT 'Uttara Studio Collection available 11 AM - 7 PM',
    
    -- Order Rules
    invoice_prefix TEXT NOT NULL DEFAULT 'AB-',
    default_order_status TEXT NOT NULL DEFAULT 'review_required',
    cake_minimum_notice TEXT NOT NULL DEFAULT '48 Hours (2 Days advance notice required for baking & chilling)',
    cake_minimum_notice_hours INTEGER NOT NULL DEFAULT 48,
    dress_lead_time TEXT NOT NULL DEFAULT '7 to 10 Working Days (Tailoring, smocking & hand embroidery)',
    dress_lead_time_days INTEGER NOT NULL DEFAULT 7,
    cancellation_policy TEXT NOT NULL DEFAULT 'Advance non-refundable once cake baking or fabric cutting commences.',
    
    -- Product Defaults
    preconfigured_sizes JSONB NOT NULL DEFAULT '["0-3M", "3-6M", "6-12M", "12-18M", "2-3Y", "3-4Y", "4-5Y", "Custom Sizing"]'::jsonb,
    preconfigured_cake_weights JSONB NOT NULL DEFAULT '["0.5 lb Bento", "1.0 lb", "1.5 lb", "2.0 lb", "3.0 lb Tiered"]'::jsonb,
    product_categories JSONB NOT NULL DEFAULT '["Handmade Dresses", "Celebration Cakes", "Custom Keepsakes"]'::jsonb,
    default_product_status TEXT NOT NULL DEFAULT 'draft',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for store_settings updated_at
DROP TRIGGER IF EXISTS trigger_update_store_settings_updated_at ON store_settings;
CREATE TRIGGER trigger_update_store_settings_updated_at
BEFORE UPDATE ON store_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed the initial default row if not exists
INSERT INTO store_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- 2. Row Level Security for store_settings
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view store settings" ON store_settings;
CREATE POLICY "Public can view store settings"
    ON store_settings
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can update store settings" ON store_settings;
CREATE POLICY "Admins can update store settings"
    ON store_settings
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- 3. Stored Procedure / RPC: get_store_settings
CREATE OR REPLACE FUNCTION get_store_settings()
RETURNS JSONB AS $$
DECLARE
    v_settings RECORD;
BEGIN
    SELECT * INTO v_settings FROM store_settings WHERE id = 'default' LIMIT 1;
    IF NOT FOUND THEN
        INSERT INTO store_settings (id) VALUES ('default') RETURNING * INTO v_settings;
    END IF;
    RETURN to_jsonb(v_settings);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_store_settings() TO anon, authenticated, service_role;

-- 4. Stored Procedure / RPC: update_store_settings
CREATE OR REPLACE FUNCTION update_store_settings(p_settings JSONB)
RETURNS JSONB AS $$
DECLARE
    v_updated RECORD;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin privileges required to update settings';
    END IF;

    UPDATE store_settings
    SET
        store_name = COALESCE(p_settings->>'store_name', store_name),
        business_email = COALESCE(p_settings->>'business_email', business_email),
        contact_phone = COALESCE(p_settings->>'contact_phone', contact_phone),
        whatsapp_number = COALESCE(p_settings->>'whatsapp_number', whatsapp_number),
        workshop_address = COALESCE(p_settings->>'workshop_address', workshop_address),
        store_description = COALESCE(p_settings->>'store_description', store_description),
        studio_hours = COALESCE(p_settings->>'studio_hours', studio_hours),
        instagram_handle = COALESCE(p_settings->>'instagram_handle', instagram_handle),
        facebook_url = COALESCE(p_settings->>'facebook_url', facebook_url),
        
        bkash_number = COALESCE(p_settings->>'bkash_number', bkash_number),
        bkash_type = COALESCE(p_settings->>'bkash_type', bkash_type),
        minimum_advance_amount = COALESCE((p_settings->>'minimum_advance_amount')::NUMERIC, minimum_advance_amount),
        payment_instructions = COALESCE(p_settings->>'payment_instructions', payment_instructions),
        remaining_balance_policy = COALESCE(p_settings->>'remaining_balance_policy', remaining_balance_policy),
        require_trx_id = COALESCE((p_settings->>'require_trx_id')::BOOLEAN, require_trx_id),
        require_sender_last4 = COALESCE((p_settings->>'require_sender_last4')::BOOLEAN, require_sender_last4),
        require_reference_name = COALESCE((p_settings->>'require_reference_name')::BOOLEAN, require_reference_name),
        
        delivery_inside_dhaka = COALESCE((p_settings->>'delivery_inside_dhaka')::NUMERIC, delivery_inside_dhaka),
        delivery_outside_dhaka = COALESCE((p_settings->>'delivery_outside_dhaka')::NUMERIC, delivery_outside_dhaka),
        delivery_cake_van = COALESCE((p_settings->>'delivery_cake_van')::NUMERIC, delivery_cake_van),
        cake_delivery_restriction = COALESCE(p_settings->>'cake_delivery_restriction', cake_delivery_restriction),
        available_delivery_days = COALESCE(p_settings->'available_delivery_days', available_delivery_days),
        delivery_time_slots = COALESCE(p_settings->'delivery_time_slots', delivery_time_slots),
        pickup_enabled = COALESCE((p_settings->>'pickup_enabled')::BOOLEAN, pickup_enabled),
        pickup_address_note = COALESCE(p_settings->>'pickup_address_note', pickup_address_note),
        
        invoice_prefix = COALESCE(p_settings->>'invoice_prefix', invoice_prefix),
        default_order_status = COALESCE(p_settings->>'default_order_status', default_order_status),
        cake_minimum_notice = COALESCE(p_settings->>'cake_minimum_notice', cake_minimum_notice),
        cake_minimum_notice_hours = COALESCE((p_settings->>'cake_minimum_notice_hours')::INTEGER, cake_minimum_notice_hours),
        dress_lead_time = COALESCE(p_settings->>'dress_lead_time', dress_lead_time),
        dress_lead_time_days = COALESCE((p_settings->>'dress_lead_time_days')::INTEGER, dress_lead_time_days),
        cancellation_policy = COALESCE(p_settings->>'cancellation_policy', cancellation_policy),
        
        preconfigured_sizes = COALESCE(p_settings->'preconfigured_sizes', preconfigured_sizes),
        preconfigured_cake_weights = COALESCE(p_settings->'preconfigured_cake_weights', preconfigured_cake_weights),
        product_categories = COALESCE(p_settings->'product_categories', product_categories),
        default_product_status = COALESCE(p_settings->>'default_product_status', default_product_status),
        
        updated_at = NOW()
    WHERE id = 'default'
    RETURNING * INTO v_updated;

    RETURN to_jsonb(v_updated);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_store_settings(JSONB) TO authenticated, service_role;

-- 5. Stored Procedure / RPC: create_manual_order (Admin Staff Order Placement)
CREATE OR REPLACE FUNCTION create_manual_order(
    p_customer JSONB,
    p_order JSONB,
    p_items JSONB,
    p_payment JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_admin_id UUID;
    v_customer_id UUID;
    v_order_id UUID;
    v_invoice_number TEXT;
    v_total_amount NUMERIC(10, 2);
    v_subtotal NUMERIC(10, 2);
    v_delivery_charge NUMERIC(10, 2);
    v_advance_amount NUMERIC(10, 2);
    v_cash_due NUMERIC(10, 2);
    v_item JSONB;
    v_phone TEXT;
    v_customer_name TEXT;
    v_delivery_address TEXT;
    v_area TEXT;
    v_delivery_date DATE;
    v_order_status TEXT;
    v_advance_status TEXT;
    v_advance_verified BOOLEAN;
    v_payment_id UUID;
    v_trx_id TEXT;
    v_sender_last4 TEXT;
    v_reference_name TEXT;
BEGIN
    -- Ensure user is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin privileges required to create manual orders';
    END IF;

    v_admin_id := auth.uid();

    -- Validate customer input
    v_phone := TRIM(p_customer->>'phone');
    v_customer_name := TRIM(p_customer->>'name');
    v_delivery_address := TRIM(p_order->>'delivery_address');
    v_area := TRIM(COALESCE(p_customer->>'area', 'Other Dhaka'));

    IF v_phone IS NULL OR v_phone = '' THEN
        RAISE EXCEPTION 'Customer phone is required';
    END IF;
    IF v_customer_name IS NULL OR v_customer_name = '' THEN
        RAISE EXCEPTION 'Customer name is required';
    END IF;
    IF v_delivery_address IS NULL OR v_delivery_address = '' THEN
        RAISE EXCEPTION 'Delivery address is required';
    END IF;

    -- Validate order date
    v_delivery_date := (p_order->>'delivery_date')::DATE;
    IF v_delivery_date IS NULL THEN
        RAISE EXCEPTION 'Delivery date is required';
    END IF;

    -- Validate items list
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'At least one product item is required for a manual order';
    END IF;

    -- Financial computations
    v_subtotal := COALESCE((p_order->>'subtotal')::NUMERIC, 0.00);
    v_delivery_charge := COALESCE((p_order->>'delivery_charge')::NUMERIC, 0.00);
    v_total_amount := v_subtotal + v_delivery_charge;
    v_advance_amount := COALESCE((p_order->>'advance_amount')::NUMERIC, 0.00);

    IF v_advance_amount > v_total_amount THEN
        RAISE EXCEPTION 'Advance amount (৳ %) cannot exceed total order amount (৳ %)', v_advance_amount, v_total_amount;
    END IF;

    v_cash_due := GREATEST(0, v_total_amount - v_advance_amount);

    -- Advance and order statuses
    v_advance_verified := COALESCE((p_order->>'advance_verified')::BOOLEAN, FALSE);
    IF v_advance_verified AND v_advance_amount > 0 THEN
        v_advance_status := 'verified';
        v_order_status := 'advance_verified';
    ELSIF v_advance_amount > 0 THEN
        v_advance_status := 'pending';
        v_order_status := 'review_required';
    ELSE
        v_advance_status := 'pending';
        v_order_status := 'review_required';
    END IF;

    -- Customer resolution (existing by ID, or find by phone, or insert)
    IF p_customer->>'id' IS NOT NULL AND TRIM(p_customer->>'id') <> '' THEN
        SELECT id INTO v_customer_id FROM customers WHERE id = (p_customer->>'id')::UUID LIMIT 1;
    END IF;

    IF v_customer_id IS NULL THEN
        SELECT id INTO v_customer_id FROM customers WHERE phone = v_phone LIMIT 1;
    END IF;

    IF v_customer_id IS NULL THEN
        INSERT INTO customers (name, phone, alt_phone, email, address, area, notes)
        VALUES (
            v_customer_name,
            v_phone,
            TRIM(p_customer->>'alt_phone'),
            TRIM(p_customer->>'email'),
            v_delivery_address,
            v_area,
            p_customer->>'notes'
        )
        RETURNING id INTO v_customer_id;
    ELSE
        UPDATE customers
        SET name = v_customer_name,
            address = v_delivery_address,
            area = v_area,
            alt_phone = COALESCE(TRIM(p_customer->>'alt_phone'), alt_phone),
            email = COALESCE(TRIM(p_customer->>'email'), email),
            updated_at = NOW()
        WHERE id = v_customer_id;
    END IF;

    -- Create order record
    INSERT INTO orders (
        customer_id,
        status,
        subtotal,
        delivery_charge,
        total_amount,
        advance_amount,
        advance_status,
        cash_due,
        delivery_date,
        delivery_time,
        delivery_address,
        special_instructions
    )
    VALUES (
        v_customer_id,
        v_order_status,
        v_subtotal,
        v_delivery_charge,
        v_total_amount,
        v_advance_amount,
        v_advance_status,
        v_cash_due,
        v_delivery_date,
        p_order->>'delivery_time',
        v_delivery_address,
        p_order->>'special_instructions'
    )
    RETURNING id, invoice_number INTO v_order_id, v_invoice_number;

    -- Insert order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id,
            product_id,
            product_name_snapshot,
            quantity,
            unit_price,
            subtotal,
            selected_size,
            cake_weight,
            cake_flavor,
            cake_message,
            customization_details
        )
        VALUES (
            v_order_id,
            CASE WHEN v_item->>'product_id' IS NOT NULL AND v_item->>'product_id' <> '' 
                 THEN (v_item->>'product_id')::UUID 
                 ELSE NULL 
            END,
            COALESCE(v_item->>'product_name', v_item->>'product_name_snapshot', 'Bespoke Item'),
            GREATEST(1, COALESCE((v_item->>'quantity')::INTEGER, 1)),
            COALESCE((v_item->>'unit_price')::NUMERIC, 0.00),
            COALESCE((v_item->>'subtotal')::NUMERIC, 0.00),
            v_item->>'selected_size',
            v_item->>'cake_weight',
            v_item->>'cake_flavor',
            v_item->>'cake_message',
            COALESCE(v_item->>'special_instructions', v_item->>'customization_details')
        );
    END LOOP;

    -- Record payment if bKash advance provided
    IF p_payment IS NOT NULL AND p_payment->>'trx_id' IS NOT NULL AND TRIM(p_payment->>'trx_id') <> '' THEN
        v_trx_id := UPPER(TRIM(p_payment->>'trx_id'));
        v_sender_last4 := COALESCE(TRIM(p_payment->>'sender_last4'), '0000');
        v_reference_name := TRIM(COALESCE(p_payment->>'reference_name', 'Manual Order Entry'));

        INSERT INTO payments (
            order_id,
            method,
            amount,
            trx_id,
            sender_last4,
            reference_name,
            status,
            matched_at,
            matched_by
        )
        VALUES (
            v_order_id,
            COALESCE(p_payment->>'method', 'bkash'),
            v_advance_amount,
            v_trx_id,
            v_sender_last4,
            v_reference_name,
            CASE WHEN v_advance_verified THEN 'matched' ELSE 'pending_match' END,
            CASE WHEN v_advance_verified THEN NOW() ELSE NULL END,
            CASE WHEN v_advance_verified THEN v_admin_id ELSE NULL END
        )
        RETURNING id INTO v_payment_id;
    END IF;

    -- Add status history entry
    INSERT INTO order_status_history (
        order_id,
        status,
        changed_by,
        note,
        created_at
    )
    VALUES (
        v_order_id,
        v_order_status,
        v_admin_id,
        'Manual bespoke order created by Atelier Admin. Customer: ' || v_customer_name || ' (' || v_phone || '). Advance: ৳ ' || v_advance_amount::TEXT,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'order_id', v_order_id,
        'invoice_number', v_invoice_number,
        'customer_id', v_customer_id,
        'customer_name', v_customer_name,
        'total_amount', v_total_amount,
        'advance_amount', v_advance_amount,
        'cash_due', v_cash_due,
        'status', v_order_status,
        'advance_status', v_advance_status,
        'delivery_date', v_delivery_date,
        'created_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_manual_order(JSONB, JSONB, JSONB, JSONB) TO authenticated, service_role;



-- ==============================================================================
-- EXTRA RLS POLICY: ALLOW SELF-PROFILE SELECT FOR ADMIN USERS
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'admin_users' AND policyname = 'Users can view their own admin profile'
    ) THEN
        CREATE POLICY "Users can view their own admin profile"
            ON admin_users
            FOR SELECT
            USING (id = auth.uid());
    END IF;
END $$;


-- ==============================================================================
-- ADMIN USER CONFIGURATION (ababils@attire.com)
-- ==============================================================================
INSERT INTO public.admin_users (id, email, full_name, role, is_active)
VALUES (
    'ccaaafc3-5f50-4ac2-ba83-bc0610b6fb0d',
    'ababils@attire.com',
    'Sanjida Bethi',
    'superadmin',
    TRUE
)
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email,
    role = 'superadmin',
    is_active = TRUE;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- FILE: seed.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- Ababil’s Attire by Sanjida Bethi
-- Seed Data: supabase/seed.sql
-- Description: Initial products, images, details, sample customer, order, and bKash payment matching demo
-- ==============================================================================

DO $$
DECLARE
    -- Product IDs
    v_p_dress1 UUID := '11111111-1111-4111-8111-111111111111';
    v_p_dress2 UUID := '22222222-2222-4222-8222-222222222222';
    v_p_dress3 UUID := '33333333-3333-4333-8333-333333333333';
    v_p_cake1  UUID := '44444444-4444-4444-8444-444444444444';
    v_p_cake2  UUID := '55555555-5555-4555-8555-555555555555';
    v_p_cake3  UUID := '66666666-6666-4666-8666-666666666666';

    -- Customer & Order IDs
    v_cust_id  UUID := '77777777-7777-4777-8777-777777777777';
    v_order_id UUID := '88888888-8888-4888-8888-888888888888';
BEGIN

    -- 1. Insert Products (Dresses)
    INSERT INTO products (
        id, product_code, name, category, description, price, status, 
        featured, new_arrival, stock_quantity, lead_time_days, minimum_notice_hours
    )
    VALUES
    (
        v_p_dress1,
        'AA-DRS-001',
        'Vintage Rose Smocked Cotton Dress',
        'dress',
        'Delicate hand-smocked heirloom dress tailored in soft organic cotton. Features intricate rosebud hand-embroidery along the bodice and ruffled Peter Pan collar.',
        3800.00,
        'published',
        TRUE,
        TRUE,
        6,
        7,
        0
    ),
    (
        v_p_dress2,
        'AA-DRS-002',
        'Ivory Silk Organza Heirloom Gown',
        'dress',
        'Exquisite celebratory christening & milestone gown in pure mulberry silk organza. Layered with soft cotton lining, scalloped hemlines, and pearlized button closure.',
        4800.00,
        'published',
        TRUE,
        FALSE,
        3,
        10,
        0
    ),
    (
        v_p_dress3,
        'AA-DRS-003',
        'Terracotta Linen Play Pinafore',
        'dress',
        'Earthy artisan linen pinafore dress with cross-back straps, mother-of-pearl buttons, and gathered heirloom skirt designed for comfortable everyday luxury.',
        2950.00,
        'published',
        FALSE,
        TRUE,
        8,
        5,
        0
    )
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price;

    -- 2. Insert Dress Details
    INSERT INTO dress_details (product_id, available_sizes, fabric_details, care_instructions)
    VALUES
    (
        v_p_dress1,
        ARRAY['0-3M', '3-6M', '6-12M', '12-18M', '2-3Y', '3-4Y'],
        '100% Organic Soft Voile Cotton with French cotton lace trim and hand-smocked silk thread.',
        'Gentle cold hand-wash with mild baby-safe detergent. Do not wring or tumble dry. Dry flat in shade. Cool iron on reverse.'
    ),
    (
        v_p_dress2,
        ARRAY['3-6M', '6-12M', '12-18M', '2-3Y'],
        'Pure Mulberry Silk Organza outer layer with 100% fine Egyptian cotton voile underlay.',
        'Dry clean recommended. Alternatively, delicate cool dip hand-wash and studio steam press.'
    ),
    (
        v_p_dress3,
        ARRAY['6-12M', '12-18M', '2-3Y', '3-4Y', '4-5Y'],
        '100% Natural Pre-washed European Flax Linen.',
        'Machine wash cold on gentle cycle. Hang to dry. Iron while slightly damp for crisp handfeel.'
    )
    ON CONFLICT (product_id) DO UPDATE 
    SET available_sizes = EXCLUDED.available_sizes,
        fabric_details = EXCLUDED.fabric_details,
        care_instructions = EXCLUDED.care_instructions;

    -- 3. Insert Products (Cakes)
    INSERT INTO products (
        id, product_code, name, category, description, price, status, 
        featured, new_arrival, stock_quantity, lead_time_days, minimum_notice_hours
    )
    VALUES
    (
        v_p_cake1,
        'AA-CKE-001',
        'Vanilla Bean & Wild Fig Celebration Cake',
        'cake',
        'Architectural botanical confection layered with Madagascar bourbon vanilla bean sponge, house-made wild fig compote, and whipped mascarpone buttercream.',
        3550.00,
        'published',
        TRUE,
        TRUE,
        15,
        2,
        48
    ),
    (
        v_p_cake2,
        'AA-CKE-002',
        'Vintage Lambeth Ruffle Bento Cake',
        'cake',
        'Handcrafted Victorian Lambeth piped bento cake in dusty blush and ivory cream. Perfect for intimate milestone celebrations, baby announcements, and birthdays.',
        1650.00,
        'published',
        TRUE,
        FALSE,
        20,
        1,
        24
    ),
    (
        v_p_cake3,
        'AA-CKE-003',
        'Pistachio Rosewater & Raspberry Confit Cake',
        'cake',
        'Artisan toasted pistachio sponge infused with Persian rosewater syrup, layered with fresh raspberry coulis and white chocolate swiss meringue buttercream.',
        3950.00,
        'published',
        FALSE,
        TRUE,
        10,
        2,
        48
    )
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price;

    -- 4. Insert Cake Details
    INSERT INTO cake_details (product_id, weight_options, flavor_options, customization_options, storage_instructions)
    VALUES
    (
        v_p_cake1,
        '[
            {"weight": "0.5 lb Bento", "price": 1800, "servings": "2-3"},
            {"weight": "1.0 lb", "price": 3550, "servings": "6-8"},
            {"weight": "1.5 lb Tiered", "price": 5200, "servings": "10-12"},
            {"weight": "2.0 lb Double Tier", "price": 6800, "servings": "14-18"}
        ]'::jsonb,
        ARRAY['Madagascar Vanilla Bean & Fig', 'Valrhona Chocolate Truffle Ganache', 'Earl Grey & Honey Lavender'],
        'Piped cursive calligraphy greeting on top (up to 25 characters) or chocolate script plaque.',
        'Keep chilled in refrigerator between 4°C – 8°C. Bring to room temperature 30 minutes before cutting for peak flavor and velvety texture.'
    ),
    (
        v_p_cake2,
        '[
            {"weight": "0.5 lb Bento", "price": 1650, "servings": "1-2"},
            {"weight": "1.0 lb Petite", "price": 2850, "servings": "4-6"}
        ]'::jsonb,
        ARRAY['Salted Caramel Vanilla', 'Rich Dark Chocolate Truffle', 'Red Velvet Cream Cheese'],
        'Custom piped vintage Lambeth text in cocoa umber or dusty blush.',
        'Store in cool refrigerated box. Best consumed within 48 hours of studio delivery.'
    ),
    (
        v_p_cake3,
        '[
            {"weight": "1.0 lb", "price": 3950, "servings": "6-8"},
            {"weight": "1.5 lb Tiered", "price": 5800, "servings": "10-12"},
            {"weight": "2.0 lb", "price": 7600, "servings": "14-18"}
        ]'::jsonb,
        ARRAY['Pistachio Rosewater & Raspberry', 'Pistachio Cardamom Cream'],
        'Edible dried organic rose petals, hand-applied 24k gold leaf, custom inscription.',
        'Keep refrigerated. Transport in an air-conditioned vehicle; do not expose to direct sun.'
    )
    ON CONFLICT (product_id) DO UPDATE 
    SET weight_options = EXCLUDED.weight_options,
        flavor_options = EXCLUDED.flavor_options,
        customization_options = EXCLUDED.customization_options,
        storage_instructions = EXCLUDED.storage_instructions;

    -- 5. Insert Product Images (Demo storage paths & external high-res fallbacks)
    INSERT INTO product_images (product_id, image_url, sort_order, alt_text)
    VALUES
    (v_p_dress1, 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=80', 0, 'Vintage Rose Smocked Cotton Dress Front View'),
    (v_p_dress1, 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?auto=format&fit=crop&w=800&q=80', 1, 'Vintage Rose Smocked Detail Close-up'),
    (v_p_dress2, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80', 0, 'Ivory Silk Organza Heirloom Gown'),
    (v_p_dress3, 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=800&q=80', 0, 'Terracotta Linen Play Pinafore'),
    (v_p_cake1,  'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80', 0, 'Vanilla Bean & Wild Fig Celebration Cake'),
    (v_p_cake2,  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80', 0, 'Vintage Lambeth Ruffle Bento Cake'),
    (v_p_cake3,  'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=800&q=80', 0, 'Pistachio Rosewater & Raspberry Confit Cake')
    ON CONFLICT DO NOTHING;

    -- 6. Insert Demo Customer (Ayesha Rahman from Banani, Dhaka)
    INSERT INTO customers (id, name, phone, email, address, area, notes)
    VALUES (
        v_cust_id,
        'Ayesha Rahman',
        '01711223344',
        'ayesha.rahman21@gmail.com',
        'House 42, Road 11, Block D, Banani',
        'Banani',
        'Deliver between 2 PM - 4 PM. Please ring bell twice.'
    )
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address;

    -- 7. Insert Demo Order #AB-260923-1042 (bKash Advance Awaiting Matching)
    INSERT INTO orders (
        id, invoice_number, customer_id, status, subtotal, delivery_charge, 
        total_amount, advance_amount, advance_status, cash_due, 
        delivery_date, delivery_time, delivery_address, special_instructions
    )
    VALUES (
        v_order_id,
        'AB-260923-1042',
        v_cust_id,
        'review_required',
        7350.00,
        250.00,
        7600.00,
        500.00,
        'pending',
        7100.00,
        (CURRENT_DATE + INTERVAL '4 days')::DATE,
        '2:00 PM - 4:00 PM',
        'House 42, Road 11, Block D, Banani, Dhaka',
        'Please chill the cake packaging thoroughly before van dispatch.'
    )
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 8. Insert Order Items for Demo Order
    INSERT INTO order_items (
        order_id, product_id, product_name_snapshot, quantity, unit_price, subtotal, 
        selected_size, cake_weight, cake_flavor, cake_message
    )
    VALUES
    (
        v_order_id,
        v_p_dress1,
        'Vintage Rose Smocked Cotton Dress',
        1,
        3800.00,
        3800.00,
        '12-18M',
        NULL,
        NULL,
        NULL
    ),
    (
        v_order_id,
        v_p_cake1,
        'Vanilla Bean & Wild Fig Celebration Cake',
        1,
        3550.00,
        3550.00,
        NULL,
        '1.0 lb',
        'Madagascar Vanilla Bean & Fig',
        'Happy 2nd Birthday Inaya!'
    )
    ON CONFLICT DO NOTHING;

    -- 9. Insert Demo bKash Payment Record (Ready for Admin Matching Tool)
    INSERT INTO payments (
        order_id, method, amount, trx_id, sender_last4, reference_name, status
    )
    VALUES (
        v_order_id,
        'bkash',
        500.00,
        '9K8A4M29PX',
        '4567',
        'Ayesha Rahman (Inaya Cake)',
        'pending_match'
    )
    ON CONFLICT DO NOTHING;

    -- 10. Initial Order Status History
    INSERT INTO order_status_history (order_id, status, note, created_at)
    VALUES (
        v_order_id,
        'review_required',
        'Order submitted with bKash advance TrxID 9K8A4M29PX. Awaiting admin statement reconciliation.',
        NOW() - INTERVAL '2 hours'
    )
    ON CONFLICT DO NOTHING;

END $$;
