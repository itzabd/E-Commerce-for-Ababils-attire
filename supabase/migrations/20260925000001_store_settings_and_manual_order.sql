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
    store_description TEXT NOT NULL DEFAULT 'Handmade dresses and fresh celebration cakes handcrafted with heirloom care in Dhaka.',
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
    preconfigured_sizes JSONB NOT NULL DEFAULT '["0-3M", "3-6M", "6-12M", "12-18M", "2-3Y", "3-4Y", "4-5Y", "Bespoke Custom"]'::jsonb,
    preconfigured_cake_weights JSONB NOT NULL DEFAULT '["0.5 lb Bento", "1.0 lb", "1.5 lb", "2.0 lb", "3.0 lb Tiered"]'::jsonb,
    product_categories JSONB NOT NULL DEFAULT '["Handmade Dresses", "Celebration Cakes", "Bespoke Keepsakes"]'::jsonb,
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
