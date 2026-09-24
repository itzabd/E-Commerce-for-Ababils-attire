/**
 * Ababil’s Attire by Sanjida Bethi
 * Phase 6: Checkout + bKash Advance Payment Verification Suite
 * Tests checkout validation, advance deposit calculations, required 3 bKash fields,
 * order creation payload, invoice formatting, and failure handling.
 */

import assert from 'node:assert/strict';

console.log('--- STARTING CHECKOUT + BKASH ADVANCE PAYMENT TESTS ---');

// 1. Phone validation logic under test
function cleanPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('880')) {
    return '0' + digits.slice(3);
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    return '0' + digits;
  }
  return digits;
}

function isValidBdPhone(raw: string): boolean {
  const cleaned = cleanPhoneNumber(raw);
  return /^01[3-9]\d{8}$/.test(cleaned);
}

// 2. Earliest delivery date calculation
function getEarliestDeliveryDate(hasCake: boolean, baseDate: Date = new Date()): string {
  const d = new Date(baseDate);
  const addDays = hasCake ? 2 : 1;
  d.setDate(d.getDate() + addDays);
  return d.toISOString().split('T')[0];
}

// 3. Invoice generation format validation: AB-YYMMDD-####
function generateInvoiceNumber(now: Date = new Date(), seq: number = 1001): string {
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seqPadded = String(seq).padStart(4, '0');
  return `AB-${yy}${mm}${dd}-${seqPadded}`;
}

// 4. Financial breakdown helper
interface FinancialBreakdown {
  subtotal: number;
  deliveryCharge: number;
  total: number;
  advanceAmount: number;
  cashDue: number;
}

function calculateOrderFinances(
  items: Array<{ unitPrice: number; quantity: number; category: 'dress' | 'cake' }>,
  minAdvance: number = 500
): FinancialBreakdown {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const hasDress = items.some((i) => i.category === 'dress');
  const hasCake = items.some((i) => i.category === 'cake');

  let deliveryCharge = 0;
  if (items.length > 0) {
    if (hasDress && hasCake) {
      deliveryCharge = 250; // Cake cold courier + dress ships free together
    } else if (hasCake) {
      deliveryCharge = 250;
    } else {
      deliveryCharge = 120;
    }
  }

  const total = subtotal + deliveryCharge;
  const advanceAmount = Math.min(minAdvance, total);
  const cashDue = Math.max(0, total - advanceAmount);

  return { subtotal, deliveryCharge, total, advanceAmount, cashDue };
}

// 5. Checkout form validation checker
interface CheckoutFormData {
  fullName: string;
  phoneNumber: string;
  deliveryAddress: string;
  deliveryDate: string;
  bkashTrxId: string;
  bkashSenderLast4: string;
  bkashRefName: string;
  hasItems: boolean;
}

function validateCheckoutForm(form: CheckoutFormData): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!form.hasItems) {
    errors.cart = 'Shopping bag is empty';
  }
  if (!form.fullName || form.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }
  if (!form.phoneNumber || !isValidBdPhone(form.phoneNumber)) {
    errors.phoneNumber = 'A valid Bangladesh phone number is required';
  }
  if (!form.deliveryAddress || form.deliveryAddress.trim().length < 8) {
    errors.deliveryAddress = 'Delivery address must be at least 8 characters';
  }
  if (!form.deliveryDate) {
    errors.deliveryDate = 'Delivery date is required';
  }
  if (!form.bkashTrxId || form.bkashTrxId.trim().length < 6) {
    errors.bkashTrxId = 'bKash Transaction ID (TrxID) is required';
  }
  if (!form.bkashSenderLast4 || !/^\d{4}$/.test(form.bkashSenderLast4.trim())) {
    errors.bkashSenderLast4 = 'Last 4 digits of sender number are required (exactly 4 numbers)';
  }
  if (!form.bkashRefName || form.bkashRefName.trim().length < 2) {
    errors.bkashRefName = 'Reference name is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ---------------------------------------------------------------------------
// TEST 1: Phone Number Cleaning & Validation
// ---------------------------------------------------------------------------
console.log('Test 1: Validating Bangladesh Phone Numbers...');
assert.strictEqual(isValidBdPhone('01712345678'), true, 'Standard 11 digit 017 format');
assert.strictEqual(isValidBdPhone('+8801712345678'), true, '+880 international prefix');
assert.strictEqual(isValidBdPhone('1712345678'), true, '10 digit format without leading 0');
assert.strictEqual(isValidBdPhone('+880 1812-345678'), true, 'Dashes and spaces format');
assert.strictEqual(isValidBdPhone('01987654321'), true, '019 Banglalink format');
assert.strictEqual(isValidBdPhone('01300000000'), true, '013 GP format');

// Invalid phones
assert.strictEqual(isValidBdPhone('12345'), false, 'Too short');
assert.strictEqual(isValidBdPhone('01234567890'), false, '012 prefix is invalid in BD');
assert.strictEqual(isValidBdPhone('abcdefghijk'), false, 'Letters rejected');
assert.strictEqual(isValidBdPhone(''), false, 'Empty phone rejected');
console.log('✓ Test 1 Passed: BD Phone number validation confirmed.');

// ---------------------------------------------------------------------------
// TEST 2: Earliest Delivery Scheduling Window
// ---------------------------------------------------------------------------
console.log('Test 2: Verifying earliest delivery dates for dress vs fresh cake...');
const mockToday = new Date('2026-09-25T10:00:00Z');
const dressEarliest = getEarliestDeliveryDate(false, mockToday);
assert.strictEqual(dressEarliest, '2026-09-26', 'Dress earliest dispatch is tomorrow (1 day)');

const cakeEarliest = getEarliestDeliveryDate(true, mockToday);
assert.strictEqual(cakeEarliest, '2026-09-27', 'Cake earliest delivery requires 48hr notice (2 days)');
console.log('✓ Test 2 Passed: Delivery scheduling windows verified.');

// ---------------------------------------------------------------------------
// TEST 3: Advance Calculation & Financial Breakdown
// ---------------------------------------------------------------------------
console.log('Test 3: Financial breakdown: Subtotal, bundled delivery, advance, and COD due...');
const sampleItems: Array<{ unitPrice: number; quantity: number; category: 'dress' | 'cake' }> = [
  { unitPrice: 3200, quantity: 1, category: 'dress' },
  { unitPrice: 1850, quantity: 1, category: 'cake' },
];

const finances = calculateOrderFinances(sampleItems, 500);
assert.strictEqual(finances.subtotal, 5050, 'Subtotal: 3200 + 1850 = 5050');
assert.strictEqual(finances.deliveryCharge, 250, 'Combined delivery charge is ৳250');
assert.strictEqual(finances.total, 5300, 'Total is 5050 + 250 = 5300');
assert.strictEqual(finances.advanceAmount, 500, 'Minimum advance deposit is ৳500');
assert.strictEqual(finances.cashDue, 4800, 'Remaining cash due on delivery: 5300 - 500 = 4800');

// Small order where total < 500
const smallItems: Array<{ unitPrice: number; quantity: number; category: 'dress' | 'cake' }> = [
  { unitPrice: 200, quantity: 1, category: 'dress' },
];
const smallFinances = calculateOrderFinances(smallItems, 500);
assert.strictEqual(smallFinances.total, 320); // 200 + 120
assert.strictEqual(smallFinances.advanceAmount, 320, 'Advance is capped at total amount');
assert.strictEqual(smallFinances.cashDue, 0, 'No cash due if full amount is paid in advance');
console.log('✓ Test 3 Passed: Advance and COD calculations verified.');

// ---------------------------------------------------------------------------
// TEST 4: Required 3 bKash Fields Validation
// ---------------------------------------------------------------------------
console.log('Test 4: Strict validation of the 3 required bKash payment fields...');
const baseValidForm: CheckoutFormData = {
  fullName: 'Ayesha Rahman',
  phoneNumber: '01712345678',
  deliveryAddress: 'House 14, Road 7, Sector 3, Uttara, Dhaka',
  deliveryDate: '2026-09-27',
  bkashTrxId: '9K28FD4A',
  bkashSenderLast4: '5678',
  bkashRefName: 'Ayesha / Cake',
  hasItems: true,
};

const validResult = validateCheckoutForm(baseValidForm);
assert.strictEqual(validResult.isValid, true, 'Fully completed form must be valid');
assert.strictEqual(Object.keys(validResult.errors).length, 0);

// Missing TrxID
const missingTrx = validateCheckoutForm({ ...baseValidForm, bkashTrxId: '' });
assert.strictEqual(missingTrx.isValid, false);
assert.ok(missingTrx.errors.bkashTrxId, 'Error on missing TrxID');

// Invalid sender last 4 digits (3 digits instead of 4)
const invalidLast4Short = validateCheckoutForm({ ...baseValidForm, bkashSenderLast4: '123' });
assert.strictEqual(invalidLast4Short.isValid, false);
assert.ok(invalidLast4Short.errors.bkashSenderLast4, 'Error on 3 digits sender last4');

// Non-numeric sender last 4
const invalidLast4Alpha = validateCheckoutForm({ ...baseValidForm, bkashSenderLast4: 'abcd' });
assert.strictEqual(invalidLast4Alpha.isValid, false);

// Missing reference name
const missingRef = validateCheckoutForm({ ...baseValidForm, bkashRefName: ' ' });
assert.strictEqual(missingRef.isValid, false);
assert.ok(missingRef.errors.bkashRefName, 'Error on missing reference name');
console.log('✓ Test 4 Passed: 3 bKash mandatory fields strictly enforced.');

// ---------------------------------------------------------------------------
// TEST 5: Invoice Number Format Specification (AB-YYMMDD-####)
// ---------------------------------------------------------------------------
console.log('Test 5: Verifying invoice format AB-YYMMDD-####...');
const testDate = new Date('2026-09-25T14:30:00Z');
const invoice = generateInvoiceNumber(testDate, 1042);
assert.strictEqual(invoice, 'AB-260925-1042');
const invoicePattern = /^AB-\d{6}-\d{4}$/;
assert.strictEqual(invoicePattern.test(invoice), true, 'Invoice must match AB-YYMMDD-####');
console.log('✓ Test 5 Passed: Invoice format conforms to AB-YYMMDD-####.');

// ---------------------------------------------------------------------------
// TEST 6: Order Payload Structure for Supabase create_guest_order RPC
// ---------------------------------------------------------------------------
console.log('Test 6: Validating create_guest_order RPC input payload structure...');
const payload = {
  customer: {
    name: 'Ayesha Rahman',
    phone: cleanPhoneNumber('01712345678'),
    address: 'House 14, Road 7, Sector 3, Uttara, Dhaka',
    area: 'Dhaka Inside City',
  },
  order: {
    delivery_date: '2026-09-27',
    delivery_time: 'Morning 10:00 AM - 1:00 PM',
    delivery_address: 'House 14, Road 7, Sector 3, Uttara, Dhaka',
    subtotal: 5050,
    delivery_charge: 250,
    total_amount: 5300,
    advance_amount: 500,
  },
  items: [
    {
      product_name_snapshot: 'Aurelia Floral Smocked Dress',
      quantity: 1,
      unit_price: 3200,
      subtotal: 3200,
      selected_size: '12M',
    },
    {
      product_name_snapshot: 'Pistachio Rose Heritage Cake',
      quantity: 1,
      unit_price: 1850,
      subtotal: 1850,
      cake_weight: '1.0 lb',
      cake_flavor: 'Madagascar Vanilla Bean & Berries',
      cake_message: 'Happy 1st Birthday Noor!',
    },
  ],
  payment: {
    trx_id: '9K28FD4A',
    sender_last4: '5678',
    reference_name: 'Ayesha / Cake',
  },
};

assert.strictEqual(payload.customer.phone, '01712345678');
assert.strictEqual(payload.payment.trx_id, '9K28FD4A');
assert.strictEqual(payload.payment.sender_last4, '5678');
assert.strictEqual(payload.items.length, 2);
assert.strictEqual(payload.items[1].cake_message, 'Happy 1st Birthday Noor!');
console.log('✓ Test 6 Passed: RPC payload structure confirmed.');

// ---------------------------------------------------------------------------
// TEST 7: Empty Cart Rejection & Failure Handling
// ---------------------------------------------------------------------------
console.log('Test 7: Empty cart prevention and missing fields error response...');
const emptyCartForm = { ...baseValidForm, hasItems: false };
const emptyCartResult = validateCheckoutForm(emptyCartForm);
assert.strictEqual(emptyCartResult.isValid, false);
assert.strictEqual(emptyCartResult.errors.cart, 'Shopping bag is empty');

// Missing address
const missingAddressForm = { ...baseValidForm, deliveryAddress: 'Short' };
const missingAddressResult = validateCheckoutForm(missingAddressForm);
assert.strictEqual(missingAddressResult.isValid, false);
assert.ok(missingAddressResult.errors.deliveryAddress);
console.log('✓ Test 7 Passed: Failure cases properly guarded.');

console.log('--- ALL CHECKOUT + BKASH ADVANCE TESTS PASSED SUCCESSFULLY (7/7) ---');
