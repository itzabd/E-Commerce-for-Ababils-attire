/**
 * Ababil’s Attire by Sanjida Bethi
 * Protected Admin Layout
 *
 * Implements the Stitch Atelier Admin top navigation, session status bar,
 * active admin identifier badge, and secure sign-out trigger.
 */

import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const AdminLayout: React.FC = () => {
  const { admin, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div style={styles.container}>
      {/* Admin Top Navigation Bar */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          {/* Left: Brand Monogram & Admin Pill */}
          <div style={styles.brandGroup}>
            <Link to="/admin" style={styles.brandLink}>
              <span style={styles.monogram}>AB</span>
              <div style={styles.titleStack}>
                <span style={styles.brandTitle}>Ababil’s Attire</span>
                <span style={styles.brandSubtitle}>ATELIER SUITE</span>
              </div>
            </Link>
            <span style={styles.adminPill}>ADMIN</span>
          </div>

          {/* Right: Admin Profile & Actions */}
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
              title="Sign out of Atelier Admin"
            >
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Protected Admin Stage */}
      <main style={styles.main}>
        <Outlet />
      </main>
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
    padding: '6px 10px',
    borderRadius: '6px',
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
    padding: '6px 12px',
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
  },
};
