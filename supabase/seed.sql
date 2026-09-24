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
