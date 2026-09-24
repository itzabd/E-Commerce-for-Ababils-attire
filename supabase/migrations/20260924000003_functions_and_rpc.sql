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
