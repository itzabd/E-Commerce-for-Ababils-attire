import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ordersService } from '../../services/orders.service';
import { productsService } from '../../services/products.service';
import { adminService } from '../../services/admin.service';
import { supabase } from '../../lib/supabase';

export const AdminDashboard: React.FC = () => {
  const { admin, user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    dressCount: 0,
    cakeCount: 0,
    totalCustomers: 0,
    repeatRate: 0,
  });

  const loadStats = async () => {
    try {
      const [ordersRes, prods, custDir] = await Promise.all([
        ordersService.getOrdersAdmin(),
        productsService.getAllProductsAdmin(),
        adminService.getCustomersDirectory(),
      ]);

      const orders = Array.isArray(ordersRes) ? ordersRes : [];
      const activeOrders = orders.filter((o: any) => o.status !== 'cancelled');
      const pending = activeOrders.filter((o: any) => o.status === 'review_required' || o.advance_status === 'pending').length;
      const dresses = prods.filter((p: any) => p.category === 'dress').length;
      const cakes = prods.filter((p: any) => p.category === 'cake').length;

      setStats({
        totalOrders: activeOrders.length,
        pendingOrders: pending,
        totalProducts: prods.length,
        dressCount: dresses,
        cakeCount: cakes,
        totalCustomers: custDir.metrics?.total_customers || 0,
        repeatRate: custDir.metrics?.repeat_customer_rate || 0,
      });
    } catch (err) {
      console.warn('Dashboard stats load error:', err);
    }
  };

  useEffect(() => {
    loadStats();

    const channel = supabase
      .channel('dashboard-metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, loadStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={styles.container}>
      {/* Welcome Banner */}
      <div style={styles.banner}>
        <div style={styles.bannerText}>
          <div style={styles.badgeRow}>
            <span style={styles.badge}>ADMIN AUTHENTICATION VERIFIED</span>
            <span style={styles.liveStoreBadge}>● STUDIO LIVE</span>
          </div>
          <h1 style={styles.welcomeTitle}>Welcome, {admin?.full_name || 'Administrator'}</h1>
          <p style={styles.welcomeSubtitle}>
            Administrative access confirmed for <strong style={{ color: '#2d2421' }}>{user?.email}</strong> with active role{' '}
            <span style={styles.roleHighlight}>[{admin?.role?.toUpperCase() || 'STAFF'}]</span>.
          </p>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div style={styles.metricsGrid}>
        <Link to="/admin/orders" style={{ ...styles.metricCard, textDecoration: 'none' }}>
          <div style={styles.metricHeader}>
            <span style={styles.metricLabel}>Total Orders</span>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#8c5e51' }}>
              receipt_long
            </span>
          </div>
          <div style={styles.metricValueRow}>
            <span style={styles.metricValue}>{stats.totalOrders}</span>
            {stats.pendingOrders > 0 && (
              <span style={styles.pendingBadge}>{stats.pendingOrders} pending</span>
            )}
          </div>
          <p style={styles.metricHint}>Client inquiries and placed orders</p>
        </Link>

        <Link to="/admin/products" style={{ ...styles.metricCard, textDecoration: 'none' }}>
          <div style={styles.metricHeader}>
            <span style={styles.metricLabel}>Product Archive</span>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#8c5e51' }}>
              checkroom
            </span>
          </div>
          <div style={styles.metricValueRow}>
            <span style={styles.metricValue}>{stats.totalProducts}</span>
            <span style={styles.categorySplit}>
              {stats.dressCount} dresses • {stats.cakeCount} cakes
            </span>
          </div>
          <p style={styles.metricHint}>Handmade dresses and fresh cakes</p>
        </Link>

        <Link to="/admin/customers" style={{ ...styles.metricCard, textDecoration: 'none' }}>
          <div style={styles.metricHeader}>
            <span style={styles.metricLabel}>Atelier Clients</span>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#8c5e51' }}>
              group
            </span>
          </div>
          <div style={styles.metricValueRow}>
            <span style={styles.metricValue}>{stats.totalCustomers}</span>
            <span style={styles.repeatBadge}>{stats.repeatRate}% repeat</span>
          </div>
          <p style={styles.metricHint}>Client directory in Dhaka</p>
        </Link>

        <Link to="/admin/settings" style={{ ...styles.metricCard, textDecoration: 'none' }}>
          <div style={styles.metricHeader}>
            <span style={styles.metricLabel}>bKash Advance</span>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#8c5e51' }}>
              verified
            </span>
          </div>
          <div style={styles.metricValueRow}>
            <span style={styles.metricValue}>৳ 500</span>
            <span style={styles.verifiedBadge}>Standard</span>
          </div>
          <p style={styles.metricHint}>Per order booking requirement</p>
        </Link>
      </div>

      {/* Quick Actions Hub */}
      <div style={styles.actionsCard}>
        <div style={styles.actionsHeader}>
          <h2 style={styles.actionsTitle}>Quick Atelier Actions</h2>
          <p style={styles.actionsSubtitle}>Direct shortcuts to manage the boutique catalog and dockets</p>
        </div>
        <div style={styles.actionBtnGroup}>
          <Link to="/admin/products" style={styles.primaryActionBtn}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              add_circle
            </span>
            <span>Manage Products</span>
          </Link>

          <Link to="/admin/orders" style={styles.secondaryActionBtn}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              orders
            </span>
            <span>Review Orders</span>
          </Link>

          <Link to="/admin/customers" style={styles.secondaryActionBtn}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              person_search
            </span>
            <span>Client Directory</span>
          </Link>

          <Link to="/admin/settings" style={styles.secondaryActionBtn}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              tune
            </span>
            <span>Store Settings</span>
          </Link>
        </div>
      </div>

      {/* Security & Verification Matrix */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Identity & Role</h2>
          <div style={styles.detailRow}>
            <span style={styles.label}>Full Name:</span>
            <span style={styles.value}>{admin?.full_name || 'Sanjida Bethi'}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Email Address:</span>
            <span style={styles.value}>{admin?.email || user?.email}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Administrative Role:</span>
            <span style={styles.value}>
              <span style={styles.rolePill}>{admin?.role || 'SUPERADMIN'}</span>
            </span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.label}>Account UUID:</span>
            <span style={styles.monoValue}>{user?.id?.slice(0, 18) || 'Authenticated'}...</span>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Security & Access Enforcement</h2>
          <div style={styles.statusItem}>
            <span style={styles.checkIcon}>✓</span>
            <div>
              <strong style={styles.statusLabel}>Supabase Auth Session:</strong>
              <p style={styles.statusDesc}>Active, persisted, auto-refreshing JWT token.</p>
            </div>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.checkIcon}>✓</span>
            <div>
              <strong style={styles.statusLabel}>Table Authorization:</strong>
              <p style={styles.statusDesc}>Verified against <code>admin_users</code> with active status.</p>
            </div>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.checkIcon}>✓</span>
            <div>
              <strong style={styles.statusLabel}>PostgreSQL RLS:</strong>
              <p style={styles.statusDesc}>Full CRUD permissions granted via security definer function.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1280px',
    margin: '0 auto',
    width: '100%',
  },
  banner: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '14px',
    padding: '24px 28px',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.04))',
  },
  bannerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '4px',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    padding: '3px 10px',
    borderRadius: '9999px',
  },
  liveStoreBadge: {
    display: 'inline-block',
    backgroundColor: '#f5ede9',
    color: '#5c3e36',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    padding: '3px 10px',
    borderRadius: '9999px',
  },
  welcomeTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '26px',
    color: '#2d2421',
    fontWeight: 600,
    lineHeight: 1.3,
    margin: '4px 0',
  },
  welcomeSubtitle: {
    fontSize: '14px',
    color: '#6f6764',
    lineHeight: 1.6,
    margin: '2px 0 0 0',
  },
  roleHighlight: {
    color: '#5c3e36',
    fontWeight: 700,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '12px',
    padding: '20px 22px',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.04))',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#6f6764',
    letterSpacing: '0.02em',
  },
  metricValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
    margin: '4px 0',
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#2d2421',
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    lineHeight: 1.1,
  },
  pendingBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#b45309',
    backgroundColor: '#fef3c7',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  categorySplit: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#8c5e51',
  },
  repeatBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#065f46',
    backgroundColor: '#ecfdf5',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  verifiedBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#065f46',
    backgroundColor: '#ecfdf5',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  metricHint: {
    fontSize: '12px',
    color: '#988e8a',
    margin: 0,
    lineHeight: 1.4,
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '12px',
    padding: '20px 24px',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.04))',
  },
  actionsHeader: {
    marginBottom: '14px',
  },
  actionsTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '18px',
    fontWeight: 600,
    color: '#2d2421',
    margin: '0 0 4px 0',
    lineHeight: 1.3,
  },
  actionsSubtitle: {
    fontSize: '13px',
    color: '#6f6764',
    margin: 0,
    lineHeight: 1.5,
  },
  actionBtnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  primaryActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    minHeight: '42px',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.12))',
    transition: 'all 0.15s ease',
  },
  secondaryActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#f5f3ef',
    color: '#5c3e36',
    border: '1px solid #dfd8ce',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    minHeight: '42px',
    transition: 'all 0.15s ease',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.04))',
  },
  cardTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '18px',
    fontWeight: 600,
    color: '#2d2421',
    marginBottom: '16px',
    borderBottom: '1px solid #ece8e1',
    paddingBottom: '10px',
    lineHeight: 1.3,
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f5f3ef',
    fontSize: '13px',
    gap: '12px',
  },
  label: {
    color: '#6f6764',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  value: {
    color: '#2d2421',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  monoValue: {
    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
    fontSize: '12px',
    color: '#5c3e36',
    backgroundColor: '#f5ede9',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  rolePill: {
    backgroundColor: '#f5ede9',
    color: '#5c3e36',
    padding: '3px 10px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '10px 0',
  },
  checkIcon: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    flexShrink: 0,
    marginTop: '2px',
  },
  statusLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#2d2421',
    display: 'block',
    lineHeight: 1.4,
    marginBottom: '2px',
  },
  statusDesc: {
    fontSize: '12px',
    color: '#6f6764',
    lineHeight: 1.5,
    margin: 0,
  },
};
