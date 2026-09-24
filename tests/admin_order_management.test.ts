/**
 * Ababil’s Attire by Sanjida Bethi
 * Phase 8: Admin Order Management + bKash Advance Matching Verification Suite
 * Tests admin route protection, order filtering/search, status pipeline transitions,
 * status history audit trail, bKash TrxID matching states, confirm advance, flag mismatch,
 * cash due calculations, and customer/admin data isolation.
 */

import assert from 'node:assert/strict';

console.log('--- STARTING PHASE 8: ADMIN ORDER MANAGEMENT & BKASH MATCHING TESTS ---');

// 1. Admin route protection verification
const ALLOWED_ADMIN_ROLES = ['superadmin', 'admin', 'staff'] as const;

function isAuthorizedForAdminOrders(role?: string | null): boolean {
  if (!role) return false;
  return (ALLOWED_ADMIN_ROLES as readonly string[]).includes(role.toLowerCase());
}

console.log('Test 1: Admin Route Authorization...');
assert.equal(isAuthorizedForAdminOrders('superadmin'), true);
assert.equal(isAuthorizedForAdminOrders('admin'), true);
assert.equal(isAuthorizedForAdminOrders('staff'), true);
assert.equal(isAuthorizedForAdminOrders('customer'), false);
assert.equal(isAuthorizedForAdminOrders('guest'), false);
assert.equal(isAuthorizedForAdminOrders(null), false);
assert.equal(isAuthorizedForAdminOrders(''), false);
console.log('✓ Admin orders route strictly restricted to superadmin, admin, and staff roles.');

// 2. Order filtering and search logic
interface MockOrderItem {
  product_name_snapshot: string;
  cake_weight?: string | null;
  selected_size?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface MockOrder {
  id: string;
  invoice_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_date: string;
  total_amount: number;
  advance_amount: number;
  advance_status: 'pending' | 'verified' | 'rejected';
  cash_due: number;
  items: MockOrderItem[];
  payments: Array<{
    trx_id: string;
    sender_last4: string;
    amount: number;
    status: 'pending_match' | 'matched' | 'mismatched';
  }>;
  history: Array<{
    status: string;
    note: string;
    created_at: string;
  }>;
}

const mockOrders: MockOrder[] = [
  {
    id: 'ord_1',
    invoice_number: 'AB-260924-1043',
    status: 'review_required',
    customer_name: 'Nusrat Jahan',
    customer_phone: '01819223344',
    delivery_address: 'House 18, Road 4, Dhanmondi, Dhaka',
    delivery_date: '2026-10-28',
    total_amount: 4600,
    advance_amount: 500,
    advance_status: 'pending',
    cash_due: 4100,
    items: [
      {
        product_name_snapshot: 'Vintage Lambeth Ruffle Bento Cake',
        cake_weight: '3.0 lb',
        quantity: 1,
        unit_price: 4350,
        subtotal: 4350,
      },
    ],
    payments: [
      {
        trx_id: '8L99AC12',
        sender_last4: '4421',
        amount: 500,
        status: 'pending_match',
      },
    ],
    history: [
      {
        status: 'review_required',
        note: 'Order submitted with bKash advance TrxID 8L99AC12.',
        created_at: '2026-09-24T11:20:00Z',
      },
    ],
  },
  {
    id: 'ord_2',
    invoice_number: 'AB-260923-1042',
    status: 'in_production',
    customer_name: 'Ayesha Rahman',
    customer_phone: '01712345678',
    delivery_address: 'House 14, Road 2, Sector 3, Uttara, Dhaka',
    delivery_date: '2026-11-14',
    total_amount: 7600,
    advance_amount: 500,
    advance_status: 'verified',
    cash_due: 7100,
    items: [
      {
        product_name_snapshot: 'Aurelia Floral Smocked Dress',
        selected_size: '12M',
        quantity: 1,
        unit_price: 3800,
        subtotal: 3800,
      },
      {
        product_name_snapshot: 'Vanilla Berry Celebration Cake',
        cake_weight: '2.0 lb',
        quantity: 1,
        unit_price: 2350,
        subtotal: 2350,
      },
    ],
    payments: [
      {
        trx_id: '9K28FD4A',
        sender_last4: '5678',
        amount: 500,
        status: 'matched',
      },
    ],
    history: [
      {
        status: 'review_required',
        note: 'Order placed online.',
        created_at: '2026-09-24T15:45:00Z',
      },
      {
        status: 'advance_verified',
        note: 'bKash advance ৳500 verified.',
        created_at: '2026-09-24T16:10:00Z',
      },
      {
        status: 'in_production',
        note: 'Tailoring smocked dress and baking sponge.',
        created_at: '2026-09-25T09:30:00Z',
      },
    ],
  },
  {
    id: 'ord_3',
    invoice_number: 'AB-260920-1039',
    status: 'out_for_delivery',
    customer_name: 'Farhana Kabir',
    customer_phone: '01911002233',
    delivery_address: 'House 55, Road 11, Block C, Banani, Dhaka',
    delivery_date: '2026-10-20',
    total_amount: 5750,
    advance_amount: 500,
    advance_status: 'verified',
    cash_due: 5250,
    items: [
      {
        product_name_snapshot: 'French Linen Christening Gown',
        selected_size: '0-3M',
        quantity: 1,
        unit_price: 3950,
        subtotal: 3950,
      },
    ],
    payments: [
      {
        trx_id: '7P43XX89',
        sender_last4: '9988',
        amount: 500,
        status: 'matched',
      },
    ],
    history: [
      {
        status: 'out_for_delivery',
        note: 'Handed to courier Redx #449.',
        created_at: '2026-09-20T13:15:00Z',
      },
    ],
  },
];

function filterOrders(
  orders: MockOrder[],
  filters: {
    status?: string;
    search?: string;
    category?: 'all' | 'dress' | 'cake' | 'bundle';
  }
): MockOrder[] {
  let res = orders;

  if (filters.status && filters.status !== 'all') {
    res = res.filter((o) => o.status === filters.status);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    res = res.filter(
      (o) =>
        o.invoice_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        o.delivery_address.toLowerCase().includes(q)
    );
  }

  if (filters.category && filters.category !== 'all') {
    res = res.filter((o) => {
      const hasDress = o.items.some((i) => !i.cake_weight);
      const hasCake = o.items.some((i) => i.cake_weight);
      if (filters.category === 'dress') return hasDress && !hasCake;
      if (filters.category === 'cake') return hasCake && !hasDress;
      if (filters.category === 'bundle') return hasDress && hasCake;
      return true;
    });
  }

  return res;
}

console.log('Test 2: Order Search and Filtering...');
// Filter by search invoice
const searchInv = filterOrders(mockOrders, { search: '1043' });
assert.equal(searchInv.length, 1);
assert.equal(searchInv[0].invoice_number, 'AB-260924-1043');

// Filter by customer phone
const searchPhone = filterOrders(mockOrders, { search: '01712345678' });
assert.equal(searchPhone.length, 1);
assert.equal(searchPhone[0].customer_name, 'Ayesha Rahman');

// Filter by status 'review_required'
const searchReview = filterOrders(mockOrders, { status: 'review_required' });
assert.equal(searchReview.length, 1);

// Filter by category 'bundle' (dress + cake)
const searchBundle = filterOrders(mockOrders, { category: 'bundle' });
assert.equal(searchBundle.length, 1);
assert.equal(searchBundle[0].invoice_number, 'AB-260923-1042');

// Filter by category 'cake' only
const searchCake = filterOrders(mockOrders, { category: 'cake' });
assert.equal(searchCake.length, 1);
assert.equal(searchCake[0].invoice_number, 'AB-260924-1043');
console.log('✓ Order search by invoice/phone/name and category/status filtering verified.');

// 3. bKash TrxID matching tool states
function matchTrxId(
  trxInput: string,
  orders: MockOrder[]
): {
  state: 'match_found' | 'no_match' | 'already_confirmed' | 'amount_mismatch' | 'invalid_input';
  order?: MockOrder;
} {
  const clean = trxInput.trim().toUpperCase();
  if (!clean) return { state: 'invalid_input' };

  const found = orders.find((o) => o.payments.some((p) => p.trx_id.toUpperCase() === clean));
  if (!found) return { state: 'no_match' };

  const p = found.payments.find((py) => py.trx_id.toUpperCase() === clean)!;
  if (p.status === 'matched' || found.advance_status === 'verified') {
    return { state: 'already_confirmed', order: found };
  }
  if (p.amount !== 500) {
    return { state: 'amount_mismatch', order: found };
  }

  return { state: 'match_found', order: found };
}

console.log('Test 3: bKash TrxID Matching Tool States...');
// Match Found (Pending advance review)
const mFound = matchTrxId('8L99AC12', mockOrders);
assert.equal(mFound.state, 'match_found');
assert.equal(mFound.order?.invoice_number, 'AB-260924-1043');

// Already Confirmed
const mConfirmed = matchTrxId('9K28FD4A', mockOrders);
assert.equal(mConfirmed.state, 'already_confirmed');
assert.equal(mConfirmed.order?.invoice_number, 'AB-260923-1042');

// No match
const mNone = matchTrxId('NONEXISTENT00', mockOrders);
assert.equal(mNone.state, 'no_match');

// Invalid input
const mBlank = matchTrxId('   ', mockOrders);
assert.equal(mBlank.state, 'invalid_input');
console.log('✓ bKash matching states (Match Found, Already Confirmed, No Match, Invalid Input) verified.');

// 4. Confirm Advance Payment & Flag Mismatch operations
function executeMatchAction(
  order: MockOrder,
  confirm: boolean,
  note?: string
): MockOrder {
  const updated = JSON.parse(JSON.stringify(order)) as MockOrder;
  if (confirm) {
    updated.advance_status = 'verified';
    if (updated.status === 'review_required') {
      updated.status = 'advance_verified';
    }
    updated.payments[0].status = 'matched';
    updated.history.push({
      status: updated.status,
      note: note || 'Advance payment verified by admin.',
      created_at: new Date().toISOString(),
    });
  } else {
    updated.advance_status = 'rejected';
    updated.payments[0].status = 'mismatched';
    updated.history.push({
      status: updated.status,
      note: note || 'Advance payment flagged as mismatched.',
      created_at: new Date().toISOString(),
    });
  }
  return updated;
}

console.log('Test 4: Payment Confirmation and Flagging...');
// Confirm advance for order 1
const confirmedOrder1 = executeMatchAction(mockOrders[0], true, 'bKash statement matched.');
assert.equal(confirmedOrder1.advance_status, 'verified');
assert.equal(confirmedOrder1.status, 'advance_verified');
assert.equal(confirmedOrder1.payments[0].status, 'matched');
assert.equal(confirmedOrder1.history.length, 2);
assert.ok(confirmedOrder1.history[1].note.includes('bKash statement matched'));

// Flag mismatch for order 1
const flaggedOrder1 = executeMatchAction(mockOrders[0], false, 'Amount did not arrive.');
assert.equal(flaggedOrder1.advance_status, 'rejected');
assert.equal(flaggedOrder1.payments[0].status, 'mismatched');
assert.ok(flaggedOrder1.history[1].note.includes('Amount did not arrive'));
console.log('✓ Confirm Advance and Flag Mismatch correctly update statuses and record history logs.');

// 5. Order Status Pipeline Transitions
const PIPELINE_ORDER = [
  'review_required',
  'advance_verified',
  'in_production',
  'dispatch_ready',
  'out_for_delivery',
  'delivered',
] as const;

function isValidStatusTransition(from: string, to: string): boolean {
  // Exception statuses can always be set with explanation
  if (['cancelled', 'returned', 'unable_to_reach'].includes(to)) return true;
  const fromIdx = PIPELINE_ORDER.indexOf(from as any);
  const toIdx = PIPELINE_ORDER.indexOf(to as any);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx >= fromIdx; // Forward progress allowed
}

console.log('Test 5: Order Status Transitions...');
assert.equal(isValidStatusTransition('review_required', 'advance_verified'), true);
assert.equal(isValidStatusTransition('advance_verified', 'in_production'), true);
assert.equal(isValidStatusTransition('in_production', 'out_for_delivery'), true);
assert.equal(isValidStatusTransition('out_for_delivery', 'delivered'), true);
assert.equal(isValidStatusTransition('in_production', 'cancelled'), true);
assert.equal(isValidStatusTransition('out_for_delivery', 'unable_to_reach'), true);
assert.equal(isValidStatusTransition('out_for_delivery', 'returned'), true);
console.log('✓ Status transitions and operational exception transitions validated.');

// 6. Cash Due Calculation
console.log('Test 6: Financial Balances & Cash Due...');
for (const o of mockOrders) {
  assert.equal(o.total_amount - o.advance_amount, o.cash_due);
}
console.log('✓ Total - Advance = Cash Due verified across all orders.');

// 7. Customer vs Admin Data Isolation
console.log('Test 7: Customer vs Admin Data Isolation...');
// Public customer tracking sanitizer
function sanitizeForPublicTracking(order: MockOrder) {
  return {
    found: true,
    invoice_number: order.invoice_number,
    status: order.status,
    customer_name_initial: order.customer_name.split(' ')[0],
    delivery_area: 'Dhaka',
    total_amount: order.total_amount,
    advance_amount: order.advance_amount,
    cash_due: order.cash_due,
  };
}

const sanitized = sanitizeForPublicTracking(mockOrders[0]);
assert.equal((sanitized as any).payments, undefined);
assert.equal((sanitized as any).trx_id, undefined);
assert.equal((sanitized as any).customer_phone, undefined);
assert.equal((sanitized as any).history, undefined);
assert.equal(sanitized.customer_name_initial, 'Nusrat');
console.log('✓ Customer public tracking never leaks bKash TrxID, full customer phone, or internal audit logs.');

console.log('\n--- ALL PHASE 8: ADMIN ORDER MANAGEMENT & BKASH MATCHING TESTS PASSED! ---');
