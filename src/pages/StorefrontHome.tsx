/**
 * Ababil’s Attire by Sanjida Bethi
 * Guest Customer Storefront (Placeholder)
 *
 * Demonstrates that customer pages remain 100% guest-accessible without login.
 * Provides entry point to the administrative portal for testing admin authentication.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const StorefrontHome: React.FC = () => {
  const { isAdmin, admin } = useAuth();

  return (
    <div style={styles.page}>
      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brand}>
            <span style={styles.monogram}>AB</span>
            <div>
              <div style={styles.brandTitle}>Ababil’s Attire</div>
              <div style={styles.brandSubtitle}>by Sanjida Bethi</div>
            </div>
          </div>

          <div style={styles.headerActions}>
            {isAdmin ? (
              <Link to="/admin" style={styles.adminActiveLink}>
                Admin Suite ({admin?.role?.toUpperCase()}) →
              </Link>
            ) : (
              <Link to="/admin/login" style={styles.adminLoginLink}>
                Studio Login 🔒
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Exhibition Banner */}
      <section style={styles.heroSection}>
        <div style={styles.heroInner}>
          <span style={styles.heirloomTag}>ATELIER CURATED HEIRLOOM</span>
          <h1 style={styles.heroHeading}>Bespoke Heirloom Dresses & Celebration Cakes</h1>
          <p style={styles.heroDescription}>
            Every handmade stitch and pastry glaze is framed with calculated restraint.
            Dhaka’s premier artisan atelier for milestone celebration confections and bespoke smocked dresses.
          </p>

          <div style={styles.guestNoticeCard}>
            <div style={styles.noticeHeader}>
              <span style={styles.noticePill}>GUEST-ACCESSIBLE BOUTIQUE</span>
            </div>
            <p style={styles.noticeBody}>
              Customers do <strong>not</strong> need accounts to browse collections, place orders, or track delivery.
              Customer checkout uses Cash on Delivery with a mandatory bKash advance.
            </p>
          </div>

          <div style={styles.ctaRow}>
            <Link to="/admin/login" style={styles.primaryCta}>
              Access Admin & Studio Portal →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          © 2026 Ababil’s Attire by Sanjida Bethi • Banani, Dhaka, Bangladesh • All Rights Reserved
        </p>
      </footer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--color-surface, #fbf9f5)',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid var(--color-border-subtle, #ece8e1)',
    padding: '16px 24px',
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  monogram: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '26px',
    fontWeight: 700,
    color: '#5c3e36',
  },
  brandTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '16px',
    fontWeight: 600,
    color: '#2d2421',
    lineHeight: 1.1,
  },
  brandSubtitle: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '11px',
    color: '#8c5e51',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  adminLoginLink: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 600,
    color: '#5c3e36',
    backgroundColor: '#f5ede9',
    padding: '6px 14px',
    borderRadius: '9999px',
    border: '1px solid #ebd8d0',
    textDecoration: 'none',
  },
  adminActiveLink: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 600,
    color: '#065f46',
    backgroundColor: '#ecfdf5',
    padding: '6px 14px',
    borderRadius: '9999px',
    border: '1px solid #a7f3d0',
    textDecoration: 'none',
  },
  heroSection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 24px',
  },
  heroInner: {
    maxWidth: '680px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  heirloomTag: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    color: '#8c5e51',
    backgroundColor: '#f5ede9',
    padding: '4px 12px',
    borderRadius: '9999px',
  },
  heroHeading: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '36px',
    fontWeight: 500,
    color: '#2d2421',
    lineHeight: 1.25,
  },
  heroDescription: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '15px',
    color: '#6f6764',
    lineHeight: 1.6,
  },
  guestNoticeCard: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '12px',
    padding: '16px 20px',
    textAlign: 'left',
    width: '100%',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.04))',
  },
  noticeHeader: {
    marginBottom: '8px',
  },
  noticePill: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '10px',
    fontWeight: 700,
    color: '#5c3e36',
    letterSpacing: '0.06em',
  },
  noticeBody: {
    fontSize: '13px',
    color: '#2d2421',
    lineHeight: 1.5,
  },
  ctaRow: {
    marginTop: '10px',
  },
  primaryCta: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '14px',
    fontWeight: 600,
    padding: '12px 28px',
    borderRadius: '9999px',
    textDecoration: 'none',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.08))',
  },
  footer: {
    borderTop: '1px solid #ece8e1',
    padding: '24px',
    textAlign: 'center',
    backgroundColor: '#ffffff',
  },
  footerText: {
    fontSize: '12px',
    color: '#988e8a',
  },
};
