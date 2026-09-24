/**
 * Ababil’s Attire by Sanjida Bethi
 * Payment Service & Admin bKash TrxID Matching Tool
 *
 * NOTE: This tool matches the customer-submitted TrxID against internal stored order
 * and payment records. It does NOT call an external bKash API.
 */

import { supabase } from '../lib/supabase';
import type { TrxMatchingPreview, PaymentRow } from '../types';

export interface MatchConfirmationResult {
  success: boolean;
  trx_id: string;
  confirmed: boolean;
  order_id: string;
  invoice_number: string;
  advance_status: 'verified' | 'rejected';
  order_status: string;
  matched_at: string;
  matched_by: string;
}

export const paymentsService = {
  /**
   * Step 1 & 2: Paste TrxID -> Find related order, payment, customer, and expected advance.
   * Step 3 & 4: Returns full details for admin to compare against physical bKash SMS / statement.
   */
  async findByTrxId(trxId: string): Promise<TrxMatchingPreview> {
    const cleanTrx = trxId.trim();
    if (!cleanTrx) {
      return { found: false, error: 'Please enter a valid TrxID' };
    }

    const { data, error } = await (supabase.rpc as any)('find_order_by_trx_id', {
      p_trx_id: cleanTrx,
    });

    if (error) {
      console.error('Error finding order by TrxID:', error);
      return { found: false, error: error.message || 'Error querying TrxID' };
    }

    return data as unknown as TrxMatchingPreview;
  },

  /**
   * Step 5, 6, 7: Admin confirms or rejects the advance match.
   * Updates payment record, order advance status, logs confirmation timestamp & admin ID,
   * and records an audit log entry in order_status_history.
   */
  async matchPayment(
    trxId: string,
    confirm: boolean,
    note?: string
  ): Promise<MatchConfirmationResult> {
    const cleanTrx = trxId.trim();

    const { data, error } = await (supabase.rpc as any)('match_bkash_payment', {
      p_trx_id: cleanTrx,
      p_confirm: confirm,
      p_note: note || undefined,
    });

    if (error) {
      console.error('Error confirming bKash payment match:', error);
      throw new Error(error.message || 'Failed to reconcile bKash advance');
    }

    return data as unknown as MatchConfirmationResult;
  },

  /**
   * Admin: List all payments pending matching/verification
   */
  async getPendingPaymentsAdmin(): Promise<PaymentRow[]> {
    const { data, error } = await (supabase as any)
      .from('payments')
      .select('*')
      .eq('status', 'pending_match')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending payments:', error);
      throw error;
    }

    return data || [];
  },
};
