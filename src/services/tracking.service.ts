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

    // Standard Demo Seed Fallback for AA-2409 (Stitch Screen Showcase) or AB-260923-1042
    if (cleanInvoice === 'AA-2409' || cleanInvoice === 'AB-260923-1042') {
      const isAA = cleanInvoice === 'AA-2409';
      return {
        found: true,
        invoice_number: isAA ? 'AA-2409' : 'AB-260923-1042',
        status: 'in_production',
        customer_name_initial: isAA ? 'Barrister Nabila Rahman' : 'Ayesha',
        delivery_area: 'House 42, Road 11, Block D, Studio Delivery Metro',
        delivery_date: '2026-09-28',
        delivery_time: 'Afternoon Slot (2:00 PM – 6:00 PM)',
        subtotal: 5800,
        delivery_charge: 250,
        total_amount: 6050,
        advance_amount: 500,
        advance_status: 'verified',
        cash_due: 5550,
        created_at: '2026-09-24T09:12:00Z',
        items: [
          {
            id: 'demo_item_1',
            product_name: 'Aurelia Smocked Dress',
            quantity: 1,
            unit_price: 3200,
            subtotal: 3200,
            selected_size: '1-2Y (Custom tailored)',
          },
          {
            id: 'demo_item_2',
            product_name: 'Vintage Rose Birthday Cake',
            quantity: 1,
            unit_price: 2600,
            subtotal: 2600,
            cake_weight: '2 lb',
            cake_flavor: 'Vanilla & Raspberry Compote',
            cake_message: 'Happy 2nd Birthday Inaya!',
          },
        ],
        timeline: [
          {
            status: 'Order Placed',
            created_at: '2026-09-24T14:30:00Z',
            note: 'Order submitted with bKash advance transaction. Awaiting store verification.',
          },
          {
            status: 'Confirmed',
            created_at: '2026-09-24T15:15:00Z',
            note: 'bKash advance payment of ৳500 verified by Sanjida Bethi.',
          },
          {
            status: 'Processing',
            created_at: '2026-09-24T16:00:00Z',
            note: 'Tailoring smocked dress details and preparing fresh celebration cake sponge.',
          },
        ],
      };
    }

    return { found: false, error: `We couldn't find an order with that number. Please check the number or contact Sanjida directly.` };
  },
};
