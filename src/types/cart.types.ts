/**
 * Ababil’s Attire by Sanjida Bethi
 * Unified Shopping Bag / Cart Types
 */

export type CartItemCategory = 'dress' | 'cake';

export interface CartItem {
  id: string; // Unique hash/composite key based on product + option combinations
  productId: string;
  productCode: string;
  name: string;
  category: CartItemCategory;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
  stockQuantity: number;

  // Dress specific options
  selectedSize?: string;
  fabricDetails?: string;
  leadTimeDays?: number;

  // Cake specific options
  selectedWeight?: string;
  selectedFlavor?: string;
  customMessage?: string;
  minimumNoticeHours?: number;
}

export interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryEstimate: number;
  deliveryDiscount: number;
  estimatedTotal: number;
  hasDress: boolean;
  hasCake: boolean;
  specialNote: string;
  setSpecialNote: (note: string) => void;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  undoRemove: () => void;
  lastRemovedItem: { item: CartItem; index: number } | null;
}
