/**
 * Ababil’s Attire by Sanjida Bethi
 * Admin Auth & Customer Management Service
 */

import { supabase } from '../lib/supabase';
import type { CustomerRow } from '../types';

export interface CustomerDirectoryEntry extends CustomerRow {
  total_orders: number;
  lifetime_value: number;
  last_order_date?: string;
}

export const adminService = {
  /**
   * Admin Authentication: Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Admin login failed:', error);
      throw error;
    }

    // Verify whether this user has an entry in admin_users
    const { data: adminRecord, error: adminError } = await (supabase as any)
      .from('admin_users')
      .select('*')
      .eq('id', data.user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminRecord) {
      await supabase.auth.signOut();
      throw new Error('Access denied: Your account is not authorized as an Atelier Admin.');
    }

    return { user: data.user, admin: adminRecord };
  },

  /**
   * Admin Authentication: Sign out
   */
  async signOut() {
    return await supabase.auth.signOut();
  },

  /**
   * Get currently signed-in admin profile
   */
  async getCurrentAdmin() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return null;

    const { data: adminData } = await (supabase as any)
      .from('admin_users')
      .select('*')
      .eq('id', authData.user.id)
      .eq('is_active', true)
      .single();

    return adminData || null;
  },

  /**
   * Customer Directory with Order Count & Lifetime Value
   */
  async getCustomersDirectory(search?: string): Promise<CustomerDirectoryEntry[]> {
    let query = (supabase as any)
      .from('customers')
      .select(`
        *,
        orders:orders(id, total_amount, created_at, status)
      `)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,area.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching customers directory:', error);
      throw error;
    }

    return (data || []).map((c: any) => {
      const orders = c.orders || [];
      const validOrders = orders.filter((o: any) => o.status !== 'cancelled');
      const ltv = validOrders.reduce((acc: number, o: any) => acc + Number(o.total_amount || 0), 0);
      const sortedOrders = [...orders].sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return {
        ...c,
        total_orders: validOrders.length,
        lifetime_value: ltv,
        last_order_date: sortedOrders[0]?.created_at,
      };
    });
  },

  /**
   * Customer Detail with Full Order History
   */
  async getCustomerWithOrders(customerId: string) {
    const { data, error } = await (supabase as any)
      .from('customers')
      .select(`
        *,
        orders:orders(
          *,
          items:order_items(*),
          payments(*)
        )
      `)
      .eq('id', customerId)
      .single();

    if (error) {
      console.error('Error fetching customer details:', error);
      return null;
    }

    return data;
  },
};
