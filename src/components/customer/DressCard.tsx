/**
 * Ababil’s Attire by Sanjida Bethi
 * Customer Dress Product Card (Mirrors Stitch project 1646646279704595948)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { ProductWithDetails } from '../../types';

interface DressCardProps {
  product: ProductWithDetails;
}

export const DressCard: React.FC<DressCardProps> = ({ product }) => {
  const primaryImage =
    product.images && product.images.length > 0
      ? product.images.find((img) => img.sort_order === 0)?.image_url || product.images[0].image_url
      : 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=80';

  const sizes = product.dress_details?.available_sizes || ['6M', '12M', '18M', '2T', '3T', '4T'];
  const sizeRangeText = sizes.length > 0 ? `${sizes[0]}–${sizes[sizes.length - 1]}` : 'Custom Sizes';

  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 2;
  const isOutOfStock = product.status === 'out_of_stock' || product.stock_quantity === 0;
  const isMadeToOrder = product.status === 'made_to_order';

  return (
    <article style={styles.card} className="atelier-product-card">
      {/* 3:4 Aspect Ratio Image Container */}
      <Link to={`/dresses/${product.id}`} style={styles.imageLink}>
        <div style={styles.imageWrapper}>
          <img
            src={primaryImage}
            alt={product.name}
            style={styles.image}
            loading="lazy"
            onError={(e) => {
              // Fallback to high-res atelier photo if image link fails
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=80';
            }}
          />

          {/* Top-Left Pill Badge */}
          <div style={styles.badgeContainer}>
            {isOutOfStock ? (
              <span style={styles.badgeOutOfStock}>Out of Stock</span>
            ) : isLowStock ? (
              <span style={styles.badgeLowStock}>{product.stock_quantity} Left</span>
            ) : isMadeToOrder ? (
              <span style={styles.badgeMadeToOrder}>Made to Order</span>
            ) : (
              <span style={styles.badgeDefault}>{sizeRangeText}</span>
            )}
          </div>

          {/* New Arrival Badge */}
          {product.new_arrival && (
            <div style={styles.newBadgeContainer}>
              <span style={styles.badgeNew}>New</span>
            </div>
          )}
        </div>
      </Link>

      {/* Card Content */}
      <div style={styles.content}>
        {/* Fabric / Subtitle */}
        <p style={styles.fabricSubtitle}>
          {product.dress_details?.fabric_details
            ? product.dress_details.fabric_details.split('with')[0].trim()
            : 'Pure Cotton & Hand Smocking'}
        </p>

        {/* Product Title */}
        <Link to={`/dresses/${product.id}`} style={styles.titleLink}>
          <h3 style={styles.title}>{product.name}</h3>
        </Link>

        {/* Price */}
        <p style={styles.price}>৳ {product.price.toLocaleString()}</p>

        {/* Meta / Availability */}
        <div style={styles.metaRow}>
          <span style={styles.availabilityText}>
            {isOutOfStock
              ? 'Currently Sold Out'
              : isMadeToOrder
              ? `${product.lead_time_days || 7}–10 Days Tailoring`
              : `In Stock (${sizeRangeText})`}
          </span>
        </div>

        {/* Action Button */}
        <Link to={`/dresses/${product.id}`} style={styles.viewButton}>
          View Dress
        </Link>
      </div>
    </article>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid var(--color-border-subtle, #ece8e1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '10px',
    transition: 'all 0.25s ease',
    boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(92,62,54,0.03))',
  },
  imageLink: {
    display: 'block',
    textDecoration: 'none',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: '3 / 4',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f5f3ef',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transition: 'transform 0.4s ease',
  },
  badgeContainer: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    zIndex: 2,
  },
  newBadgeContainer: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    zIndex: 2,
  },
  badgeDefault: {
    display: 'inline-block',
    backgroundColor: 'rgba(251, 249, 245, 0.92)',
    backdropFilter: 'blur(4px)',
    color: '#5c3e36',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    padding: '3px 8px',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  badgeMadeToOrder: {
    display: 'inline-block',
    backgroundColor: '#ffdad6',
    color: '#7a514c',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '10px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '4px',
  },
  badgeLowStock: {
    display: 'inline-block',
    backgroundColor: '#ffdad6',
    color: '#93000a',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '10px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '4px',
  },
  badgeOutOfStock: {
    display: 'inline-block',
    backgroundColor: '#e0dcd6',
    color: '#6f6764',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '10px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '4px',
  },
  badgeNew: {
    display: 'inline-block',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '2px 7px',
    borderRadius: '9999px',
  },
  content: {
    paddingTop: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  fabricSubtitle: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontStyle: 'italic',
    fontSize: '12px',
    color: '#8c5e51',
    lineHeight: 1.2,
    marginBottom: '3px',
  },
  titleLink: {
    textDecoration: 'none',
    color: 'inherit',
    width: '100%',
  },
  title: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    color: '#2d2421',
    lineHeight: 1.35,
    margin: '0 0 4px 0',
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  price: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '14px',
    fontWeight: 700,
    color: '#5c3e36',
    margin: '2px 0 6px 0',
  },
  metaRow: {
    marginBottom: '8px',
  },
  availabilityText: {
    fontSize: '11px',
    color: '#6f6764',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
  },
  viewButton: {
    width: '100%',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    backgroundColor: '#f5f3ef',
    color: '#5c3e36',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.2s ease',
  },
};
