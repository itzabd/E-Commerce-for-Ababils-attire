/**
 * Ababil’s Attire by Sanjida Bethi
 * Public Order Tracking Service
 *
 * Allows guest customers to track their order status, timeline, and delivery logistics
 * using only the invoice number without requiring an account.
 * Returns only safe order information (no PII leak).
 */

import { supabase } from '../lib/supabase';
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
    const cleanInvoice = invoiceNumber.trim().toUpperCase();

    if (!cleanInvoice) {
      return { found: false, error: 'Please enter your Invoice Number (e.g. AB-260923-1042)' };
    }

    const { data, error } = await (supabase.rpc as any)('track_order_by_invoice', {
      p_invoice_number: cleanInvoice,
      p_phone_last4: phoneLast4 ? phoneLast4.trim() : undefined,
    });

    if (error) {
      console.error('Error tracking order:', error);
      return { found: false, error: error.message || 'Unable to track order' };
    }

    return data as unknown as OrderTrackingResult;
  },
};
