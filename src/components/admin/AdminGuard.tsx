/**
 * Ababil’s Attire by Sanjida Bethi
 * Protected Admin Route Guard
 *
 * Verifies that the current user has an active authenticated session
 * and has a verified role ('superadmin' | 'admin' | 'staff') in admin_users.
 * Non-admin users or unauthenticated visitors are redirected to /admin/login.
 */

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface AdminGuardProps {
  children?: React.ReactNode;
  allowedRoles?: Array<'superadmin' | 'admin' | 'staff'>;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children, allowedRoles }) => {
  const { isAdmin, isLoading, admin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCard}>
          <div style={styles.monogram}>AB</div>
          <h2 style={styles.loadingTitle}>Ababil’s Attire Atelier</h2>
          <div style={styles.spinner} />
          <p style={styles.loadingSubtext}>Verifying administrative authorization...</p>
        </div>
      </div>
    );
  }

  // Not logged in or not in admin_users
  if (!isAdmin || !admin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Optional role-level sub-check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(admin.role)) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCard}>
          <div style={styles.monogram}>AB</div>
          <h2 style={styles.loadingTitle}>Restricted Area</h2>
          <p style={styles.errorSubtext}>
            Your role (<strong>{admin.role}</strong>) does not have sufficient permission for this workspace section.
          </p>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-surface, #fbf9f5)',
    padding: '24px',
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '16px',
    padding: '40px 32px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%',
    boxShadow: 'var(--shadow-md, 0 6px 18px rgba(92, 62, 54, 0.08))',
  },
  monogram: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '28px',
    fontWeight: 600,
    color: '#5c3e36',
    letterSpacing: '0.08em',
    marginBottom: '12px',
  },
  loadingTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '20px',
    color: '#2d2421',
    fontWeight: 600,
    marginBottom: '20px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    margin: '0 auto 16px',
    border: '3px solid #f5ede9',
    borderTopColor: '#5c3e36',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingSubtext: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    color: '#6f6764',
  },
  errorSubtext: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '14px',
    color: '#991b1b',
    marginTop: '12px',
  },
};
