/**
 * Ababil’s Attire by Sanjida Bethi
 * Cake Product Details View (Mirrors Stitch project 1646646279704595948)
 */

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { productsService } from '../../services/products.service';
import type { ProductWithDetails } from '../../types';
import { useCart } from '../../hooks/useCart';
import { getStudioWhatsAppUrl } from '../../lib/studio';

interface CakeWeightOption {
  weight: string;
  price: number;
  servings?: string;
}

export const CakeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Configuration State
  const [selectedWeight, setSelectedWeight] = useState<CakeWeightOption | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const { addItem } = useCart();

  // Close fullscreen modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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

          // Initialize weight options
          const weights = data?.cake_details?.weight_options as CakeWeightOption[] | undefined;
          if (weights && weights.length > 0) {
            setSelectedWeight(weights[0]);
          } else if (data) {
            setSelectedWeight({
              weight: '1.0 lb',
              price: data.price,
              servings: '6–8 guests',
            });
          }

          // Initialize flavor
          const flavors = data?.cake_details?.flavor_options;
          if (flavors && flavors.length > 0) {
            setSelectedFlavor(flavors[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load cake details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleOrderCake = () => {
    if (!product || !selectedWeight) return;
    if (product.status === 'out_of_stock' || product.stock_quantity === 0) {
      alert('This artisan cake is currently unavailable.');
      return;
    }

    const firstImage =
      product.images && product.images.length > 0
        ? product.images[0].image_url
        : 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=1200&q=80';

    addItem({
      category: 'cake',
      productId: product.id,
      productCode: product.product_code,
      name: product.name,
      unitPrice: selectedWeight.price,
      imageUrl: firstImage,
      stockQuantity: product.stock_quantity ?? 10,
      selectedWeight: selectedWeight.weight,
      selectedFlavor: selectedFlavor || 'Madagascar Vanilla Bean & Berries',
      customMessage: customMessage.trim() || undefined,
      minimumNoticeHours: product.minimum_notice_hours ?? 48,
      quantity: 1,
    });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Fetching artisan cake details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={styles.notFoundContainer}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#8c5e51' }}>
          cake
        </span>
        <h2 style={styles.notFoundTitle}>Cake Not Found</h2>
        <p style={styles.notFoundDesc}>
          The cake you are looking for may have been archived or is temporarily unavailable.
        </p>
        <Link to="/cakes" style={styles.backBtn}>
          ← Back to All Cakes
        </Link>
      </div>
    );
  }

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images.map((img) => img.image_url)
      : [
          'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
        ];

  const currentImage = galleryImages[activeImageIndex] || galleryImages[0];
  const weights: CakeWeightOption[] =
    (product.cake_details?.weight_options as CakeWeightOption[] | undefined) || [
      { weight: '0.5 lb Bento', price: 950, servings: '1–2 slices' },
      { weight: '1.0 lb', price: product.price, servings: '4–6 guests' },
      { weight: '1.5 lb Tiered', price: Math.round(product.price * 1.5), servings: '8–10 guests' },
      { weight: '2.0 lb Double Tier', price: Math.round(product.price * 1.9), servings: '12–16 guests' },
    ];

  const flavors = product.cake_details?.flavor_options || [
    'Madagascar Vanilla Bean & Berries',
    'Rich Valrhona Chocolate Ganache',
    'Persian Rosewater & Pistachio',
  ];

  const activePrice = selectedWeight ? selectedWeight.price : product.price;
  const noticeHours = product.minimum_notice_hours || 48;

  return (
    <div style={styles.pageWrapper}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={styles.breadcrumb}>
        <Link to="/" style={styles.crumbLink}>
          Home
        </Link>
        <span style={styles.crumbDivider}>/</span>
        <Link to="/cakes" style={styles.crumbLink}>
          Cakes
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
          {/* Main 1:1 Square Image */}
          <div style={styles.mainImageContainer}>
            <img
              src={currentImage}
              alt={product.name}
              style={styles.mainImage}
              onClick={() => setImageModalOpen(true)}
            />

            {/* Fresh Studio Badge */}
            <div style={styles.freshBadge}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#8c5e51' }}>
                auto_awesome
              </span>
              <span>Baked Fresh to Order</span>
            </div>

            {/* Photo Counter Badge */}
            <div style={styles.photoBadge}>
              <span>{activeImageIndex + 1}</span> / {galleryImages.length}
            </div>

            {/* Zoom / Fullscreen Button */}
            <button
              type="button"
              style={styles.zoomButton}
              onClick={() => setImageModalOpen(true)}
              aria-label="Expand photo"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                zoom_in
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
        {/* RIGHT: Cake Information, Size & Ordering                         */}
        {/* =============================================================== */}
        <section style={styles.infoSection}>
          {/* Notice Alert Badge */}
          <div style={styles.statusRow}>
            <span style={styles.noticeBadge}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                schedule
              </span>
              {noticeHours}h Studio Notice Required
            </span>
          </div>

          {/* Cake Title */}
          <h1 style={styles.productTitle}>{product.name}</h1>

          {/* Price */}
          <div style={styles.priceRow}>
            <span style={styles.productPrice}>৳ {activePrice.toLocaleString()}</span>
            <span style={styles.priceMeta}>
              for {selectedWeight?.weight || '1.0 lb'} ({selectedWeight?.servings || 'Party Servings'})
            </span>
          </div>

          {/* Flavor Notes Tag */}
          <div style={styles.flavorBadgeBox}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#8c5e51' }}>
              restaurant
            </span>
            <span style={styles.flavorBadgeText}>
              {selectedFlavor || 'Madagascar Vanilla Bean & Fresh Buttercream'}
            </span>
          </div>

          {/* Description */}
          <p style={styles.productDescription}>{product.description}</p>

          {/* Fresh Baking Notice Box */}
          <div style={styles.noticeCalloutBox}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36', marginTop: '2px' }}>
              alarm
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <p style={styles.noticeCalloutTitle}>Notice time for fresh baking</p>
              <p style={styles.noticeCalloutText}>
                Please order at least {noticeHours} hours before your celebration so Sanjida can bake and
                chill your cake fresh in our studio.
              </p>
            </div>
          </div>

          <hr style={styles.divider} />

          {/* Choose Size & Servings Radio Cards */}
          <div style={styles.optionsSection}>
            <label style={styles.optionsLabel}>Choose Your Cake:</label>
            <div style={styles.weightsGrid}>
              {weights.map((w) => {
                const isSelected = selectedWeight?.weight === w.weight;
                return (
                  <label
                    key={w.weight}
                    style={{
                      ...styles.weightOptionCard,
                      border: isSelected
                        ? '2px solid #5c3e36'
                        : '1px solid var(--color-border-default, #dfd8ce)',
                      backgroundColor: isSelected ? '#ffffff' : '#f5f3ef',
                    }}
                  >
                    <input
                      type="radio"
                      name="cake_weight"
                      checked={isSelected}
                      onChange={() => setSelectedWeight(w)}
                      style={{ display: 'none' }}
                    />
                    <div style={styles.weightRadioCircle}>
                      {isSelected && <span style={styles.radioDot} />}
                    </div>
                    <div style={styles.weightDetails}>
                      <span style={styles.weightTitle}>{w.weight}</span>
                      <span style={styles.weightServings}>{w.servings || 'Party Slices'}</span>
                    </div>
                    <span style={styles.weightPrice}>৳ {w.price.toLocaleString()}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Flavor Selection */}
          {flavors.length > 0 && (
            <div style={styles.optionsSection}>
              <label style={styles.optionsLabel}>Select Flavor Profile:</label>
              <div style={styles.flavorsGrid}>
                {flavors.map((flavor) => {
                  const isSelected = selectedFlavor === flavor;
                  return (
                    <button
                      key={flavor}
                      type="button"
                      onClick={() => setSelectedFlavor(flavor)}
                      style={{
                        ...styles.flavorChip,
                        backgroundColor: isSelected ? '#5c3e36' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#2d2421',
                        border: isSelected
                          ? '2px solid #5c3e36'
                          : '1px solid var(--color-border-default, #dfd8ce)',
                      }}
                    >
                      {flavor}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Inscription Input */}
          <div style={styles.optionsSection}>
            <label style={styles.optionsLabel}>Custom Piped Message (Optional):</label>
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g. Happy 1st Birthday Ayla!"
              maxLength={40}
              style={styles.messageInput}
            />
            <span style={styles.messageHelper}>
              Hand-piped in cocoa umber or blush cursive script (max 40 chars).
            </span>
          </div>

          {/* Action CTAs */}
          <div style={styles.actionButtonGroup}>
            <button type="button" onClick={handleOrderCake} style={styles.orderCakeBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                cake
              </span>
              <span>Add to Bag • ৳ {activePrice.toLocaleString()}</span>
            </button>

            <a
              href={getStudioWhatsAppUrl(
                `Assalamu Alaikum Sanjida Apu, I would like to order the ${product.name} (${selectedWeight?.weight || '1.0 lb'}${
                  selectedFlavor ? ` • ${selectedFlavor}` : ''
                }). Could you confirm date availability?`
              )}
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

          {/* Storage & Delivery Instructions */}
          <div style={styles.specificationsBox}>
            <div style={styles.specItem}>
              <span className="material-symbols-outlined" style={styles.specIcon}>
                kitchen
              </span>
              <div>
                <p style={styles.specTitle}>Storage & Handling Instructions</p>
                <p style={styles.specDesc}>
                  {product.cake_details?.storage_instructions ||
                    'Keep refrigerated between 4°C – 8°C. Bring to room temperature 30 minutes before cutting for peak flavor and velvety texture.'}
                </p>
              </div>
            </div>

            <div style={styles.specItem}>
              <span className="material-symbols-outlined" style={styles.specIcon}>
                ac_unit
              </span>
              <div>
                <p style={styles.specTitle}>Chilled Cake Delivery</p>
                <p style={styles.specDesc}>
                  Delivered across Dhaka in temperature-managed chilled delivery transport to preserve
                  frosting and intricate piping. Mandatory ৳ 500 bKash advance required.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

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
    aspectRatio: '1 / 1',
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
  freshBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    backgroundColor: 'rgba(251, 249, 245, 0.94)',
    backdropFilter: 'blur(4px)',
    color: '#5c3e36',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '4px 10px',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
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
    bottom: '12px',
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
  noticeBadge: {
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
  flavorBadgeBox: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f5ede9',
    borderRadius: '8px',
    padding: '8px 12px',
    border: '1px solid #ebd8d0',
  },
  flavorBadgeText: {
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
  noticeCalloutBox: {
    backgroundColor: '#eeebe6',
    border: '1px solid #dfd8ce',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  noticeCalloutTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#5c3e36',
    margin: 0,
  },
  noticeCalloutText: {
    fontSize: '12px',
    color: '#6f6764',
    margin: 0,
    lineHeight: 1.45,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid var(--color-border-subtle, #ece8e1)',
    margin: '4px 0',
  },
  optionsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  optionsLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#2d2421',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  weightsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px',
  },
  weightOptionCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  weightRadioCircle: {
    width: '18px',
    height: '18px',
    borderRadius: '9999px',
    border: '2px solid #5c3e36',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    flexShrink: 0,
  },
  radioDot: {
    width: '8px',
    height: '8px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
  },
  weightDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  weightTitle: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    color: '#2d2421',
  },
  weightServings: {
    fontSize: '11px',
    color: '#6f6764',
  },
  weightPrice: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '14px',
    fontWeight: 700,
    color: '#5c3e36',
  },
  flavorsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  flavorChip: {
    minHeight: '44px',
    padding: '0 16px',
    borderRadius: '9999px',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageInput: {
    height: '44px',
    minHeight: '44px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    backgroundColor: '#ffffff',
    padding: '0 14px',
    fontSize: '13px',
    color: '#2d2421',
    outline: 'none',
  },
  messageHelper: {
    fontSize: '11px',
    color: '#8c5e51',
  },
  actionButtonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '6px',
  },
  orderCakeBtn: {
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
    cursor: 'pointer',
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
