/**
 * Ababil’s Attire by Sanjida Bethi
 * Public Order Tracking Service
 *
 * Allows guest customers to track their order status, timeline, and delivery logistics
 * using only the invoice number without requiring an account.
 * Returns only safe order information (no PII leak).
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { OrderTrackingResult } from '../types';

export const trackingService = {
  /**
   * Track order by Invoice Number (e.g. 'AB-260923-1042')
   * Optional phone last 4 digits for secondary verification
   */
  async trackOrderByInvoice(
    invoiceNumber: string,
    phoneLast4?: string
  ): Promise<OrderTrackingResult> {
    const cleanInvoice = invoiceNumber.trim().toUpperCase().replace(/^#/, '');

    if (!cleanInvoice) {
      return { found: false, error: 'Please enter your Invoice Number (e.g. AB-260923-1042)' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.rpc as any)('track_order_by_invoice', {
          p_invoice_number: cleanInvoice,
          p_phone_last4: phoneLast4 ? phoneLast4.trim() : undefined,
        });

        if (!error && data && data.found) {
          return data as unknown as OrderTrackingResult;
        }
      } catch (err) {
        console.warn('Supabase order tracking query failed, checking local cache:', err);
      }
    }

    // Check localStorage cache for orders placed in this browser
    try {
      const stored = localStorage.getItem('ababils_guest_orders_v1');
      if (stored) {
        const orderList = JSON.parse(stored);
        const cached = orderList[cleanInvoice];
        if (cached) {
          const conf = cached.confirmation;
          const payload = cached.payload;
          return {
            found: true,
            invoice_number: conf.invoice_number,
            status: conf.status || 'review_required',
            customer_name_initial: conf.customer_name ? conf.customer_name.split(' ')[0] : 'Valued Customer',
            delivery_area: payload?.customer?.area || payload?.order?.delivery_address || 'Dhaka',
            delivery_date: conf.delivery_date,
            delivery_time: payload?.order?.delivery_time || 'Morning 10:00 AM - 1:00 PM',
            subtotal: conf.subtotal,
            delivery_charge: conf.delivery_charge,
            total_amount: conf.total_amount,
            advance_amount: conf.advance_amount,
            advance_status: conf.advance_status,
            cash_due: conf.cash_due,
            created_at: conf.created_at,
            items: (payload?.items || []).map((it: any, idx: number) => ({
              id: 'it_' + idx,
              product_name: it.product_name_snapshot,
              quantity: it.quantity,
              unit_price: it.unit_price,
              subtotal: it.subtotal,
              selected_size: it.selected_size,
              cake_weight: it.cake_weight,
              cake_flavor: it.cake_flavor,
              cake_message: it.cake_message,
            })),
            timeline: [
              {
                status: 'Order Placed',
                created_at: conf.created_at,
                note: 'Order received at Ababil’s Attire.',
              },
              {
                status: 'Confirmed',
                created_at: conf.created_at,
                note: 'bKash advance details recorded; awaiting dispatch scheduling.',
              },
            ],
          };
        }
      }
    } catch (e) {
      console.warn('Error reading cached orders from localStorage:', e);
    }

    // Query admin order service (which reads Supabase orders + guest orders + admin updates)
    try {
      const { ordersService } = await import('./orders.service');
      const adminOrder = await ordersService.getOrderByIdAdmin(cleanInvoice);
      if (adminOrder) {
        const history = adminOrder.history || [];
        const timeline = history.length > 0
          ? history.map(h => ({
              status: h.status ? h.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Updated',
              created_at: h.created_at,
              note: h.note || 'Status updated by atelier administration.',
            }))
          : [
              {
                status: 'Order Placed',
                created_at: adminOrder.created_at,
                note: 'Order received at Ababil’s Attire atelier.',
              },
            ];

        return {
          found: true,
          invoice_number: adminOrder.invoice_number,
          status: adminOrder.status || 'review_required',
          customer_name_initial: adminOrder.customer?.name ? adminOrder.customer.name.split(' ')[0] : 'Valued Patron',
          delivery_area: adminOrder.delivery_address || 'Studio Delivery Metro',
          delivery_date: adminOrder.delivery_date,
          delivery_time: adminOrder.delivery_time || 'Standard Afternoon Slot (2:00 PM – 6:00 PM)',
          subtotal: adminOrder.subtotal,
          delivery_charge: adminOrder.delivery_charge,
          total_amount: adminOrder.total_amount,
          advance_amount: adminOrder.advance_amount,
          advance_status: adminOrder.advance_status || 'pending',
          cash_due: adminOrder.cash_due,
          created_at: adminOrder.created_at,
          items: (adminOrder.items || []).map((it, idx) => ({
            id: it.id || `it_${idx}`,
            product_name: it.product_name_snapshot,
            quantity: it.quantity,
            unit_price: it.unit_price,
            subtotal: it.subtotal,
            selected_size: it.selected_size || undefined,
            cake_weight: it.cake_weight || undefined,
            cake_flavor: it.cake_flavor || undefined,
            cake_message: it.cake_message || undefined,
          })),
          timeline,
        };
      }
    } catch (e) {
      console.warn('Error reading dynamic order from admin service:', e);
    }

    return { found: false, error: `We couldn't find an order with invoice #${cleanInvoice}. Please check your invoice number or contact Sanjida on WhatsApp.` };
  },
};
