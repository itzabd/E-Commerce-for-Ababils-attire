/**
 * Ababil’s Attire by Sanjida Bethi
 * Cart Added Toast Notification
 * Displays a premium, non-intrusive floating feedback card whenever a product is added to bag.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';

export const CartAddedNotification: React.FC = () => {
  const { lastAddedItem, dismissNotification } = useCart();

  if (!lastAddedItem) return null;

  const { item } = lastAddedItem;

  return (
    <div style={styles.toastContainer} role="status" aria-live="polite">
      <div style={styles.toastCard}>
        {/* Left: Thumbnail Image */}
        <div style={styles.thumbWrapper}>
          <img
            src={item.imageUrl || 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=300&q=80'}
            alt={item.name}
            style={styles.thumbImg}
          />
          <span style={styles.badgeCheck}>✓</span>
        </div>

        {/* Center: Info */}
        <div style={styles.infoCol}>
          <div style={styles.headerRow}>
            <span style={styles.successTag}>Added to Bag!</span>
            <span style={styles.priceTag}>৳ {Number(item.unitPrice * (item.quantity || 1)).toLocaleString()}</span>
          </div>
          <p style={styles.itemName}>{item.name}</p>
          <p style={styles.itemMeta}>
            {item.category === 'dress' ? (
              <span>Size: <strong>{item.selectedSize || 'Standard'}</strong></span>
            ) : (
              <span>
                {item.selectedWeight || '1.0 lb'}
                {item.selectedFlavor ? ` • ${item.selectedFlavor.split('&')[0].trim()}` : ''}
              </span>
            )}
            <span style={styles.qtyDot}>•</span>
            <span>Qty: {item.quantity || 1}</span>
          </p>
        </div>

        {/* Right: Actions */}
        <div style={styles.actionCol}>
          <Link
            to="/bag"
            onClick={dismissNotification}
            style={styles.viewBagBtn}
            aria-label="View Shopping Bag"
          >
            <span>View Bag</span>
            <span style={{ fontSize: '14px' }}>→</span>
          </Link>
          <button
            type="button"
            onClick={dismissNotification}
            style={styles.closeBtn}
            aria-label="Dismiss notification"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  toastContainer: {
    position: 'fixed',
    top: '70px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 24px)',
    maxWidth: '430px',
    zIndex: 9999,
    pointerEvents: 'auto',
    animation: 'toastSlideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  toastCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e7ded8',
    borderRadius: '16px',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 12px 32px rgba(67, 40, 33, 0.16), 0 2px 8px rgba(0, 0, 0, 0.04)',
    backdropFilter: 'blur(10px)',
  },
  thumbWrapper: {
    position: 'relative',
    width: '48px',
    height: '48px',
    flexShrink: 0,
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #ebdcd6',
    backgroundColor: '#fbf9f5',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  badgeCheck: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    backgroundColor: '#065f46',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 700,
    width: '16px',
    height: '16px',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #ffffff',
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
  },
  successTag: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '11px',
    fontWeight: 700,
    color: '#065f46',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  priceTag: {
    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
    fontSize: '12px',
    fontWeight: 700,
    color: '#5c3e36',
  },
  itemName: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '14px',
    fontWeight: 600,
    color: '#2d2421',
    lineHeight: 1.2,
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemMeta: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '11px',
    color: '#7a6f6b',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  qtyDot: {
    color: '#c2b6b0',
    fontSize: '10px',
  },
  actionCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px',
    flexShrink: 0,
  },
  viewBagBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: '9999px',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 6px rgba(92, 62, 54, 0.2)',
    transition: 'background-color 0.2s',
  },
  closeBtn: {
    color: '#9c8e88',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '12px',
    padding: '2px 4px',
    cursor: 'pointer',
    lineHeight: 1,
  },
};
