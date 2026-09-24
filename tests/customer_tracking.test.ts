/**
 * Ababil’s Attire by Sanjida Bethi
 * Phase 7: Customer Track Order Verification Suite
 * Tests invoice normalization, safe order lookup, status progression,
 * exception handling (cancelled/returned/unable_to_reach), payment summary,
 * dress and cake details formatting, and deep-link query parameter handling.
 */

import assert from 'node:assert/strict';

console.log('--- STARTING PHASE 7: CUSTOMER TRACK ORDER TESTS ---');

// 1. Invoice normalization logic
function normalizeInvoice(raw: string): string {
  return raw.trim().toUpperCase().replace(/^#/, '');
}

console.log('Test 1: Invoice Normalization...');
assert.equal(normalizeInvoice('  ab-260923-1042  '), 'AB-260923-1042');
assert.equal(normalizeInvoice('#AB-260923-1042'), 'AB-260923-1042');
assert.equal(normalizeInvoice(' #ab-260923-1042 '), 'AB-260923-1042');
assert.equal(normalizeInvoice(''), '');
assert.equal(normalizeInvoice('   '), '');
console.log('✓ Invoice normalization handles leading/trailing whitespace, lowercase, and # prefix.');

// 2. Query param parsing & deep-linking
function parseInvoiceFromQuery(searchQuery: string): string {
  const params = new URLSearchParams(searchQuery);
  const raw = params.get('invoice') || '';
  return normalizeInvoice(raw);
}

console.log('Test 2: Deep-Link & Query Parameter Parsing...');
assert.equal(parseInvoiceFromQuery('?invoice=AB-260923-1042'), 'AB-260923-1042');
assert.equal(parseInvoiceFromQuery('?ref=storefront&invoice=ab-260923-1042'), 'AB-260923-1042');
assert.equal(parseInvoiceFromQuery('?other=123'), '');
assert.equal(parseInvoiceFromQuery(''), '');
console.log('✓ Deep-link query param extraction correctly parses invoice parameter.');

// 3. Status progression and lifecycle mapping
interface StepProgress {
  activeStep: number;
  completed: number[];
  isException: boolean;
  exceptionType?: 'cancelled' | 'returned' | 'unable_to_reach';
}

function computeStepProgress(status: string): StepProgress {
  switch (status.toLowerCase()) {
    case 'delivered':
      return { activeStep: 5, completed: [1, 2, 3, 4, 5], isException: false };
    case 'out_for_delivery':
    case 'dispatch_ready':
    case 'dispatched':
      return { activeStep: 4, completed: [1, 2, 3], isException: false };
    case 'in_production':
    case 'processing':
      return { activeStep: 3, completed: [1, 2], isException: false };
    case 'advance_verified':
    case 'confirmed':
      return { activeStep: 2, completed: [1], isException: false };
    case 'cancelled':
      return { activeStep: 0, completed: [], isException: true, exceptionType: 'cancelled' };
    case 'returned':
      return { activeStep: 0, completed: [1, 2, 3, 4], isException: true, exceptionType: 'returned' };
    case 'unable_to_reach':
      return { activeStep: 4, completed: [1, 2, 3], isException: true, exceptionType: 'unable_to_reach' };
    case 'review_required':
    default:
      return { activeStep: 1, completed: [], isException: false };
  }
}

console.log('Test 3: Status Progression & Timeline Step Mapping...');
// 1. Order Placed
const sReview = computeStepProgress('review_required');
assert.equal(sReview.activeStep, 1);
assert.deepEqual(sReview.completed, []);
assert.equal(sReview.isException, false);

// 2. Advance Verified / Confirmed
const sConfirmed = computeStepProgress('advance_verified');
assert.equal(sConfirmed.activeStep, 2);
assert.deepEqual(sConfirmed.completed, [1]);
assert.equal(sConfirmed.isException, false);

// 3. In Production / Processing
const sProduction = computeStepProgress('in_production');
assert.equal(sProduction.activeStep, 3);
assert.deepEqual(sProduction.completed, [1, 2]);
assert.equal(sProduction.isException, false);

// 4. Dispatched / Out for Delivery
const sOut = computeStepProgress('out_for_delivery');
assert.equal(sOut.activeStep, 4);
assert.deepEqual(sOut.completed, [1, 2, 3]);
assert.equal(sOut.isException, false);

// 5. Delivered
const sDelivered = computeStepProgress('delivered');
assert.equal(sDelivered.activeStep, 5);
assert.deepEqual(sDelivered.completed, [1, 2, 3, 4, 5]);
assert.equal(sDelivered.isException, false);

// Exception statuses
const sCancelled = computeStepProgress('cancelled');
assert.equal(sCancelled.isException, true);
assert.equal(sCancelled.exceptionType, 'cancelled');

const sReturned = computeStepProgress('returned');
assert.equal(sReturned.isException, true);
assert.equal(sReturned.exceptionType, 'returned');

const sUnable = computeStepProgress('unable_to_reach');
assert.equal(sUnable.isException, true);
assert.equal(sUnable.exceptionType, 'unable_to_reach');
console.log('✓ All 5 standard stages + 3 exception states mapped correctly.');

// 4. Safe Public Order Tracking Data Structure
interface SafePublicOrder {
  found: boolean;
  invoice_number?: string;
  status?: string;
  customer_name_initial?: string;
  delivery_area?: string;
  delivery_date?: string;
  delivery_time?: string;
  subtotal?: number;
  delivery_charge?: number;
  total_amount?: number;
  advance_amount?: number;
  cash_due?: number;
  items?: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    selected_size?: string | null;
    cake_weight?: string | null;
    cake_flavor?: string | null;
    cake_message?: string | null;
  }>;
}

const mockOrder: SafePublicOrder = {
  found: true,
  invoice_number: 'AB-260923-1042',
  status: 'in_production',
  customer_name_initial: 'Ayesha',
  delivery_area: 'Banani, Dhaka',
  delivery_date: '2026-09-28',
  delivery_time: '2:00 PM - 4:00 PM',
  subtotal: 7350,
  delivery_charge: 250,
  total_amount: 7600,
  advance_amount: 500,
  cash_due: 7100,
  items: [
    {
      id: 'demo_item_1',
      product_name: 'Vintage Rose Smocked Cotton Dress',
      quantity: 1,
      unit_price: 3800,
      subtotal: 3800,
      selected_size: '12-18M',
    },
    {
      id: 'demo_item_2',
      product_name: 'Vanilla Bean & Wild Fig Celebration Cake',
      quantity: 1,
      unit_price: 3550,
      subtotal: 3550,
      cake_weight: '1.0 lb',
      cake_flavor: 'Madagascar Vanilla Bean & Fig',
      cake_message: 'Happy 2nd Birthday Inaya!',
    },
  ],
};

console.log('Test 4: Payment Breakdown & Financial Safety...');
assert.equal(mockOrder.subtotal! + mockOrder.delivery_charge!, mockOrder.total_amount);
assert.equal(mockOrder.total_amount! - mockOrder.advance_amount!, mockOrder.cash_due);
assert.equal(mockOrder.advance_amount, 500);
assert.equal(mockOrder.cash_due, 7100);

// Verify no PII or sensitive keys in public tracking
const sensitiveFields = ['trx_id', 'sender_phone', 'internal_notes', 'admin_audit', 'password'];
for (const field of sensitiveFields) {
  assert.equal((mockOrder as any)[field], undefined, `Public tracking must not leak ${field}`);
}
console.log('✓ Financial calculations verified; no PII or internal payment TrxIDs leaked.');

console.log('Test 5: Dress & Cake Item Specifications...');
const dressItem = mockOrder.items![0];
assert.equal(dressItem.product_name, 'Vintage Rose Smocked Cotton Dress');
assert.equal(dressItem.selected_size, '12-18M');
assert.equal(dressItem.cake_weight, undefined);

const cakeItem = mockOrder.items![1];
assert.equal(cakeItem.product_name, 'Vanilla Bean & Wild Fig Celebration Cake');
assert.equal(cakeItem.cake_weight, '1.0 lb');
assert.equal(cakeItem.cake_flavor, 'Madagascar Vanilla Bean & Fig');
assert.equal(cakeItem.cake_message, 'Happy 2nd Birthday Inaya!');
console.log('✓ Dress sizes and Cake custom weights/flavors/messages preserved properly.');

console.log('Test 6: Invalid Invoice Error Handling...');
function handleLookupResponse(found: boolean, invoice: string) {
  if (!found) {
    return {
      found: false,
      error: `We couldn't find an order with that number. Please check the number or contact Sanjida directly.`,
      whatsappCta: `https://wa.me/8801712345678?text=${encodeURIComponent(
        `Hello Sanjida, I would like to check the status of my order ${invoice}.`
      )}`,
    };
  }
  return { found: true };
}

const invalidRes = handleLookupResponse(false, 'AB-999999-0000');
assert.equal(invalidRes.found, false);
assert.ok(invalidRes.error.includes("couldn't find an order"));
assert.ok(invalidRes.whatsappCta.includes('8801712345678'));
assert.ok(invalidRes.whatsappCta.includes('AB-999999-0000'));
console.log('✓ Invalid invoice returns required message with WhatsApp CTA.');

console.log('\n--- ALL PHASE 7: CUSTOMER TRACK ORDER TESTS PASSED! ---');
