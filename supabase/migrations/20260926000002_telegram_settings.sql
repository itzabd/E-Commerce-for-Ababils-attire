// ==============================================================================
// Migration: Add Telegram notifications settings to store_settings table & RPC
// Date: 2026-09-26
// ==============================================================================

-- 1. Add Telegram notification columns to store_settings table
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS telegram_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT DEFAULT '';

-- 2. Update update_store_settings function to persist Telegram notification configurations
CREATE OR REPLACE FUNCTION update_store_settings(p_settings jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated RECORD;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin privileges required to update settings';
    END IF;

    UPDATE store_settings
    SET
        store_name = COALESCE(p_settings->>'store_name', store_name),
        logo_url = CASE WHEN p_settings ? 'logo_url' THEN p_settings->>'logo_url' ELSE logo_url END,
        hero_banner_url = CASE WHEN p_settings ? 'hero_banner_url' THEN p_settings->>'hero_banner_url' ELSE hero_banner_url END,
        dresses_collection_url = CASE WHEN p_settings ? 'dresses_collection_url' THEN p_settings->>'dresses_collection_url' ELSE dresses_collection_url END,
        cakes_collection_url = CASE WHEN p_settings ? 'cakes_collection_url' THEN p_settings->>'cakes_collection_url' ELSE cakes_collection_url END,
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
        size_chart = COALESCE(p_settings->'size_chart', size_chart),
        size_guide_intro = COALESCE(p_settings->>'size_guide_intro', size_guide_intro),

        telegram_notifications_enabled = CASE WHEN p_settings ? 'telegram_notifications_enabled' THEN (p_settings->>'telegram_notifications_enabled')::BOOLEAN ELSE telegram_notifications_enabled END,
        telegram_chat_id = CASE WHEN p_settings ? 'telegram_chat_id' THEN p_settings->>'telegram_chat_id' ELSE telegram_chat_id END,
        
        updated_at = NOW()
    WHERE id = 'default'
    RETURNING * INTO v_updated;

    RETURN to_jsonb(v_updated);
END;
$$;
