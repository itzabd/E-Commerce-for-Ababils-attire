/**
 * Ababil’s Attire by Sanjida Bethi
 * useCart Hook
 */

import { useContext } from 'react';
import { CartContext } from '../context/cartContextInstance';
import type { CartContextType } from '../types/cart.types';

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export type { CartItem, CartContextType } from '../types/cart.types';
