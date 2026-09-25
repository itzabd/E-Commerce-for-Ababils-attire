/**
 * Ababil’s Attire by Sanjida Bethi
 * Protected Admin Layout
 *
 * Implements the Stitch Atelier Admin top navigation, sub-navigation tabs,
 * active route indicator, active admin identifier badge, and secure sign-out trigger.
 */

import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { settingsService } from '../services/settings.service';
import type { StoreSettings } from '../types';

export const AdminLayout: React.FC = () => {
  const { admin, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    // Initial fetch
    settingsService.getSettings().then((s) => setStoreSettings(s));

    // Listen to settings update events
    const handleSettingsUpdated = (e: any) => {
      if (e.detail) setStoreSettings(e.detail);
    };
    window.addEventListener('store_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('store_settings_updated', handleSettingsUpdated);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  const isDashboardActive = location.pathname === '/admin' || location.pathname === '/admin/';
  const isOrdersActive = location.pathname.startsWith('/admin/orders');
  const isProductsActive = location.pathname.startsWith('/admin/products');
  const isCustomersActive = location.pathname.startsWith('/admin/customers');
  const isSettingsActive = location.pathname.startsWith('/admin/settings');

  const navItems = [
    {
      to: '/admin',
      label: 'Dashboard',
      icon: 'grid_view',
      isActive: isDashboardActive,
    },
    {
      to: '/admin/orders',
      label: 'Orders',
      icon: 'receipt_long',
      isActive: isOrdersActive,
    },
    {
      to: '/admin/products',
      label: 'Products',
      icon: 'checkroom',
      isActive: isProductsActive,
    },
    {
      to: '/admin/customers',
      label: 'Customers',
      icon: 'group',
      isActive: isCustomersActive,
    },
    {
      to: '/admin/settings',
      label: 'Settings',
      icon: 'tune',
      isActive: isSettingsActive,
    },
  ];

  return (
    <div style={styles.container} className="admin-app-root">
      {/* ===================================================================== */}
      {/* 1. DESKTOP STITCH STUDIO SIDEBAR (Visible >= 960px)                   */}
      {/* ===================================================================== */}
      <aside className="stitch-admin-desktop-sidebar">
        {/* Brand Workspace Title */}
        <div className="stitch-admin-sidebar-header">
          <Link to="/admin" className="stitch-admin-sidebar-brand">
            <span className="stitch-admin-sidebar-brand-name">Ababil’s Attire</span>
            <span className="stitch-admin-sidebar-brand-sub">STUDIO WORKSPACE</span>
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="stitch-admin-sidebar-nav" aria-label="Desktop Studio Navigation">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`stitch-admin-sidebar-link ${item.isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined stitch-admin-sidebar-icon">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer: Storefront Quick Link */}
        <div className="stitch-admin-sidebar-footer">
          <Link to="/" className="stitch-admin-storefront-btn">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              storefront
            </span>
            <span>Storefront Quick Link</span>
          </Link>
          <div className="stitch-admin-sync-indicator">
            <span className="stitch-admin-sync-dot"></span>
            <span>Studio Synchronized</span>
          </div>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* 2. MAIN WORKSPACE AREA (Header + Content Stage)                       */}
      {/* ===================================================================== */}
      <div className="stitch-admin-stage-wrapper">
        {/* DESKTOP TOP BAR (Visible >= 960px) */}
        <header className="stitch-admin-desktop-topbar">
          <div className="stitch-admin-topbar-left">
            <div className="stitch-admin-topbar-brand-chip">
              <span className="stitch-admin-chip-title">ABABIL’S ATTIRE</span>
              <span className="stitch-admin-chip-sub">Admin Panel &amp; Studio Suite</span>
            </div>
            <div className="stitch-admin-topbar-location">
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#7e544f' }}>
                location_on
              </span>
              <span>Studio Atelier</span>
            </div>
          </div>

          <div className="stitch-admin-topbar-right">
            {/* Search Input */}
            <div className="stitch-admin-search-pill">
              <span className="material-symbols-outlined stitch-admin-search-icon">search</span>
              <input
                type="text"
                placeholder="Search orders, inventory, patrons..."
                className="stitch-admin-search-input"
              />
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="stitch-admin-icon-btn"
              title="Notifications"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                notifications
              </span>
              <span className="stitch-admin-notification-badge"></span>
            </button>

            {/* Admin Lead Profile Chip */}
            <div className="stitch-admin-lead-chip">
              <div className="stitch-admin-lead-avatar">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  person
                </span>
              </div>
              <div className="stitch-admin-lead-info">
                <span className="stitch-admin-lead-name">{admin?.full_name || 'Sanjida Bethi'}</span>
                <span className="stitch-admin-lead-role">{admin?.role?.toUpperCase() || 'LEAD ARTISAN'}</span>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              style={styles.signOutButton}
              title="Sign out of Admin Suite"
            >
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </header>

        {/* MOBILE TOP BAR (Protected for < 960px) */}
        <header style={styles.header} className="stitch-admin-mobile-header">
          <div style={styles.headerInner}>
            <div style={styles.brandGroup}>
              <Link to="/admin" style={styles.brandLink}>
                {storeSettings?.logo_url ? (
                  <img
                    src={storeSettings.logo_url}
                    alt="Store Logo"
                    style={styles.logoImage}
                  />
                ) : (
                  <span style={styles.monogram}>AB</span>
                )}
                <div style={styles.titleStack}>
                  <span style={styles.brandTitle}>Ababil’s Attire</span>
                  <span style={styles.brandSubtitle}>ADMIN SUITE</span>
                </div>
              </Link>
              <span style={styles.adminPill}>ADMIN</span>
            </div>

            <div style={styles.actionGroup}>
              <Link to="/" style={styles.storefrontLink} title="View Customer Storefront">
                Storefront ↗
              </Link>

              <div style={styles.profileBadge}>
                <div style={styles.avatar}>
                  {admin?.full_name ? admin.full_name.slice(0, 2).toUpperCase() : 'SB'}
                </div>
                <div style={styles.profileText}>
                  <span style={styles.profileName}>{admin?.full_name || user?.email || 'Admin'}</span>
                  <span style={styles.roleTag}>{admin?.role?.toUpperCase() || 'STAFF'}</span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                style={styles.signOutButton}
                title="Sign out of Admin Suite"
              >
                {isSigningOut ? '...' : 'Exit'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Protected Admin Stage */}
        <main style={styles.main} className="stitch-admin-main-stage">
          <Outlet />
        </main>
      </div>

      {/* DOCKED BOTTOM NAVIGATION BAR (Mobile Only - Protected for < 960px) */}
      <nav style={styles.bottomNav} className="stitch-admin-mobile-dock" aria-label="Admin Dock Navigation">
        {navItems.map((item) => {
          const color = item.isActive ? '#432821' : '#8c827a';
          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                ...styles.bottomNavItem,
                color,
              }}
              title={item.label}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '22px',
                  color,
                  transition: 'color 0.2s ease',
                }}
              >
                {item.icon}
              </span>
              <span
                style={{
                  ...styles.bottomNavLabel,
                  fontWeight: item.isActive ? 700 : 500,
                  color,
                }}
              >
                {item.label}
              </span>
              {/* Active Indicator Dot directly underneath */}
              <div
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: item.isActive ? '#432821' : 'transparent',
                  marginTop: '2px',
                  transition: 'background-color 0.2s ease',
                }}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--color-surface, #fbf9f5)',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid var(--color-border-subtle, #ece8e1)',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.04))',
  },
  headerInner: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brandLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  monogram: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '22px',
    fontWeight: 700,
    color: '#5c3e36',
    letterSpacing: '0.04em',
  },
  logoImage: {
    maxHeight: '34px',
    maxWidth: '120px',
    objectFit: 'contain',
    borderRadius: '4px',
  },
  titleStack: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '15px',
    fontWeight: 600,
    color: '#2d2421',
    lineHeight: 1.2,
  },
  brandSubtitle: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#988e8a',
  },
  adminPill: {
    backgroundColor: '#f5ede9',
    color: '#5c3e36',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    padding: '3px 8px',
    borderRadius: '9999px',
    border: '1px solid #ebd8d0',
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  storefrontLink: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 500,
    color: '#6f6764',
    textDecoration: 'none',
    padding: '0 12px',
    minHeight: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '8px',
    backgroundColor: '#f5f3ef',
    border: '1px solid #dfd8ce',
    transition: 'all 0.2s ease',
  },
  profileBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 10px',
    borderRadius: '8px',
    backgroundColor: '#fdfbf7',
    border: '1px solid #ece8e1',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 700,
  },
  profileText: {
    display: 'flex',
    flexDirection: 'column',
  },
  profileName: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2d2421',
    lineHeight: 1.2,
  },
  roleTag: {
    fontSize: '9px',
    fontWeight: 600,
    color: '#8c5e51',
    letterSpacing: '0.04em',
  },
  signOutButton: {
    backgroundColor: 'transparent',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '0 14px',
    minHeight: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  main: {
    flex: 1,
    maxWidth: '1280px',
    width: '100%',
    margin: '0 auto',
    padding: '24px 20px',
    paddingBottom: '96px',
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '64px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #ebdcd6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 50,
    boxShadow: '0 -2px 10px rgba(67, 40, 33, 0.05)',
  },
  bottomNavItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    padding: '6px 12px',
    minWidth: '56px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.15s ease',
  },
  bottomNavLabel: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '11px',
    marginTop: '3px',
    lineHeight: 1,
    letterSpacing: '0.01em',
  },
};
