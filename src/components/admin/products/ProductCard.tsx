/**
 * Ababil’s Attire by Sanjida Bethi
 * Admin Product Card Component
 *
 * Implements the editorial gallery card layout from Stitch screen 41df5b74c827466598486122115dd0e5
 */

import React from 'react';
import type { ProductWithDetails } from '../../../types';

interface ProductCardProps {
  product: ProductWithDetails;
  onEdit: (product: ProductWithDetails) => void;
  onDuplicate: (product: ProductWithDetails) => void;
  onToggleStatus: (product: ProductWithDetails) => void;
  onToggleOutOfStock: (product: ProductWithDetails) => void;
  onDelete: (product: ProductWithDetails) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onToggleOutOfStock,
  onDelete,
}) => {
  const isDress = product.category === 'dress';
  const coverImage = product.images && product.images.length > 0 ? product.images[0].image_url : null;
  const isOutOfStock = product.status === 'out_of_stock';
  const isPublished = product.status === 'published';

  const formattedPrice = new Intl.NumberFormat('en-BD').format(product.price);

  return (
    <div style={styles.card}>
      <div style={styles.cardLayout}>
        {/* Product Image Thumbnail */}
        <div style={isDress ? styles.dressImageWrapper : styles.cakeImageWrapper}>
          {coverImage ? (
            <img
              src={coverImage}
              alt={product.name}
              style={{
                ...styles.image,
                filter: isOutOfStock ? 'grayscale(40%)' : 'none',
              }}
            />
          ) : (
            <div style={styles.imagePlaceholder}>
              <span style={styles.placeholderIcon}>{isDress ? '👗' : '🎂'}</span>
              <span style={styles.placeholderText}>No photo</span>
            </div>
          )}
          <span style={styles.categoryPill}>
            {isDress ? 'Dresses' : 'Cakes'}
          </span>
          {isOutOfStock && <span style={styles.soldOutBadge}>Out of Stock</span>}
        </div>

        {/* Content Details */}
        <div style={styles.content}>
          <div>
            <div style={styles.headerRow}>
              <div>
                <div style={styles.badgeRow}>
                  {/* Status Badge */}
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...getStatusStyle(product.status),
                    }}
                  >
                    {formatStatusLabel(product.status)}
                  </span>
                  {product.featured && <span style={styles.featuredBadge}>Featured</span>}
                  {product.new_arrival && <span style={styles.newArrivalBadge}>New Arrival</span>}
                </div>

                <h3 style={styles.name}>{product.name}</h3>

                {/* Subtitle Fabric / Flavor Details */}
                {isDress && product.dress_details?.fabric_details && (
                  <p style={styles.descriptorItalic}>{product.dress_details.fabric_details}</p>
                )}
                {!isDress && product.cake_details?.flavor_options && (
                  <p style={styles.descriptor}>
                    Flavors: {product.cake_details.flavor_options.join(', ')}
                  </p>
                )}
              </div>

              {/* Price & Code */}
              <div style={styles.priceColumn}>
                <span style={styles.price}>৳ {formattedPrice}</span>
                <span style={styles.code}>Code: {product.product_code}</span>
              </div>
            </div>

            {/* Metadata & Inventory */}
            <div style={styles.metadataGrid}>
              {isDress ? (
                <>
                  <div style={styles.metaItem}>
                    <span style={styles.metaIcon}>📦</span>
                    <span>
                      In Stock: <strong style={styles.boldPrimary}>{product.stock_quantity} units</strong>
                    </span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaIcon}>⏳</span>
                    <span>
                      Lead Time: <strong style={styles.boldPrimary}>{product.lead_time_days} days</strong> (Custom Tailoring)
                    </span>
                  </div>
                  <div style={styles.metaItemFull}>
                    <span style={styles.metaIcon}>📏</span>
                    <span>
                      Available Sizes:{' '}
                      <strong style={styles.boldPrimary}>
                        {product.dress_details?.available_sizes?.length
                          ? product.dress_details.available_sizes.join(', ')
                          : 'Not specified'}
                      </strong>
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.metaItem}>
                    <span style={styles.metaIcon}>⏱️</span>
                    <span>
                      Notice: <strong style={styles.boldPrimary}>{product.minimum_notice_hours} Hours Notice</strong>
                    </span>
                  </div>
                  <div style={styles.metaItem}>
                    <span style={styles.metaIcon}>🎂</span>
                    <span>
                      Availability: <strong style={styles.boldPrimary}>{product.status === 'out_of_stock' ? 'Booked Out' : 'Made to Order'}</strong>
                    </span>
                  </div>
                  <div style={styles.metaItemFull}>
                    <span style={styles.metaIcon}>⚖️</span>
                    <span>
                      Weight Options:{' '}
                      <strong style={styles.boldPrimary}>
                        {product.cake_details?.weight_options?.length
                          ? product.cake_details.weight_options.map((w: any) => w.weight || w).join(', ')
                          : 'Standard'}
                      </strong>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card Actions Toolbar */}
          <div style={styles.cardActions}>
            <div style={styles.primaryActionGroup}>
              <button
                type="button"
                onClick={() => onEdit(product)}
                style={styles.editButton}
              >
                ✎ Edit Record
              </button>
              <button
                type="button"
                onClick={() => onDuplicate(product)}
                style={styles.duplicateButton}
                title="Create a duplicate draft clone"
              >
                ⎘ Duplicate
              </button>
            </div>

            <div style={styles.iconActionGroup}>
              {/* Quick Publish / Hide */}
              <button
                type="button"
                onClick={() => onToggleStatus(product)}
                style={styles.iconButton}
                title={isPublished ? 'Hide from storefront' : 'Publish to storefront'}
              >
                {isPublished ? '👁️' : '🙈'}
              </button>

              {/* Quick Out of Stock Toggle */}
              <button
                type="button"
                onClick={() => onToggleOutOfStock(product)}
                style={{
                  ...styles.iconButton,
                  color: isOutOfStock ? '#065f46' : '#8c5e51',
                }}
                title={isOutOfStock ? 'Mark In Stock / Available' : 'Mark Out of Stock'}
              >
                {isOutOfStock ? '🔄' : '🚫'}
              </button>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => onDelete(product)}
                style={styles.deleteIconButton}
                title="Delete Product"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatStatusLabel(status: string): string {
  switch (status) {
    case 'published':
      return 'Published';
    case 'draft':
      return 'Draft';
    case 'made_to_order':
      return 'Made to Order';
    case 'out_of_stock':
      return 'Out of Stock';
    case 'hidden':
      return 'Hidden';
    default:
      return status;
  }
}

function getStatusStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'published':
      return { backgroundColor: '#e7f3ea', color: '#1e582e', border: '1px solid #c3e6ca' };
    case 'draft':
      return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
    case 'made_to_order':
      return { backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' };
    case 'out_of_stock':
      return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
    case 'hidden':
      return { backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb' };
    default:
      return { backgroundColor: '#f5f3ef', color: '#2d2421', border: '1px solid #dfd8ce' };
  }
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '14px',
    padding: '16px',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.04))',
    transition: 'all 0.2s ease',
  },
  cardLayout: {
    display: 'flex',
    flexDirection: 'row',
    gap: '16px',
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  dressImageWrapper: {
    width: '120px',
    height: '160px',
    borderRadius: '10px',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f5f3ef',
    border: '1px solid #dfd8ce',
    flexShrink: 0,
  },
  cakeImageWrapper: {
    width: '120px',
    height: '120px',
    borderRadius: '10px',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f5f3ef',
    border: '1px solid #dfd8ce',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    color: '#988e8a',
  },
  placeholderIcon: {
    fontSize: '24px',
  },
  placeholderText: {
    fontSize: '11px',
    fontWeight: 500,
  },
  categoryPill: {
    position: 'absolute',
    top: '6px',
    left: '6px',
    backgroundColor: 'rgba(251, 249, 245, 0.9)',
    backdropFilter: 'blur(2px)',
    color: '#5c3e36',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid rgba(223, 216, 206, 0.8)',
  },
  soldOutBadge: {
    position: 'absolute',
    bottom: '6px',
    left: '6px',
    right: '6px',
    backgroundColor: '#ba1a1a',
    color: '#ffffff',
    fontSize: '9px',
    fontWeight: 700,
    textAlign: 'center',
    padding: '2px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    minWidth: '280px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '4px',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '4px',
  },
  featuredBadge: {
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#ffdbd1',
    color: '#49251b',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  newArrivalBadge: {
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#f5ede9',
    color: '#5c3e36',
    border: '1px solid #ebd8d0',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  name: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '18px',
    fontWeight: 600,
    color: '#2d2421',
    lineHeight: 1.25,
    marginTop: '2px',
  },
  descriptorItalic: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontStyle: 'italic',
    fontSize: '12px',
    color: '#7e544f',
    marginTop: '3px',
  },
  descriptor: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    color: '#6f6764',
    marginTop: '3px',
  },
  priceColumn: {
    textAlign: 'right',
    flexShrink: 0,
  },
  price: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '18px',
    fontWeight: 700,
    color: '#5c3e36',
    display: 'block',
  },
  code: {
    fontSize: '11px',
    color: '#988e8a',
    display: 'block',
    marginTop: '2px',
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '6px 16px',
    marginTop: '12px',
    paddingTop: '10px',
    borderTop: '1px solid #ece8e1',
    fontSize: '12px',
    color: '#504441',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  metaItemFull: {
    gridColumn: '1 / -1',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  metaIcon: {
    fontSize: '13px',
  },
  boldPrimary: {
    color: '#5c3e36',
    fontWeight: 600,
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #f5f3ef',
    flexWrap: 'wrap',
  },
  primaryActionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  editButton: {
    height: '34px',
    padding: '0 14px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.2s',
  },
  duplicateButton: {
    height: '34px',
    padding: '0 14px',
    backgroundColor: 'transparent',
    color: '#5c3e36',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid #dfd8ce',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.2s',
  },
  iconActionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  iconButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f3ef',
    border: '1px solid #dfd8ce',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  deleteIconButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
