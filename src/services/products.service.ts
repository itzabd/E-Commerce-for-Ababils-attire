/**
 * Ababil’s Attire by Sanjida Bethi
 * Product Data Access Service
 */

import { supabase } from '../lib/supabase';
import type { ProductWithDetails, ProductCategory, ProductStatus } from '../types';
import { FALLBACK_PRODUCTS } from '../data/fallbackProducts';

function normalizeProduct(raw: any): ProductWithDetails {
  const images = Array.isArray(raw.images)
    ? [...raw.images].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : [];

  const dress_details = Array.isArray(raw.dress_details)
    ? raw.dress_details[0] || null
    : raw.dress_details || null;

  const cake_details = Array.isArray(raw.cake_details)
    ? raw.cake_details[0] || null
    : raw.cake_details || null;

  return {
    ...raw,
    images,
    dress_details,
    cake_details,
  };
}

export const productsService = {
  /**
   * Fetch published products for customer storefront
   */
  async getPublishedProducts(category?: ProductCategory): Promise<ProductWithDetails[]> {
    try {
      let query = (supabase as any)
        .from('products')
        .select(`
          *,
          images:product_images(*),
          dress_details(*),
          cake_details(*)
        `)
        .in('status', ['published', 'made_to_order', 'out_of_stock'])
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map(normalizeProduct);
      }
    } catch (err) {
      console.warn('Supabase query failed, falling back to local catalog:', err);
    }

    // Fallback if Supabase table is empty or error
    let fallback = FALLBACK_PRODUCTS;
    if (category) {
      fallback = fallback.filter((p) => p.category === category);
    }
    return fallback;
  },

  /**
   * Fetch single product with all details by product code or UUID
   */
  async getProductByCode(codeOrId: string): Promise<ProductWithDetails | null> {
    if (!codeOrId) return null;
    const clean = decodeURIComponent(codeOrId).trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

    try {
      // 1. Primary lookup by UUID id or case-insensitive product_code
      const primaryQuery = (supabase as any)
        .from('products')
        .select(`
          *,
          images:product_images(*),
          dress_details(*),
          cake_details(*)
        `);

      const { data, error } = isUuid
        ? await primaryQuery.eq('id', clean).maybeSingle()
        : await primaryQuery.ilike('product_code', clean).maybeSingle();

      if (!error && data) {
        return normalizeProduct(data);
      }

      // 2. Secondary check if codeOrId was swapped or partial match
      const secondaryQuery = (supabase as any)
        .from('products')
        .select(`
          *,
          images:product_images(*),
          dress_details(*),
          cake_details(*)
        `);

      const { data: secondData, error: secondError } = isUuid
        ? await secondaryQuery.ilike('product_code', clean).maybeSingle()
        : await secondaryQuery.eq('id', clean).maybeSingle();

      if (!secondError && secondData) {
        return normalizeProduct(secondData);
      }
    } catch (err) {
      console.warn('Supabase getProductByCode failed, checking local catalog:', err);
    }

    // Fallback search across local static products
    const lowerClean = clean.toLowerCase();
    const found = FALLBACK_PRODUCTS.find(
      (p) => p.id.toLowerCase() === lowerClean || p.product_code.toLowerCase() === lowerClean
    );
    return found || null;
  },

  /**
   * Fetch featured items for homepage highlights
   */
  async getFeaturedProducts(limit = 6): Promise<ProductWithDetails[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('products')
        .select(`
          *,
          images:product_images(*),
          dress_details(*),
          cake_details(*)
        `)
        .in('status', ['published', 'made_to_order'])
        .eq('featured', true)
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data.map(normalizeProduct);
      }
    } catch (err) {
      console.warn('Supabase getFeaturedProducts failed, using fallback:', err);
    }

    return FALLBACK_PRODUCTS.filter((p) => p.featured).slice(0, limit);
  },

  /**
   * Admin: Fetch all products with inventory & status counts
   */
  async getAllProductsAdmin(filters?: {
    category?: ProductCategory | 'all';
    status?: ProductStatus | 'all';
    search?: string;
  }): Promise<ProductWithDetails[]> {
    let query = (supabase as any)
      .from('products')
      .select(`
        *,
        images:product_images(*),
        dress_details(*),
        cake_details(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const cleanSearch = filters.search.trim();
      query = query.or(`name.ilike.%${cleanSearch}%,product_code.ilike.%${cleanSearch}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching admin products:', error);
      throw error;
    }

    // Sort images by sort_order
    const products = (data as unknown as ProductWithDetails[]) || [];
    for (const p of products) {
      if (Array.isArray(p.images)) {
        p.images.sort((a, b) => a.sort_order - b.sort_order);
      }
    }

    return products;
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
      .insert({
        ...product,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
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
        fabric_details: details.fabric_details || null,
        care_instructions: details.care_instructions || null,
      });
      if (dressError) console.error('Error saving dress details:', dressError);
    } else if (product.category === 'cake' && details) {
      const { error: cakeError } = await (supabase as any).from('cake_details').insert({
        product_id: productId,
        weight_options: details.weight_options || [],
        flavor_options: details.flavor_options || [],
        customization_options: details.customization_options || null,
        storage_instructions: details.storage_instructions || null,
      });
      if (cakeError) console.error('Error saving cake details:', cakeError);
    }

    return productId;
  },

  /**
   * Admin: Update product details safely without deleting unrelated data
   */
  async updateProduct(
    id: string,
    product: {
      name?: string;
      price?: number;
      description?: string;
      status?: ProductStatus;
      featured?: boolean;
      new_arrival?: boolean;
      stock_quantity?: number;
      lead_time_days?: number;
      minimum_notice_hours?: number;
    },
    category: ProductCategory,
    details?: {
      available_sizes?: string[];
      fabric_details?: string;
      care_instructions?: string;
      weight_options?: Array<{ weight: string; price: number; servings?: string }>;
      flavor_options?: string[];
      customization_options?: string;
      storage_instructions?: string;
    }
  ): Promise<void> {
    const { error: productError } = await (supabase as any)
      .from('products')
      .update({
        ...product,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (productError) {
      console.error('Error updating product core:', productError);
      throw productError;
    }

    if (category === 'dress' && details) {
      const { error: dressError } = await (supabase as any)
        .from('dress_details')
        .upsert({
          product_id: id,
          available_sizes: details.available_sizes || [],
          fabric_details: details.fabric_details || null,
          care_instructions: details.care_instructions || null,
        });
      if (dressError) console.error('Error updating dress details:', dressError);
    } else if (category === 'cake' && details) {
      const { error: cakeError } = await (supabase as any)
        .from('cake_details')
        .upsert({
          product_id: id,
          weight_options: details.weight_options || [],
          flavor_options: details.flavor_options || [],
          customization_options: details.customization_options || null,
          storage_instructions: details.storage_instructions || null,
        });
      if (cakeError) console.error('Error updating cake details:', cakeError);
    }
  },

  /**
   * Admin: Duplicate product creating a draft clone
   */
  async duplicateProduct(id: string): Promise<string> {
    const original = await this.getProductByCode(id);
    if (!original) {
      throw new Error('Original product not found for duplication.');
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newCode = `${original.product_code}-COPY-${randomSuffix}`;
    const newName = `${original.name} (Copy)`;

    const newProductId = await this.createProduct(
      {
        product_code: newCode,
        name: newName,
        category: original.category,
        description: original.description || undefined,
        price: original.price,
        status: 'draft',
        featured: false,
        new_arrival: false,
        stock_quantity: original.stock_quantity,
        lead_time_days: original.lead_time_days,
        minimum_notice_hours: original.minimum_notice_hours,
      },
      original.category === 'dress'
        ? {
            available_sizes: original.dress_details?.available_sizes || [],
            fabric_details: original.dress_details?.fabric_details || undefined,
            care_instructions: original.dress_details?.care_instructions || undefined,
          }
        : {
            weight_options: (original.cake_details?.weight_options as any) || [],
            flavor_options: original.cake_details?.flavor_options || [],
            customization_options: original.cake_details?.customization_options || undefined,
            storage_instructions: original.cake_details?.storage_instructions || undefined,
          }
    );

    // Duplicate images
    if (original.images && original.images.length > 0) {
      const imagesToInsert = original.images.map((img) => ({
        product_id: newProductId,
        image_url: img.image_url,
        sort_order: img.sort_order,
        alt_text: `${newName} image`,
      }));

      await (supabase as any).from('product_images').insert(imagesToInsert);
    }

    return newProductId;
  },

  /**
   * Admin: Update product status (e.g. published, draft, out_of_stock, hidden)
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
   * Admin: Delete product (cascades to details and images in db)
   */
  async deleteProduct(id: string): Promise<void> {
    const { error } = await (supabase as any).from('products').delete().eq('id', id);
    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },
};
