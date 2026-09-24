/**
 * Ababil’s Attire by Sanjida Bethi
 * Fallback Catalog Data (Mirrors Stitch project 1646646279704595948)
 *
 * Used as a resilient fallback when remote Supabase tables are unseeded or offline.
 * Real Supabase database entries always take precedence.
 */

import type { ProductWithDetails } from '../types';

export const FALLBACK_PRODUCTS: ProductWithDetails[] = [
  // --- DRESSES ---
  {
    id: '11111111-1111-4111-8111-111111111111',
    product_code: 'AA-DRS-001',
    name: 'Aurelia Floral Smocked Frock',
    category: 'dress',
    description:
      'A sweet, gentle dress made from breathable natural cotton with hand-smocked pastel floral embroidery around the collar and a soft gathered skirt. Perfect for birthdays, family photos, and special celebrations.',
    price: 3200,
    status: 'published',
    featured: true,
    new_arrival: true,
    stock_quantity: 6,
    lead_time_days: 2,
    minimum_notice_hours: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: 'img-d1-1',
        product_id: '11111111-1111-4111-8111-111111111111',
        image_url:
          'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=900&q=80',
        alt_text: 'Aurelia Floral Smocked Dress Studio Front',
        sort_order: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: 'img-d1-2',
        product_id: '11111111-1111-4111-8111-111111111111',
        image_url:
          'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?auto=format&fit=crop&w=900&q=80',
        alt_text: 'Delicate pastel floral smocking closeup',
        sort_order: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: 'img-d1-3',
        product_id: '11111111-1111-4111-8111-111111111111',
        image_url:
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80',
        alt_text: 'Back tie bow and mother-of-pearl buttons',
        sort_order: 2,
        created_at: new Date().toISOString(),
      },
    ],
    dress_details: {
      product_id: '11111111-1111-4111-8111-111111111111',
      available_sizes: ['6M', '12M', '18M', '2T', '3T', '4T'],
      fabric_details: '100% Pure Soft Cotton with Hand Smocking & French lace trim',
      care_instructions:
        'Gentle cold hand-wash with mild baby-safe detergent. Do not wring or tumble dry. Dry flat in shade. Cool iron on reverse.',
    },
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    product_code: 'AA-DRS-002',
    name: 'Noor Tiered Dress',
    category: 'dress',
    description:
      'Handmade toddler dress in warm biscuit organic muslin with gathered tiered skirt and embroidered Peter Pan collar. Tailored with French seams and mother-of-pearl buttons.',
    price: 3600,
    status: 'made_to_order',
    featured: true,
    new_arrival: false,
    stock_quantity: 4,
    lead_time_days: 7,
    minimum_notice_hours: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: 'img-d2-1',
        product_id: '22222222-2222-4222-8222-222222222222',
        image_url:
          'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=900&q=80',
        alt_text: 'Noor Tiered Dress in Organic Muslin',
        sort_order: 0,
        created_at: new Date().toISOString(),
      },
    ],
    dress_details: {
      product_id: '22222222-2222-4222-8222-222222222222',
      available_sizes: ['12M', '18M', '2T', '3T', '4T'],
      fabric_details: '100% Organic Muslin with French Seams & Peter Pan Collar',
      care_instructions:
        'Machine wash cold on gentle cycle with like colors. Hang to dry naturally. Warm iron if desired.',
    },
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    product_code: 'AA-DRS-003',
    name: 'Zoya Dusty Rose Eyelet Romper',
    category: 'dress',
    description:
      'Charming dusty rose baby girl romper crafted with antique English eyelet embroidery, frilled shoulder straps, and natural wooden buttons. Lightweight and gentle for warm festivities.',
    price: 2800,
    status: 'published',
    featured: true,
    new_arrival: true,
    stock_quantity: 2,
    lead_time_days: 1,
    minimum_notice_hours: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: 'img-d3-1',
        product_id: '33333333-3333-4333-8333-333333333333',
        image_url:
          'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=900&q=80',
        alt_text: 'Zoya Dusty Rose Eyelet Romper',
        sort_order: 0,
        created_at: new Date().toISOString(),
      },
    ],
    dress_details: {
      product_id: '33333333-3333-4333-8333-333333333333',
      available_sizes: ['6M', '12M', '18M', '2T'],
      fabric_details: '100% Antique English Eyelet Cotton Voile',
      care_instructions:
        'Delicate cold hand-wash. Do not bleach. Air dry flat. Cool iron on reverse.',
    },
  },
  {
    id: '44444444-1111-4111-8111-111111111111',
    product_code: 'AA-DRS-004',
    name: 'Maryam Classic Collar Gown',
    category: 'dress',
    description:
      'Classic christening and celebratory gown in winter white silk and cotton blend with hand-stitched French knot details on the Peter Pan collar and silk waist sashes.',
    price: 4200,
    status: 'published',
    featured: true,
    new_arrival: false,
    stock_quantity: 5,
    lead_time_days: 2,
    minimum_notice_hours: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: 'img-d4-1',
        product_id: '44444444-1111-4111-8111-111111111111',
        image_url:
          'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80',
        alt_text: 'Maryam Classic Collar Gown',
        sort_order: 0,
        created_at: new Date().toISOString(),
      },
    ],
    dress_details: {
      product_id: '44444444-1111-4111-8111-111111111111',
      available_sizes: ['6M', '12M', '18M', '2T', '3T', '4T'],
      fabric_details: 'Silk & Cotton Batiste with Hand-stitched French Knots',
      care_instructions:
        'Dry clean recommended or gentle lukewarm hand rinse. Iron damp.',
    },
  },

  // --- CAKES ---
  {
    id: '55555555-5555-4555-8555-555555555555',
    product_code: 'AA-CKE-001',
    name: 'Pistachio Rose Cake',
    category: 'cake',
    description:
      'Exquisite Persian pistachio and rosewater round layer cake frosted in textured mascarpone cream, garnished with organic dried rosebuds and vibrant emerald crushed pistachios.',
    price: 1850,
    status: 'published',
    featured: true,
    new_arrival: true,
    stock_quantity: 12,
    lead_time_days: 2,
    minimum_notice_hours: 48,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: 'img-c1-1',
        product_id: '55555555-5555-4555-8555-555555555555',
        image_url:
          'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=900&q=80',
        alt_text: 'Pistachio Rose Cake on ceramic stand',
        sort_order: 0,
        created_at: new Date().toISOString(),
      },
    ],
    cake_details: {
      product_id: '55555555-5555-4555-8555-555555555555',
      weight_options: [
        { weight: '0.5 lb Bento', price: 950, servings: '1–2 slices' },
        { weight: '1.0 lb', price: 1850, servings: '4–6 guests' },
        { weight: '1.5 lb Tiered', price: 2750, servings: '8–10 guests' },
        { weight: '2.0 lb Double Tier', price: 3600, servings: '12–16 guests' },
      ],
      flavor_options: [
        'Persian Pistachio & Rosewater Cream',
        'Pistachio Cardamom Cream',
        'Rosewater White Chocolate Mousse',
      ],
      customization_options: 'Complimentary piped calligraphy card or cursive plaque.',
      storage_instructions:
        'Keep refrigerated between 4°C – 8°C. Bring to room temperature 30 minutes before cutting for peak flavor and velvety texture.',
    },
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    product_code: 'AA-CKE-002',
    name: 'Vanilla & Fresh Berry Cake',
    category: 'cake',
    description:
      'Classic airy Madagascar vanilla sponge with visible vanilla bean speckles, layered with homemade raspberry-blackberry compote and whipped chantilly cream topping.',
    price: 2200,
    status: 'published',
    featured: true,
    new_arrival: false,
    stock_quantity: 15,
    lead_time_days: 2,
    minimum_notice_hours: 48,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: 'img-c2-1',
        product_id: '66666666-6666-4666-8666-666666666666',
        image_url:
          'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80',
        alt_text: 'Vanilla & Fresh Berry Cake',
        sort_order: 0,
        created_at: new Date().toISOString(),
      },
    ],
    cake_details: {
      product_id: '66666666-6666-4666-8666-666666666666',
      weight_options: [
        { weight: '0.5 lb Bento', price: 1100, servings: '1–2 slices' },
        { weight: '1.0 lb', price: 2200, servings: '6–8 guests' },
        { weight: '1.5 lb Tiered', price: 3200, servings: '10–12 guests' },
        { weight: '2.0 lb Double Tier', price: 4200, servings: '14–18 guests' },
      ],
      flavor_options: [
        'Madagascar Vanilla Bean & Fresh Berry',
        'Vanilla Mascarpone Cream',
        'Berry Compote & White Ganache',
      ],
      customization_options: 'Piped birthday message on chocolate crest.',
      storage_instructions:
        'Keep chilled. Consume within 48 hours for the freshest fruit and cream texture.',
    },
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    product_code: 'AA-CKE-003',
    name: 'Vintage Birthday Cake',
    category: 'cake',
    description:
      'Vintage Victorian Lambeth celebration cake in pastel ivory and muted rose with intricate over-piping, swags, shells, and a delicate personalized chocolate crest in the center.',
    price: 2600,
    status: 'published',
    featured: true,
    new_arrival: true,
    stock_quantity: 8,
    lead_time_days: 2,
    minimum_notice_hours: 48,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: 'img-c3-1',
        product_id: '77777777-7777-4777-8777-777777777777',
        image_url:
          'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=900&q=80',
        alt_text: 'Vintage Lambeth Piped Birthday Cake',
        sort_order: 0,
        created_at: new Date().toISOString(),
      },
    ],
    cake_details: {
      product_id: '77777777-7777-4777-8777-777777777777',
      weight_options: [
        { weight: '1.0 lb', price: 2600, servings: '6–8 guests' },
        { weight: '1.5 lb Tiered', price: 3800, servings: '10–12 guests' },
        { weight: '2.0 lb Double Tier', price: 4900, servings: '14–18 guests' },
      ],
      flavor_options: [
        'Rich Valrhona Chocolate Truffle',
        'Vanilla Buttercream Swirl',
        'Salted Caramel Silk',
      ],
      customization_options: 'Hand-piped buttercream message, age numbers, or chocolate monogram.',
      storage_instructions:
        'Store in refrigerated cake box. Bring out 20 mins before celebratory cutting.',
    },
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    product_code: 'AA-CKE-004',
    name: 'Earl Grey Tea Cake',
    category: 'cake',
    description:
      'Modern tea cake infused with fragrant Earl Grey tea leaves, filled with bergamot buttercream, and topped with dried organic lavender sprigs and brushed gold leaf flakes.',
    price: 950,
    status: 'published',
    featured: false,
    new_arrival: true,
    stock_quantity: 10,
    lead_time_days: 1,
    minimum_notice_hours: 24,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: 'img-c4-1',
        product_id: '88888888-8888-4888-8888-888888888888',
        image_url:
          'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=80',
        alt_text: 'Earl Grey Tea Cake Bento',
        sort_order: 0,
        created_at: new Date().toISOString(),
      },
    ],
    cake_details: {
      product_id: '88888888-8888-4888-8888-888888888888',
      weight_options: [
        { weight: '0.5 lb Bento', price: 950, servings: '1–2 slices' },
        { weight: '1.0 lb', price: 1800, servings: '4–6 guests' },
      ],
      flavor_options: ['Earl Grey & Lavender Buttercream', 'Bergamot Citrus Cream'],
      customization_options: 'Dried organic lavender sprigs and edible gold leaf.',
      storage_instructions: 'Keep chilled. Best served with warm afternoon tea.',
    },
  },
];
