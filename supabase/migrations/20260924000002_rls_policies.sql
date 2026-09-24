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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
-- 3. ADMIN USERS TABLE POLICIES
-- ==============================================================================
CREATE POLICY "Admins can view admin accounts"
    ON admin_users
    FOR SELECT
    USING (is_admin());

CREATE POLICY "Superadmins can manage admin accounts"
    ON admin_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE id = auth.uid()
            AND role = 'superadmin'
            AND is_active = TRUE
        )
    );

-- ==============================================================================
-- 4. PRODUCTS & DETAILS POLICIES
-- ==============================================================================

-- Products: Public can read published products only; Admins can do everything
CREATE POLICY "Public can view published products"
    ON products
    FOR SELECT
    USING (status = 'published');

CREATE POLICY "Admins have full access to products"
    ON products
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Product Images: Public can view images for published products; Admins have full access
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

CREATE POLICY "Admins have full access to product images"
    ON product_images
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Dress Details: Public can view for published products; Admins have full access
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

CREATE POLICY "Admins have full access to dress details"
    ON dress_details
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Cake Details: Public can view for published products; Admins have full access
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

CREATE POLICY "Admins have full access to cake details"
    ON cake_details
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ==============================================================================
-- 5. CUSTOMERS POLICIES (Strictly Admin-Only for direct table access)
-- Note: Guest checkout writes via SECURITY DEFINER RPC function create_guest_order()
-- ==============================================================================
CREATE POLICY "Admins have full access to customers"
    ON customers
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ==============================================================================
-- 6. ORDERS POLICIES (Strictly Admin-Only for direct table access)
-- Note: Guest checkout writes and guest tracking reads via SECURITY DEFINER RPC functions
-- ==============================================================================
CREATE POLICY "Admins have full access to orders"
    ON orders
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ==============================================================================
-- 7. ORDER ITEMS POLICIES (Strictly Admin-Only for direct table access)
-- ==============================================================================
CREATE POLICY "Admins have full access to order items"
    ON order_items
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ==============================================================================
-- 8. PAYMENTS POLICIES (Strictly Admin-Only for direct table access)
-- ==============================================================================
CREATE POLICY "Admins have full access to payments"
    ON payments
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ==============================================================================
-- 9. ORDER STATUS HISTORY POLICIES (Strictly Admin-Only for direct table access)
-- ==============================================================================
CREATE POLICY "Admins have full access to order status history"
    ON order_status_history
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());
