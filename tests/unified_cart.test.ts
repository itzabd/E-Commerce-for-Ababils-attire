/**
 * Ababil’s Attire by Sanjida Bethi
 * Unified Cart / My Bag Verification Suite
 * Tests dress & cake cart operations, option isolation, deduplication,
 * quantity boundaries, delivery calculations, and localStorage persistence.
 */

import assert from 'node:assert/strict';

console.log('--- STARTING UNIFIED CART / MY BAG TESTS ---');

// 1. Simulation of Cart Data Structures & Cart Logic
interface CartItemBase {
  id: string;
  productId: string;
  productCode: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stockQuantity?: number;
  isMadeToOrder?: boolean;
}

interface DressCartItem extends CartItemBase {
  category: 'dress';
  size: string;
  fabric?: string;
  color?: string;
}

interface CakeCartItem extends CartItemBase {
  category: 'cake';
  weight: string;
  flavor: string;
  customMessage?: string;
}

type CartItem = DressCartItem | CakeCartItem;

type CartItemInput =
  | {
      category: 'dress';
      productId: string;
      productCode: string;
      name: string;
      price: number;
      imageUrl: string;
      stockQuantity?: number;
      isMadeToOrder?: boolean;
      size: string;
      fabric?: string;
      color?: string;
      quantity?: number;
    }
  | {
      category: 'cake';
      productId: string;
      productCode: string;
      name: string;
      price: number;
      imageUrl: string;
      stockQuantity?: number;
      isMadeToOrder?: boolean;
      weight: string;
      flavor: string;
      customMessage?: string;
      quantity?: number;
    };

function generateCartItemId(item: CartItemInput): string {
  if (item.category === 'dress') {
    return `${item.productId}_sz-${item.size}`;
  }
  const cleanMsg = (item.customMessage || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return `${item.productId}_wt-${item.weight}_flv-${item.flavor}_msg-${cleanMsg}`;
}

class CartManager {
  private items: CartItem[] = [];
  private storageMock: Record<string, string> = {};
  private lastRemovedItem: { item: CartItem; index: number } | null = null;
  private customerNote: string = '';

  constructor() {
    this.items = [];
    this.storageMock = {};
  }

  // Persistence Simulation
  saveToStorage() {
    this.storageMock['ababils_bag_v1'] = JSON.stringify(this.items);
    this.storageMock['ababils_bag_note_v1'] = this.customerNote;
  }

  loadFromStorage() {
    const raw = this.storageMock['ababils_bag_v1'];
    if (raw) {
      this.items = JSON.parse(raw);
    }
    this.customerNote = this.storageMock['ababils_bag_note_v1'] || '';
  }

  getItems(): CartItem[] {
    return [...this.items];
  }

  getItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  hasDresses(): boolean {
    return this.items.some((i) => i.category === 'dress');
  }

  hasCakes(): boolean {
    return this.items.some((i) => i.category === 'cake');
  }

  getDeliveryCharge(): number {
    if (this.items.length === 0) return 0;
    const dresses = this.hasDresses();
    const cakes = this.hasCakes();
    if (dresses && cakes) {
      // Combined delivery: ৳250 cold courier for cake + free delivery bundling for dress (-৳120 discount)
      return 250;
    }
    if (cakes) return 250;
    return 120; // Dress standard courier
  }

  getTotal(): number {
    return this.getSubtotal() + this.getDeliveryCharge();
  }

  addItem(input: CartItemInput): boolean {
    // Validation: Stock check
    if (input.stockQuantity !== undefined && input.stockQuantity <= 0 && !input.isMadeToOrder) {
      return false; // Out of stock
    }

    const qtyToAdd = input.quantity && input.quantity > 0 ? input.quantity : 1;
    const compositeId = generateCartItemId(input);
    const existingIndex = this.items.findIndex((item) => item.id === compositeId);

    if (existingIndex > -1) {
      // Duplicate product + same options -> increment quantity
      const existing = this.items[existingIndex];
      const maxAllowed = existing.stockQuantity ?? 20;
      const newQty = Math.min(existing.quantity + qtyToAdd, maxAllowed);
      this.items[existingIndex] = { ...existing, quantity: newQty };
    } else {
      // New line item
      const newItem: CartItem = {
        ...input,
        id: compositeId,
        quantity: Math.min(qtyToAdd, input.stockQuantity ?? 20),
      } as CartItem;
      this.items.push(newItem);
    }

    this.saveToStorage();
    return true;
  }

  updateQuantity(id: string, newQty: number): boolean {
    const itemIndex = this.items.findIndex((i) => i.id === id);
    if (itemIndex === -1) return false;

    if (newQty <= 0) {
      this.removeItem(id);
      return true;
    }

    const item = this.items[itemIndex];
    const maxAllowed = item.stockQuantity ?? 20;
    const clampedQty = Math.min(newQty, maxAllowed);

    this.items[itemIndex] = { ...item, quantity: clampedQty };
    this.saveToStorage();
    return true;
  }

  removeItem(id: string): CartItem | null {
    const itemIndex = this.items.findIndex((i) => i.id === id);
    if (itemIndex === -1) return null;

    const removed = this.items[itemIndex];
    this.lastRemovedItem = { item: removed, index: itemIndex };
    this.items = this.items.filter((i) => i.id !== id);
    this.saveToStorage();
    return removed;
  }

  undoRemove(): boolean {
    if (!this.lastRemovedItem) return false;
    const { item, index } = this.lastRemovedItem;
    const safeIndex = Math.min(index, this.items.length);
    this.items.splice(safeIndex, 0, item);
    this.lastRemovedItem = null;
    this.saveToStorage();
    return true;
  }

  clearBag() {
    this.items = [];
    this.lastRemovedItem = null;
    this.customerNote = '';
    this.saveToStorage();
  }

  setCustomerNote(note: string) {
    this.customerNote = note;
    this.saveToStorage();
  }

  getCustomerNote(): string {
    return this.customerNote;
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Add Dress Cart Item & Option Preservation
// ---------------------------------------------------------------------------
console.log('Test 1: Adding a dress retains product, image, size, unit price, quantity');
const cart = new CartManager();
const dressAdded = cart.addItem({
  category: 'dress',
  productId: 'prod-dress-1',
  productCode: 'AA-DRS-001',
  name: 'Aurelia Floral Smocked Frock',
  price: 3200,
  imageUrl: 'https://images.unsplash.com/dress1.jpg',
  size: '12M',
  fabric: '100% Pure Soft Cotton',
  color: 'Blush Ivory',
  stockQuantity: 5,
  quantity: 1,
});

assert.strictEqual(dressAdded, true, 'Dress should be added successfully');
assert.strictEqual(cart.getItemCount(), 1, 'Header bag count should be 1');
const items1 = cart.getItems();
assert.strictEqual(items1.length, 1);
assert.strictEqual(items1[0].name, 'Aurelia Floral Smocked Frock');
assert.strictEqual(items1[0].price, 3200);
assert.strictEqual((items1[0] as DressCartItem).size, '12M');
assert.strictEqual((items1[0] as DressCartItem).fabric, '100% Pure Soft Cotton');
console.log('✓ Test 1 Passed: Dress options preserved correctly.');

// ---------------------------------------------------------------------------
// TEST 2: Add Cake Cart Item & Option Preservation
// ---------------------------------------------------------------------------
console.log('Test 2: Adding a cake retains weight, flavor, custom calligraphy, unit price');
const cakeAdded = cart.addItem({
  category: 'cake',
  productId: 'prod-cake-1',
  productCode: 'AA-CKE-001',
  name: 'Pistachio Rose Heritage Cake',
  price: 1850,
  imageUrl: 'https://images.unsplash.com/cake1.jpg',
  weight: '1.0 lb',
  flavor: 'Madagascar Vanilla Bean & Berries',
  customMessage: 'Happy 1st Birthday Noor!',
  quantity: 1,
  isMadeToOrder: true,
});

assert.strictEqual(cakeAdded, true, 'Cake should be added successfully');
assert.strictEqual(cart.getItemCount(), 2, 'Header bag count should now be 2 items');
const items2 = cart.getItems();
assert.strictEqual(items2.length, 2, 'Bag has 2 line items (1 dress + 1 cake)');
const cakeItem = items2.find((i) => i.category === 'cake') as CakeCartItem;
assert.ok(cakeItem, 'Cake item must exist in bag');
assert.strictEqual(cakeItem.weight, '1.0 lb');
assert.strictEqual(cakeItem.flavor, 'Madagascar Vanilla Bean & Berries');
assert.strictEqual(cakeItem.customMessage, 'Happy 1st Birthday Noor!');
console.log('✓ Test 2 Passed: Cake options and custom inscription preserved.');

// ---------------------------------------------------------------------------
// TEST 3: Duplicate Product + Same Options Increments Quantity
// ---------------------------------------------------------------------------
console.log('Test 3: Duplicate dress with identical size increments quantity instead of adding new line');
cart.addItem({
  category: 'dress',
  productId: 'prod-dress-1',
  productCode: 'AA-DRS-001',
  name: 'Aurelia Floral Smocked Frock',
  price: 3200,
  imageUrl: 'https://images.unsplash.com/dress1.jpg',
  size: '12M',
  quantity: 1,
  stockQuantity: 5,
});

assert.strictEqual(cart.getItems().length, 2, 'Still 2 line items in bag');
const dressItem = cart.getItems().find((i) => i.id === 'prod-dress-1_sz-12M') as DressCartItem;
assert.strictEqual(dressItem.quantity, 2, 'Quantity for size 12M increased to 2');
assert.strictEqual(cart.getItemCount(), 3, 'Total items in bag is now 3 (2 dresses + 1 cake)');
console.log('✓ Test 3 Passed: Identical option deduplication works seamlessly.');

// ---------------------------------------------------------------------------
// TEST 4: Same Product + Different Options Creates Separate Cart Line
// ---------------------------------------------------------------------------
console.log('Test 4: Same dress with different size (2T) creates a distinct line item');
cart.addItem({
  category: 'dress',
  productId: 'prod-dress-1',
  productCode: 'AA-DRS-001',
  name: 'Aurelia Floral Smocked Frock',
  price: 3200,
  imageUrl: 'https://images.unsplash.com/dress1.jpg',
  size: '2T',
  quantity: 1,
  stockQuantity: 5,
});

assert.strictEqual(cart.getItems().length, 3, 'Now 3 line items in bag');
const size2tItem = cart.getItems().find((i) => i.id === 'prod-dress-1_sz-2T');
assert.ok(size2tItem, '2T line item exists separately');
assert.strictEqual(size2tItem.quantity, 1);
console.log('✓ Test 4 Passed: Option variations create separate lines as required.');

// ---------------------------------------------------------------------------
// TEST 5: Out-of-Stock Handling & Quantity Limits
// ---------------------------------------------------------------------------
console.log('Test 5: Out of stock products cannot be added, and quantity cannot exceed stock');
const oosAdded = cart.addItem({
  category: 'dress',
  productId: 'prod-dress-oos',
  productCode: 'AA-DRS-OOS',
  name: 'Sold Out Heritage Dress',
  price: 4500,
  imageUrl: 'https://images.unsplash.com/dress-oos.jpg',
  size: '18M',
  stockQuantity: 0,
  isMadeToOrder: false,
});
assert.strictEqual(oosAdded, false, 'Out-of-stock product should be rejected');

// Stock limit clamping
const itemToMax = cart.getItems().find((i) => i.id === 'prod-dress-1_sz-2T')!;
cart.updateQuantity(itemToMax.id, 999);
const clampedItem = cart.getItems().find((i) => i.id === itemToMax.id)!;
assert.strictEqual(clampedItem.quantity, 5, 'Quantity should be clamped to stock limit (5)');
console.log('✓ Test 5 Passed: Stock boundaries and out-of-stock rejection enforced.');

// ---------------------------------------------------------------------------
// TEST 6: Pricing, Subtotal, Delivery Bundling & Grand Total
// ---------------------------------------------------------------------------
console.log('Test 6: Subtotal and unified delivery calculation (combined dress + fresh cake bundle)');
// Current items in cart:
// 1. prod-dress-1 (12M): 2 x 3200 = 6400
// 2. prod-cake-1: 1 x 1850 = 1850
// 3. prod-dress-1 (2T): 5 x 3200 = 16000
// Subtotal = 6400 + 1850 + 16000 = 24250
const expectedSubtotal = 2 * 3200 + 1850 + 5 * 3200;
assert.strictEqual(cart.getSubtotal(), expectedSubtotal, `Subtotal must equal ${expectedSubtotal}`);

// When both dress and cake are in bag:
assert.strictEqual(cart.hasDresses(), true);
assert.strictEqual(cart.hasCakes(), true);
assert.strictEqual(cart.getDeliveryCharge(), 250, 'Combined delivery should be ৳250 (cake cold delivery bundled)');
assert.strictEqual(cart.getTotal(), expectedSubtotal + 250, 'Total is Subtotal + 250');
console.log('✓ Test 6 Passed: Delivery calculations correctly bundle dress & cake orders.');

// ---------------------------------------------------------------------------
// TEST 7: Remove Item & Undo Functionality
// ---------------------------------------------------------------------------
console.log('Test 7: Remove item and test undo restore');
const removed = cart.removeItem('prod-dress-1_sz-2T');
assert.ok(removed, 'Item was removed');
assert.strictEqual(cart.getItems().length, 2, 'Bag has 2 line items after removal');

const undoSuccess = cart.undoRemove();
assert.strictEqual(undoSuccess, true, 'Undo removal was successful');
assert.strictEqual(cart.getItems().length, 3, 'Bag has 3 line items after undo');
console.log('✓ Test 7 Passed: Remove and undo operations verified.');

// ---------------------------------------------------------------------------
// TEST 8: LocalStorage Persistence & Session Recovery
// ---------------------------------------------------------------------------
console.log('Test 8: Cart persists across simulated page refresh / browser session');
cart.setCustomerNote('Please tie with blush satin ribbons and pack delicately.');
// Simulate closing browser and reopening:
const newSessionCart = new CartManager();
// Copy the simulated storage
(newSessionCart as any).storageMock = { ...(cart as any).storageMock };
newSessionCart.loadFromStorage();

assert.strictEqual(newSessionCart.getItems().length, 3, 'Recovered all 3 items');
assert.strictEqual(newSessionCart.getItemCount(), cart.getItemCount(), 'Recovered exact item count');
assert.strictEqual(newSessionCart.getSubtotal(), cart.getSubtotal(), 'Recovered exact subtotal');
assert.strictEqual(newSessionCart.getCustomerNote(), 'Please tie with blush satin ribbons and pack delicately.');
console.log('✓ Test 8 Passed: Storage persistence retains items, options, and order note.');

// ---------------------------------------------------------------------------
// TEST 9: Empty Bag State
// ---------------------------------------------------------------------------
console.log('Test 9: Clearing cart results in empty bag state');
cart.clearBag();
assert.strictEqual(cart.getItems().length, 0, 'No items in bag');
assert.strictEqual(cart.getItemCount(), 0, 'Item count is 0');
assert.strictEqual(cart.getSubtotal(), 0, 'Subtotal is 0');
assert.strictEqual(cart.getDeliveryCharge(), 0, 'Delivery is 0 for empty bag');
assert.strictEqual(cart.getTotal(), 0, 'Total is 0');
console.log('✓ Test 9 Passed: Empty bag state verified.');

console.log('--- ALL UNIFIED CART TESTS PASSED SUCCESSFULLY (9/9) ---');
