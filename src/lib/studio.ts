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
  
  // Real Dhaka Studio contact numbers & bKash defaults
  phone: '+880 1795-077102',
  phoneDisplay: '+880 1795-077102',
  phoneRaw: '01795077102',
  whatsappNumber: '8801795077102',
  whatsappDisplay: '+880 1795-077102',
  bkashNumber: '01795-077102',
  bkashType: 'Personal',
  defaultAdvance: 500,

  // Atelier physical location & hours defaults
  workshopAddress: 'House 639, Kuddus Khalifa Road, Morkun, Tongi Gazipur- 1700',
  bananiStudioAddress: 'House 639, Kuddus Khalifa Road, Morkun, Tongi Gazipur- 1700',
  studioHours: 'Sunday – Friday: 10:00 AM – 8:00 PM (Saturday Studio Closed / Delivery Only)',
  
  // Official Studio Emails
  businessEmail: 'sanjida@ababilsattire.com',
  conciergeEmail: 'sanjida@ababilsattire.com',
  
  // Verified Social Media
  instagramHandle: '@ababils.attire',
  instagramUrl: 'https://instagram.com/ababils.attire',
  facebookUrl: 'https://www.facebook.com/ababilsattirebd',

  // Delivery logistics
  deliveryInsideDhaka: 80,
  deliveryOutsideDhaka: 150,
  deliveryCakeVan: 250,
  deliveryCouriers: 'Pathao Courier • Paperfly • Chilled Van',
};

/**
 * Returns merged live studio settings with hardcoded fallbacks
 */
export function getStudioConfig() {
  let local: any = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('ababil_admin_store_settings');
      if (raw) local = JSON.parse(raw);
    } catch {}
  }
  return {
    ...STUDIO_CONFIG,
    name: local.store_name || STUDIO_CONFIG.name,
    phone: local.contact_phone || local.whatsapp_number || STUDIO_CONFIG.phone,
    phoneDisplay: local.contact_phone || local.whatsapp_number || STUDIO_CONFIG.phoneDisplay,
    phoneRaw: (local.contact_phone || local.whatsapp_number || STUDIO_CONFIG.phoneRaw).replace(/\D/g, ''),
    whatsappNumber: (local.whatsapp_number || local.contact_phone || STUDIO_CONFIG.whatsappNumber).replace(/\D/g, ''),
    whatsappDisplay: local.whatsapp_number || local.contact_phone || STUDIO_CONFIG.whatsappDisplay,
    bkashNumber: local.bkash_number || STUDIO_CONFIG.bkashNumber,
    workshopAddress: local.workshop_address || STUDIO_CONFIG.workshopAddress,
    studioHours: local.studio_hours || STUDIO_CONFIG.studioHours,
    businessEmail: local.business_email || STUDIO_CONFIG.businessEmail,
    conciergeEmail: local.business_email || STUDIO_CONFIG.conciergeEmail,
    instagramUrl: local.instagram_handle
      ? (local.instagram_handle.startsWith('http')
          ? local.instagram_handle
          : `https://instagram.com/${local.instagram_handle.replace(/^@/, '')}`)
      : STUDIO_CONFIG.instagramUrl,
    facebookUrl: local.facebook_url || STUDIO_CONFIG.facebookUrl,
    defaultAdvance: local.minimum_advance_amount ?? STUDIO_CONFIG.defaultAdvance,
  };
}

/**
 * Generate a pre-filled direct WhatsApp link for customer inquiries.
 * Automatically synchronizes with live settings in localStorage or accepts an override number.
 */
export function getStudioWhatsAppUrl(message?: string, overrideNumber?: string): string {
  let num = overrideNumber;
  if (!num && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('ababil_admin_store_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.whatsapp_number) num = parsed.whatsapp_number;
        else if (parsed.contact_phone) num = parsed.contact_phone;
      }
    } catch {}
  }
  const rawNum = num || STUDIO_CONFIG.whatsappNumber;
  const cleanDigits = rawNum.replace(/\D/g, '');
  const phone = cleanDigits.startsWith('880')
    ? cleanDigits
    : cleanDigits.startsWith('0')
      ? '88' + cleanDigits
      : '880' + cleanDigits;

  const base = `https://wa.me/${phone}`;
  if (!message) {
    return `${base}?text=${encodeURIComponent(
      'Assalamu Alaikum Sanjida Apu, I would like to inquire about placing an order at Ababil’s Attire.'
    )}`;
  }
  return `${base}?text=${encodeURIComponent(message)}`;
}
