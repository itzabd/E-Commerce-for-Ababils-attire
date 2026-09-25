/**
 * Ababil’s Attire by Sanjida Bethi
 * Contact & Custom Orders Page (Mirrors Stitch specifications)
 */

import React, { useState, useEffect } from 'react';
import { STUDIO_CONFIG, getStudioWhatsAppUrl } from '../../lib/studio';
import { settingsService } from '../../services/settings.service';
import type { StoreSettings } from '../../types';

export const ContactPage: React.FC = () => {
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    settingsService.getSettings().then((s) => setStoreSettings(s));
  }, []);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    category: 'dress',
    eventDate: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div style={styles.container} className="customer-page-container contact-page-container">
      {/* Header */}
      <section style={styles.headerSection} className="contact-header-section">
        <span style={styles.eyebrow}>CONTACT &amp; CUSTOM INQUIRIES</span>
        <h1 style={styles.title}>Let’s Plan Your Celebration</h1>
        <p style={styles.subtitle}>
          Have a question about dress measurements or want to design a custom celebration cake?
          Sanjida Bethi and our team are delighted to assist you.
        </p>
      </section>

      <div style={styles.contentGrid} className="contact-grid-desktop">
        {/* Left: Atelier Contact & Policy Info */}
        <div style={styles.infoCol}>
          {/* Quick WhatsApp Concierge Card */}
          <div style={styles.whatsAppCard}>
            <div style={styles.whatsAppHeader}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#25D366' }}>
                chat
              </span>
              <div>
                <h3 style={styles.cardHeading}>Direct WhatsApp Concierge</h3>
                <p style={styles.cardSub}>Fastest response for dates & sizing</p>
              </div>
            </div>
            <p style={styles.whatsAppDesc}>
              Chat directly with Sanjida to share reference photos, ask for custom sizing, or verify cake availability.
            </p>
            <a
              href={getStudioWhatsAppUrl('Assalamu Alaikum Sanjida Apu, I would like to inquire about a custom order.', storeSettings?.whatsapp_number || storeSettings?.contact_phone)}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.whatsAppBtn}
            >
              Message Sanjida on WhatsApp 💬
            </a>
          </div>

          {/* Studio Details */}
          <div style={styles.detailsCard}>
            <div style={styles.detailItem}>
              <span className="material-symbols-outlined" style={styles.detailIcon}>
                location_on
              </span>
              <div>
                <h4 style={styles.detailLabel}>Workshop & Studio</h4>
                <p style={styles.detailValue}>{storeSettings?.workshop_address || STUDIO_CONFIG.workshopAddress}</p>
              </div>
            </div>

            <div style={styles.detailItem}>
              <span className="material-symbols-outlined" style={styles.detailIcon}>
                schedule
              </span>
              <div>
                <h4 style={styles.detailLabel}>Studio Hours</h4>
                <p style={styles.detailValue}>{storeSettings?.studio_hours || STUDIO_CONFIG.studioHours}</p>
              </div>
            </div>

            <div style={styles.detailItem}>
              <span className="material-symbols-outlined" style={styles.detailIcon}>
                mail
              </span>
              <div>
                <h4 style={styles.detailLabel}>Electronic Inquiries</h4>
                <p style={styles.detailValue}>{storeSettings?.business_email || STUDIO_CONFIG.conciergeEmail}</p>
              </div>
            </div>

            {(storeSettings?.contact_phone || storeSettings?.whatsapp_number) && (
              <div style={styles.detailItem}>
                <span className="material-symbols-outlined" style={styles.detailIcon}>
                  call
                </span>
                <div>
                  <h4 style={styles.detailLabel}>Telephone & WhatsApp</h4>
                  <p style={styles.detailValue}>{storeSettings.whatsapp_number || storeSettings.contact_phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Delivery & bKash Advance Policy Card */}
          <div style={styles.policyCard}>
            <h4 style={styles.policyTitle}>Important Ordering Notes:</h4>
            <ul style={styles.policyList}>
              <li>
                <strong>৳ {storeSettings?.minimum_advance_amount ?? 500} bKash Advance:</strong> Required to confirm booking via {storeSettings?.bkash_type === 'merchant' ? 'bKash merchant' : 'personal bKash'} ({storeSettings?.bkash_number || STUDIO_CONFIG.bkashNumber}). Remaining balance is settled via Cash on Delivery.
              </li>
              <li>
                <strong>Chilled Delivery:</strong> All cakes are transported in air-conditioned delivery transport across Dhaka to ensure flawless presentation.
              </li>
              <li>
                <strong>Courier:</strong> Handmade dresses ship nationwide via registered courier within 2–5 business days.
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Custom Inquiry Form */}
        <div style={styles.formCol}>
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>Send a Message</h3>
            <p style={styles.formSubtitle}>
              Fill in your details below and our team will get back to you within a few hours.
            </p>

            {formSubmitted ? (
              <div style={styles.successBox}>
                <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#065f46' }}>
                  task_alt
                </span>
                <h4 style={styles.successTitle}>Inquiry Sent!</h4>
                <p style={styles.successText}>
                  Thank you, {formData.name || 'valued customer'}. Sanjida will review your inquiry
                  and respond via WhatsApp/Phone shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormSubmitted(false);
                    setFormData({ name: '', phone: '', category: 'dress', eventDate: '', message: '' });
                  }}
                  style={styles.newInquiryBtn}
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Farhana Ahmed"
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Phone / WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 01711-223344"
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldRow}>
                  <div style={{ ...styles.fieldGroup, flex: 1 }}>
                    <label style={styles.label}>Inquiry Type</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={styles.select}
                    >
                      <option value="dress">Girls' Handmade Dress Sizing</option>
                      <option value="cake">Custom Celebration Cake</option>
                      <option value="both">Both Dress & Cake Package</option>
                      <option value="other">General Studio Inquiry</option>
                    </select>
                  </div>

                  <div style={{ ...styles.fieldGroup, flex: 1 }}>
                    <label style={styles.label}>Event Date (If applicable)</label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Message & Special Requests *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe dress size, child's age, cake flavor preference, or color palette..."
                    style={styles.textarea}
                  />
                </div>

                <button type="submit" style={styles.submitBtn}>
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '16px 16px 60px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  headerSection: {
    textAlign: 'center',
    maxWidth: '680px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'center',
  },
  eyebrow: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    color: '#8c5e51',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '30px',
    fontWeight: 500,
    color: '#2d2421',
    lineHeight: 1.25,
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#6f6764',
    lineHeight: 1.6,
    margin: 0,
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    alignItems: 'start',
  },
  infoCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  whatsAppCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid var(--color-border-subtle, #ece8e1)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(92,62,54,0.03))',
  },
  whatsAppHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  cardHeading: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '15px',
    fontWeight: 600,
    color: '#2d2421',
    margin: 0,
  },
  cardSub: {
    fontSize: '11px',
    color: '#065f46',
    margin: 0,
    fontWeight: 500,
  },
  whatsAppDesc: {
    fontSize: '13px',
    color: '#6f6764',
    lineHeight: 1.5,
    margin: 0,
  },
  whatsAppBtn: {
    height: '42px',
    borderRadius: '9999px',
    backgroundColor: '#25D366',
    color: '#ffffff',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid var(--color-border-subtle, #ece8e1)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  detailIcon: {
    color: '#8c5e51',
    fontSize: '20px',
    marginTop: '2px',
  },
  detailLabel: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#8c5e51',
    margin: '0 0 2px 0',
  },
  detailValue: {
    fontSize: '13px',
    color: '#2d2421',
    margin: 0,
    lineHeight: 1.4,
  },
  policyCard: {
    backgroundColor: '#f5f3ef',
    borderRadius: '14px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  policyTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#5c3e36',
    margin: 0,
  },
  policyList: {
    margin: 0,
    paddingLeft: '18px',
    fontSize: '12px',
    color: '#6f6764',
    lineHeight: 1.6,
  },
  formCol: {
    width: '100%',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid var(--color-border-subtle, #ece8e1)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(92,62,54,0.03))',
  },
  formTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '22px',
    fontWeight: 500,
    color: '#2d2421',
    margin: 0,
  },
  formSubtitle: {
    fontSize: '13px',
    color: '#6f6764',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2d2421',
  },
  input: {
    height: '44px',
    minHeight: '44px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    padding: '0 12px',
    fontSize: '13px',
    color: '#2d2421',
    outline: 'none',
  },
  select: {
    height: '44px',
    minHeight: '44px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    padding: '0 10px',
    fontSize: '13px',
    color: '#2d2421',
    outline: 'none',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
  },
  textarea: {
    borderRadius: '8px',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#2d2421',
    outline: 'none',
    resize: 'vertical',
  },
  submitBtn: {
    height: '46px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    marginTop: '6px',
    boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(92,62,54,0.08))',
  },
  successBox: {
    textAlign: 'center',
    padding: '30px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  successTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '20px',
    fontWeight: 600,
    color: '#065f46',
    margin: 0,
  },
  successText: {
    fontSize: '13px',
    color: '#6f6764',
    lineHeight: 1.5,
    margin: 0,
    maxWidth: '360px',
  },
  newInquiryBtn: {
    marginTop: '12px',
    padding: '0 20px',
    height: '44px',
    minHeight: '44px',
    borderRadius: '9999px',
    backgroundColor: '#f5f3ef',
    color: '#5c3e36',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
