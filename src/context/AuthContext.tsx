/**
 * Ababil’s Attire by Sanjida Bethi
 * Admin Authentication Context & Session Provider
 *
 * Enforces dual-layer security:
 * 1. Supabase Auth session validation
 * 2. Mandatory presence and active status in admin_users table with an allowed role:
 *    ('superadmin', 'admin', 'staff')
 *
 * If an authenticated user is not in admin_users or has an unauthorized role,
 * the session is immediately invalidated to prevent unauthorized /admin access.
 */

import React, { createContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { AdminRole, Database } from '../types/database.types';

export type AdminUserRow = Database['public']['Tables']['admin_users']['Row'];

export interface AuthContextValue {
  user: User | null;
  admin: AdminUserRow | null;
  session: Session | null;
  role: AdminRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshAdminProfile: () => Promise<void>;
}

const ALLOWED_ADMIN_ROLES: AdminRole[] = ['superadmin', 'admin', 'staff'];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [admin, setAdmin] = useState<AdminUserRow | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Fetch and verify admin privileges from database.
   * This ensures we NEVER trust frontend storage or user metadata for admin role.
   */
  const verifyAndFetchAdminRecord = useCallback(async (userId: string): Promise<AdminUserRow | null> => {
    try {
      const { data, error: queryError } = await (supabase as any)
        .from('admin_users')
        .select('*')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (queryError || !data) {
        return null;
      }

      const role = data.role as AdminRole;
      if (!ALLOWED_ADMIN_ROLES.includes(role)) {
        return null;
      }

      return data as AdminUserRow;
    } catch (err) {
      console.error('[Auth] Error querying admin record:', err);
      return null;
    }
  }, []);

  /**
   * Initialize session on load and listen to Supabase Auth state changes
   */
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setIsLoading(true);

      if (!isSupabaseConfigured()) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('[Auth] Session retrieval notice:', sessionError.message);
          if (isMounted) {
            setUser(null);
            setSession(null);
            setAdmin(null);
            setIsLoading(false);
          }
          return;
        }

        const currentSession = sessionData.session;
        if (currentSession?.user) {
          const adminRecord = await verifyAndFetchAdminRecord(currentSession.user.id);

          if (isMounted) {
            if (adminRecord) {
              setUser(currentSession.user);
              setSession(currentSession);
              setAdmin(adminRecord);
            } else {
              // Authenticated user exists but is not an authorized active admin
              await supabase.auth.signOut();
              setUser(null);
              setSession(null);
              setAdmin(null);
              setError('Access denied: You do not have active Atelier Admin privileges.');
            }
          }
        } else {
          if (isMounted) {
            setUser(null);
            setSession(null);
            setAdmin(null);
          }
        }
      } catch (err) {
        console.error('[Auth] Initialization error:', err);
        if (isMounted) {
          setError('Authentication error during session verification.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Listen for auth changes (token refresh, sign out, sign in)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT' || !newSession?.user) {
          setUser(null);
          setSession(null);
          setAdmin(null);
          setIsLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          setIsLoading(true);
          const adminRecord = await verifyAndFetchAdminRecord(newSession.user.id);

          if (adminRecord) {
            setUser(newSession.user);
            setSession(newSession);
            setAdmin(adminRecord);
            setError(null);
          } else {
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            setAdmin(null);
            setError('Unauthorized: Your account does not possess Atelier Admin credentials.');
          }
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [verifyAndFetchAdminRecord]);

  /**
   * Refresh admin profile data on demand
   */
  const refreshAdminProfile = useCallback(async () => {
    if (!user) return;
    const adminRecord = await verifyAndFetchAdminRecord(user.id);
    setAdmin(adminRecord);
  }, [user, verifyAndFetchAdminRecord]);

  /**
   * Admin Login: Authenticates email/password via Supabase Auth,
   * then strictly verifies admin_users table role.
   */
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setError(null);
      setIsLoading(true);

      if (!email.trim() || !password) {
        setIsLoading(false);
        const msg = 'Please enter both email and password.';
        setError(msg);
        return { success: false, error: msg };
      }

      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError || !data.user) {
          const msg = signInError?.message || 'Invalid credentials. Please verify email and password.';
          setError(msg);
          setIsLoading(false);
          return { success: false, error: msg };
        }

        // Verify the logged-in user is an active admin
        const adminRecord = await verifyAndFetchAdminRecord(data.user.id);

        if (!adminRecord) {
          await supabase.auth.signOut();
          const msg = 'Access denied: Your account is not authorized as an Atelier Admin.';
          setUser(null);
          setSession(null);
          setAdmin(null);
          setError(msg);
          setIsLoading(false);
          return { success: false, error: msg };
        }

        setUser(data.user);
        setSession(data.session);
        setAdmin(adminRecord);
        setIsLoading(false);
        return { success: true };
      } catch (err: any) {
        const msg = err.message || 'An unexpected error occurred during login.';
        console.error('[Auth] Sign in error:', err);
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }
    },
    [verifyAndFetchAdminRecord]
  );

  /**
   * Admin Logout: Signs out from Supabase Auth and clears all local state
   */
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Auth] Sign out warning:', err);
    } finally {
      setUser(null);
      setSession(null);
      setAdmin(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  const isAdmin = useMemo(() => {
    return Boolean(admin && admin.is_active && ALLOWED_ADMIN_ROLES.includes(admin.role));
  }, [admin]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      admin,
      session,
      role: admin?.role || null,
      isAdmin,
      isLoading,
      error,
      signIn,
      signOut,
      clearError,
      refreshAdminProfile,
    }),
    [user, admin, session, isAdmin, isLoading, error, signIn, signOut, clearError, refreshAdminProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };

