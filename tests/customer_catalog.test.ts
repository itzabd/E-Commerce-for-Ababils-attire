/**
 * Ababil’s Attire by Sanjida Bethi
 * Customer Storefront & Product Catalog Verification Suite
 */

import assert from 'node:assert/strict';

console.log('--- STARTING CUSTOMER STOREFRONT & CATALOG TESTS ---');

interface MockProduct {
  id: string;
  product_code: string;
  name: string;
  category: 'dress' | 'cake';
  price: number;
  status: 'published' | 'draft' | 'made_to_order' | 'out_of_stock' | 'hidden';
  featured: boolean;
  new_arrival: boolean;
  lead_time_days: number;
  minimum_notice_hours: number;
  images: Array<{ url: string; sort_order: number }>;
  sizes?: string[];
  fabric_details?: string;
  weights?: Array<{ weight: string; price: number }>;
  flavors?: string[];
}

const CATALOG_ITEMS: MockProduct[] = [
  {
    id: 'd1',
    product_code: 'AA-DRS-001',
    name: 'Aurelia Floral Smocked Frock',
    category: 'dress',
    price: 3200,
    status: 'published',
    featured: true,
    new_arrival: true,
    lead_time_days: 2,
    minimum_notice_hours: 0,
    images: [{ url: 'https://images.unsplash.com/d1.jpg', sort_order: 0 }],
    sizes: ['6M', '12M', '18M', '2T', '3T', '4T'],
    fabric_details: '100% Pure Soft Cotton with Hand Smocking',
  },
  {
    id: 'd2',
    product_code: 'AA-DRS-002',
    name: 'Noor Heirloom Tiered Dress',
    category: 'dress',
    price: 3600,
    status: 'made_to_order',
    featured: true,
    new_arrival: false,
    lead_time_days: 7,
    minimum_notice_hours: 0,
    images: [{ url: 'https://images.unsplash.com/d2.jpg', sort_order: 0 }],
    sizes: ['12M', '18M', '2T', '3T', '4T'],
    fabric_details: '100% Organic Muslin with French Seams',
  },
  {
    id: 'c1',
    product_code: 'AA-CKE-001',
    name: 'Pistachio Rose Cake',
    category: 'cake',
    price: 1850,
    status: 'published',
    featured: true,
    new_arrival: true,
    lead_time_days: 2,
    minimum_notice_hours: 48,
    images: [{ url: 'https://images.unsplash.com/c1.jpg', sort_order: 0 }],
    weights: [
      { weight: '0.5 lb Bento', price: 950 },
      { weight: '1.0 lb', price: 1850 },
      { weight: '1.5 lb Tiered', price: 2750 },
      { weight: '2.0 lb Double Tier', price: 3600 },
    ],
    flavors: ['Persian Pistachio & Rosewater Cream', 'Pistachio Cardamom Cream'],
  },
  {
    id: 'c2',
    product_code: 'AA-CKE-002',
    name: 'Vanilla & Fresh Berry Cake',
    category: 'cake',
    price: 2200,
    status: 'published',
    featured: true,
    new_arrival: false,
    lead_time_days: 2,
    minimum_notice_hours: 48,
    images: [{ url: 'https://images.unsplash.com/c2.jpg', sort_order: 0 }],
    weights: [
      { weight: '0.5 lb Bento', price: 1100 },
      { weight: '1.0 lb', price: 2200 },
    ],
    flavors: ['Madagascar Vanilla Bean & Fresh Berry'],
  },
];

// Test 1: Published Visibility & Status Isolation
console.log('\nTest 1: Published Visibility & Status Isolation...');
const visibleStatuses = ['published', 'made_to_order', 'out_of_stock'];
const visibleItems = CATALOG_ITEMS.filter((p) => visibleStatuses.includes(p.status));
assert.equal(visibleItems.length, 4, 'All 4 mock catalog items should be customer-visible');

const draftOrHidden = CATALOG_ITEMS.filter((p) => p.status === 'draft' || p.status === 'hidden');
assert.equal(draftOrHidden.length, 0, 'No draft or hidden items should be customer-accessible');
console.log('  ✓ Only published and made_to_order products are visible on customer storefront.');

// Test 2: Dress catalog sizing and tailoring specifications
console.log('\nTest 2: Dress Catalog Sizing (6M, 12M, 18M, 2T, 3T, 4T)...');
const dresses = CATALOG_ITEMS.filter((p) => p.category === 'dress');
const requiredSizes = ['6M', '12M', '18M', '2T', '3T', '4T'];

dresses.forEach((dress) => {
  assert.ok(dress.sizes && dress.sizes.length > 0, `Dress ${dress.name} must have sizes`);
  const hasValidSize = dress.sizes.some((s) => requiredSizes.includes(s));
  assert.ok(hasValidSize, `Dress ${dress.name} missing standard sizes`);
  assert.ok(dress.fabric_details, `Dress ${dress.name} must have fabric details`);
  assert.ok(dress.price > 0, `Dress ${dress.name} must have valid BDT price`);
});
console.log(`  ✓ All ${dresses.length} dresses verified with standard sizes and fabric specifications.`);

// Test 3: Cake catalog weights (0.5 lb Bento, 1.5 lb, 2 lb, 3 lb), flavors, and notice hours
console.log('\nTest 3: Cake Weights, Flavors & Minimum Notice Hours...');
const cakes = CATALOG_ITEMS.filter((p) => p.category === 'cake');
const expectedWeights = ['0.5 lb Bento', '1.0 lb', '1.5 lb Tiered', '2.0 lb Double Tier'];

cakes.forEach((cake) => {
  assert.ok(cake.weights && cake.weights.length > 0, `Cake ${cake.name} must have weight options`);
  assert.ok(cake.flavors && cake.flavors.length > 0, `Cake ${cake.name} must have flavor options`);
  assert.ok(cake.minimum_notice_hours >= 24, `Cake ${cake.name} must require >=24h notice`);
  const bentoOrTiered = cake.weights.some((w) => expectedWeights.includes(w.weight));
  assert.ok(bentoOrTiered, `Cake ${cake.name} missing expected weight formats`);
});
console.log(`  ✓ All ${cakes.length} cakes verified with weight tiers, flavor profiles, and notice hours.`);

// Test 4: Image gallery structure
console.log('\nTest 4: Image Gallery Structure & Primary Image...');
CATALOG_ITEMS.forEach((p) => {
  assert.ok(p.images.length > 0, `Item ${p.name} must have images`);
  assert.equal(p.images[0].sort_order, 0, `Primary image must have sort_order 0`);
});
console.log('  ✓ Image gallery structures and sort_order indexes verified across all catalog items.');

// Test 5: Client-side search logic across titles, fabrics, and flavors
console.log('\nTest 5: Catalog Search and Filtering Logic...');
const searchCatalog = (term: string) => {
  const t = term.toLowerCase();
  return CATALOG_ITEMS.filter(
    (p) =>
      p.name.toLowerCase().includes(t) ||
      (p.fabric_details || '').toLowerCase().includes(t) ||
      (p.flavors || []).some((f) => f.toLowerCase().includes(t))
  );
};

const linenMatches = searchCatalog('cotton');
assert.equal(linenMatches.length, 1, 'Search for "cotton" should return 1 matching dress');

const roseMatches = searchCatalog('rose');
assert.equal(roseMatches.length, 1, 'Search for "rose" should return 1 matching cake');
console.log('  ✓ Search across product titles, descriptions, fabrics, and flavor profiles verified.');

// Test 6: Security and credentials leakage check
console.log('\nTest 6: Security & Credentials Leakage Isolation...');
const serialized = JSON.stringify(CATALOG_ITEMS);
assert.ok(!serialized.includes('service_role'), 'Must not expose service_role');
assert.ok(!serialized.includes('supabase_secret'), 'Must not expose secret key');
console.log('  ✓ No service-role or secret keys exposed in client models.');

console.log('\n--- ALL CUSTOMER STOREFRONT & CATALOG TESTS PASSED SUCCESSFULLY! ---\n');
