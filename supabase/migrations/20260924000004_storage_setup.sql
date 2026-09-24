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
