/**
 * Ababil’s Attire by Sanjida Bethi
 * Invoice Data Compilation Service
 *
 * Generates structured data required for:
 * 1. Customer Digital Invoice view
 * 2. Admin A4 Delivery Slip / Printable PDF
 *
 * Invoice Format: AB-YYMMDD-####
 */

import { supabase } from '../lib/supabase';
import type { InvoiceDocumentData } from '../types';

export const invoiceService = {
  /**
   * Compile complete invoice data by order ID or invoice number
   */
  async getInvoiceData(orderIdOrInvoice: string): Promise<InvoiceDocumentData | null> {
    const isInvoiceNumber = orderIdOrInvoice.toUpperCase().startsWith('AB-');

    const query = (supabase as any)
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_items(*),
        payments(*)
      `);

    const { data: order, error } = isInvoiceNumber
      ? await query.eq('invoice_number', orderIdOrInvoice.toUpperCase().trim()).single()
      : await query.eq('id', orderIdOrInvoice).single();

    if (error || !order) {
      console.error('Error fetching order for invoice:', error);
      return null;
    }

    const latestPayment = Array.isArray(order.payments) && order.payments.length > 0
      ? order.payments[0]
      : undefined;

    const formattedInvoice: InvoiceDocumentData = {
      invoice_number: order.invoice_number,
      created_at: order.created_at,
      delivery_date: order.delivery_date,
      delivery_time: order.delivery_time,
      status: order.status,
      customer: {
        name: order.customer?.name || 'Customer',
        phone: order.customer?.phone || '',
        address: order.customer?.address || order.delivery_address,
        area: order.customer?.area || 'Dhaka',
      },
      items: (order.items || []).map((item: any) => ({
        product_name: item.product_name_snapshot,
        selected_size: item.selected_size,
        cake_weight: item.cake_weight,
        cake_flavor: item.cake_flavor,
        cake_message: item.cake_message,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      })),
      financials: {
        subtotal: order.subtotal,
        delivery_charge: order.delivery_charge,
        total_amount: order.total_amount,
        advance_amount: order.advance_amount,
        advance_status: order.advance_status,
        cash_due: order.cash_due,
      },
      payment_record: latestPayment
        ? {
            method: latestPayment.method,
            trx_id: latestPayment.trx_id,
            sender_last4: latestPayment.sender_last4,
            reference_name: latestPayment.reference_name,
            status: latestPayment.status,
            matched_at: latestPayment.matched_at,
          }
        : undefined,
      special_instructions: order.special_instructions,
      store_info: {
        name: import.meta.env.VITE_STUDIO_NAME || "Ababil’s Attire by Sanjida Bethi",
        tagline: 'Handmade Dresses & Celebration Cakes',
        artisan: 'Sanjida Bethi',
        contact_phone: '+880 1712-345678',
        whatsapp: import.meta.env.VITE_STUDIO_WHATSAPP_NUMBER || '+8801712345678',
        studio_address: import.meta.env.VITE_STUDIO_ADDRESS || 'House 639, Kuddus Khalifa Road, Morkun, Tongi, Gazipur - 1700',
        bkash_number: import.meta.env.VITE_STUDIO_BKASH_NUMBER || '01795-077102',
      },
    };

    return formattedInvoice;
  },
};
