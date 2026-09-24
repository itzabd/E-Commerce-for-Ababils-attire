/**
 * Ababil’s Attire by Sanjida Bethi
 * useAuth Hook
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextValue } from '../context/AuthContext';

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { AuthContextValue, AdminUserRow } from '../context/AuthContext';
