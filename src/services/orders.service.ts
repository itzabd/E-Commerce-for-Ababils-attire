/**
 * Ababil’s Attire by Sanjida Bethi
 * Orders Data Access Service
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  CreateGuestOrderPayload,
  OrderConfirmationResult,
  OrderStatus,
  AdvanceStatus,
  OrderRow,
  CustomerRow,
  OrderItemRow,
  PaymentRow,
  OrderStatusHistoryRow,
  TrxMatchingPreview,
  CreateManualOrderPayload,
  ManualOrderResult,
} from '../types';

export interface AdminOrderSummary extends OrderRow {
  customer: CustomerRow;
  items: OrderItemRow[];
  payments: PaymentRow[];
  history?: OrderStatusHistoryRow[];
}

function generateInvoiceNumberFallback(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `AB-${yy}${mm}${dd}-${seq}`;
}

export const ordersService = {
  /**
   * Guest Checkout: Atomically create order, customer, items, and bKash payment record
   */
  async createGuestOrder(payload: CreateGuestOrderPayload): Promise<OrderConfirmationResult> {
    if (isSupabaseConfigured()) {
      try {
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

        if (data && (data as any).invoice_number) {
          try {
            const stored = localStorage.getItem('ababils_guest_orders_v1');
            const orderList = stored ? JSON.parse(stored) : {};
            orderList[(data as any).invoice_number] = {
              confirmation: data,
              payload,
            };
            localStorage.setItem('ababils_guest_orders_v1', JSON.stringify(orderList));
          } catch (e) {
            console.warn('Could not cache guest order to localStorage:', e);
          }
        }

        return data as unknown as OrderConfirmationResult;
      } catch (err: any) {
        console.warn('RPC invocation failed, falling back to local guest confirmation:', err);
        // If connection fails, fall back to offline simulation below
      }
    }

    // Offline / Local Simulation: Generate valid invoice format AB-YYMMDD-####
    const invoiceNumber = generateInvoiceNumberFallback();
    const orderId = 'ord_' + Math.random().toString(36).substring(2, 11);
    const subtotal = payload.order.subtotal;
    const deliveryCharge = payload.order.delivery_charge;
    const totalAmount = subtotal + deliveryCharge;
    const advanceAmount = payload.order.advance_amount ?? 500;
    const cashDue = Math.max(0, totalAmount - advanceAmount);

    const result: OrderConfirmationResult = {
      success: true,
      order_id: orderId,
      invoice_number: invoiceNumber,
      customer_name: payload.customer.name,
      subtotal,
      delivery_charge: deliveryCharge,
      total_amount: totalAmount,
      advance_amount: advanceAmount,
      advance_status: 'pending',
      cash_due: cashDue,
      delivery_date: payload.order.delivery_date,
      status: 'review_required',
      created_at: new Date().toISOString(),
    };

    // Store in local storage for order confirmation page & tracking lookup
    try {
      const stored = localStorage.getItem('ababils_guest_orders_v1');
      const orderList = stored ? JSON.parse(stored) : {};
      orderList[invoiceNumber] = {
        confirmation: result,
        payload,
      };
      localStorage.setItem('ababils_guest_orders_v1', JSON.stringify(orderList));
    } catch (e) {
      console.warn('Could not cache guest order to localStorage:', e);
    }

    return result;
  },

  /**
   * Admin: Fetch orders with customer and payment preview
   */
  async getOrdersAdmin(filters?: {
    status?: OrderStatus | 'all';
    search?: string;
    productCategory?: 'all' | 'dress' | 'cake' | 'bundle';
    date?: string;
  }): Promise<AdminOrderSummary[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = (supabase as any)
          .from('orders')
          .select(`
            *,
            customer:customers(*),
            items:order_items(*),
            payments(*),
            history:order_status_history(*)
          `)
          .order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters?.date) {
          query = query.eq('delivery_date', filters.date);
        }
        if (filters?.search) {
          query = query.or(`invoice_number.ilike.%${filters.search}%,delivery_address.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          // If we have remote orders or the database query succeeded
          const remoteOrders = data as unknown as AdminOrderSummary[];
          
          // Also check if there are locally cached guest orders not yet in remoteOrders
          try {
            const stored = localStorage.getItem('ababils_guest_orders_v1');
            if (stored) {
              const orderList = JSON.parse(stored);
              const remoteInvoices = new Set(remoteOrders.map((o) => o.invoice_number));
              const missingCached: AdminOrderSummary[] = Object.keys(orderList)
                .filter((inv) => !remoteInvoices.has(inv))
                .map((inv) => {
                  const entry = orderList[inv];
                  const conf = entry.confirmation;
                  const payload = entry.payload;
                  return {
                    id: conf.order_id || 'ord_' + inv,
                    invoice_number: conf.invoice_number,
                    customer_id: 'cust_' + inv,
                    status: conf.status || 'review_required',
                    subtotal: conf.subtotal,
                    delivery_charge: conf.delivery_charge,
                    total_amount: conf.total_amount,
                    advance_amount: conf.advance_amount,
                    advance_status: conf.advance_status || 'pending',
                    cash_due: conf.cash_due,
                    delivery_date: conf.delivery_date,
                    delivery_time: payload?.order?.delivery_time || 'Morning 10:00 AM - 1:00 PM',
                    delivery_address: payload?.order?.delivery_address || payload?.customer?.address || 'Dhaka',
                    special_instructions: payload?.order?.special_instructions || null,
                    created_at: conf.created_at,
                    updated_at: conf.created_at,
                    customer: {
                      id: 'cust_' + inv,
                      name: payload?.customer?.name || conf.customer_name || 'Customer',
                      phone: payload?.customer?.phone || '01700000000',
                      email: payload?.customer?.email || null,
                      address: payload?.customer?.address || 'Dhaka',
                      area: payload?.customer?.area || 'Dhaka',
                      notes: null,
                      created_at: conf.created_at,
                      updated_at: conf.created_at,
                    },
                    items: (payload?.items || []).map((it: any, idx: number) => ({
                      id: 'item_' + idx,
                      order_id: conf.order_id || 'ord_' + inv,
                      product_id: it.product_id || null,
                      product_name_snapshot: it.product_name_snapshot,
                      quantity: it.quantity,
                      unit_price: it.unit_price,
                      subtotal: it.subtotal,
                      selected_size: it.selected_size || null,
                      cake_weight: it.cake_weight || null,
                      cake_flavor: it.cake_flavor || null,
                      cake_message: it.cake_message || null,
                      customization_details: it.customization_details || null,
                      created_at: conf.created_at,
                    })),
                    payments: [
                      {
                        id: 'pay_' + inv,
                        order_id: conf.order_id || 'ord_' + inv,
                        method: 'bkash',
                        amount: conf.advance_amount,
                        trx_id: payload?.payment?.trx_id || '9K28FD4A',
                        sender_last4: payload?.payment?.sender_last4 || '1234',
                        reference_name: payload?.payment?.reference_name || payload?.customer?.name || null,
                        status: (conf.advance_status === 'verified' ? 'matched' : 'pending_match') as any,
                        matched_at: null,
                        matched_by: null,
                        created_at: conf.created_at,
                      },
                    ],
                    history: [
                      {
                        id: 'hist_' + inv,
                        order_id: conf.order_id || 'ord_' + inv,
                        status: conf.status || 'review_required',
                        changed_by: null,
                        note: 'Order placed by guest customer.',
                        created_at: conf.created_at,
                      },
                    ],
                  };
                });

              if (missingCached.length > 0) {
                return [...missingCached, ...remoteOrders];
              }
            }
          } catch (cacheErr) {
            console.warn('Error checking cached guest orders:', cacheErr);
          }

          return remoteOrders;
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to cached/demo orders:', err);
      }
    }

    // Merge localStorage cached orders and standard Stitch demo orders
    let allOrders = getDemoOrders();

    try {
      const stored = localStorage.getItem('ababils_guest_orders_v1');
      if (stored) {
        const orderList = JSON.parse(stored);
        const cachedOrders: AdminOrderSummary[] = Object.keys(orderList).map((inv) => {
          const entry = orderList[inv];
          const conf = entry.confirmation;
          const payload = entry.payload;
          return {
            id: conf.order_id || 'ord_' + inv,
            invoice_number: conf.invoice_number,
            customer_id: 'cust_' + inv,
            status: conf.status || 'review_required',
            subtotal: conf.subtotal,
            delivery_charge: conf.delivery_charge,
            total_amount: conf.total_amount,
            advance_amount: conf.advance_amount,
            advance_status: conf.advance_status || 'pending',
            cash_due: conf.cash_due,
            delivery_date: conf.delivery_date,
            delivery_time: payload?.order?.delivery_time || 'Morning 10:00 AM - 1:00 PM',
            delivery_address: payload?.order?.delivery_address || payload?.customer?.address || 'Dhaka',
            special_instructions: payload?.order?.special_instructions || null,
            created_at: conf.created_at,
            updated_at: conf.created_at,
            customer: {
              id: 'cust_' + inv,
              name: payload?.customer?.name || conf.customer_name || 'Customer',
              phone: payload?.customer?.phone || '01700000000',
              email: payload?.customer?.email || null,
              address: payload?.customer?.address || 'Dhaka',
              area: payload?.customer?.area || 'Dhaka',
              notes: null,
              created_at: conf.created_at,
              updated_at: conf.created_at,
            },
            items: (payload?.items || []).map((it: any, idx: number) => ({
              id: 'item_' + idx,
              order_id: conf.order_id || 'ord_' + inv,
              product_id: it.product_id || null,
              product_name_snapshot: it.product_name_snapshot,
              quantity: it.quantity,
              unit_price: it.unit_price,
              subtotal: it.subtotal,
              selected_size: it.selected_size || null,
              cake_weight: it.cake_weight || null,
              cake_flavor: it.cake_flavor || null,
              cake_message: it.cake_message || null,
              customization_details: it.customization_details || null,
              created_at: conf.created_at,
            })),
            payments: [
              {
                id: 'pay_' + inv,
                order_id: conf.order_id || 'ord_' + inv,
                method: 'bkash',
                amount: conf.advance_amount,
                trx_id: payload?.payment?.trx_id || '9K28FD4A',
                sender_last4: payload?.payment?.sender_last4 || '1234',
                reference_name: payload?.payment?.reference_name || payload?.customer?.name || null,
                status: (conf.advance_status === 'verified' ? 'matched' : 'pending_match') as any,
                matched_at: null,
                matched_by: null,
                created_at: conf.created_at,
              },
            ],
            history: [
              {
                id: 'hist_' + inv,
                order_id: conf.order_id || 'ord_' + inv,
                status: conf.status || 'review_required',
                changed_by: null,
                note: 'Order placed by guest customer.',
                created_at: conf.created_at,
              },
            ],
          };
        });

        // Prepend newer cached orders without duplicate invoices
        const existingInvoices = new Set(cachedOrders.map((o) => o.invoice_number));
        allOrders = [...cachedOrders, ...allOrders.filter((o) => !existingInvoices.has(o.invoice_number))];
      }
    } catch (e) {
      console.warn('Error reading cached orders from localStorage:', e);
    }

    // Apply any admin status or payment overrides saved locally
    try {
      const statusOverridesStr = localStorage.getItem('ababils_admin_status_overrides_v1');
      const paymentOverridesStr = localStorage.getItem('ababils_admin_payment_overrides_v1');
      const statusOverrides = statusOverridesStr ? JSON.parse(statusOverridesStr) : {};
      const paymentOverrides = paymentOverridesStr ? JSON.parse(paymentOverridesStr) : {};

      allOrders = allOrders.map((order) => {
        let updatedOrder = { ...order };
        const statusOv = statusOverrides[order.id] || statusOverrides[order.invoice_number];
        if (statusOv) {
          const newHistory = [...(updatedOrder.history || [])];
          if (!newHistory.some(h => h.status === statusOv.status && h.note === statusOv.note)) {
            newHistory.push({
              id: 'hist_ov_' + Date.now(),
              order_id: order.id,
              status: statusOv.status,
              changed_by: null,
              note: statusOv.note || `Status changed to ${statusOv.status}`,
              created_at: statusOv.updated_at || new Date().toISOString(),
            });
          }
          updatedOrder.status = statusOv.status;
          updatedOrder.history = newHistory;
        }

        // Check payment overrides by TrxID
        for (const payment of updatedOrder.payments) {
          if (payment.trx_id && paymentOverrides[payment.trx_id.toUpperCase()]) {
            const payOv = paymentOverrides[payment.trx_id.toUpperCase()];
            updatedOrder.advance_status = payOv.advance_status;
            payment.status = payOv.confirmed ? 'matched' : 'rejected';
          }
        }

        return updatedOrder;
      });
    } catch (err) {
      console.warn('Error applying admin overrides:', err);
    }

    // Apply client-side filters
    let filtered = allOrders;

    if (filters?.status && filters.status !== 'all') {
      filtered = filtered.filter((o) => o.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (o) =>
          o.invoice_number.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.phone.toLowerCase().includes(q) ||
          o.delivery_address.toLowerCase().includes(q)
      );
    }

    if (filters?.productCategory && filters.productCategory !== 'all') {
      filtered = filtered.filter((o) => {
        const hasDress = o.items.some((i) => !i.cake_weight);
        const hasCake = o.items.some((i) => i.cake_weight);
        if (filters.productCategory === 'dress') return hasDress && !hasCake;
        if (filters.productCategory === 'cake') return hasCake && !hasDress;
        if (filters.productCategory === 'bundle') return hasDress && hasCake;
        return true;
      });
    }

    return filtered;
  },

  /**
   * Admin: Get single order with complete details and status history
   */
  async getOrderByIdAdmin(orderIdOrInvoice: string): Promise<AdminOrderSummary | null> {
    if (isSupabaseConfigured()) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdOrInvoice);
        let query = (supabase as any)
          .from('orders')
          .select(`
            *,
            customer:customers(*),
            items:order_items(*),
            payments(*),
            history:order_status_history(*)
          `);

        if (isUuid) {
          query = query.or(`id.eq.${orderIdOrInvoice},invoice_number.eq.${orderIdOrInvoice}`);
        } else {
          query = query.eq('invoice_number', orderIdOrInvoice);
        }

        const { data, error } = await query.maybeSingle();

        if (!error && data) {
          return data as unknown as AdminOrderSummary;
        }
      } catch (err) {
        console.warn('Error fetching order from Supabase, checking fallback:', err);
      }
    }

    const all = await this.getOrdersAdmin();
    const found = all.find((o) => o.id === orderIdOrInvoice || o.invoice_number === orderIdOrInvoice);
    return found || null;
  },

  /**
   * Admin: Update order status with audit log note
   */
  async updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const { error: updateError } = await (supabase as any)
          .from('orders')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (updateError) {
          throw updateError;
        }

        const { data: userData } = await supabase.auth.getUser();
        const adminId = userData.user?.id || null;

        await (supabase as any).from('order_status_history').insert({
          order_id: orderId,
          status: newStatus,
          changed_by: adminId,
          note: note || `Order updated to ${newStatus} by admin.`,
        });

        return;
      } catch (err) {
        console.warn('Supabase status update failed, saving locally:', err);
      }
    }

    // Local fallback update
    updateLocalOrderStatus(orderId, newStatus, note);
  },

  /**
   * Admin: Find order and payment details by bKash TrxID
   */
  async findOrderByTrxId(trxId: string): Promise<TrxMatchingPreview> {
    const cleanTrx = trxId.trim().toUpperCase();
    if (!cleanTrx) {
      return { found: false, error: 'Please enter a valid bKash TrxID.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.rpc as any)('find_order_by_trx_id', {
          p_trx_id: cleanTrx,
        });

        if (!error && data && data.found) {
          return data as unknown as TrxMatchingPreview;
        }
      } catch (err) {
        console.warn('RPC find_order_by_trx_id failed, checking local state:', err);
      }
    }

    // Fallback search across local orders
    const all = await this.getOrdersAdmin();
    const matchedOrder = all.find((o) =>
      o.payments.some((p) => p.trx_id?.toUpperCase() === cleanTrx)
    );

    if (matchedOrder) {
      const p = matchedOrder.payments.find((py) => py.trx_id?.toUpperCase() === cleanTrx)!;
      return {
        found: true,
        payment_id: p.id,
        trx_id: p.trx_id,
        sender_last4: p.sender_last4,
        reference_name: p.reference_name,
        payment_amount: p.amount,
        payment_status: p.status,
        matched_at: p.matched_at,
        order_id: matchedOrder.id,
        invoice_number: matchedOrder.invoice_number,
        order_status: matchedOrder.status,
        expected_advance: matchedOrder.advance_amount,
        advance_status: matchedOrder.advance_status,
        total_amount: matchedOrder.total_amount,
        cash_due: matchedOrder.cash_due,
        delivery_date: matchedOrder.delivery_date,
        customer_name: matchedOrder.customer.name,
        customer_phone: matchedOrder.customer.phone,
        customer_area: matchedOrder.customer.area,
        delivery_address: matchedOrder.delivery_address,
        items: matchedOrder.items.map((i) => ({
          product_name: i.product_name_snapshot,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.subtotal,
          selected_size: i.selected_size,
          cake_weight: i.cake_weight,
        })),
      };
    }

    return { found: false, error: `No order found with TrxID: ${cleanTrx}` };
  },

  /**
   * Admin: Create a manual order on behalf of a customer.
   * Uses the create_manual_order Supabase RPC (authenticated, admin-only).
   * Falls back to local storage and in-memory order when Supabase is offline/unconfigured.
   */
  async createManualOrder(payload: CreateManualOrderPayload): Promise<ManualOrderResult> {
    // 1. Validation
    if (!payload.customer.name || !payload.customer.name.trim()) {
      throw new Error('Customer full name is required');
    }
    if (!payload.customer.phone || !payload.customer.phone.trim()) {
      throw new Error('Customer phone number is required');
    }
    if (!payload.order.delivery_address || !payload.order.delivery_address.trim()) {
      throw new Error('Delivery address is required');
    }
    if (!payload.order.delivery_date) {
      throw new Error('Delivery date is required');
    }
    if (!payload.items || payload.items.length === 0) {
      throw new Error('At least one item is required to place a manual order');
    }
    for (const item of payload.items) {
      if (!item.product_name) {
        throw new Error('Item name is required');
      }
      if (item.quantity <= 0) {
        throw new Error(`Quantity for ${item.product_name} must be greater than zero`);
      }
      if (item.category === 'dress' && !item.selected_size) {
        throw new Error(`Size is required for dress item: ${item.product_name}`);
      }
      if (item.category === 'cake' && !item.cake_weight) {
        throw new Error(`Weight is required for cake item: ${item.product_name}`);
      }
    }

    const subtotal = payload.items.reduce(
      (sum, item) => sum + (item.subtotal || item.unit_price * item.quantity),
      0
    );
    const deliveryCharge = Number(payload.order.delivery_charge || 0);
    const totalAmount = subtotal + deliveryCharge;
    const advanceAmount = Number(payload.order.advance_amount || 0);

    if (advanceAmount > totalAmount) {
      throw new Error(
        `Advance amount (৳ ${advanceAmount}) cannot exceed total order amount (৳ ${totalAmount})`
      );
    }

    if (advanceAmount > 0 && payload.payment && payload.payment.method === 'bkash') {
      if (!payload.payment.trx_id || !payload.payment.trx_id.trim()) {
        throw new Error('bKash Transaction ID (TrxID) is required when an advance has been received via bKash');
      }
      if (!payload.payment.sender_last4 || payload.payment.sender_last4.trim().length < 4) {
        throw new Error('Last 4 digits of sender phone are required for bKash advance');
      }
    }

    // 2. Supabase RPC if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.rpc as any)('create_manual_order', {
          p_customer: payload.customer,
          p_order: {
            ...payload.order,
            subtotal,
            total_amount: totalAmount,
            delivery_charge: deliveryCharge,
            advance_amount: advanceAmount,
          },
          p_items: payload.items.map((it) => ({
            product_id: it.product_id,
            product_name: it.product_name,
            product_name_snapshot: it.product_name,
            quantity: it.quantity,
            unit_price: it.unit_price,
            subtotal: it.subtotal || it.unit_price * it.quantity,
            selected_size: it.selected_size,
            cake_weight: it.cake_weight,
            cake_flavor: it.cake_flavor,
            cake_message: it.cake_message,
            special_instructions: it.special_instructions,
          })),
          p_payment: payload.payment
            ? {
                method: payload.payment.method || 'bkash',
                amount: advanceAmount,
                trx_id: payload.payment.trx_id?.trim().toUpperCase(),
                sender_last4: payload.payment.sender_last4?.trim(),
                reference_name: payload.payment.reference_name?.trim(),
              }
            : null,
        });

        if (!error && data && data.success) {
          return data as unknown as ManualOrderResult;
        }
        if (error) {
          console.warn('create_manual_order RPC error:', error);
          throw error;
        }
      } catch (err: any) {
        console.warn('Supabase create_manual_order failed, falling back to local storage:', err);
      }
    }

    // 3. Fallback / Local simulation
    const invoiceNumber = generateInvoiceNumberFallback();
    const orderId = 'ord_manual_' + Math.random().toString(36).substring(2, 9);
    const customerId = payload.customer.id || 'cust_' + Math.random().toString(36).substring(2, 9);
    const cashDue = Math.max(0, totalAmount - advanceAmount);
    const isAdvanceVerified = Boolean(payload.order.advance_verified && advanceAmount > 0);
    const initialStatus: OrderStatus = isAdvanceVerified ? 'advance_verified' : 'review_required';
    const advanceStatus: AdvanceStatus = isAdvanceVerified ? 'verified' : 'pending';

    const orderResult: ManualOrderResult = {
      success: true,
      order_id: orderId,
      invoice_number: invoiceNumber,
      customer_id: customerId,
      customer_name: payload.customer.name,
      total_amount: totalAmount,
      advance_amount: advanceAmount,
      cash_due: cashDue,
      status: initialStatus,
      advance_status: advanceStatus,
      delivery_date: payload.order.delivery_date,
      created_at: new Date().toISOString(),
    };

    // Construct local order entry and save to localStorage
    try {
      const stored = localStorage.getItem('ababils_guest_orders_v1');
      const orderList = stored ? JSON.parse(stored) : {};

      orderList[invoiceNumber] = {
        confirmation: {
          success: true,
          order_id: orderId,
          invoice_number: invoiceNumber,
          customer_name: payload.customer.name,
          subtotal,
          delivery_charge: deliveryCharge,
          total_amount: totalAmount,
          advance_amount: advanceAmount,
          advance_status: advanceStatus,
          cash_due: cashDue,
          delivery_date: payload.order.delivery_date,
          status: initialStatus,
          created_at: orderResult.created_at,
        },
        payload: {
          customer: {
            ...payload.customer,
            id: customerId,
          },
          order: {
            delivery_date: payload.order.delivery_date,
            delivery_time: payload.order.delivery_time || 'Morning 10:00 AM - 1:00 PM',
            delivery_address: payload.order.delivery_address,
            special_instructions: payload.order.special_instructions,
            subtotal,
            delivery_charge: deliveryCharge,
            total_amount: totalAmount,
            advance_amount: advanceAmount,
          },
          items: payload.items.map((it) => ({
            product_id: it.product_id,
            product_name_snapshot: it.product_name,
            quantity: it.quantity,
            unit_price: it.unit_price,
            subtotal: it.subtotal || it.unit_price * it.quantity,
            selected_size: it.selected_size,
            cake_weight: it.cake_weight,
            cake_flavor: it.cake_flavor,
            cake_message: it.cake_message,
            customization_details: it.special_instructions,
          })),
          payment: payload.payment
            ? {
                trx_id: payload.payment.trx_id?.trim().toUpperCase(),
                sender_last4: payload.payment.sender_last4?.trim(),
                reference_name: payload.payment.reference_name?.trim(),
              }
            : {
                trx_id: 'MANUAL_PENDING',
                sender_last4: '0000',
                reference_name: 'Studio Telephone',
              },
        },
      };

      localStorage.setItem('ababils_guest_orders_v1', JSON.stringify(orderList));
    } catch (e) {
      console.warn('Could not cache manual order to localStorage:', e);
    }

    return orderResult;
  },

  /**
   * Admin: Confirm or Flag mismatch for bKash advance payment
   */
  async matchBkashPayment(
    trxId: string,
    confirm: boolean,
    note?: string
  ): Promise<{ success: boolean; error?: string; order_id?: string; invoice_number?: string }> {
    const cleanTrx = trxId.trim().toUpperCase();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.rpc as any)('match_bkash_payment', {
          p_trx_id: cleanTrx,
          p_confirm: confirm,
          p_note: note || undefined,
        });

        if (!error && data && data.success) {
          return {
            success: true,
            order_id: data.order_id,
            invoice_number: data.invoice_number,
          };
        }
        if (error) {
          throw error;
        }
      } catch (err: any) {
        console.warn('RPC match_bkash_payment failed, updating locally:', err);
      }
    }

    // Local fallback confirmation
    const all = await this.getOrdersAdmin();
    const order = all.find((o) =>
      o.payments.some((p) => p.trx_id?.toUpperCase() === cleanTrx)
    );

    if (order) {
      updateLocalOrderPayment(order.id, cleanTrx, confirm, note);
      return {
        success: true,
        order_id: order.id,
        invoice_number: order.invoice_number,
      };
    }

    return { success: false, error: `No payment found with TrxID: ${cleanTrx}` };
  },
};

// =============================================================================
// DEMO ORDERS & LOCAL STORAGE HELPERS
// =============================================================================

function getDemoOrders(): AdminOrderSummary[] {
  return [
    {
      id: 'ord_demo_1043',
      invoice_number: 'AB-260924-1043',
      customer_id: 'cust_demo_1043',
      status: 'review_required',
      subtotal: 4350,
      delivery_charge: 250,
      total_amount: 4600,
      advance_amount: 500,
      advance_status: 'pending',
      cash_due: 4100,
      delivery_date: '2026-10-28',
      delivery_time: '10:00 AM - 1:00 PM',
      delivery_address: 'House 18, Road 4, Dhanmondi, Dhaka',
      special_instructions: 'Please chill cake packaging thoroughly before van dispatch.',
      created_at: '2026-09-24T11:20:00Z',
      updated_at: '2026-09-24T11:20:00Z',
      customer: {
        id: 'cust_demo_1043',
        name: 'Nusrat Jahan',
        phone: '01819223344',
        email: 'dr.nusrat.jahan@gmail.com',
        address: 'House 18, Road 4, Dhanmondi, Dhaka',
        area: 'Dhanmondi',
        notes: null,
        created_at: '2026-09-24T11:20:00Z',
        updated_at: '2026-09-24T11:20:00Z',
      },
      items: [
        {
          id: 'item_1043_1',
          order_id: 'ord_demo_1043',
          product_id: null,
          product_name_snapshot: 'Vintage Lambeth Ruffle Bento Cake',
          quantity: 1,
          unit_price: 4350,
          subtotal: 4350,
          selected_size: null,
          cake_weight: '3.0 lb',
          cake_flavor: 'Salted Caramel Buttercream',
          cake_message: 'Darling 30th',
          customization_details: null,
          created_at: '2026-09-24T11:20:00Z',
        },
      ],
      payments: [
        {
          id: 'pay_1043_1',
          order_id: 'ord_demo_1043',
          method: 'bkash',
          amount: 500,
          trx_id: '8L99AC12',
          sender_last4: '4421',
          reference_name: 'Nusrat Cake',
          status: 'pending_match',
          matched_at: null,
          matched_by: null,
          created_at: '2026-09-24T11:20:00Z',
        },
      ],
      history: [
        {
          id: 'hist_1043_1',
          order_id: 'ord_demo_1043',
          status: 'review_required',
          changed_by: null,
          note: 'Order submitted with bKash advance TrxID 8L99AC12. Awaiting admin statement reconciliation.',
          created_at: '2026-09-24T11:20:00Z',
        },
      ],
    },
    {
      id: 'ord_demo_1042',
      invoice_number: 'AB-260923-1042',
      customer_id: 'cust_demo_1042',
      status: 'in_production',
      subtotal: 7350,
      delivery_charge: 250,
      total_amount: 7600,
      advance_amount: 500,
      advance_status: 'verified',
      cash_due: 7100,
      delivery_date: '2026-11-14',
      delivery_time: '2:00 PM - 4:00 PM',
      delivery_address: 'House 14, Road 2, Sector 3, Uttara, Dhaka',
      special_instructions: 'Handle with utmost care. Fragile sugar flowers on cake.',
      created_at: '2026-09-24T15:45:00Z',
      updated_at: '2026-09-24T16:00:00Z',
      customer: {
        id: 'cust_demo_1042',
        name: 'Ayesha Rahman',
        phone: '01712345678',
        email: 'ayesha.rahman21@gmail.com',
        address: 'House 14, Road 2, Sector 3, Uttara, Dhaka',
        area: 'Uttara',
        notes: null,
        created_at: '2026-09-24T15:45:00Z',
        updated_at: '2026-09-24T15:45:00Z',
      },
      items: [
        {
          id: 'item_1042_1',
          order_id: 'ord_demo_1042',
          product_id: null,
          product_name_snapshot: 'Aurelia Floral Smocked Dress',
          quantity: 1,
          unit_price: 3800,
          subtotal: 3800,
          selected_size: '12M',
          cake_weight: null,
          cake_flavor: null,
          cake_message: null,
          customization_details: 'Hand smocked bodice with French linen lawn',
          created_at: '2026-09-24T15:45:00Z',
        },
        {
          id: 'item_1042_2',
          order_id: 'ord_demo_1042',
          product_id: null,
          product_name_snapshot: 'Vanilla Berry Celebration Cake',
          quantity: 1,
          unit_price: 2350,
          subtotal: 2350,
          selected_size: null,
          cake_weight: '2.0 lb',
          cake_flavor: 'Madagascar Vanilla & Fresh Berries',
          cake_message: 'Happy 1st Birthday Zaara!',
          customization_details: null,
          created_at: '2026-09-24T15:45:00Z',
        },
        {
          id: 'item_1042_3',
          order_id: 'ord_demo_1042',
          product_id: null,
          product_name_snapshot: 'Custom Bento Lunchbox Cake',
          quantity: 1,
          unit_price: 1200,
          subtotal: 1200,
          selected_size: null,
          cake_weight: '0.5 lb',
          cake_flavor: 'Red Velvet Cream Cheese',
          cake_message: 'Sweet Love',
          customization_details: null,
          created_at: '2026-09-24T15:45:00Z',
        },
      ],
      payments: [
        {
          id: 'pay_1042_1',
          order_id: 'ord_demo_1042',
          method: 'bkash',
          amount: 500,
          trx_id: '9K28FD4A',
          sender_last4: '5678',
          reference_name: 'Ayesha / Cake',
          status: 'matched',
          matched_at: '2026-09-24T16:10:00Z',
          matched_by: null,
          created_at: '2026-09-24T15:45:00Z',
        },
      ],
      history: [
        {
          id: 'hist_1042_1',
          order_id: 'ord_demo_1042',
          status: 'review_required',
          changed_by: null,
          note: 'Order placed online by customer (bKash advance pending).',
          created_at: '2026-09-24T15:45:00Z',
        },
        {
          id: 'hist_1042_2',
          order_id: 'ord_demo_1042',
          status: 'advance_verified',
          changed_by: null,
          note: 'Advance ৳ 500 matched & confirmed by Sanjida (TrxID: 9K28FD4A).',
          created_at: '2026-09-24T16:10:00Z',
        },
        {
          id: 'hist_1042_3',
          order_id: 'ord_demo_1042',
          status: 'in_production',
          changed_by: null,
          note: 'Order moved to Processing stage. Pattern cut and fabric queued in studio.',
          created_at: '2026-09-25T09:30:00Z',
        },
      ],
    },
    {
      id: 'ord_demo_1039',
      invoice_number: 'AB-260920-1039',
      customer_id: 'cust_demo_1039',
      status: 'out_for_delivery',
      subtotal: 5500,
      delivery_charge: 250,
      total_amount: 5750,
      advance_amount: 500,
      advance_status: 'verified',
      cash_due: 5250,
      delivery_date: '2026-10-20',
      delivery_time: '1:15 PM',
      delivery_address: 'House 55, Road 11, Block C, Banani, Dhaka',
      special_instructions: 'Rider: Redx #449. Chilled Direct Van Transport.',
      created_at: '2026-09-20T10:15:00Z',
      updated_at: '2026-09-20T13:15:00Z',
      customer: {
        id: 'cust_demo_1039',
        name: 'Farhana Kabir',
        phone: '01911002233',
        email: 'farhana.kabir.bd@gmail.com',
        address: 'House 55, Road 11, Block C, Banani, Dhaka',
        area: 'Banani',
        notes: null,
        created_at: '2026-09-20T10:15:00Z',
        updated_at: '2026-09-20T10:15:00Z',
      },
      items: [
        {
          id: 'item_1039_1',
          order_id: 'ord_demo_1039',
          product_id: null,
          product_name_snapshot: 'French Linen Christening Gown (0-3M)',
          quantity: 1,
          unit_price: 3950,
          subtotal: 3950,
          selected_size: '0-3M',
          cake_weight: null,
          cake_flavor: null,
          cake_message: null,
          customization_details: 'Signature Wooden Gift Box with Ribbon',
          created_at: '2026-09-20T10:15:00Z',
        },
        {
          id: 'item_1039_2',
          order_id: 'ord_demo_1039',
          product_id: null,
          product_name_snapshot: 'Pastel Daisy Bento Cake',
          quantity: 1,
          unit_price: 1550,
          subtotal: 1550,
          selected_size: null,
          cake_weight: '0.5 lb',
          cake_flavor: 'Vanilla Fig',
          cake_message: 'Blessings',
          customization_details: null,
          created_at: '2026-09-20T10:15:00Z',
        },
      ],
      payments: [
        {
          id: 'pay_1039_1',
          order_id: 'ord_demo_1039',
          method: 'bkash',
          amount: 500,
          trx_id: '7P43XX89',
          sender_last4: '9988',
          reference_name: 'Farhana Baby',
          status: 'matched',
          matched_at: '2026-09-20T11:00:00Z',
          matched_by: null,
          created_at: '2026-09-20T10:15:00Z',
        },
      ],
      history: [
        {
          id: 'hist_1039_1',
          order_id: 'ord_demo_1039',
          status: 'out_for_delivery',
          changed_by: null,
          note: 'Handed to courier Redx #449 for chilled direct handover.',
          created_at: '2026-09-20T13:15:00Z',
        },
      ],
    },
  ];
}

function updateLocalOrderStatus(orderId: string, newStatus: OrderStatus, note?: string) {
  try {
    const stored = localStorage.getItem('ababils_admin_status_overrides_v1');
    const overrides = stored ? JSON.parse(stored) : {};
    overrides[orderId] = {
      status: newStatus,
      note,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem('ababils_admin_status_overrides_v1', JSON.stringify(overrides));
  } catch (e) {
    console.warn('Could not save local status override:', e);
  }
}

function updateLocalOrderPayment(orderId: string, trxId: string, confirm: boolean, note?: string) {
  try {
    const stored = localStorage.getItem('ababils_admin_payment_overrides_v1');
    const overrides = stored ? JSON.parse(stored) : {};
    overrides[trxId] = {
      orderId,
      confirmed: confirm,
      advance_status: confirm ? 'verified' : 'rejected',
      note,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem('ababils_admin_payment_overrides_v1', JSON.stringify(overrides));
  } catch (e) {
    console.warn('Could not save local payment override:', e);
  }
}
