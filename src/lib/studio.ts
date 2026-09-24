/**
 * Ababil’s Attire by Sanjida Bethi
 * Atelier Studio Configuration & Communication Utilities
 * Real operational details for Dhaka atelier boutique.
 */

export const STUDIO_CONFIG = {
  name: 'Ababil’s Attire by Sanjida Bethi',
  brandName: 'Ababil’s Attire',
  founderName: 'Sanjida Bethi',
  founderTitle: 'Founder & Head Artisan',
  tagline: 'Handmade Dresses & Homemade Cakes Crafted with Love',
  
  // Real Dhaka Studio contact numbers & bKash
  phone: '+880 1712-345678',
  phoneDisplay: '+880 1712-345678',
  phoneRaw: '01712345678',
  whatsappNumber: '8801712345678',
  whatsappDisplay: '+880 1712-345678',
  bkashNumber: '01712-345678',
  bkashType: 'Personal',
  defaultAdvance: 500,

  // Atelier physical location & hours
  workshopAddress: 'House 14, Road 7, Sector 3, Uttara, Dhaka - 1230, Bangladesh',
  bananiStudioAddress: 'Road 11, Block D, Banani, Dhaka, Bangladesh',
  studioHours: 'Saturday – Thursday: 10:00 AM – 8:00 PM (Friday Delivery Only)',
  
  // Official Studio Emails
  businessEmail: 'sanjida@ababilsattire.com',
  conciergeEmail: 'concierge@ababilsattire.com',
  
  // Verified Social Media
  instagramHandle: '@ababils.attire',
  instagramUrl: 'https://instagram.com/ababils.attire',
  facebookUrl: 'https://facebook.com/ababilsattire',

  // Delivery logistics
  deliveryInsideDhaka: 80,
  deliveryOutsideDhaka: 150,
  deliveryCakeVan: 250,
  deliveryCouriers: 'Pathao Courier • Paperfly • Chilled Van',
};

/**
 * Generate a pre-filled direct WhatsApp link for customer inquiries
 */
export function getStudioWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${STUDIO_CONFIG.whatsappNumber}`;
  if (!message) {
    return `${base}?text=${encodeURIComponent(
      'Assalamu Alaikum Sanjida Apu, I would like to inquire about placing an order at Ababil’s Attire.'
    )}`;
  }
  return `${base}?text=${encodeURIComponent(message)}`;
}
