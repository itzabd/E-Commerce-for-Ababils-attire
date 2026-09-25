/**
 * Ababil’s Attire by Sanjida Bethi
 * Store Configuration & Admin Settings Service
 * Handles Store Profile, bKash & Advance Rules, Delivery Rates, Lead Times, and Admin Security
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { StoreSettings } from '../types';

const STORAGE_SETTINGS_KEY = 'ababil_admin_store_settings';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  store_name: 'Ababil’s Attire by Sanjida Bethi',
  logo_url: null,
  hero_banner_url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=1200&q=80',
  dresses_collection_url: 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?auto=format&fit=crop&w=900&q=80',
  cakes_collection_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80',
  business_email: 'sanjida@ababilsattire.com',
  contact_phone: '+880 1795-077102',
  whatsapp_number: '+880 1795-077102',
  workshop_address: 'House 639, Kuddus Khalifa Road, Morkun, Tongi, Gazipur - 1700',
  store_description: 'Handmade dresses and fresh celebration cakes handcrafted with loving care.',
  studio_hours: 'Saturday – Thursday: 10:00 AM – 8:00 PM (Friday Delivery Only)',
  instagram_handle: 'ababils.attire',
  facebook_url: 'facebook.com/ababilsattirebd',

  bkash_number: '01795-077102',
  bkash_type: 'personal',
  minimum_advance_amount: 500,
  payment_instructions: 'Please Send Money of ৳ 500 to our personal bKash number 01795-077102 and enter TrxID to lock your slot.',
  remaining_balance_policy: 'Remaining balance is collected as Cash on Delivery (COD) by Pathao / Paperfly / Chilled Van courier.',
  require_trx_id: true,
  require_sender_last4: true,
  require_reference_name: true,

  delivery_inside_dhaka: 80,
  delivery_outside_dhaka: 150,
  delivery_cake_van: 250,
  cake_delivery_restriction: 'Fresh celebration cakes are carefully delivered via temperature-controlled vans to prevent melting or decorative damage.',
  available_delivery_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  delivery_time_slots: [
    { id: 'slot_morning', name: 'Morning Slot (10 AM - 1 PM)', start_time: '10:00', end_time: '13:00' },
    { id: 'slot_afternoon', name: 'Afternoon Slot (2 PM - 6 PM)', start_time: '14:00', end_time: '18:00' },
    { id: 'slot_evening', name: 'Evening Slot (6 PM - 9 PM)', start_time: '18:00', end_time: '21:00' },
  ],
  pickup_enabled: true,
  pickup_address_note: 'Studio Collection available 11 AM - 7 PM',

  invoice_prefix: 'AB-',
  default_order_status: 'review_required',
  cake_minimum_notice: '48 Hours (2 Days advance notice required for baking & chilling)',
  cake_minimum_notice_hours: 48,
  dress_lead_time: '7 to 10 Working Days (Tailoring, smocking & hand embroidery)',
  dress_lead_time_days: 7,
  cancellation_policy: 'Advance non-refundable once cake baking or fabric cutting commences.',

  preconfigured_sizes: ['6M', '12M', '18M', '2-3Y', '3-4Y', '4-5Y', 'Custom Sizing'],
  preconfigured_cake_weights: ['0.5 lb Bento', '1.0 lb', '1.5 lb', '2.0 lb', '3.0 lb Tiered'],
  product_categories: ['Handmade Dresses', 'Celebration Cakes', 'Custom Keepsakes'],
  default_product_status: 'draft',

  // Dynamic About Section Story Content Defaults
  about_story_title: 'Handmade Dresses & Cakes, Stitched & Baked with Love',
  about_story_content: 'Growing up with an appreciation for vintage textiles and classical French pastry arts, Sanjida Bethi established Ababil’s Attire to unite two heartfelt arts: hand-smocked dresses for little girls and wholesome, scratch-baked celebration cakes.\n\nIn an era of mass production and pre-mix bakeries, our studio preserves the unhurried rhythm of authentic craftsmanship. Each dress takes days of careful tailoring, featuring hand-smocked silk embroidery, French seams, and pure natural fabrics that feel gentle on tender skin.',
  about_artisan_quote: '“Stitched with love, baked with care — every piece created for timeless family memories.”',
  about_craft_dresses_desc: 'We exclusively craft garments using breathable natural fibres: European flax linen, organic cotton muslin, and mulberry silk organza. Every pleat and smocking gather is stitched by hand so your child can move with grace and comfort.',
  about_craft_cakes_desc: 'Our confections are baked strictly from scratch with real dairy butter, farm-fresh eggs, and pure Madagascar bourbon vanilla. Never artificial stabilizers or pre-mix powders. Finished with hand-piped Lambeth ruffles, rose petals, and personalized calligraphy.',
  about_story_image_url: 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?auto=format&fit=crop&w=1200&q=80',
  size_chart: [
    { id: 'sz_1', size: '6M', chest: '18"', length: '14"', typical_age: '3–6 Months' },
    { id: 'sz_2', size: '12M', chest: '19.5"', length: '16"', typical_age: '6–12 Months' },
    { id: 'sz_3', size: '18M', chest: '20.5"', length: '17.5"', typical_age: '12–18 Months' },
    { id: 'sz_4', size: '2-3Y', chest: '21.5"', length: '19"', typical_age: '2–3 Years' },
    { id: 'sz_5', size: '3-4Y', chest: '22.5"', length: '21"', typical_age: '3–4 Years' },
    { id: 'sz_6', size: '4-5Y', chest: '23.5"', length: '23"', typical_age: '4–5 Years' },
  ],
  size_guide_intro: 'Measurements in inches. Handcrafted garments have a relaxed silhouette for ease and growing room.',
};

export const DEFAULT_SIZE_CHART = DEFAULT_STORE_SETTINGS.size_chart!;

function getLocalSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STORE_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Could not read store settings from localStorage:', e);
  }
  return { ...DEFAULT_STORE_SETTINGS };
}

function saveLocalSettings(settings: StoreSettings): void {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Could not save store settings to localStorage:', e);
  }
}

export const settingsService = {
  /**
   * Retrieve current store configuration
   */
  async getSettings(): Promise<StoreSettings> {
    const local = getLocalSettings();
    const storedLogo = typeof window !== 'undefined' ? localStorage.getItem('ababil_store_logo') : null;
    const fallbackLogo = storedLogo || local.logo_url || null;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.rpc as any)('get_store_settings');
        if (!error && data) {
          const remoteSettings: StoreSettings = {
            ...DEFAULT_STORE_SETTINGS,
            ...data,
            logo_url: data.logo_url ?? fallbackLogo,
            hero_banner_url: data.hero_banner_url || DEFAULT_STORE_SETTINGS.hero_banner_url,
            dresses_collection_url: data.dresses_collection_url || DEFAULT_STORE_SETTINGS.dresses_collection_url,
            cakes_collection_url: data.cakes_collection_url || DEFAULT_STORE_SETTINGS.cakes_collection_url,
            minimum_advance_amount: Number(data.minimum_advance_amount ?? 500),
            delivery_inside_dhaka: Number(data.delivery_inside_dhaka ?? 80),
            delivery_outside_dhaka: Number(data.delivery_outside_dhaka ?? 150),
            delivery_cake_van: Number(data.delivery_cake_van ?? 250),
            cake_minimum_notice_hours: Number(data.cake_minimum_notice_hours ?? 48),
            dress_lead_time_days: Number(data.dress_lead_time_days ?? 7),
          };
          saveLocalSettings(remoteSettings);
          return remoteSettings;
        }
      } catch (err) {
        console.warn('RPC get_store_settings failed, checking local store:', err);
      }
    }

    return {
      ...local,
      logo_url: local.logo_url || fallbackLogo,
    };
  },

  /**
   * Update store configuration
   */
  async updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = getLocalSettings();
    if (updates.logo_url !== undefined) {
      if (typeof window !== 'undefined') {
        if (updates.logo_url) {
          localStorage.setItem('ababil_store_logo', updates.logo_url);
        } else {
          localStorage.removeItem('ababil_store_logo');
        }
      }
    }

    const merged: StoreSettings = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    saveLocalSettings(merged);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: merged }));
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.rpc as any)('update_store_settings', {
          p_settings: merged,
        });

        if (error) {
          console.error('[Settings] update_store_settings RPC error:', error);
          throw new Error(`Failed to persist settings to server: ${error.message}`);
        }

        if (data) {
          const updated: StoreSettings = {
            ...DEFAULT_STORE_SETTINGS,
            ...data,
            logo_url: data.logo_url ?? merged.logo_url,
            hero_banner_url: data.hero_banner_url ?? merged.hero_banner_url,
            dresses_collection_url: data.dresses_collection_url ?? merged.dresses_collection_url,
            cakes_collection_url: data.cakes_collection_url ?? merged.cakes_collection_url,
            minimum_advance_amount: Number(data.minimum_advance_amount ?? merged.minimum_advance_amount),
            delivery_inside_dhaka: Number(data.delivery_inside_dhaka ?? merged.delivery_inside_dhaka),
            delivery_outside_dhaka: Number(data.delivery_outside_dhaka ?? merged.delivery_outside_dhaka),
            delivery_cake_van: Number(data.delivery_cake_van ?? merged.delivery_cake_van),
          };
          saveLocalSettings(updated);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('store_settings_updated', { detail: updated }));
          }
          return updated;
        }
      } catch (err: any) {
        console.error('Settings update error:', err);
        throw err;
      }
    }

    return merged;
  },

  /**
   * Reset Delivery Rates back to Dhaka Studio standards
   */
  async resetDeliveryRates(): Promise<StoreSettings> {
    return await this.updateSettings({
      delivery_inside_dhaka: 80,
      delivery_outside_dhaka: 150,
      delivery_cake_van: 250,
    });
  },

  /**
   * Change current admin account password
   */
  async updateAdminPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword.trim(),
        });

        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to update password.' };
      }
    }

    // Local/mock simulation
    return { success: true };
  },
};
