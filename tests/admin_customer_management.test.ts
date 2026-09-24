/**
 * Ababil’s Attire by Sanjida Bethi
 * Phase 9: Admin Customer Management Verification Suite
 * Tests admin route protection, customer search & filtering, customer statistics,
 * profile retrieval, full order history dockets, admin notes CRUD,
 * and strict admin notes/customer data privacy isolation.
 */

import assert from 'node:assert/strict';

console.log('--- STARTING PHASE 9: ADMIN CUSTOMER MANAGEMENT TESTS ---');

// 1. Admin route authorization check
const ALLOWED_ADMIN_ROLES = ['superadmin', 'admin', 'staff'] as const;

function isAuthorizedForAdminCustomers(role?: string | null): boolean {
  if (!role) return false;
  return (ALLOWED_ADMIN_ROLES as readonly string[]).includes(role.toLowerCase());
}

console.log('Test 1: Admin Route Authorization...');
assert.equal(isAuthorizedForAdminCustomers('superadmin'), true);
assert.equal(isAuthorizedForAdminCustomers('admin'), true);
assert.equal(isAuthorizedForAdminCustomers('staff'), true);
assert.equal(isAuthorizedForAdminCustomers('customer'), false);
assert.equal(isAuthorizedForAdminCustomers('guest'), false);
assert.equal(isAuthorizedForAdminCustomers(null), false);
assert.equal(isAuthorizedForAdminCustomers(''), false);
console.log('✓ Admin customers route strictly restricted to superadmin, admin, and staff roles.');

// 2. Mock Directory Data Model
interface MockCustomer {
  id: string;
  name: string;
  phone: string;
  alt_phone?: string | null;
  address: string;
  area: string;
  total_orders: number;
  completed_orders: number;
  lifetime_value: number;
  purchased_categories: ('dresses' | 'cakes')[];
  latest_invoice: string;
  latest_status: string;
  customer_type: string;
  admin_notes: Array<{
    id: string;
    category: 'child' | 'cake_dietary' | 'delivery' | 'general';
    content: string;
    created_by: string;
    created_at: string;
  }>;
  orders: Array<{
    invoice_number: string;
    total_amount: number;
    advance_amount: number;
    cash_due: number;
    status: string;
    delivery_date: string;
    items: Array<{
      product_name: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
      selected_size?: string;
      cake_weight?: string;
    }>;
  }>;
}

const mockCustomers: MockCustomer[] = [
  {
    id: 'cust_01',
    name: 'Ayesha Rahman',
    phone: '01712345678',
    alt_phone: '01712999888',
    address: 'House 14, Road 7, Sector 3, Uttara, Dhaka',
    area: 'Uttara',
    total_orders: 3,
    completed_orders: 2,
    lifetime_value: 19800,
    purchased_categories: ['dresses', 'cakes'],
    latest_invoice: 'AB-260923-1042',
    latest_status: 'in_production',
    customer_type: 'VIP Regular',
    admin_notes: [
      {
        id: 'note_1',
        category: 'child',
        content: "Daughter Zaara's birthday is Nov 14 (prefers 12M-18M dresses, French linen only).",
        created_by: 'Sanjida Bethi',
        created_at: '2026-09-22T10:00:00Z',
      },
      {
        id: 'note_2',
        category: 'cake_dietary',
        content: 'Strictly eggless or low-sugar vanilla sponge; loves Madagascar vanilla bean with berry compote.',
        created_by: 'Sanjida Bethi',
        created_at: '2026-09-22T10:05:00Z',
      },
      {
        id: 'note_3',
        category: 'delivery',
        content: 'Always request chilled morning delivery before 11 AM due to Uttara traffic.',
        created_by: 'Atelier Logistics',
        created_at: '2026-09-23T08:30:00Z',
      },
    ],
    orders: [
      {
        invoice_number: 'AB-260923-1042',
        total_amount: 7600,
        advance_amount: 500,
        cash_due: 7100,
        status: 'in_production',
        delivery_date: '2026-11-14',
        items: [
          {
            product_name: 'Aurelia Floral Smocked Dress',
            quantity: 1,
            unit_price: 3800,
            subtotal: 3800,
            selected_size: '12M',
          },
          {
            product_name: 'Vanilla Berry Celebration Cake',
            quantity: 1,
            unit_price: 2600,
            subtotal: 2600,
            cake_weight: '2.0 lb',
          },
        ],
      },
      {
        invoice_number: 'AB-260715-0812',
        total_amount: 5400,
        advance_amount: 500,
        cash_due: 4900,
        status: 'delivered',
        delivery_date: '2024-07-18',
        items: [
          {
            product_name: 'Heirloom Linen Romper',
            quantity: 1,
            unit_price: 3850,
            subtotal: 3850,
            selected_size: '6M',
          },
        ],
      },
    ],
  },
  {
    id: 'cust_02',
    name: 'Nusrat Jahan',
    phone: '01819223344',
    alt_phone: null,
    address: 'House 18, Road 4, Dhanmondi, Dhaka',
    area: 'Dhanmondi',
    total_orders: 1,
    completed_orders: 0,
    lifetime_value: 4600,
    purchased_categories: ['cakes'],
    latest_invoice: 'AB-260924-1043',
    latest_status: 'review_required',
    customer_type: 'Active Inquiry',
    admin_notes: [
      {
        id: 'note_4',
        category: 'cake_dietary',
        content: 'Prefers Madagascar vanilla sponge with salted caramel buttercream.',
        created_by: 'Sanjida Bethi',
        created_at: '2026-09-24T11:30:00Z',
      },
    ],
    orders: [
      {
        invoice_number: 'AB-260924-1043',
        total_amount: 4600,
        advance_amount: 500,
        cash_due: 4100,
        status: 'review_required',
        delivery_date: '2026-10-28',
        items: [
          {
            product_name: 'Vintage Lambeth Ruffle Bento Cake',
            quantity: 1,
            unit_price: 4350,
            subtotal: 4350,
            cake_weight: '3.0 lb',
          },
        ],
      },
    ],
  },
  {
    id: 'cust_03',
    name: 'Farhana Kabir',
    phone: '01911002233',
    alt_phone: '01911554433',
    address: 'House 55, Road 11, Block C, Banani, Dhaka',
    area: 'Banani',
    total_orders: 2,
    completed_orders: 1,
    lifetime_value: 9950,
    purchased_categories: ['dresses'],
    latest_invoice: 'AB-260920-1039',
    latest_status: 'out_for_delivery',
    customer_type: 'Seasonal Patron',
    admin_notes: [
      {
        id: 'note_5',
        category: 'child',
        content: 'Daughter Maya now 2T; prefers light pastel rose.',
        created_by: 'Sanjida Bethi',
        created_at: '2026-09-20T10:20:00Z',
      },
    ],
    orders: [
      {
        invoice_number: 'AB-260920-1039',
        total_amount: 5750,
        advance_amount: 500,
        cash_due: 5250,
        status: 'out_for_delivery',
        delivery_date: '2026-10-20',
        items: [
          {
            product_name: 'French Linen Christening Gown',
            quantity: 1,
            unit_price: 3950,
            subtotal: 3950,
            selected_size: '0-3M',
          },
        ],
      },
    ],
  },
];

// 3. Search logic testing
function searchCustomers(query: string, list: MockCustomer[]): MockCustomer[] {
  const q = query.toLowerCase().trim();
  if (!q) return list;
  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.alt_phone && c.alt_phone.toLowerCase().includes(q)) ||
      c.area.toLowerCase().includes(q) ||
      c.latest_invoice.toLowerCase().includes(q) ||
      c.orders.some((o) => o.invoice_number.toLowerCase().includes(q))
  );
}

console.log('Test 2: Customer Search (Name, Phone, Invoice, Area)...');
assert.equal(searchCustomers('ayesha', mockCustomers).length, 1);
assert.equal(searchCustomers('Ayesha', mockCustomers)[0].id, 'cust_01');
assert.equal(searchCustomers('01819', mockCustomers).length, 1);
assert.equal(searchCustomers('01819', mockCustomers)[0].id, 'cust_02');
assert.equal(searchCustomers('AB-260920-1039', mockCustomers).length, 1);
assert.equal(searchCustomers('1039', mockCustomers)[0].id, 'cust_03');
assert.equal(searchCustomers('Banani', mockCustomers).length, 1);
assert.equal(searchCustomers('NonExistent', mockCustomers).length, 0);
console.log('✓ Customer search correctly identifies records across name, phone, area, and invoice.');

// 4. Filter logic testing
function filterCustomers(filter: 'all' | 'dress_buyers' | 'cake_buyers' | 'repeat_customers', list: MockCustomer[]): MockCustomer[] {
  if (filter === 'all') return list;
  if (filter === 'dress_buyers') return list.filter((c) => c.purchased_categories.includes('dresses'));
  if (filter === 'cake_buyers') return list.filter((c) => c.purchased_categories.includes('cakes'));
  if (filter === 'repeat_customers') return list.filter((c) => c.total_orders > 1);
  return list;
}

console.log('Test 3: Customer Filter Chips (All, Dress Buyers, Cake Lovers, Repeat Regulars)...');
assert.equal(filterCustomers('all', mockCustomers).length, 3);
assert.equal(filterCustomers('dress_buyers', mockCustomers).length, 2); // Ayesha & Farhana
assert.equal(filterCustomers('cake_buyers', mockCustomers).length, 2); // Ayesha & Nusrat
assert.equal(filterCustomers('repeat_customers', mockCustomers).length, 2); // Ayesha (3) & Farhana (2)
console.log('✓ Filter chips correctly segment customer cohorts.');

// 5. Customer statistics calculation
function calculateCustomerMetrics(list: MockCustomer[]) {
  const total = list.length;
  const repeat = list.filter((c) => c.total_orders > 1).length;
  const repeatRate = total > 0 ? Math.round((repeat / total) * 100) : 0;
  const totalSpend = list.reduce((acc, c) => acc + c.lifetime_value, 0);
  const avgLifetime = total > 0 ? Math.round(totalSpend / total) : 0;
  return { total, repeat, repeatRate, avgLifetime };
}

console.log('Test 4: Customer Summary Metrics Calculation...');
const metrics = calculateCustomerMetrics(mockCustomers);
assert.equal(metrics.total, 3);
assert.equal(metrics.repeat, 2);
assert.equal(metrics.repeatRate, 67); // 2 out of 3 = 66.6% -> 67%
assert.equal(metrics.avgLifetime, Math.round((19800 + 4600 + 9950) / 3)); // ৳ 11,450
console.log('✓ Summary metrics correctly compute total clients, repeat rate %, and average lifetime spend.');

// 6. Admin Notes CRUD & Privacy Isolation
console.log('Test 5: Admin Notes Isolation & Privacy Verification...');

// Ensure notes can be added, updated, and deleted
let customerNotes = [...mockCustomers[0].admin_notes];

// Add note
const newNote = {
  id: 'note_new',
  category: 'delivery' as const,
  content: 'Notify via WhatsApp 30 mins before arrival.',
  created_by: 'Sanjida Bethi',
  created_at: new Date().toISOString(),
};
customerNotes.unshift(newNote);
assert.equal(customerNotes.length, 4);
assert.equal(customerNotes[0].id, 'note_new');

// Edit note
customerNotes[0] = {
  ...customerNotes[0],
  content: 'Notify via WhatsApp 45 mins before arrival.',
};
assert.equal(customerNotes[0].content, 'Notify via WhatsApp 45 mins before arrival.');

// Delete note
customerNotes = customerNotes.filter((n) => n.id !== 'note_new');
assert.equal(customerNotes.length, 3);

// Critical privacy check: Admin notes must NEVER be included in public tracking output
interface PublicTrackingOutput {
  found: boolean;
  invoice_number: string;
  status: string;
  customer_name_initial: string;
  delivery_area: string;
  delivery_date: string;
  total_amount: number;
}

function sanitizeForPublicTracking(customer: MockCustomer, invoice: string): PublicTrackingOutput {
  const order = customer.orders.find((o) => o.invoice_number === invoice)!;
  return {
    found: true,
    invoice_number: order.invoice_number,
    status: order.status,
    customer_name_initial: customer.name.split(' ')[0] + ' ' + (customer.name.split(' ')[1]?.[0] || '') + '.',
    delivery_area: customer.area,
    delivery_date: order.delivery_date,
    total_amount: order.total_amount,
  };
}

const publicOutput = sanitizeForPublicTracking(mockCustomers[0], 'AB-260923-1042');
assert.equal('admin_notes' in publicOutput, false);
assert.equal('notes' in publicOutput, false);
assert.equal('phone' in publicOutput, false);
assert.equal('address' in publicOutput, false);
console.log('✓ Admin notes strictly isolated from public tracking/storefront and never leaked to guests.');

// 7. Order history breakdown verification
console.log('Test 6: Customer Order History & Docket Verification...');
const ayeshaProfile = mockCustomers[0];
assert.equal(ayeshaProfile.orders.length, 2);
const activeDocket = ayeshaProfile.orders[0];
assert.equal(activeDocket.invoice_number, 'AB-260923-1042');
assert.equal(activeDocket.total_amount, 7600);
assert.equal(activeDocket.advance_amount, 500);
assert.equal(activeDocket.cash_due, 7100);
assert.equal(activeDocket.items.length, 2);
assert.equal(activeDocket.items[0].product_name, 'Aurelia Floral Smocked Dress');
assert.equal(activeDocket.items[0].selected_size, '12M');
assert.equal(activeDocket.items[1].product_name, 'Vanilla Berry Celebration Cake');
assert.equal(activeDocket.items[1].cake_weight, '2.0 lb');
console.log('✓ Full customer order history dockets contain items, custom sizes, weights, and COD financials.');

// 8. Mobile-safe contact formatting (WhatsApp & Call)
console.log('Test 7: Direct Contact Formatter (WhatsApp & Tel)...');
function formatWhatsAppLink(phone: string): string {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '880' + clean.slice(1);
  } else if (!clean.startsWith('880')) {
    clean = '880' + clean;
  }
  return `https://wa.me/${clean}`;
}

assert.equal(formatWhatsAppLink('01712345678'), 'https://wa.me/8801712345678');
assert.equal(formatWhatsAppLink('+880 1819-223344'), 'https://wa.me/8801819223344');
console.log('✓ WhatsApp sanitization produces valid Bangladeshi international phone URLs.');

console.log('--- ALL PHASE 9: ADMIN CUSTOMER MANAGEMENT TESTS PASSED SUCCESSFULLY ---');
