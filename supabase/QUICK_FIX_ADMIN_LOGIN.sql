-- ==============================================================================
-- Ababil’s Attire: Quick Fix for Admin Login (Solves RLS 42P17 Infinite Recursion)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/tufmjeeodmfnrubkkqya/sql/new
-- ==============================================================================

-- 1. Drop existing policies on admin_users that caused recursive loop
DROP POLICY IF EXISTS "Admins can view admin accounts" ON admin_users;
DROP POLICY IF EXISTS "Superadmins can manage admin accounts" ON admin_users;
DROP POLICY IF EXISTS "Users can view their own admin profile" ON admin_users;
DROP POLICY IF EXISTS "Superadmins can insert admin accounts" ON admin_users;
DROP POLICY IF EXISTS "Superadmins can update admin accounts" ON admin_users;
DROP POLICY IF EXISTS "Superadmins can delete admin accounts" ON admin_users;

-- 2. Clean, direct SELECT policy without recursion:
-- Any authenticated user can read their own admin record to verify their role
CREATE POLICY "Users can view their own admin profile"
    ON admin_users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- 3. Superadmin check function with isolated search path
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

-- 4. Superadmins can manage accounts
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
