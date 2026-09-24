/**
 * Ababil’s Attire by Sanjida Bethi
 * Product Images Storage Service
 *
 * Strategy:
 * - Bucket: 'product-images' (public)
 * - Path structure:
 *     - dresses/{product_code}_{timestamp}_{sort_order}.webp
 *     - cakes/{product_code}_{timestamp}_{sort_order}.webp
 * - Ordering: Controlled via sort_order in product_images table (0 = primary cover)
 * - Replacement: Upload new object -> update product_images table -> delete old object
 * - Deletion: Remove object from storage bucket + delete row from product_images table
 */

import { supabase } from '../lib/supabase';
import type { ProductCategory, ProductImageRow } from '../types';

const BUCKET_NAME = 'product-images';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export const storageService = {
  /**
   * Client-side image validation (size and mime type)
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported image format (${file.type || 'unknown'}). Supported: JPG, PNG, WEBP, AVIF.`,
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `Image exceeds maximum size of 5 MB (current: ${sizeMb} MB). Please choose a smaller image.`,
      };
    }

    return { valid: true };
  },

  /**
   * Upload single product image to Supabase Storage and register in product_images table
   */
  async uploadProductImage(
    productId: string,
    productCode: string,
    category: ProductCategory,
    file: File,
    sortOrder = 0,
    altText?: string
  ): Promise<ProductImageRow> {
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

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
   * Upload multiple images in sequence with incremental sort orders
   */
  async uploadMultipleImages(
    productId: string,
    productCode: string,
    category: ProductCategory,
    files: File[],
    startingSortOrder = 0,
    onProgress?: (uploadedCount: number, total: number) => void
  ): Promise<ProductImageRow[]> {
    const uploadedRows: ProductImageRow[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sortOrder = startingSortOrder + i;
      const row = await this.uploadProductImage(
        productId,
        productCode,
        category,
        file,
        sortOrder,
        `${productCode} photo ${sortOrder + 1}`
      );
      uploadedRows.push(row);
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    }

    return uploadedRows;
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
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

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
