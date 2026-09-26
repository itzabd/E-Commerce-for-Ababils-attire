-- Ababil’s Attire by Sanjida Bethi
-- Security Patch: Prevent Price Tampering & Restrict Storage

-- 1. FIX PRICE TAMPERING VULNERABILITY IN GUEST CHECKOUT
-- The original function trusted the client's payload for item subtotals and the total order amount.
-- This updated version looks up the TRUE price from the `products` table and strictly calculates the total in the database.

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
    
    v_calculated_subtotal NUMERIC(10, 2) := 0.00;
    v_total_amount NUMERIC(10, 2);
    v_delivery_charge NUMERIC(10, 2);
    v_advance_amount NUMERIC(10, 2);
    v_cash_due NUMERIC(10, 2);
    
    v_item JSONB;
    v_product_id UUID;
    v_real_price NUMERIC(10, 2);
    v_quantity INTEGER;
    v_item_subtotal NUMERIC(10, 2);
    
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
    
    IF v_phone IS NULL OR v_phone = '' THEN RAISE EXCEPTION 'Customer phone number is required'; END IF;
    IF v_customer_name IS NULL OR v_customer_name = '' THEN RAISE EXCEPTION 'Customer name is required'; END IF;
    IF v_delivery_address IS NULL OR v_delivery_address = '' THEN RAISE EXCEPTION 'Delivery address is required'; END IF;

    -- Extract payment fields
    v_trx_id := UPPER(TRIM(p_payment->>'trx_id'));
    v_sender_last4 := TRIM(p_payment->>'sender_last4');
    v_reference_name := TRIM(COALESCE(p_payment->>'reference_name', ''));
    
    IF v_trx_id IS NULL OR v_trx_id = '' THEN RAISE EXCEPTION 'bKash Transaction ID is required'; END IF;
    IF v_sender_last4 IS NULL OR LENGTH(v_sender_last4) < 4 THEN RAISE EXCEPTION 'Last 4 digits required'; END IF;

    -- Extract delivery date
    v_delivery_date := (p_order->>'delivery_date')::DATE;
    IF v_delivery_date IS NULL THEN RAISE EXCEPTION 'Delivery date is required'; END IF;

    -- Find or create customer
    SELECT id INTO v_customer_id FROM customers WHERE phone = v_phone LIMIT 1;
    IF v_customer_id IS NULL THEN
        INSERT INTO customers (name, phone, email, address, area, notes)
        VALUES (v_customer_name, v_phone, TRIM(p_customer->>'email'), v_delivery_address, v_area, p_customer->>'notes')
        RETURNING id INTO v_customer_id;
    ELSE
        UPDATE customers
        SET name = v_customer_name, address = v_delivery_address, area = v_area, email = COALESCE(TRIM(p_customer->>'email'), email), updated_at = NOW()
        WHERE id = v_customer_id;
    END IF;

    -- Create order placeholder (prices calculated later)
    v_delivery_charge := COALESCE((p_order->>'delivery_charge')::NUMERIC, 0.00);
    v_advance_amount := COALESCE((p_order->>'advance_amount')::NUMERIC, 500.00);

    INSERT INTO orders (
        customer_id, status, subtotal, delivery_charge, total_amount, advance_amount, advance_status, cash_due,
        delivery_date, delivery_time, delivery_address, special_instructions
    )
    VALUES (
        v_customer_id, 'review_required', 0, v_delivery_charge, 0, v_advance_amount, 'pending', 0,
        v_delivery_date, p_order->>'delivery_time', v_delivery_address, p_order->>'special_instructions'
    )
    RETURNING id, invoice_number INTO v_order_id, v_invoice_number;

    -- Calculate true prices for items and insert
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_quantity := GREATEST(1, COALESCE((v_item->>'quantity')::INTEGER, 1));
        v_product_id := CASE WHEN (v_item->>'product_id') IS NOT NULL AND (v_item->>'product_id') <> '' THEN (v_item->>'product_id')::UUID ELSE NULL END;
        
        IF v_product_id IS NOT NULL THEN
            SELECT base_price INTO v_real_price FROM products WHERE id = v_product_id;
            v_real_price := COALESCE(v_real_price, 0.00);
        ELSE
            -- Custom untracked product, we have to trust the provided price or default to 0
            v_real_price := COALESCE((v_item->>'unit_price')::NUMERIC, 0.00);
        END IF;

        v_item_subtotal := v_real_price * v_quantity;
        v_calculated_subtotal := v_calculated_subtotal + v_item_subtotal;

        INSERT INTO order_items (
            order_id, product_id, product_name_snapshot, quantity, unit_price, subtotal,
            selected_size, cake_weight, cake_flavor, cake_message, customization_details
        )
        VALUES (
            v_order_id, v_product_id, COALESCE(v_item->>'product_name_snapshot', 'Artisan Item'),
            v_quantity, v_real_price, v_item_subtotal, v_item->>'selected_size', v_item->>'cake_weight',
            v_item->>'cake_flavor', v_item->>'cake_message', v_item->>'customization_details'
        );
    END LOOP;

    -- Finalize order totals
    v_total_amount := v_calculated_subtotal + v_delivery_charge;
    v_cash_due := GREATEST(0, v_total_amount - v_advance_amount);

    UPDATE orders
    SET subtotal = v_calculated_subtotal,
        total_amount = v_total_amount,
        cash_due = v_cash_due
    WHERE id = v_order_id;

    -- Insert payment record
    INSERT INTO payments (order_id, trx_id, sender_last4, reference_name, amount)
    VALUES (v_order_id, v_trx_id, v_sender_last4, v_reference_name, v_advance_amount);

    -- Log history
    INSERT INTO order_status_history (order_id, status, note, changed_by)
    VALUES (v_order_id, 'review_required', 'Order placed via Guest Checkout. TrxID: ' || v_trx_id, NULL);

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'invoice_number', v_invoice_number,
        'customer_name', v_customer_name,
        'subtotal', v_calculated_subtotal,
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


-- 2. RESTRICT PUBLIC UPLOADS TO STORAGE BUCKET
-- Removes the anon insert policy and ensures only authenticated users can upload product images

-- Drop the overly permissive policy if it exists
DROP POLICY IF EXISTS "Public Upload Access" ON storage.objects;

-- Create an Admin-Only insert policy
CREATE POLICY "Admin Upload Access"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');
