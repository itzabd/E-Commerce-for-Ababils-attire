/**
 * Ababil’s Attire by Sanjida Bethi
 * Application Domain Types & Contracts
 */

import type { Database, OrderStatus, AdvanceStatus, PaymentStatus, ProductCategory } from './database.types';

export type * from './database.types';

export type ProductRow = Database['public']['Tables']['products']['Row'];
export type ProductImageRow = Database['public']['Tables']['product_images']['Row'];
export type DressDetailsRow = Database['public']['Tables']['dress_details']['Row'];
export type CakeDetailsRow = Database['public']['Tables']['cake_details']['Row'];
export type CustomerRow = Database['public']['Tables']['customers']['Row'];
export type OrderRow = Database['public']['Tables']['orders']['Row'];
export type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
export type PaymentRow = Database['public']['Tables']['payments']['Row'];
export type OrderStatusHistoryRow = Database['public']['Tables']['order_status_history']['Row'];

/** Joined Product for Catalog & Details views */
export interface ProductWithDetails extends ProductRow {
  images: ProductImageRow[];
  dress_details?: DressDetailsRow | null;
  cake_details?: CakeDetailsRow | null;
}

/** Customer Input for Guest Checkout */
export interface GuestCustomerInput {
  name: string;
  phone: string;
  email?: string;
  address: string;
  area: string;
  notes?: string;
}

/** Order Item Input for Guest Checkout */
export interface OrderItemInput {
  product_id?: string;
  product_name_snapshot: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  selected_size?: string;
  cake_weight?: string;
  cake_flavor?: string;
  cake_message?: string;
  customization_details?: string;
}

/** bKash Advance Payment Input */
export interface BKashPaymentInput {
  trx_id: string;
  sender_last4: string;
  reference_name?: string;
}

/** Guest Order Placement Payload */
export interface CreateGuestOrderPayload {
  customer: GuestCustomerInput;
  order: {
    delivery_date: string; // YYYY-MM-DD
    delivery_time?: string;
    delivery_address: string;
    special_instructions?: string;
    subtotal: number;
    delivery_charge: number;
    total_amount: number;
    advance_amount?: number; // Defaults to 500
  };
  items: OrderItemInput[];
  payment: BKashPaymentInput;
}

/** Public Guest Order Confirmation Return */
export interface OrderConfirmationResult {
  success: boolean;
  order_id: string;
  invoice_number: string;
  customer_name: string;
  subtotal: number;
  delivery_charge: number;
  total_amount: number;
  advance_amount: number;
  advance_status: AdvanceStatus;
  cash_due: number;
  delivery_date: string;
  status: OrderStatus;
  created_at: string;
}

/** Safe Public Order Tracking Data */
export interface OrderTrackingResult {
  found: boolean;
  error?: string;
  invoice_number?: string;
  status?: OrderStatus;
  customer_name_initial?: string;
  delivery_area?: string;
  delivery_date?: string;
  delivery_time?: string | null;
  subtotal?: number;
  delivery_charge?: number;
  total_amount?: number;
  advance_amount?: number;
  advance_status?: AdvanceStatus;
  cash_due?: number;
  created_at?: string;
  items?: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    selected_size?: string | null;
    cake_weight?: string | null;
    cake_flavor?: string | null;
    cake_message?: string | null;
  }>;
  timeline?: Array<{
    status: string;
    created_at: string;
    note: string | null;
  }>;
}

/** Admin TrxID Search/Matching Result */
export interface TrxMatchingPreview {
  found: boolean;
  error?: string;
  payment_id?: string;
  trx_id?: string;
  sender_last4?: string;
  reference_name?: string | null;
  payment_amount?: number;
  payment_status?: PaymentStatus;
  matched_at?: string | null;
  matched_by_email?: string | null;
  order_id?: string;
  invoice_number?: string;
  order_status?: OrderStatus;
  expected_advance?: number;
  advance_status?: AdvanceStatus;
  total_amount?: number;
  cash_due?: number;
  delivery_date?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_area?: string;
  delivery_address?: string;
  items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    selected_size?: string | null;
    cake_weight?: string | null;
  }>;
}

/** Invoice Structure for Customer Digital View and Admin A4 Delivery Slip */
export interface InvoiceDocumentData {
  invoice_number: string;
  created_at: string;
  delivery_date: string;
  delivery_time?: string | null;
  status: OrderStatus;
  customer: {
    name: string;
    phone: string;
    address: string;
    area: string;
  };
  items: Array<{
    product_name: string;
    category?: ProductCategory;
    selected_size?: string | null;
    cake_weight?: string | null;
    cake_flavor?: string | null;
    cake_message?: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  financials: {
    subtotal: number;
    delivery_charge: number;
    total_amount: number;
    advance_amount: number;
    advance_status: AdvanceStatus;
    cash_due: number;
  };
  payment_record?: {
    method: string;
    trx_id: string;
    sender_last4: string;
    reference_name?: string | null;
    status: PaymentStatus;
    matched_at?: string | null;
  };
  special_instructions?: string | null;
  store_info: {
    name: string;
    tagline: string;
    artisan: string;
    contact_phone: string;
    whatsapp: string;
    studio_address: string;
    bkash_number: string;
  };
}

/** Delivery Time Window Slot */
export interface DeliveryTimeSlot {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
}

/** Store Configuration Settings */
export interface StoreSettings {
  id?: string;
  // Store Information
  store_name: string;
  logo_url?: string | null;
  business_email: string;
  contact_phone: string;
  whatsapp_number: string;
  workshop_address: string;
  store_description: string;
  studio_hours: string;
  instagram_handle: string;
  facebook_url: string;

  // bKash & Payment Settings
  bkash_number: string;
  bkash_type: 'personal' | 'merchant';
  minimum_advance_amount: number;
  payment_instructions: string;
  remaining_balance_policy: string;
  require_trx_id: boolean;
  require_sender_last4: boolean;
  require_reference_name: boolean;

  // Delivery & Courier Settings
  delivery_inside_dhaka: number;
  delivery_outside_dhaka: number;
  delivery_cake_van: number;
  cake_delivery_restriction: string;
  available_delivery_days: string[];
  delivery_time_slots: DeliveryTimeSlot[];
  pickup_enabled: boolean;
  pickup_address_note: string;

  // Order Rules & Lead Times
  invoice_prefix: string;
  default_order_status: OrderStatus;
  cake_minimum_notice: string;
  cake_minimum_notice_hours: number;
  dress_lead_time: string;
  dress_lead_time_days: number;
  cancellation_policy: string;

  // Product Defaults & Sizing
  preconfigured_sizes: string[];
  preconfigured_cake_weights: string[];
  product_categories: string[];
  default_product_status: string;

  created_at?: string;
  updated_at?: string;
}

/** Manual Order Item Specification */
export interface ManualOrderItemInput {
  product_id?: string;
  product_name: string;
  category: 'dress' | 'cake';
  quantity: number;
  unit_price: number;
  subtotal: number;
  selected_size?: string;
  cake_weight?: string;
  cake_flavor?: string;
  cake_message?: string;
  special_instructions?: string;
}

/** Manual Order Payload for Staff / Admin Order Placement */
export interface CreateManualOrderPayload {
  customer: {
    id?: string;
    name: string;
    phone: string;
    alt_phone?: string;
    email?: string;
    address: string;
    area: string;
    notes?: string;
  };
  order: {
    delivery_date: string;
    delivery_time?: string;
    delivery_address: string;
    delivery_charge: number;
    subtotal: number;
    total_amount: number;
    advance_amount: number;
    special_instructions?: string;
    advance_verified?: boolean;
  };
  items: ManualOrderItemInput[];
  payment?: {
    method?: 'bkash' | 'cash_on_delivery' | 'manual_adjustment';
    amount: number;
    trx_id?: string;
    sender_last4?: string;
    reference_name?: string;
    status?: 'pending_match' | 'matched';
  };
}

/** Manual Order Creation Result */
export interface ManualOrderResult {
  success: boolean;
  order_id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name: string;
  total_amount: number;
  advance_amount: number;
  cash_due: number;
  status: OrderStatus;
  advance_status: AdvanceStatus;
  delivery_date: string;
  created_at: string;
}

