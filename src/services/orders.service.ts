/**
 * Ababil’s Attire by Sanjida Bethi
 * Orders Data Access Service
 */

import { supabase } from '../lib/supabase';
import type {
  CreateGuestOrderPayload,
  OrderConfirmationResult,
  OrderStatus,
  OrderRow,
  CustomerRow,
  OrderItemRow,
  PaymentRow,
  OrderStatusHistoryRow,
} from '../types';

export interface AdminOrderSummary extends OrderRow {
  customer: CustomerRow;
  items: OrderItemRow[];
  payments: PaymentRow[];
  history?: OrderStatusHistoryRow[];
}

export const ordersService = {
  /**
   * Guest Checkout: Atomically create order, customer, items, and bKash payment record
   */
  async createGuestOrder(payload: CreateGuestOrderPayload): Promise<OrderConfirmationResult> {
    const { data, error } = await (supabase.rpc as any)('create_guest_order', {
      p_customer: payload.customer,
      p_order: payload.order,
      p_items: payload.items,
      p_payment: payload.payment,
    });

    if (error) {
      console.error('Error in createGuestOrder RPC:', error);
      throw new Error(error.message || 'Failed to place order');
    }

    return data as unknown as OrderConfirmationResult;
  },

  /**
   * Admin: Fetch orders with customer and payment preview
   */
  async getOrdersAdmin(filters?: {
    status?: OrderStatus;
    search?: string;
    date?: string;
  }): Promise<AdminOrderSummary[]> {
    let query = (supabase as any)
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_items(*),
        payments(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.date) {
      query = query.eq('delivery_date', filters.date);
    }
    if (filters?.search) {
      query = query.or(`invoice_number.ilike.%${filters.search}%,delivery_address.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching admin orders:', error);
      throw error;
    }

    return (data as unknown as AdminOrderSummary[]) || [];
  },

  /**
   * Admin: Get single order with complete details and status history
   */
  async getOrderByIdAdmin(orderId: string): Promise<AdminOrderSummary | null> {
    const { data, error } = await (supabase as any)
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_items(*),
        payments(*),
        history:order_status_history(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order details:', error);
      return null;
    }

    return (data as unknown as AdminOrderSummary) || null;
  },

  /**
   * Admin: Update order status with audit log note
   */
  async updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string): Promise<void> {
    const { error: updateError } = await (supabase as any)
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      throw updateError;
    }

    if (note) {
      const { data: userData } = await supabase.auth.getUser();
      const adminId = userData.user?.id || null;

      await (supabase as any).from('order_status_history').insert({
        order_id: orderId,
        status: newStatus,
        changed_by: adminId,
        note,
      });
    }
  },
};
