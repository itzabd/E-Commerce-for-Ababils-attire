/**
 * Ababil’s Attire by Sanjida Bethi
 * Dress Product Details View (Mirrors Stitch project 1646646279704595948)
 */

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { productsService } from '../../services/products.service';
import type { ProductWithDetails } from '../../types';
import { useCart } from '../../hooks/useCart';

export const DressDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('12M');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const { addItem } = useCart();

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSizeGuide(false);
        setImageModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await productsService.getProductByCode(id);
        if (isMounted) {
          setProduct(data);
          const sizes = data?.dress_details?.available_sizes;
          if (sizes && sizes.length > 0) {
            setSelectedSize(sizes[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load dress details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddToBag = () => {
    if (!product) return;
    if (product.status === 'out_of_stock' || product.stock_quantity === 0) {
      alert('This dress is currently out of stock.');
      return;
    }
    if (!selectedSize) {
      alert('Please select a size first.');
      return;
    }

    const firstImage =
      product.images && product.images.length > 0
        ? product.images[0].image_url
        : 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=1200&q=80';

    addItem({
      category: 'dress',
      productId: product.id,
      productCode: product.product_code,
      name: product.name,
      unitPrice: product.price,
      imageUrl: firstImage,
      stockQuantity: product.stock_quantity ?? 10,
      selectedSize: selectedSize,
      fabricDetails: product.dress_details?.fabric_details || undefined,
      leadTimeDays: product.lead_time_days ?? undefined,
      quantity: 1,
    });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Fetching handcrafted dress details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={styles.notFoundContainer}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#8c5e51' }}>
          checkroom
        </span>
        <h2 style={styles.notFoundTitle}>Dress Not Found</h2>
        <p style={styles.notFoundDesc}>
          The dress you are looking for may have been archived or is temporarily unavailable.
        </p>
        <Link to="/dresses" style={styles.backBtn}>
          ← Back to All Dresses
        </Link>
      </div>
    );
  }

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images.map((img) => img.image_url)
      : [
          'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?auto=format&fit=crop&w=1200&q=80',
        ];

  const currentImage = galleryImages[activeImageIndex] || galleryImages[0];
  const availableSizes = product.dress_details?.available_sizes || [
    '6M',
    '12M',
    '18M',
    '2T',
    '3T',
    '4T',
  ];

  const isOutOfStock = product.status === 'out_of_stock' || product.stock_quantity === 0;
  const isMadeToOrder = product.status === 'made_to_order';

  return (
    <div style={styles.pageWrapper}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={styles.breadcrumb}>
        <Link to="/" style={styles.crumbLink}>
          Home
        </Link>
        <span style={styles.crumbDivider}>/</span>
        <Link to="/dresses" style={styles.crumbLink}>
          Girls’ Dresses
        </Link>
        <span style={styles.crumbDivider}>/</span>
        <span style={styles.crumbCurrent}>{product.name}</span>
      </nav>

      {/* Main Details Grid: Left Gallery + Right Information */}
      <div style={styles.detailsGrid}>
        {/* =============================================================== */}
        {/* LEFT: Photo Gallery Section                                     */}
        {/* =============================================================== */}
        <section style={styles.gallerySection}>
          {/* Main 3:4 Aspect Ratio Image */}
          <div style={styles.mainImageContainer}>
            <img
              src={currentImage}
              alt={product.name}
              style={styles.mainImage}
              onClick={() => setImageModalOpen(true)}
            />

            {/* Photo Counter Badge */}
            <div style={styles.photoBadge}>
              <span>{activeImageIndex + 1}</span> / {galleryImages.length}
            </div>

            {/* Zoom / Fullscreen Button */}
            <button
              type="button"
              style={styles.zoomButton}
              onClick={() => setImageModalOpen(true)}
              aria-label="Expand image"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                fullscreen
              </span>
            </button>
          </div>

          {/* Thumbnails Row */}
          {galleryImages.length > 1 && (
            <div style={styles.thumbnailsRow}>
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    ...styles.thumbnailBtn,
                    border:
                      idx === activeImageIndex
                        ? '2px solid #5c3e36'
                        : '1px solid var(--color-border-default, #dfd8ce)',
                    opacity: idx === activeImageIndex ? 1 : 0.7,
                  }}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} style={styles.thumbnailImg} />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* =============================================================== */}
        {/* RIGHT: Product Information, Size & Ordering                     */}
        {/* =============================================================== */}
        <section style={styles.infoSection}>
          {/* Status & Availability Tag */}
          <div style={styles.statusRow}>
            {isOutOfStock ? (
              <span style={styles.outOfStockBadge}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  cancel
                </span>
                Currently Sold Out
              </span>
            ) : isMadeToOrder ? (
              <span style={styles.madeToOrderBadge}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  schedule
                </span>
                Made to Order (7–10 Days Tailoring)
              </span>
            ) : (
              <span style={styles.inStockBadge}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  check_circle
                </span>
                Ready to Ship • Ships in 1–2 days
              </span>
            )}
          </div>

          {/* Product Title */}
          <h1 style={styles.productTitle}>{product.name}</h1>

          {/* Price */}
          <div style={styles.priceRow}>
            <span style={styles.productPrice}>৳ {product.price.toLocaleString()}</span>
            <span style={styles.priceMeta}>Tax included • bKash Advance Eligible</span>
          </div>

          {/* Fabric Highlight Badge */}
          {product.dress_details?.fabric_details && (
            <div style={styles.fabricBadgeBox}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#5c3e36' }}>
                eco
              </span>
              <span style={styles.fabricBadgeText}>
                {product.dress_details.fabric_details}
              </span>
            </div>
          )}

          {/* Warm Description */}
          <p style={styles.productDescription}>{product.description}</p>

          <hr style={styles.divider} />

          {/* Choose Size Section */}
          <div style={styles.sizeSection}>
            <div style={styles.sizeHeader}>
              <div style={styles.sizeLabelGroup}>
                <span style={styles.sizeLabel}>Choose Your Size:</span>
                <span style={styles.selectedSizeText}>{selectedSize}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeGuide(true)}
                style={styles.sizeGuideBtn}
              >
                Size Guide & Measurements
              </button>
            </div>

            {/* Size Chips */}
            <div style={styles.sizeChipsGrid}>
              {availableSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  style={{
                    ...styles.sizeChip,
                    backgroundColor: selectedSize === size ? '#5c3e36' : '#ffffff',
                    color: selectedSize === size ? '#ffffff' : '#2d2421',
                    border:
                      selectedSize === size
                        ? '2px solid #5c3e36'
                        : '1px solid var(--color-border-default, #dfd8ce)',
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div style={styles.actionButtonGroup}>
            <button
              type="button"
              onClick={handleAddToBag}
              disabled={isOutOfStock}
              style={{
                ...styles.addToBagBtn,
                opacity: isOutOfStock ? 0.5 : 1,
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                shopping_bag
              </span>
              <span>
                {isOutOfStock ? 'Out of Stock' : `Add to Bag • ৳ ${product.price.toLocaleString()}`}
              </span>
            </button>

            <a
              href={`https://wa.me/?text=Hi%20Sanjida,%20I'm%20interested%20in%20the%20${encodeURIComponent(
                product.name
              )}%20in%20size%20${selectedSize}.`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.whatsappInquireBtn}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                chat
              </span>
              <span>Message Sanjida</span>
            </a>
          </div>

          {/* Care & Atelier Specifications */}
          <div style={styles.specificationsBox}>
            <div style={styles.specItem}>
              <span className="material-symbols-outlined" style={styles.specIcon}>
                dry_cleaning
              </span>
              <div>
                <p style={styles.specTitle}>Care Instructions</p>
                <p style={styles.specDesc}>
                  {product.dress_details?.care_instructions ||
                    'Gentle cold hand-wash with mild detergent. Do not wring or tumble dry. Dry flat in shade. Cool iron on reverse.'}
                </p>
              </div>
            </div>

            <div style={styles.specItem}>
              <span className="material-symbols-outlined" style={styles.specIcon}>
                local_shipping
              </span>
              <div>
                <p style={styles.specTitle}>Shipping & Delivery</p>
                <p style={styles.specDesc}>
                  Dhaka delivery within 2–3 business days. Nationwide courier within 3–5 days.
                  Mandatory ৳ 500 bKash advance secures tailoring reservation.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* =============================================================== */}
      {/* SIZE GUIDE MODAL                                                */}
      {/* =============================================================== */}
      {showSizeGuide && (
        <div style={styles.modalBackdrop} onClick={() => setShowSizeGuide(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Girls' Size Guide</h3>
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                style={styles.modalCloseBtn}
                aria-label="Close size guide"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p style={styles.modalSubtitle}>
              Measurements in inches. Handcrafted garments have a relaxed silhouette for ease and growing room.
            </p>

            <table style={styles.sizeTable}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.tableTh}>Size</th>
                  <th style={styles.tableTh}>Chest</th>
                  <th style={styles.tableTh}>Length</th>
                  <th style={styles.tableTh}>Typical Age</th>
                </tr>
              </thead>
              <tbody>
                <tr style={styles.tableRow}>
                  <td style={styles.tableTdBold}>6M</td>
                  <td style={styles.tableTd}>18"</td>
                  <td style={styles.tableTd}>14"</td>
                  <td style={styles.tableTd}>3–6 Months</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableTdBold}>12M</td>
                  <td style={styles.tableTd}>19.5"</td>
                  <td style={styles.tableTd}>16"</td>
                  <td style={styles.tableTd}>6–12 Months</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableTdBold}>18M</td>
                  <td style={styles.tableTd}>20.5"</td>
                  <td style={styles.tableTd}>17.5"</td>
                  <td style={styles.tableTd}>12–18 Months</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableTdBold}>2T</td>
                  <td style={styles.tableTd}>21.5"</td>
                  <td style={styles.tableTd}>19"</td>
                  <td style={styles.tableTd}>1.5–2 Years</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableTdBold}>3T</td>
                  <td style={styles.tableTd}>22.5"</td>
                  <td style={styles.tableTd}>21"</td>
                  <td style={styles.tableTd}>2.5–3 Years</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={styles.tableTdBold}>4T</td>
                  <td style={styles.tableTd}>23.5"</td>
                  <td style={styles.tableTd}>23"</td>
                  <td style={styles.tableTd}>3.5–4 Years</td>
                </tr>
              </tbody>
            </table>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                style={styles.modalConfirmBtn}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* FULLSCREEN IMAGE MODAL                                          */}
      {/* =============================================================== */}
      {imageModalOpen && (
        <div style={styles.fullscreenBackdrop} onClick={() => setImageModalOpen(false)}>
          <button
            type="button"
            style={styles.fullscreenClose}
            onClick={() => setImageModalOpen(false)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
              close
            </span>
          </button>
          <img src={currentImage} alt={product.name} style={styles.fullscreenImage} />
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '12px 16px 40px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  toast: {
    position: 'fixed',
    top: '70px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ffffff',
    border: '1px solid #a7f3d0',
    borderRadius: '12px',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: 'var(--shadow-md, 0 6px 18px rgba(92, 62, 54, 0.12))',
    zIndex: 100,
  },
  toastText: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    color: '#065f46',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#6f6764',
    padding: '6px 0',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
  },
  crumbLink: {
    color: '#5c3e36',
    textDecoration: 'none',
  },
  crumbDivider: {
    color: '#dfd8ce',
  },
  crumbCurrent: {
    color: '#2d2421',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '32px',
    alignItems: 'start',
  },
  gallerySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  mainImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '3 / 4',
    borderRadius: '14px',
    overflow: 'hidden',
    backgroundColor: '#f5f3ef',
    border: '1px solid var(--color-border-subtle, #ece8e1)',
    cursor: 'zoom-in',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  photoBadge: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    backgroundColor: 'rgba(251, 249, 245, 0.92)',
    backdropFilter: 'blur(4px)',
    color: '#5c3e36',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: '9999px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  zoomButton: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '36px',
    height: '36px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(251, 249, 245, 0.92)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#5c3e36',
    border: 'none',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  thumbnailsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  thumbnailBtn: {
    aspectRatio: '1 / 1',
    borderRadius: '8px',
    overflow: 'hidden',
    padding: 0,
    backgroundColor: '#f5f3ef',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
  },
  inStockBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: '9999px',
    border: '1px solid #a7f3d0',
  },
  madeToOrderBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ffdad6',
    color: '#7a514c',
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: '9999px',
  },
  outOfStockBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#eeebe6',
    color: '#6f6764',
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: '9999px',
  },
  productTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '28px',
    fontWeight: 500,
    color: '#2d2421',
    lineHeight: 1.25,
    margin: 0,
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    flexWrap: 'wrap',
  },
  productPrice: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '24px',
    fontWeight: 700,
    color: '#5c3e36',
  },
  priceMeta: {
    fontSize: '12px',
    color: '#6f6764',
  },
  fabricBadgeBox: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f5ede9',
    borderRadius: '8px',
    padding: '8px 12px',
    border: '1px solid #ebd8d0',
  },
  fabricBadgeText: {
    fontSize: '12px',
    color: '#5c3e36',
    fontWeight: 600,
  },
  productDescription: {
    fontSize: '14px',
    color: '#6f6764',
    lineHeight: 1.6,
    margin: 0,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid var(--color-border-subtle, #ece8e1)',
    margin: '4px 0',
  },
  sizeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sizeHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sizeLabelGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  sizeLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#2d2421',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  selectedSizeText: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#8c5e51',
  },
  sizeGuideBtn: {
    fontSize: '11px',
    color: '#5c3e36',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
    fontWeight: 600,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    minHeight: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0 4px',
  },
  sizeChipsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
    gap: '8px',
  },
  sizeChip: {
    minHeight: '44px',
    minWidth: '44px',
    borderRadius: '8px',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '6px',
  },
  addToBagBtn: {
    height: '48px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '14px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: 'none',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.08))',
    transition: 'all 0.2s ease',
  },
  whatsappInquireBtn: {
    height: '44px',
    borderRadius: '9999px',
    backgroundColor: '#f5f3ef',
    color: '#5c3e36',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textDecoration: 'none',
  },
  specificationsBox: {
    backgroundColor: '#f5f3ef',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '8px',
  },
  specItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  specIcon: {
    color: '#8c5e51',
    fontSize: '20px',
    marginTop: '2px',
  },
  specTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2d2421',
    margin: '0 0 2px 0',
  },
  specDesc: {
    fontSize: '11px',
    color: '#6f6764',
    lineHeight: 1.45,
    margin: 0,
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(45, 36, 33, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 100,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '460px',
    width: '100%',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(92, 62, 54, 0.16))',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '20px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: 0,
  },
  modalCloseBtn: {
    color: '#988e8a',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: '12px',
    color: '#6f6764',
    lineHeight: 1.45,
    margin: 0,
  },
  sizeTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
  },
  tableHeaderRow: {
    borderBottom: '1px solid var(--color-border-default, #dfd8ce)',
    backgroundColor: '#f5f3ef',
  },
  tableTh: {
    padding: '8px 10px',
    textAlign: 'left',
    color: '#5c3e36',
    fontWeight: 600,
  },
  tableRow: {
    borderBottom: '1px solid var(--color-border-subtle, #ece8e1)',
  },
  tableTdBold: {
    padding: '8px 10px',
    fontWeight: 700,
    color: '#2d2421',
  },
  tableTd: {
    padding: '8px 10px',
    color: '#6f6764',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '6px',
  },
  modalConfirmBtn: {
    height: '44px',
    padding: '0 24px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '13px',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 110,
    padding: '16px',
  },
  fullscreenClose: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    color: '#ffffff',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    maxWidth: '90vw',
    maxHeight: '85vh',
    objectFit: 'contain',
    borderRadius: '8px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    gap: '12px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '3px solid #eeebe6',
    borderTopColor: '#5c3e36',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '13px',
    color: '#8c5e51',
  },
  notFoundContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  notFoundTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '24px',
    color: '#2d2421',
    margin: 0,
  },
  notFoundDesc: {
    fontSize: '13px',
    color: '#6f6764',
    maxWidth: '360px',
    margin: 0,
  },
  backBtn: {
    marginTop: '12px',
    padding: '10px 20px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 600,
  },
};
