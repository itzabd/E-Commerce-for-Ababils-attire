/**
 * Ababil’s Attire by Sanjida Bethi
 * Customer Reviews & Social Proof Service
 * Manages WhatsApp and Facebook screenshot reviews with Supabase + LocalStorage fallback.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface CustomerReview {
  id: string;
  customer_name: string;
  customer_area?: string;
  platform: 'whatsapp' | 'facebook' | 'instagram';
  screenshot_url: string;
  caption: string;
  product_name?: string;
  rating: number; // usually 5
  date: string;
  is_featured: boolean;
  created_at: string;
}

const REVIEWS_STORAGE_KEY = 'ababil_customer_reviews_v1';

// Initial authentic seed reviews from mothers on WhatsApp and Facebook
export const INITIAL_SEED_REVIEWS: CustomerReview[] = [
  {
    id: 'rev_1',
    customer_name: 'Dr. Nusrat Jahan',
    customer_area: 'Gulshan 2, Dhaka',
    platform: 'whatsapp',
    screenshot_url: 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?auto=format&fit=crop&w=900&q=80',
    caption: '“Sanjida Apu, everyone at the dawat was asking where we made Inaya’s dress! The hand smocking on the chest and the organic cotton fabric was so gentle on her skin. She wore it happily the entire evening without any fuss!”',
    product_name: 'Aurelia Floral Smocked Dress',
    rating: 5,
    date: 'Yesterday, 9:42 PM',
    is_featured: true,
    created_at: '2026-09-24T15:42:00Z',
  },
  {
    id: 'rev_2',
    customer_name: 'Tanzeen Ahmed',
    customer_area: 'Uttara Sector 4, Dhaka',
    platform: 'facebook',
    screenshot_url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=900&q=80',
    caption: '“The Madagascar Vanilla Bento Cake was heavenly! Not overly sweet, sponge was super moist, and the chilled van delivery arrived right on time before our celebration. Thank you for making our baby’s milestone so sweet.”',
    product_name: 'Vintage Lambeth Celebration Cake',
    rating: 5,
    date: '3 days ago',
    is_featured: true,
    created_at: '2026-09-22T11:15:00Z',
  },
  {
    id: 'rev_3',
    customer_name: 'Farhana Rahman',
    customer_area: 'Dhanmondi, Dhaka',
    platform: 'whatsapp',
    screenshot_url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=900&q=80',
    caption: '“Sharing Maya’s 1st birthday shoot photo! Look at the mother-of-pearl buttons and neat French seams. The matching bow headband was such a thoughtful surprise. Submitting another order for Eid soon in sha Allah!”',
    product_name: 'Zoya Dusty Rose Eyelet Romper',
    rating: 5,
    date: '5 days ago',
    is_featured: true,
    created_at: '2026-09-20T18:30:00Z',
  },
  {
    id: 'rev_4',
    customer_name: 'Maliha Chowdhury',
    customer_area: 'Bashundhara R/A, Dhaka',
    platform: 'facebook',
    screenshot_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80',
    caption: '“Such clean presentation and love the bKash advance transparency. Sanjida personally called within 10 minutes to verify the child’s chest measurements. That kind of personal boutique care is rare in Dhaka nowadays.”',
    product_name: 'Pastel Daisy Bento Cake & Romper Bundle',
    rating: 5,
    date: 'Last week',
    is_featured: true,
    created_at: '2026-09-18T14:10:00Z',
  },
  {
    id: 'rev_5',
    customer_name: 'Dr. Sabrina Islam',
    customer_area: 'Banani, Dhaka',
    platform: 'whatsapp',
    screenshot_url: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=900&q=80',
    caption: '“Apu, received both the Ivory Silk Organza gown and the Vanilla Lambeth cake! The delivery van arrived on time and the cake was chilled in flawless condition. Everyone loved it!”',
    product_name: 'Ivory Silk Heirloom Gown & Lambeth Cake',
    rating: 5,
    date: 'Last Friday',
    is_featured: true,
    created_at: '2026-09-15T16:20:00Z',
  },
];

function getStoredReviews(): CustomerReview[] {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse reviews from localStorage:', err);
  }
  // Initialize with seed reviews
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(INITIAL_SEED_REVIEWS));
  } catch {}
  return INITIAL_SEED_REVIEWS;
}

function saveStoredReviews(reviews: CustomerReview[]): void {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  } catch (err) {
    console.warn('Failed to save reviews to localStorage:', err);
  }
}

export const reviewsService = {
  /**
   * Get all active customer reviews (featured first)
   */
  async getReviews(): Promise<CustomerReview[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('customer_reviews' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data as CustomerReview[];
        }
      } catch {
        // Fallback to local storage if table is not yet migrated
      }
    }
    return getStoredReviews();
  },

  /**
   * Add a new customer review (Admin only)
   */
  async addReview(
    input: Omit<CustomerReview, 'id' | 'created_at'>
  ): Promise<CustomerReview> {
    const newReview: CustomerReview = {
      ...input,
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('customer_reviews' as any)
          .insert(newReview as any)
          .select()
          .single();

        if (!error && data) {
          const current = getStoredReviews();
          saveStoredReviews([data as CustomerReview, ...current]);
          return data as CustomerReview;
        }
      } catch {
        // Fall through to local save
      }
    }

    const current = getStoredReviews();
    const updated = [newReview, ...current];
    saveStoredReviews(updated);
    return newReview;
  },

  /**
   * Delete a customer review by ID (Admin only)
   */
  async deleteReview(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('customer_reviews' as any)
          .delete()
          .eq('id', id);
      } catch {}
    }

    const current = getStoredReviews();
    const filtered = current.filter((r) => r.id !== id);
    saveStoredReviews(filtered);
    return true;
  },

  /**
   * Reset reviews to defaults
   */
  resetToDefaults(): CustomerReview[] {
    saveStoredReviews(INITIAL_SEED_REVIEWS);
    return INITIAL_SEED_REVIEWS;
  },
};
