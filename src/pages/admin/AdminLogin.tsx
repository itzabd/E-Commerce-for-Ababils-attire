/**
 * Ababil’s Attire by Sanjida Bethi
 * Admin Login Page
 *
 * Implements the editorial login portal for Sanjida Bethi and authorized studio staff.
 * Validates Supabase Auth email/password and checks active role in admin_users.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isSupabaseConfigured } from '../../lib/supabase';

export const AdminLogin: React.FC = () => {
  const { signIn, isAdmin, isLoading, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // If already logged in with admin privileges, redirect to intended target or /admin
  const from = (location.state as any)?.from?.pathname || '/admin';

  useEffect(() => {
    if (isAdmin && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [isAdmin, isLoading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim() || !password) {
      setLocalError('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else if (result.error) {
      setLocalError(result.error);
    }
  };

  const displayError = localError || authError;
  const isMissingEnv = !isSupabaseConfigured();

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Monogram Crest */}
        <div style={styles.crestWrapper}>
          <div style={styles.crest}>AB</div>
          <span style={styles.atelierLabel}>ADMIN SUITE</span>
        </div>

        {/* Heading */}
        <div style={styles.headingBlock}>
          <h1 style={styles.title}>Ababil’s Attire</h1>
          <p style={styles.subtitle}>Administrative & Studio Portal</p>
        </div>

        {/* Missing Supabase Env Notice */}
        {isMissingEnv && (
          <div style={styles.warningBox}>
            <strong style={styles.warningTitle}>Supabase Setup Notice</strong>
            <p style={styles.warningText}>
              Supabase URL & Anon Key are not yet configured in <code>.env</code>. Please link your project keys to authenticate live accounts.
            </p>
          </div>
        )}

        {/* Auth Error Alert */}
        {displayError && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>!</span>
            <div style={styles.errorContent}>
              <span style={styles.errorText}>{displayError}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label htmlFor="admin-email" style={styles.label}>
              Studio Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sanjida@ababilsattire.com"
              disabled={isSubmitting}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <div style={styles.labelRow}>
              <label htmlFor="admin-password" style={styles.label}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={styles.togglePasswordButton}
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div style={styles.passwordWrapper}>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter studio password"
                disabled={isSubmitting}
                required
                style={styles.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isMissingEnv}
            style={{
              ...styles.submitButton,
              opacity: isSubmitting || isMissingEnv ? 0.7 : 1,
              cursor: isSubmitting || isMissingEnv ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? (
              <span style={styles.buttonLoading}>
                <span style={styles.miniSpinner} />
                Verifying Credentials...
              </span>
            ) : (
              'Sign In to Admin Suite'
            )}
          </button>
        </form>

        {/* Security & Role Notice */}
        <div style={styles.footerNotice}>
          <p style={styles.noticeText}>
            Access strictly restricted to authorized administrators (<code>superadmin</code>, <code>admin</code>, <code>staff</code>).
          </p>
        </div>

        {/* Return to Storefront */}
        <div style={styles.storefrontReturn}>
          <Link to="/" style={styles.returnLink}>
            ← Return to Customer Storefront
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-surface, #fbf9f5)',
    padding: '24px 16px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '16px',
    padding: '40px 32px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: 'var(--shadow-md, 0 6px 18px rgba(92, 62, 54, 0.08))',
    textAlign: 'center',
  },
  crestWrapper: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '16px',
  },
  crest: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '34px',
    fontWeight: 700,
    color: '#5c3e36',
    letterSpacing: '0.06em',
    lineHeight: 1,
  },
  atelierLabel: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    color: '#8c5e51',
    marginTop: '6px',
    padding: '2px 8px',
    backgroundColor: '#f5ede9',
    borderRadius: '9999px',
  },
  headingBlock: {
    marginBottom: '28px',
  },
  title: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '24px',
    fontWeight: 600,
    color: '#2d2421',
    marginBottom: '4px',
  },
  subtitle: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    color: '#6f6764',
  },
  warningBox: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '8px',
    padding: '12px 14px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  warningTitle: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#92400e',
    marginBottom: '4px',
  },
  warningText: {
    fontSize: '12px',
    color: '#78350f',
    lineHeight: 1.4,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '12px 14px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  errorIcon: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#991b1b',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 700,
    flexShrink: 0,
    marginTop: '1px',
  },
  errorContent: {
    flex: 1,
  },
  errorText: {
    fontSize: '13px',
    color: '#991b1b',
    lineHeight: 1.4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    textAlign: 'left',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 600,
    color: '#2d2421',
    letterSpacing: '0.01em',
  },
  togglePasswordButton: {
    fontSize: '11px',
    color: '#6f6764',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  passwordWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    height: '44px',
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '10px',
    padding: '0 14px',
    fontSize: '14px',
    color: '#2d2421',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  submitButton: {
    width: '100%',
    height: '46px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    borderRadius: '9999px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '8px',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.08))',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
  },
  buttonLoading: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  miniSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  footerNotice: {
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #ece8e1',
  },
  noticeText: {
    fontSize: '11px',
    color: '#988e8a',
    lineHeight: 1.4,
  },
  storefrontReturn: {
    marginTop: '16px',
  },
  returnLink: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#5c3e36',
    textDecoration: 'none',
  },
};
