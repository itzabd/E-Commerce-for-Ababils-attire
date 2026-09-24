/**
 * Ababil’s Attire by Sanjida Bethi
 * Product Images Storage Service
 *
 * Strategy:
 * - Bucket: 'product-images' (public)
 * - Path structure:
 *     - dresses/{product_code}_{timestamp}_{filename}.webp
 *     - cakes/{product_code}_{timestamp}_{filename}.webp
 * - Ordering: Controlled via sort_order in product_images table (0 = primary cover)
 * - Replacement: Upload new object -> update product_images table -> delete old object
 * - Deletion: Remove object from storage bucket + delete row from product_images table
 */

import { supabase } from '../lib/supabase';
import type { ProductCategory, ProductImageRow } from '../types';

const BUCKET_NAME = 'product-images';

export const storageService = {
  /**
   * Upload product image to Supabase Storage and register in product_images table
   */
  async uploadProductImage(
    productId: string,
    productCode: string,
    category: ProductCategory,
    file: File,
    sortOrder = 0,
    altText?: string
  ): Promise<ProductImageRow> {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const folder = category === 'dress' ? 'dresses' : 'cakes';
    const timestamp = Date.now();
    const sanitizedCode = productCode.replace(/[^a-zA-Z0-9_-]/g, '');
    const storagePath = `${folder}/${sanitizedCode}_${timestamp}_${sortOrder}.${fileExt}`;

    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    // 2. Obtain public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const imageUrl = publicUrlData.publicUrl;

    // 3. Insert record in product_images table
    const { data: imageRow, error: dbError } = await (supabase as any)
      .from('product_images')
      .insert({
        product_id: productId,
        image_url: imageUrl,
        sort_order: sortOrder,
        alt_text: altText || `${sanitizedCode} image`,
      })
      .select('*')
      .single();

    if (dbError || !imageRow) {
      console.error('Database record error for image:', dbError);
      throw new Error(`Failed to save image record: ${dbError?.message}`);
    }

    return imageRow;
  },

  /**
   * Replace existing image with a newly uploaded file
   */
  async replaceProductImage(
    imageId: string,
    oldImageUrl: string,
    file: File,
    productCode: string,
    category: ProductCategory
  ): Promise<string> {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const folder = category === 'dress' ? 'dresses' : 'cakes';
    const timestamp = Date.now();
    const sanitizedCode = productCode.replace(/[^a-zA-Z0-9_-]/g, '');
    const newStoragePath = `${folder}/${sanitizedCode}_${timestamp}_rep.${fileExt}`;

    // Upload new image
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(newStoragePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Replacement upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(newStoragePath);

    const newUrl = publicUrlData.publicUrl;

    // Update database record
    const { error: updateError } = await (supabase as any)
      .from('product_images')
      .update({ image_url: newUrl })
      .eq('id', imageId);

    if (updateError) {
      throw new Error(`Failed to update image reference: ${updateError.message}`);
    }

    // Delete old storage file in the background
    try {
      const oldPath = this.extractStoragePathFromUrl(oldImageUrl);
      if (oldPath) {
        await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
      }
    } catch (e) {
      console.warn('Could not clean up old image file:', e);
    }

    return newUrl;
  },

  /**
   * Delete an image from storage and remove its database row
   */
  async deleteProductImage(imageId: string, imageUrl: string): Promise<void> {
    // 1. Delete DB row
    const { error: dbError } = await (supabase as any)
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (dbError) {
      throw new Error(`Failed to delete image record: ${dbError.message}`);
    }

    // 2. Remove file from storage bucket
    const storagePath = this.extractStoragePathFromUrl(imageUrl);
    if (storagePath) {
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    }
  },

  /**
   * Reorder gallery images for a product
   */
  async reorderProductImages(
    orderedItems: Array<{ id: string; sort_order: number }>
  ): Promise<void> {
    const promises = orderedItems.map((item) =>
      (supabase as any)
        .from('product_images')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
    );

    const results = await Promise.all(promises);
    const hasError = results.some((r: any) => r.error);
    if (hasError) {
      throw new Error('Failed to update image sort orders');
    }
  },

  /**
   * Helper: Parse relative storage path from a full public Supabase URL
   */
  extractStoragePathFromUrl(url: string): string | null {
    try {
      const parts = url.split(`${BUCKET_NAME}/`);
      if (parts.length > 1) {
        return decodeURIComponent(parts[1].split('?')[0]);
      }
      return null;
    } catch {
      return null;
    }
  },
};
