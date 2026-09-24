/**
 * Ababil’s Attire by Sanjida Bethi
 * Customer Cake Product Card (Mirrors Stitch project 1646646279704595948)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { ProductWithDetails } from '../../types';

interface CakeCardProps {
  product: ProductWithDetails;
}

export const CakeCard: React.FC<CakeCardProps> = ({ product }) => {
  const primaryImage =
    product.images && product.images.length > 0
      ? product.images.find((img) => img.sort_order === 0)?.image_url || product.images[0].image_url
      : 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80';

  const noticeHours = product.minimum_notice_hours || 48;

  const weights = product.cake_details?.weight_options as Array<{
    weight: string;
    price: number;
    servings?: string;
  }> | undefined;

  const firstWeightLabel = weights && weights.length > 0 ? weights[0].weight : '1 lb';
  const displayPrice = weights && weights.length > 0 ? weights[0].price : product.price;

  const flavors = product.cake_details?.flavor_options || [];
  const flavorText =
    flavors.length > 0
      ? flavors[0]
      : product.description?.split('.')[0] || 'Handcrafted fresh to order';

  return (
    <article style={styles.card}>
      {/* 1:1 Square Image Container */}
      <Link to={`/cakes/${product.id}`} style={styles.imageLink}>
        <div style={styles.imageWrapper}>
          <img
            src={primaryImage}
            alt={product.name}
            style={styles.image}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80';
            }}
          />

          {/* Bottom-Left Notice Tag */}
          <div style={styles.badgeContainer}>
            <span style={styles.badgeNotice}>{noticeHours}h Notice</span>
          </div>

          {/* Top-Right Baked Fresh Tag */}
          <div style={styles.topBadgeContainer}>
            <span style={styles.badgeFresh}>Fresh Baked</span>
          </div>
        </div>
      </Link>

      {/* Card Content */}
      <div style={styles.content}>
        {/* Starting Price Header Note */}
        <p style={styles.pricePrefix}>
          Starts at ৳ {displayPrice.toLocaleString()}{' '}
          <span style={styles.weightNote}>({firstWeightLabel})</span>
        </p>

        {/* Product Title */}
        <Link to={`/cakes/${product.id}`} style={styles.titleLink}>
          <h3 style={styles.title}>{product.name}</h3>
        </Link>

        {/* Flavor Notes */}
        <p style={styles.flavorDescription}>{flavorText}</p>

        {/* Price Bold */}
        <p style={styles.boldPrice}>
          ৳ {displayPrice.toLocaleString()}{' '}
          <span style={styles.lightWeight}>({firstWeightLabel})</span>
        </p>

        {/* Action Button */}
        <Link to={`/cakes/${product.id}`} style={styles.viewButton}>
          View Cake
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
    aspectRatio: '1 / 1',
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
    bottom: '8px',
    left: '8px',
    zIndex: 2,
  },
  topBadgeContainer: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    zIndex: 2,
  },
  badgeNotice: {
    display: 'inline-block',
    backgroundColor: 'rgba(251, 249, 245, 0.94)',
    backdropFilter: 'blur(4px)',
    color: '#7e544f',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    padding: '2px 7px',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  badgeFresh: {
    display: 'inline-block',
    backgroundColor: 'rgba(255, 218, 214, 0.92)',
    color: '#7a514c',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '9px',
    fontWeight: 700,
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
  pricePrefix: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '10px',
    fontWeight: 700,
    color: '#8c5e51',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '2px',
  },
  weightNote: {
    fontWeight: 400,
    color: '#6f6764',
    textTransform: 'none',
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
  flavorDescription: {
    fontSize: '11px',
    color: '#6f6764',
    lineHeight: 1.4,
    margin: '0 0 6px 0',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  boldPrice: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 700,
    color: '#5c3e36',
    margin: '0 0 8px 0',
  },
  lightWeight: {
    fontSize: '11px',
    fontWeight: 400,
    color: '#6f6764',
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
