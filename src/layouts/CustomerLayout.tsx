/**
 * Ababil’s Attire by Sanjida Bethi
 * Customer Storefront Layout (Mirrors Stitch project 1646646279704595948)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { CartAddedNotification } from '../components/customer/CartAddedNotification';
import { STUDIO_CONFIG, getStudioWhatsAppUrl } from '../lib/studio';
import { settingsService } from '../services/settings.service';
import type { StoreSettings } from '../types';

export const CustomerLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [secretToast, setSecretToast] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [logoImgError, setLogoImgError] = useState(false);
  const { isAdmin } = useAuth();
  const { itemCount, isBagBouncing } = useCart();
  const navigate = useNavigate();
  const [desktopSearch, setDesktopSearch] = useState('');

  useEffect(() => {
    settingsService.getSettings().then((s) => {
      setStoreSettings(s);
      setLogoImgError(false);
    });
    const handleSettingsUpdated = (e: any) => {
      if (e.detail) {
        setStoreSettings(e.detail);
        setLogoImgError(false);
      }
    };
    window.addEventListener('store_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('store_settings_updated', handleSettingsUpdated);
  }, []);

  useEffect(() => {
    setLogoImgError(false);
  }, [storeSettings?.logo_url]);

  const secretTapCountRef = useRef(0);
  const secretTapTimerRef = useRef<any>(null);

  const closeDrawer = () => setDrawerOpen(false);

  // Secret Admin Login Trigger
  const triggerSecretAdminLogin = useCallback(() => {
    setSecretToast('Entering Ababil Studio Management Suite...');
    setTimeout(() => {
      navigate('/admin/login');
      setSecretToast(null);
    }, 600);
  }, [navigate]);

  const handleSecretTap = () => {
    secretTapCountRef.current += 1;
    if (secretTapTimerRef.current) clearTimeout(secretTapTimerRef.current);

    if (secretTapCountRef.current >= 3) {
      secretTapCountRef.current = 0;
      triggerSecretAdminLogin();
    } else {
      secretTapTimerRef.current = setTimeout(() => {
        secretTapCountRef.current = 0;
      }, 1500);
    }
  };

  // Keyboard shortcut listener for secret admin login (Ctrl+Shift+A or Cmd+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        triggerSecretAdminLogin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSecretAdminLogin]);

  // Close navigation drawer with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Determine clean brand title and subtitle without duplicating "by Sanjida Bethi"
  const rawStoreName = (storeSettings?.store_name || "Ababil’s Attire by Sanjida Bethi").trim();
  const hasAuthorInName = /by\s+Sanjida\s+Bethi/i.test(rawStoreName);
  const mainBrandName = hasAuthorInName
    ? rawStoreName.replace(/by\s+Sanjida\s+Bethi/i, '').trim()
    : rawStoreName;
  const headerSubtitleText = hasAuthorInName
    ? "Handmade Dresses & Homemade Cakes"
    : "Handmade Dresses & Homemade Cakes • by Sanjida Bethi";

  return (
    <div style={styles.pageContainer}>
      {/* Floating Add to Cart Notification */}
      <CartAddedNotification />

      {/* Secret Admin Transition Toast */}
      {secretToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '84px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#301310',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            zIndex: 9999,
            letterSpacing: '0.02em',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#f3c4be' }}>
            vpn_key
          </span>
          <span>{secretToast}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* 1A. STITCH DESKTOP 2-ROW HEADER (Visible >= 960px)                */}
      {/* Faithfully implements Stitch Project 13092249108045248978 PC View */}
      {/* ================================================================= */}
      <header className="stitch-desktop-header">
        <div className="stitch-desktop-header-inner">
          {/* Row 1: Brand & Atelier Action Cluster */}
          <div className="stitch-desktop-header-top-row">
            <div className="stitch-desktop-brand-wrapper">
              <Link to="/" className="stitch-desktop-brand-link">
                <span className="stitch-desktop-brand-title">
                  {mainBrandName || "Ababil’s Attire"}{' '}
                  <span className="stitch-desktop-brand-author">by Sanjida Bethi</span>
                </span>
                <span className="stitch-desktop-brand-subtitle">
                  HANDMADE DRESSES &amp; FRESH CELEBRATION CAKES
                </span>
              </Link>
            </div>

            <div className="stitch-desktop-header-actions">
              {/* Search Atelier Pill */}
              <div className="stitch-desktop-search-pill">
                <span className="material-symbols-outlined stitch-desktop-search-icon">search</span>
                <input
                  type="text"
                  placeholder="Search atelier..."
                  value={desktopSearch}
                  onChange={(e) => setDesktopSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const q = desktopSearch.trim();
                      navigate(q ? `/dresses?search=${encodeURIComponent(q)}` : '/dresses');
                    }
                  }}
                  className="stitch-desktop-search-input"
                  aria-label="Search atelier"
                />
              </div>

              {/* Currency */}
              <div className="stitch-desktop-currency">
                <span>BDT ৳</span>
              </div>

              {/* WhatsApp Concierge */}
              <a
                href={getStudioWhatsAppUrl('Assalamu Alaikum Sanjida Apu, I would like to inquire about an order.')}
                target="_blank"
                rel="noopener noreferrer"
                className="stitch-desktop-concierge-pill"
                title="Chat with Atelier Concierge"
              >
                <span className="material-symbols-outlined stitch-desktop-concierge-icon">chat</span>
                <span>CONCIERGE</span>
              </a>

              {/* My Bag */}
              <Link
                to="/bag"
                className={`stitch-desktop-bag-pill ${isBagBouncing ? 'bag-bounce-active' : ''}`}
                title={`Shopping Bag (${itemCount} items)`}
              >
                <span className="material-symbols-outlined stitch-desktop-bag-icon">shopping_bag</span>
                <span className="stitch-desktop-bag-text">MY BAG</span>
                <span className="stitch-desktop-bag-count">{itemCount}</span>
              </Link>

              {/* User / Admin Access */}
              <Link
                to={isAdmin ? "/admin" : "/admin/login"}
                className="stitch-desktop-user-btn"
                title={isAdmin ? "Studio Admin Suite" : "Atelier Access"}
                onClick={() => {
                  handleSecretTap();
                }}
              >
                <span className="material-symbols-outlined stitch-desktop-user-icon">
                  {isAdmin ? 'shield_person' : 'person'}
                </span>
              </Link>
            </div>
          </div>

          {/* Row 2: Centered Horizontal Nav */}
          <nav className="stitch-desktop-nav-row" aria-label="Desktop Navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `stitch-desktop-nav-link ${isActive ? 'active' : ''}`
              }
            >
              HOME
            </NavLink>
            <NavLink
              to="/dresses"
              className={({ isActive }) =>
                `stitch-desktop-nav-link ${isActive ? 'active' : ''}`
              }
            >
              HANDMADE DRESSES
            </NavLink>
            <NavLink
              to="/cakes"
              className={({ isActive }) =>
                `stitch-desktop-nav-link ${isActive ? 'active' : ''}`
              }
            >
              CELEBRATION CAKES
            </NavLink>
            <NavLink
              to="/track-order"
              className={({ isActive }) =>
                `stitch-desktop-nav-link ${isActive ? 'active' : ''}`
              }
            >
              TRACK ORDER
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `stitch-desktop-nav-link ${isActive ? 'active' : ''}`
              }
            >
              ABOUT ARTISAN
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `stitch-desktop-nav-link ${isActive ? 'active' : ''}`
              }
            >
              CONTACT
            </NavLink>
          </nav>
        </div>
      </header>

      {/* ================================================================= */}
      {/* 1B. PROTECTED MOBILE HEADER (Visible < 960px)                     */}
      {/* ================================================================= */}
      <header style={styles.header} className="stitch-mobile-header">
        <div style={styles.headerInner} className="customer-header-inner">
          {/* Left: Mobile Drawer Toggle */}
          <div style={styles.leftGroup}>
            <button
              type="button"
              aria-label="Open Navigation Drawer"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              style={styles.menuButton}
              className="customer-mobile-menu-btn"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                menu
              </span>
            </button>
          </div>

          {/* Center: Brand Identity (Mathematically centered across viewports) */}
          <div style={styles.brandCenter} className="customer-brand-center">
            <Link to="/" style={styles.brandLink} className="customer-brand-link">
              {storeSettings?.logo_url && !logoImgError && (
                <div style={styles.brandLogoWrapper} className="customer-brand-logo-wrapper">
                  <img
                    src={storeSettings.logo_url}
                    alt="Ababil’s Attire Logo"
                    onError={() => setLogoImgError(true)}
                    style={styles.brandLogoImg}
                  />
                </div>
              )}
              <div style={styles.brandTextStack} className="customer-brand-text-stack">
                <span style={styles.brandTitle} className="customer-brand-title">
                  {rawStoreName}
                </span>
                <span
                  style={styles.brandSubtitle}
                  className="customer-brand-subtitle"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSecretTap();
                  }}
                  title="Ababil’s Attire by Sanjida Bethi"
                  role="button"
                  tabIndex={-1}
                >
                  {headerSubtitleText}
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Actions Cluster (Track Order, Bag, Admin) */}
          <div style={styles.rightGroup} className="customer-right-group">
            {isAdmin && (
              <Link
                to="/admin"
                style={styles.adminBadgeLink}
                className="customer-header-admin-badge"
                title="Studio Admin Suite"
              >
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
              className={`customer-header-bag-btn ${isBagBouncing ? 'bag-bounce-active' : ''}`}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {storeSettings?.logo_url && !logoImgError && (
              <div style={styles.drawerLogoWrapper}>
                <img
                  src={storeSettings.logo_url}
                  alt="Ababil’s Attire Logo"
                  style={styles.drawerLogoImg}
                />
              </div>
            )}
            <div>
              <h2 style={styles.drawerBrandTitle}>Ababil’s Attire</h2>
              <p style={styles.drawerBrandSubtitle}>by Sanjida Bethi</p>
              <span style={styles.drawerCrest}>Handmade Dresses & Homemade Cakes</span>
            </div>
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
            <span>Home</span>
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
            <span>Custom Orders & Contact</span>
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
              <span>Admin Suite</span>
            </Link>
          )}
        </nav>

        {/* Drawer Footer Quote & Discreet Studio Access */}
        <div style={styles.drawerFooter}>
          <p style={styles.drawerQuote}>"Stitched with love, baked with care."</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <p style={styles.drawerDhaka}>{storeSettings?.workshop_address || "Studio • Dhaka, Bangladesh"}</p>
            <button
              type="button"
              onClick={() => {
                closeDrawer();
                triggerSecretAdminLogin();
              }}
              title="Atelier Security"
              aria-label="Studio Lock"
              style={{
                background: 'none',
                border: 'none',
                color: '#bfae9e',
                cursor: 'pointer',
                padding: '2px',
                display: 'inline-flex',
                alignItems: 'center',
                opacity: 0.45,
                transition: 'opacity 0.2s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                lock
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* ================================================================= */}
      {/* MAIN CONTENT OUTLET                                              */}
      {/* ================================================================= */}
      <main style={styles.mainContent} className="customer-main-content">
        <Outlet />
      </main>

      {/* ================================================================= */}
      {/* ATELIER FOOTER (Anchor Implementation)                            */}
      {/* ================================================================= */}
      <footer style={styles.footer} className="customer-footer">
        <div style={styles.footerInner}>
          {/* Brand Header */}
          <div style={styles.footerBrandSection}>
            {storeSettings?.logo_url && !logoImgError && (
              <div style={styles.footerLogoWrapper}>
                <img
                  src={storeSettings.logo_url}
                  alt="Ababil’s Attire Logo"
                  style={styles.footerLogoImg}
                />
              </div>
            )}
            <h2 style={styles.footerTitle}>{rawStoreName}</h2>
            {!hasAuthorInName && <p style={styles.footerAuthor}>by Sanjida Bethi</p>}
            <p style={styles.footerTagline}>
              {storeSettings?.store_description || "Sweet handmade dresses for little girls and delicious homemade cakes for your family celebrations."}
            </p>
          </div>

          {/* Concierge Communication Buttons */}
          <div style={styles.footerConcierge}>
            <a
              href={getStudioWhatsAppUrl(undefined, storeSettings?.whatsapp_number || storeSettings?.contact_phone)}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.conciergeIconBtn}
              aria-label="WhatsApp"
              title={`WhatsApp: ${storeSettings?.whatsapp_number || storeSettings?.contact_phone || 'Direct Line'}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                chat
              </span>
            </a>
            <a
              href={storeSettings?.instagram_handle
                ? (storeSettings.instagram_handle.startsWith('http')
                    ? storeSettings.instagram_handle
                    : `https://instagram.com/${storeSettings.instagram_handle.replace(/^@/, '')}`)
                : STUDIO_CONFIG.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.conciergeIconBtn}
              aria-label="Instagram"
              title="Follow on Instagram"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                photo_camera
              </span>
            </a>
            {storeSettings?.facebook_url && (
              <a
                href={storeSettings.facebook_url.startsWith('http') ? storeSettings.facebook_url : `https://${storeSettings.facebook_url}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.conciergeIconBtn}
                aria-label="Facebook"
                title="Follow on Facebook"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  thumb_up
                </span>
              </a>
            )}
            <a
              href={`mailto:${storeSettings?.business_email || STUDIO_CONFIG.conciergeEmail}`}
              style={styles.conciergeIconBtn}
              aria-label="Email Studio"
              title="Email Studio Concierge"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                mail
              </span>
            </a>
            <a
              href={`tel:${(storeSettings?.contact_phone || storeSettings?.whatsapp_number || STUDIO_CONFIG.phone).replace(/\s+/g, '')}`}
              style={styles.conciergeIconBtn}
              aria-label="Call Studio"
              title="Call Studio Directly"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                call
              </span>
            </a>
          </div>

          {/* Quick Footer Links (Confidential boutique storefront — no overt admin link) */}
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
            <span
              onClick={handleSecretTap}
              style={{ ...styles.footerLink, cursor: 'default', userSelect: 'none' }}
              title="Dhaka Studio Atelier"
            >
              {storeSettings?.workshop_address ? storeSettings.workshop_address.split(',')[0] : "Dhaka Atelier"}
            </span>
          </div>

          {/* Studio Physical Details Banner */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(223, 216, 206, 0.4)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            fontSize: '12px',
            color: '#7e726b',
            textAlign: 'center'
          }}>
            {storeSettings?.workshop_address && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#8a6552' }}>location_on</span>
                {storeSettings.workshop_address}
              </span>
            )}
            {storeSettings?.studio_hours && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#8a6552' }}>schedule</span>
                {storeSettings.studio_hours}
              </span>
            )}
            {(storeSettings?.whatsapp_number || storeSettings?.contact_phone) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#8a6552' }}>phone_in_talk</span>
                Direct: {storeSettings.whatsapp_number || storeSettings.contact_phone}
              </span>
            )}
          </div>

          {/* Copyright (Triple-tap to enter Studio Admin) */}
          <div style={styles.copyrightRow}>
            <p
              style={{ ...styles.copyrightText, cursor: 'default', userSelect: 'none' }}
              onClick={handleSecretTap}
              title="Ababil’s Attire by Sanjida Bethi (Triple-tap for Atelier admin)"
            >
              © {new Date().getFullYear()} {storeSettings?.store_name || "Ababil’s Attire by Sanjida Bethi"}. All Rights Reserved. • {storeSettings?.workshop_address || "Dhaka, Bangladesh"}
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
          className={isBagBouncing ? 'bag-bounce-active' : ''}
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
    minHeight: '64px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '8px 16px',
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifySelf: 'start',
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#5c3e36',
    padding: '6px',
    borderRadius: '6px',
    minWidth: '44px',
    minHeight: '44px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
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
    alignItems: 'center',
    justifyContent: 'center',
    justifySelf: 'center',
    maxWidth: '65vw',
  },
  brandLink: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  brandLogoWrapper: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    border: '1.5px solid #ebd8d0',
    boxShadow: '0 2px 8px rgba(92, 62, 54, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandLogoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  brandTextStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '2px',
  },
  brandTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '20px',
    fontWeight: 600,
    color: '#5c3e36',
    letterSpacing: '0.02em',
    lineHeight: 1.15,
    whiteSpace: 'nowrap',
  },
  brandSubtitle: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '9.5px',
    letterSpacing: '0.12em',
    color: '#8c5e51',
    textTransform: 'uppercase',
    cursor: 'default',
    userSelect: 'none',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
  rightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    justifySelf: 'end',
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
    minWidth: '44px',
    minHeight: '44px',
  },
  bagButton: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#5c3e36',
    padding: '6px',
    minWidth: '44px',
    minHeight: '44px',
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
  drawerLogoWrapper: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    border: '1.5px solid #ebd8d0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  drawerLogoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
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
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
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
    gap: '6px',
  },
  footerLogoWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    border: '1.5px solid #ebd8d0',
    boxShadow: '0 2px 8px rgba(92, 62, 54, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '6px',
  },
  footerLogoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
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
    width: '44px',
    height: '44px',
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
    minHeight: '44px',
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
    minHeight: '44px',
    fontWeight: 600,
  },
  bottomNavLabel: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '10px',
    marginTop: '2px',
  },
};
