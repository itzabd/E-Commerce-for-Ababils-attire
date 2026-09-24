/**
 * Ababil’s Attire by Sanjida Bethi
 * Product Data Access Service
 */

import { supabase } from '../lib/supabase';
import type { ProductWithDetails, ProductCategory, ProductStatus } from '../types';

export const productsService = {
  /**
   * Fetch published products for customer storefront
   */
  async getPublishedProducts(category?: ProductCategory): Promise<ProductWithDetails[]> {
    let query = (supabase as any)
      .from('products')
      .select(`
        *,
        images:product_images(*),
        dress_details(*),
        cake_details(*)
      `)
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching published products:', error);
      throw error;
    }

    return (data as unknown as ProductWithDetails[]) || [];
  },

  /**
   * Fetch single product with all details by product code or UUID
   */
  async getProductByCode(codeOrId: string): Promise<ProductWithDetails | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(codeOrId);

    const query = (supabase as any)
      .from('products')
      .select(`
        *,
        images:product_images(*),
        dress_details(*),
        cake_details(*)
      `);

    const { data, error } = isUuid
      ? await query.eq('id', codeOrId).single()
      : await query.eq('product_code', codeOrId).single();

    if (error) {
      console.error('Error fetching product details:', error);
      return null;
    }

    return (data as unknown as ProductWithDetails) || null;
  },

  /**
   * Fetch featured items for homepage highlights
   */
  async getFeaturedProducts(limit = 6): Promise<ProductWithDetails[]> {
    const { data, error } = await (supabase as any)
      .from('products')
      .select(`
        *,
        images:product_images(*),
        dress_details(*),
        cake_details(*)
      `)
      .eq('status', 'published')
      .eq('featured', true)
      .limit(limit);

    if (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }

    return (data as unknown as ProductWithDetails[]) || [];
  },

  /**
   * Admin: Fetch all products with inventory & status counts
   */
  async getAllProductsAdmin(filters?: { category?: ProductCategory; status?: ProductStatus; search?: string }): Promise<ProductWithDetails[]> {
    let query = (supabase as any)
      .from('products')
      .select(`
        *,
        images:product_images(*),
        dress_details(*),
        cake_details(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,product_code.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching admin products:', error);
      throw error;
    }

    return (data as unknown as ProductWithDetails[]) || [];
  },

  /**
   * Admin: Create a new product with dress or cake details
   */
  async createProduct(
    product: {
      product_code: string;
      name: string;
      category: ProductCategory;
      description?: string;
      price: number;
      status?: ProductStatus;
      featured?: boolean;
      new_arrival?: boolean;
      stock_quantity?: number;
      lead_time_days?: number;
      minimum_notice_hours?: number;
    },
    details?: {
      available_sizes?: string[];
      fabric_details?: string;
      care_instructions?: string;
      weight_options?: Array<{ weight: string; price: number; servings?: string }>;
      flavor_options?: string[];
      customization_options?: string;
      storage_instructions?: string;
    }
  ): Promise<string> {
    const { data: createdProduct, error: productError } = await (supabase as any)
      .from('products')
      .insert(product)
      .select('id')
      .single();

    if (productError || !createdProduct) {
      console.error('Error creating product:', productError);
      throw productError;
    }

    const productId = createdProduct.id;

    if (product.category === 'dress' && details) {
      const { error: dressError } = await (supabase as any).from('dress_details').insert({
        product_id: productId,
        available_sizes: details.available_sizes || [],
        fabric_details: details.fabric_details,
        care_instructions: details.care_instructions,
      });
      if (dressError) console.error('Error saving dress details:', dressError);
    } else if (product.category === 'cake' && details) {
      const { error: cakeError } = await (supabase as any).from('cake_details').insert({
        product_id: productId,
        weight_options: details.weight_options || [],
        flavor_options: details.flavor_options || [],
        customization_options: details.customization_options,
        storage_instructions: details.storage_instructions,
      });
      if (cakeError) console.error('Error saving cake details:', cakeError);
    }

    return productId;
  },

  /**
   * Admin: Update product status (e.g. published, draft, out_of_stock)
   */
  async updateProductStatus(id: string, status: ProductStatus): Promise<void> {
    const { error } = await (supabase as any)
      .from('products')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating product status:', error);
      throw error;
    }
  },

  /**
   * Admin: Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    const { error } = await (supabase as any).from('products').delete().eq('id', id);
    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },
};
