/**
 * Ababil’s Attire by Sanjida Bethi
 * Unified Shopping Bag / Cart Context with LocalStorage Persistence
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { CartItem } from '../types/cart.types';
import { CartContext } from './cartContextInstance';

const CART_STORAGE_KEY = 'ababils_bag_v1';
const NOTE_STORAGE_KEY = 'ababils_bag_note_v1';

function generateCartItemId(item: Omit<CartItem, 'id'>): string {
  if (item.category === 'dress') {
    const size = (item.selectedSize || 'default').toLowerCase().replace(/\s+/g, '-');
    return `drs_${item.productId}_${size}`;
  } else {
    const weight = (item.selectedWeight || 'default').toLowerCase().replace(/\s+/g, '-');
    const flavor = (item.selectedFlavor || 'default').toLowerCase().replace(/\s+/g, '-');
    const message = (item.customMessage || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return `cke_${item.productId}_${weight}_${flavor}_${message}`;
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to parse cart from localStorage:', err);
    }
    return [];
  });

  const [specialNote, setSpecialNoteState] = useState<string>(() => {
    try {
      return localStorage.getItem(NOTE_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [lastRemovedItem, setLastRemovedItem] = useState<{ item: CartItem; index: number } | null>(null);

  // Sync items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to persist cart to localStorage:', err);
    }
  }, [items]);

  // Sync specialNote to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(NOTE_STORAGE_KEY, specialNote);
    } catch (err) {
      console.warn('Failed to persist special note to localStorage:', err);
    }
  }, [specialNote]);

  const setSpecialNote = (note: string) => {
    setSpecialNoteState(note);
  };

  const addItem = (itemInput: Omit<CartItem, 'id'>) => {
    const lineId = generateCartItemId(itemInput);

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((it) => it.id === lineId);
      if (existingIndex > -1) {
        // Increment quantity on the existing line, capped by available stock
        const updated = [...prevItems];
        const existing = updated[existingIndex];
        const maxLimit = existing.stockQuantity > 0 ? existing.stockQuantity : 10;
        const newQty = Math.min(existing.quantity + (itemInput.quantity || 1), maxLimit);
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
        };
        return updated;
      } else {
        // Add new line
        const newItem: CartItem = {
          ...itemInput,
          id: lineId,
          quantity: itemInput.quantity || 1,
        };
        return [...prevItems, newItem];
      }
    });
  };

  const removeItem = (id: string) => {
    setItems((prevItems) => {
      const index = prevItems.findIndex((it) => it.id === id);
      if (index > -1) {
        setLastRemovedItem({ item: prevItems[index], index });
        return prevItems.filter((it) => it.id !== id);
      }
      return prevItems;
    });
  };

  const undoRemove = () => {
    if (!lastRemovedItem) return;
    setItems((prevItems) => {
      const updated = [...prevItems];
      const targetIndex = Math.min(lastRemovedItem.index, updated.length);
      updated.splice(targetIndex, 0, lastRemovedItem.item);
      return updated;
    });
    setLastRemovedItem(null);
  };

  const updateQuantity = (id: string, newQty: number) => {
    setItems((prevItems) => {
      return prevItems
        .map((it) => {
          if (it.id === id) {
            const maxLimit = it.stockQuantity > 0 ? it.stockQuantity : 10;
            const clamped = Math.max(1, Math.min(newQty, maxLimit));
            return { ...it, quantity: clamped };
          }
          return it;
        })
        .filter((it) => it.quantity > 0);
    });
  };

  const clearCart = () => {
    setItems([]);
    setLastRemovedItem(null);
  };

  // Calculations
  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [items]);

  const hasDress = useMemo(() => {
    return items.some((item) => item.category === 'dress');
  }, [items]);

  const hasCake = useMemo(() => {
    return items.some((item) => item.category === 'cake');
  }, [items]);

  // Delivery Calculations:
  // Standard Courier for dresses = ৳ 120
  // Temperature-controlled van for cakes = ৳ 250
  // Bundle discount if both present = -৳ 120 (Dress ships together with cake!)
  const { deliveryEstimate, deliveryDiscount } = useMemo(() => {
    if (items.length === 0) {
      return { deliveryEstimate: 0, deliveryDiscount: 0 };
    }
    let estimate = 0;
    let discount = 0;

    if (hasDress && hasCake) {
      estimate = 120 + 250;
      discount = 120; // Bundled together
    } else if (hasCake) {
      estimate = 250;
      discount = 0;
    } else if (hasDress) {
      estimate = 120;
      discount = 0;
    }

    return { deliveryEstimate: estimate, deliveryDiscount: discount };
  }, [items.length, hasDress, hasCake]);

  const estimatedTotal = useMemo(() => {
    return subtotal + deliveryEstimate - deliveryDiscount;
  }, [subtotal, deliveryEstimate, deliveryDiscount]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        deliveryEstimate,
        deliveryDiscount,
        estimatedTotal,
        hasDress,
        hasCake,
        specialNote,
        setSpecialNote,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        undoRemove,
        lastRemovedItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
