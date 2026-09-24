/**
 * Ababil’s Attire by Sanjida Bethi
 * Cart Context Instance
 */

import { createContext } from 'react';
import type { CartContextType } from '../types/cart.types';

export const CartContext = createContext<CartContextType | undefined>(undefined);
