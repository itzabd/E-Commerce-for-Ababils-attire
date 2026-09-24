/**
 * Ababil’s Attire by Sanjida Bethi
 * Customer Storefront Layout (Mirrors Stitch project 1646646279704595948)
 */

import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';

export const CustomerLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isAdmin } = useAuth();
  const { itemCount } = useCart();

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div style={styles.pageContainer}>
      {/* ================================================================= */}
      {/* 1. STICKY BOUTIQUE HEADER (TopAppBar Anchor Component)            */}
      {/* ================================================================= */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          {/* Left: Mobile Drawer Toggle */}
          <div style={styles.leftGroup}>
            <button
              type="button"
              aria-label="Open Navigation Drawer"
              onClick={() => setDrawerOpen(true)}
              style={styles.menuButton}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                menu
              </span>
            </button>

            {/* Desktop Navigation Links */}
            <nav style={styles.desktopNav} className="customer-desktop-nav">
              <NavLink
                to="/"
                end
                style={({ isActive }) => (isActive ? styles.desktopNavLinkActive : styles.desktopNavLink)}
              >
                Home
              </NavLink>
              <NavLink
                to="/dresses"
                style={({ isActive }) => (isActive ? styles.desktopNavLinkActive : styles.desktopNavLink)}
              >
                Dresses
              </NavLink>
              <NavLink
                to="/cakes"
                style={({ isActive }) => (isActive ? styles.desktopNavLinkActive : styles.desktopNavLink)}
              >
                Cakes
              </NavLink>
              <NavLink
                to="/about"
                style={({ isActive }) => (isActive ? styles.desktopNavLinkActive : styles.desktopNavLink)}
              >
                Our Story
              </NavLink>
              <NavLink
                to="/contact"
                style={({ isActive }) => (isActive ? styles.desktopNavLinkActive : styles.desktopNavLink)}
              >
                Bespoke & Contact
              </NavLink>
            </nav>
          </div>

          {/* Center: Brand Identity */}
          <div style={styles.brandCenter}>
            <Link to="/" style={styles.brandLink}>
              <span style={styles.brandTitle}>Ababil’s Attire</span>
            </Link>
            <span style={styles.brandSubtitle}>
              Handmade Dresses & Homemade Cakes by Sanjida Bethi
            </span>
          </div>

          {/* Right: Actions Cluster (Track Order, Bag, Admin) */}
          <div style={styles.rightGroup}>
            {isAdmin && (
              <Link to="/admin" style={styles.adminBadgeLink} title="Studio Admin Suite">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  shield_person
                </span>
                <span style={styles.adminBadgeText}>Admin</span>
              </Link>
            )}

            <Link
              to="/track-order"
              style={styles.iconAction}
              aria-label="Track Order"
              title="Track Order"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                local_shipping
              </span>
            </Link>

            <Link
              to="/bag"
              aria-label={`Shopping Bag (${itemCount} items)`}
              title="My Bag"
              style={styles.bagButton}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                shopping_bag
              </span>
              {itemCount > 0 && <span style={styles.bagBadge}>{itemCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      {/* ================================================================= */}
      {/* SIDE NAVIGATION DRAWER (Slide-out Anchor Implementation)          */}
      {/* ================================================================= */}
      {drawerOpen && (
        <div style={styles.backdrop} onClick={closeDrawer} />
      )}

      <aside
        style={{
          ...styles.drawer,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Drawer Header */}
        <div style={styles.drawerHeader}>
          <div>
            <h2 style={styles.drawerBrandTitle}>Ababil’s Attire</h2>
            <p style={styles.drawerBrandSubtitle}>by Sanjida Bethi</p>
            <span style={styles.drawerCrest}>Handmade Dresses & Homemade Cakes</span>
          </div>
          <button
            type="button"
            style={styles.closeDrawerButton}
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <nav style={styles.drawerNav}>
          <NavLink
            to="/"
            end
            onClick={closeDrawer}
            style={({ isActive }) => (isActive ? styles.drawerLinkActive : styles.drawerLink)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              storefront
            </span>
            <span>Atelier Home</span>
          </NavLink>

          <NavLink
            to="/dresses"
            onClick={closeDrawer}
            style={({ isActive }) => (isActive ? styles.drawerLinkActive : styles.drawerLink)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              checkroom
            </span>
            <span>Handmade Dresses</span>
          </NavLink>

          <NavLink
            to="/cakes"
            onClick={closeDrawer}
            style={({ isActive }) => (isActive ? styles.drawerLinkActive : styles.drawerLink)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              cake
            </span>
            <span>Fresh Cakes</span>
          </NavLink>

          <NavLink
            to="/bag"
            onClick={closeDrawer}
            style={({ isActive }) => (isActive ? styles.drawerLinkActive : styles.drawerLink)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              shopping_bag
            </span>
            <span style={{ flex: 1 }}>My Bag</span>
            {itemCount > 0 && (
              <span
                style={{
                  backgroundColor: '#5c3e36',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                {itemCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/about"
            onClick={closeDrawer}
            style={({ isActive }) => (isActive ? styles.drawerLinkActive : styles.drawerLink)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              auto_stories
            </span>
            <span>Our Story</span>
          </NavLink>

          <NavLink
            to="/contact"
            onClick={closeDrawer}
            style={({ isActive }) => (isActive ? styles.drawerLinkActive : styles.drawerLink)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              edit_calendar
            </span>
            <span>Bespoke Orders & Contact</span>
          </NavLink>

          <NavLink
            to="/track-order"
            onClick={closeDrawer}
            style={({ isActive }) => (isActive ? styles.drawerLinkActive : styles.drawerLink)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              local_shipping
            </span>
            <span>Track Order</span>
          </NavLink>

          {isAdmin && (
            <Link to="/admin" onClick={closeDrawer} style={styles.drawerAdminLink}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                admin_panel_settings
              </span>
              <span>Admin Management Suite</span>
            </Link>
          )}
        </nav>

        {/* Drawer Footer Quote */}
        <div style={styles.drawerFooter}>
          <p style={styles.drawerQuote}>"Stitched with love, baked with care."</p>
          <p style={styles.drawerDhaka}>Banani Atelier • Dhaka, Bangladesh</p>
        </div>
      </aside>

      {/* ================================================================= */}
      {/* MAIN CONTENT OUTLET                                              */}
      {/* ================================================================= */}
      <main style={styles.mainContent}>
        <Outlet />
      </main>

      {/* ================================================================= */}
      {/* ATELIER FOOTER (Anchor Implementation)                            */}
      {/* ================================================================= */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          {/* Brand Header */}
          <div style={styles.footerBrandSection}>
            <h2 style={styles.footerTitle}>Ababil’s Attire</h2>
            <p style={styles.footerAuthor}>by Sanjida Bethi</p>
            <p style={styles.footerTagline}>
              Sweet handmade dresses for little girls and delicious homemade cakes for your family celebrations.
            </p>
          </div>

          {/* Concierge Communication Buttons */}
          <div style={styles.footerConcierge}>
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.conciergeIconBtn}
              aria-label="WhatsApp Concierge"
              title="WhatsApp Concierge"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                chat
              </span>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.conciergeIconBtn}
              aria-label="Instagram Atelier"
              title="Instagram"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                photo_camera
              </span>
            </a>
            <a
              href="mailto:concierge@ababilsattire.com"
              style={styles.conciergeIconBtn}
              aria-label="Email Studio"
              title="Email Studio"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                mail
              </span>
            </a>
          </div>

          {/* Quick Footer Links */}
          <div style={styles.footerLinksGrid}>
            <Link to="/dresses" style={styles.footerLink}>
              Dresses Collection
            </Link>
            <Link to="/cakes" style={styles.footerLink}>
              Cake Ordering Guide
            </Link>
            <Link to="/track-order" style={styles.footerLink}>
              Track Your Order
            </Link>
            <Link to="/contact" style={styles.footerLink}>
              Custom Orders
            </Link>
            <Link to="/about" style={styles.footerLink}>
              Our Story
            </Link>
            <Link to="/admin/login" style={styles.footerLink}>
              Studio Login
            </Link>
          </div>

          {/* Copyright */}
          <div style={styles.copyrightRow}>
            <p style={styles.copyrightText}>
              © 2026 Ababil’s Attire by Sanjida Bethi. All Rights Reserved. Handmade Dresses & Homemade Cakes • Banani, Dhaka.
            </p>
          </div>
        </div>
      </footer>

      {/* ================================================================= */}
      {/* DOCKED BOTTOM NAVIGATION (Mobile Only - Stitch spec)              */}
      {/* ================================================================= */}
      <nav style={styles.bottomNav} className="customer-bottom-nav">
        <NavLink
          to="/"
          end
          style={({ isActive }) => (isActive ? styles.bottomNavItemActive : styles.bottomNavItem)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            storefront
          </span>
          <span style={styles.bottomNavLabel}>Home</span>
        </NavLink>

        <NavLink
          to="/dresses"
          style={({ isActive }) => (isActive ? styles.bottomNavItemActive : styles.bottomNavItem)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            checkroom
          </span>
          <span style={styles.bottomNavLabel}>Dresses</span>
        </NavLink>

        <NavLink
          to="/cakes"
          style={({ isActive }) => (isActive ? styles.bottomNavItemActive : styles.bottomNavItem)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            cake
          </span>
          <span style={styles.bottomNavLabel}>Cakes</span>
        </NavLink>

        <NavLink
          to="/bag"
          style={({ isActive }) => (isActive ? styles.bottomNavItemActive : styles.bottomNavItem)}
        >
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              shopping_bag
            </span>
            {itemCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  backgroundColor: '#5c3e36',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 700,
                  minWidth: '15px',
                  height: '15px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}
              >
                {itemCount}
              </span>
            )}
          </div>
          <span style={styles.bottomNavLabel}>My Bag</span>
        </NavLink>

        <NavLink
          to="/contact"
          style={({ isActive }) => (isActive ? styles.bottomNavItemActive : styles.bottomNavItem)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            chat
          </span>
          <span style={styles.bottomNavLabel}>Inquire</span>
        </NavLink>
      </nav>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--color-surface, #fbf9f5)',
    color: '#2d2421',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 40,
    backgroundColor: 'rgba(251, 249, 245, 0.94)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid var(--color-border-subtle, #ece8e1)',
    transition: 'all 0.2s ease',
  },
  headerInner: {
    height: '56px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#5c3e36',
    padding: '6px',
    borderRadius: '6px',
  },
  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginLeft: '12px',
  },
  desktopNavLink: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 500,
    color: '#6f6764',
    padding: '6px 12px',
    borderRadius: '9999px',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  },
  desktopNavLinkActive: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    color: '#5c3e36',
    backgroundColor: '#f5ede9',
    padding: '6px 12px',
    borderRadius: '9999px',
    textDecoration: 'none',
  },
  brandCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  brandLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  brandTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '19px',
    fontWeight: 600,
    color: '#5c3e36',
    letterSpacing: '0.02em',
    lineHeight: 1.1,
  },
  brandSubtitle: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '9px',
    letterSpacing: '0.12em',
    color: '#8c5e51',
    textTransform: 'uppercase',
    marginTop: '1px',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  adminBadgeLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    borderRadius: '9999px',
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: 600,
    textDecoration: 'none',
    marginRight: '4px',
  },
  adminBadgeText: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
  },
  iconAction: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#5c3e36',
    padding: '6px',
    borderRadius: '6px',
    textDecoration: 'none',
  },
  bagButton: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#5c3e36',
    padding: '6px',
  },
  bagBadge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    width: '16px',
    height: '16px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontSize: '9px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(45, 36, 33, 0.45)',
    backdropFilter: 'blur(3px)',
    zIndex: 50,
  },
  drawer: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    width: '320px',
    maxWidth: '85vw',
    backgroundColor: '#fbf9f5',
    zIndex: 51,
    boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(92, 62, 54, 0.16))',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--color-border-subtle, #ece8e1)',
  },
  drawerBrandTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '22px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: 0,
  },
  drawerBrandSubtitle: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    color: '#8c5e51',
    margin: '2px 0 0 0',
  },
  drawerCrest: {
    display: 'block',
    fontSize: '10px',
    letterSpacing: '0.06em',
    color: '#6f6764',
    marginTop: '4px',
  },
  closeDrawerButton: {
    color: '#5c3e36',
    padding: '4px',
    borderRadius: '9999px',
  },
  drawerNav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '16px 0',
    overflowY: 'auto',
  },
  drawerLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '9999px',
    color: '#6f6764',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  },
  drawerLinkActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
  },
  drawerAdminLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '9999px',
    backgroundColor: '#f5ede9',
    color: '#5c3e36',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    marginTop: '12px',
    border: '1px solid #ebd8d0',
  },
  drawerFooter: {
    borderTop: '1px solid var(--color-border-subtle, #ece8e1)',
    paddingTop: '14px',
    textAlign: 'center',
  },
  drawerQuote: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontStyle: 'italic',
    fontSize: '13px',
    color: '#8c5e51',
    margin: '0 0 4px 0',
  },
  drawerDhaka: {
    fontSize: '10px',
    color: '#988e8a',
    letterSpacing: '0.04em',
  },
  mainContent: {
    flex: 1,
    paddingBottom: '60px', // padding for mobile bottom bar
  },
  footer: {
    backgroundColor: '#f5f3ef',
    borderTop: '1px solid var(--color-border-subtle, #ece8e1)',
    padding: '48px 16px 80px 16px', // Extra bottom spacing for bottom nav bar
    marginTop: 'auto',
  },
  footerInner: {
    maxWidth: '680px',
    margin: '0 auto',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  },
  footerBrandSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  footerTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '26px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: 0,
  },
  footerAuthor: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    color: '#8c5e51',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  footerTagline: {
    fontSize: '13px',
    color: '#6f6764',
    maxWidth: '420px',
    lineHeight: 1.5,
    marginTop: '4px',
  },
  footerConcierge: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  conciergeIconBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '9999px',
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#5c3e36',
    textDecoration: 'none',
    boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(92,62,54,0.03))',
  },
  footerLinksGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '12px 20px',
  },
  footerLink: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    color: '#6f6764',
    textDecoration: 'none',
    transition: 'color 0.15s ease',
  },
  copyrightRow: {
    borderTop: '1px solid #e7e4df',
    paddingTop: '16px',
    width: '100%',
  },
  copyrightText: {
    fontSize: '11px',
    color: '#988e8a',
    lineHeight: 1.5,
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '56px',
    backgroundColor: 'rgba(251, 249, 245, 0.96)',
    backdropFilter: 'blur(8px)',
    borderTop: '1px solid var(--color-border-subtle, #ece8e1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 45,
    boxShadow: '0 -2px 10px rgba(92, 62, 54, 0.05)',
  },
  bottomNavItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#988e8a',
    textDecoration: 'none',
    padding: '4px',
    minWidth: '60px',
  },
  bottomNavItemActive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#5c3e36',
    textDecoration: 'none',
    padding: '4px',
    minWidth: '60px',
    fontWeight: 600,
  },
  bottomNavLabel: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '10px',
    marginTop: '2px',
  },
};
