/**
 * Ababil’s Attire by Sanjida Bethi
 * Supabase Database TypeScript Definitions
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductCategory = 'dress' | 'cake';
export type ProductStatus = 'published' | 'draft' | 'made_to_order' | 'out_of_stock' | 'hidden';

export type OrderStatus =
  | 'review_required'    // Awaiting bKash manual TrxID match
  | 'advance_verified'   // ৳ 500 advance verified by admin
  | 'in_production'      // Tailoring or baking underway
  | 'dispatch_ready'     // Boxed with delivery slip
  | 'out_for_delivery'   // In chilled delivery van
  | 'delivered'          // Delivered & Cash on Delivery collected
  | 'cancelled';

export type AdvanceStatus = 'pending' | 'verified' | 'rejected';
export type PaymentMethod = 'bkash' | 'cash_on_delivery' | 'manual_adjustment';
export type PaymentStatus = 'pending_match' | 'matched' | 'mismatched' | 'rejected';
export type AdminRole = 'superadmin' | 'admin' | 'staff';

export interface CakeWeightOption {
  weight: string;
  price: number;
  servings?: string;
  price_multiplier?: number;
}

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: AdminRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: AdminRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: AdminRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          product_code: string;
          name: string;
          category: ProductCategory;
          description: string | null;
          price: number;
          status: ProductStatus;
          featured: boolean;
          new_arrival: boolean;
          stock_quantity: number;
          lead_time_days: number;
          minimum_notice_hours: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_code: string;
          name: string;
          category: ProductCategory;
          description?: string | null;
          price: number;
          status?: ProductStatus;
          featured?: boolean;
          new_arrival?: boolean;
          stock_quantity?: number;
          lead_time_days?: number;
          minimum_notice_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_code?: string;
          name?: string;
          category?: ProductCategory;
          description?: string | null;
          price?: number;
          status?: ProductStatus;
          featured?: boolean;
          new_arrival?: boolean;
          stock_quantity?: number;
          lead_time_days?: number;
          minimum_notice_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
          sort_order: number;
          alt_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          image_url: string;
          sort_order?: number;
          alt_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          image_url?: string;
          sort_order?: number;
          alt_text?: string | null;
          created_at?: string;
        };
      };
      dress_details: {
        Row: {
          product_id: string;
          available_sizes: string[];
          fabric_details: string | null;
          care_instructions: string | null;
        };
        Insert: {
          product_id: string;
          available_sizes?: string[];
          fabric_details?: string | null;
          care_instructions?: string | null;
        };
        Update: {
          product_id?: string;
          available_sizes?: string[];
          fabric_details?: string | null;
          care_instructions?: string | null;
        };
      };
      cake_details: {
        Row: {
          product_id: string;
          weight_options: CakeWeightOption[];
          flavor_options: string[];
          customization_options: string | null;
          storage_instructions: string | null;
        };
        Insert: {
          product_id: string;
          weight_options?: CakeWeightOption[] | Json;
          flavor_options?: string[];
          customization_options?: string | null;
          storage_instructions?: string | null;
        };
        Update: {
          product_id?: string;
          weight_options?: CakeWeightOption[] | Json;
          flavor_options?: string[];
          customization_options?: string | null;
          storage_instructions?: string | null;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          address: string;
          area: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          address: string;
          area: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          address?: string;
          area?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          invoice_number: string;
          customer_id: string;
          status: OrderStatus;
          subtotal: number;
          delivery_charge: number;
          total_amount: number;
          advance_amount: number;
          advance_status: AdvanceStatus;
          cash_due: number;
          delivery_date: string;
          delivery_time: string | null;
          delivery_address: string;
          special_instructions: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number?: string;
          customer_id: string;
          status?: OrderStatus;
          subtotal: number;
          delivery_charge?: number;
          total_amount: number;
          advance_amount?: number;
          advance_status?: AdvanceStatus;
          cash_due?: number;
          delivery_date: string;
          delivery_time?: string | null;
          delivery_address: string;
          special_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          customer_id?: string;
          status?: OrderStatus;
          subtotal?: number;
          delivery_charge?: number;
          total_amount?: number;
          advance_amount?: number;
          advance_status?: AdvanceStatus;
          cash_due?: number;
          delivery_date?: string;
          delivery_time?: string | null;
          delivery_address?: string;
          special_instructions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name_snapshot: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          selected_size: string | null;
          cake_weight: string | null;
          cake_flavor: string | null;
          cake_message: string | null;
          customization_details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name_snapshot: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          selected_size?: string | null;
          cake_weight?: string | null;
          cake_flavor?: string | null;
          cake_message?: string | null;
          customization_details?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name_snapshot?: string;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
          selected_size?: string | null;
          cake_weight?: string | null;
          cake_flavor?: string | null;
          cake_message?: string | null;
          customization_details?: string | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          method: PaymentMethod;
          amount: number;
          trx_id: string;
          sender_last4: string;
          reference_name: string | null;
          status: PaymentStatus;
          matched_at: string | null;
          matched_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          method?: PaymentMethod;
          amount: number;
          trx_id: string;
          sender_last4: string;
          reference_name?: string | null;
          status?: PaymentStatus;
          matched_at?: string | null;
          matched_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          method?: PaymentMethod;
          amount?: number;
          trx_id?: string;
          sender_last4?: string;
          reference_name?: string | null;
          status?: PaymentStatus;
          matched_at?: string | null;
          matched_by?: string | null;
          created_at?: string;
        };
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: string;
          changed_by: string | null;
          created_at: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: string;
          changed_by?: string | null;
          created_at?: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          status?: string;
          changed_by?: string | null;
          created_at?: string;
          note?: string | null;
        };
      };
    };
    Functions: {
      create_guest_order: {
        Args: {
          p_customer: Json;
          p_order: Json;
          p_items: Json;
          p_payment: Json;
        };
        Returns: Json;
      };
      track_order_by_invoice: {
        Args: {
          p_invoice_number: string;
          p_phone_last4?: string;
        };
        Returns: Json;
      };
      find_order_by_trx_id: {
        Args: {
          p_trx_id: string;
        };
        Returns: Json;
      };
      match_bkash_payment: {
        Args: {
          p_trx_id: string;
          p_confirm: boolean;
          p_note?: string;
        };
        Returns: Json;
      };
    };
  };
}
