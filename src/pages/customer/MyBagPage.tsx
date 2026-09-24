/**
 * Ababil’s Attire by Sanjida Bethi
 * My Bag / Unified Cart Page (Mirrors Stitch project 1646646279704595948)
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import type { CartItem } from '../../types/cart.types';

export const MyBagPage: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    deliveryDiscount,
    estimatedTotal,
    hasDress,
    hasCake,
    specialNote,
    setSpecialNote,
    removeItem,
    updateQuantity,
    clearCart,
    undoRemove,
    lastRemovedItem,
  } = useCart();

  const navigate = useNavigate();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);

  const handleProceedToCheckout = () => {
    if (items.length === 0) return;
    navigate('/checkout');
  };

  const handleConfirmRemove = () => {
    if (itemToRemove) {
      removeItem(itemToRemove.id);
      setItemToRemove(null);
    }
  };

  return (
    <div style={styles.pageContainer}>
      {/* Top Notification Banner */}
      <div style={styles.notificationBanner}>
        <div style={styles.bannerInner}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#8c5e51' }}>
            local_shipping
          </span>
          <p style={styles.bannerText}>
            Free local studio pickup available &amp; cake delivery scheduled on your event date!
          </p>
        </div>
      </div>

      <div style={styles.mainCanvas}>
        {/* Breadcrumb & Navigation */}
        <nav aria-label="Breadcrumb" style={styles.breadcrumbBar}>
          <Link to="/dresses" style={styles.backLink}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              arrow_back
            </span>
            <span>Continue Shopping</span>
          </Link>

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClearOpen(true)}
              style={styles.clearCartBtn}
            >
              Clear Bag
            </button>
          )}
        </nav>

        {/* Page Header */}
        <div style={styles.pageHeader}>
          <div style={styles.titleRow}>
            <h1 style={styles.pageTitle}>My Bag</h1>
            <span style={styles.countBadge}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p style={styles.pageSubtitle}>
            Review your items before checkout. Freshly baked cakes and handmade dresses ship with tender care.
          </p>
        </div>

        {/* Undo Toast Banner */}
        {lastRemovedItem && (
          <div style={styles.undoBanner}>
            <div style={styles.undoLeft}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#065f46' }}>
                check_circle
              </span>
              <span style={styles.undoText}>
                ‘{lastRemovedItem.item.name}’ was removed from your bag.
              </span>
            </div>
            <button type="button" onClick={undoRemove} style={styles.undoBtn}>
              Undo
            </button>
          </div>
        )}

        {/* =============================================================== */}
        {/* EMPTY BAG STATE                                                 */}
        {/* =============================================================== */}
        {items.length === 0 ? (
          <section style={styles.emptyCard}>
            <div style={styles.emptyIconCircle}>
              <span className="material-symbols-outlined" style={{ fontSize: '42px', color: '#8c5e51' }}>
                shopping_bag
              </span>
            </div>
            <h2 style={styles.emptyTitle}>Your Bag is Empty</h2>
            <p style={styles.emptySubtitle}>
              Explore our boutique collection of handcrafted girls’ heirloom frocks and delicious
              homemade celebration cakes.
            </p>
            <div style={styles.emptyActionGroup}>
              <Link to="/dresses" style={styles.emptyPrimaryBtn}>
                Explore Dresses
              </Link>
              <Link to="/cakes" style={styles.emptySecondaryBtn}>
                Explore Cakes
              </Link>
            </div>
          </section>
        ) : (
          /* ============================================================= */
          /* MAIN TWO-COLUMN LAYOUT (Items Stream + Order Summary)         */
          /* ============================================================= */
          <div style={styles.cartGrid}>
            {/* Left Column: Cart Items Stream */}
            <section style={styles.itemsStream}>
              {items.map((item) => (
                <article key={item.id} style={styles.itemCard}>
                  {/* Thumbnail */}
                  <div
                    style={{
                      ...styles.thumbnailWrapper,
                      aspectRatio: item.category === 'dress' ? '3 / 4' : '1 / 1',
                    }}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={styles.thumbnailImg}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          item.category === 'dress'
                            ? 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=600&q=80'
                            : 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <span style={styles.itemTypeBadge}>
                      {item.category === 'dress' ? 'Dress' : 'Cake'}
                    </span>
                  </div>

                  {/* Details Body */}
                  <div style={styles.itemBody}>
                    <div>
                      {/* Subtitle & Title & Price Header */}
                      <div style={styles.itemHeaderRow}>
                        <div>
                          <span style={styles.itemCategoryTag}>
                            {item.category === 'dress' ? 'Handmade Dress' : 'Fresh Cake'}
                          </span>
                          <h3 style={styles.itemTitle}>{item.name}</h3>
                        </div>
                        <p style={styles.itemPrice}>
                          ৳ {(item.unitPrice * item.quantity).toLocaleString()}
                        </p>
                      </div>

                      {/* Specs Block (Dress Options vs Cake Options) */}
                      {item.category === 'dress' ? (
                        <div style={styles.dressSpecsBox}>
                          <div style={styles.specLine}>
                            <span style={styles.specLabel}>Size:</span>
                            <strong style={styles.specVal}>{item.selectedSize || 'Standard'}</strong>
                          </div>
                          {item.fabricDetails && (
                            <p style={styles.fabricLine}>
                              Fabric: <span style={styles.fabricItalic}>{item.fabricDetails}</span>
                            </p>
                          )}
                          <p style={styles.shippingNotice}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                              schedule
                            </span>
                            <span>Ships in 1–2 business days</span>
                          </p>
                        </div>
                      ) : (
                        <div style={styles.cakeSpecsBox}>
                          <div style={styles.cakeSpecsGrid}>
                            <div>
                              <span style={styles.specLabel}>Weight / Size:</span>
                              <strong style={styles.specVal}>{item.selectedWeight || '1.0 lb'}</strong>
                            </div>
                            {item.selectedFlavor && (
                              <div>
                                <span style={styles.specLabel}>Flavor:</span>
                                <strong style={styles.specVal}>{item.selectedFlavor}</strong>
                              </div>
                            )}
                          </div>

                          {item.customMessage && (
                            <div style={styles.letteringRow}>
                              <span style={styles.specLabel}>Lettering:</span>
                              <p style={styles.letteringText}>
                                “{item.customMessage}”{' '}
                                <span style={styles.handPipedNote}>(Hand-piped cursive)</span>
                              </p>
                            </div>
                          )}

                          <div style={styles.cakeNoticeRow}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#8c5e51' }}>
                              schedule
                            </span>
                            <span>{item.minimumNoticeHours || 48}h Studio Advance Notice Required</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stepper & Remove Action */}
                    <div style={styles.itemFooterRow}>
                      <div style={styles.quantityStepper}>
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          style={{
                            ...styles.stepperBtn,
                            opacity: item.quantity <= 1 ? 0.4 : 1,
                            cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            remove
                          </span>
                        </button>

                        <span style={styles.stepperValue}>{item.quantity}</span>

                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.stockQuantity > 0 && item.quantity >= item.stockQuantity}
                          style={{
                            ...styles.stepperBtn,
                            opacity:
                              item.stockQuantity > 0 && item.quantity >= item.stockQuantity ? 0.4 : 1,
                            cursor:
                              item.stockQuantity > 0 && item.quantity >= item.stockQuantity
                                ? 'not-allowed'
                                : 'pointer',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            add
                          </span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setItemToRemove(item)}
                        style={styles.removeItemBtn}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                          delete
                        </span>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            {/* Right Column: Order Summary & Checkout Sidebar */}
            <aside style={styles.summarySidebar}>
              <div style={styles.summaryCard}>
                <h2 style={styles.summaryTitle}>Order Summary</h2>

                <dl style={styles.summaryDl}>
                  <div style={styles.summaryRow}>
                    <dt style={styles.summaryDt}>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</dt>
                    <dd style={styles.summaryDd}>৳ {subtotal.toLocaleString()}</dd>
                  </div>

                  {hasDress && (
                    <div style={styles.summaryRow}>
                      <dt style={styles.summaryDt}>
                        <span>Dress Delivery</span>
                        <span style={styles.lightNote}> (Standard Courier)</span>
                      </dt>
                      <dd style={styles.summaryDd}>৳ 120</dd>
                    </div>
                  )}

                  {hasCake && (
                    <div style={styles.summaryRow}>
                      <dt style={styles.summaryDt}>
                        <span>Fresh Cake Temperature Delivery</span>
                      </dt>
                      <dd style={styles.summaryDd}>৳ 250</dd>
                    </div>
                  )}

                  {deliveryDiscount > 0 && (
                    <div style={styles.discountRow}>
                      <div style={styles.discountInner}>
                        <dt style={styles.discountDt}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            redeem
                          </span>
                          <span>Ships together</span>
                        </dt>
                        <dd style={styles.discountDd}>-৳ {deliveryDiscount.toLocaleString()}</dd>
                      </div>
                      <p style={styles.discountSubtext}>Dress ships together with cake!</p>
                    </div>
                  )}

                  <div style={styles.totalRow}>
                    <dt style={styles.totalDt}>Estimated Total</dt>
                    <dd style={styles.totalDd}>৳ {estimatedTotal.toLocaleString()}</dd>
                  </div>
                </dl>

                {/* Special Note for Sanjida */}
                <div style={styles.noteSection}>
                  <label htmlFor="order-note" style={styles.noteLabel}>
                    <span>Special Note for Sanjida</span>
                    <span style={styles.optionalPill}>Optional</span>
                  </label>
                  <textarea
                    id="order-note"
                    rows={3}
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)}
                    placeholder="Add gift note, delivery date request, or gate code..."
                    style={styles.noteTextarea}
                  />
                </div>

                {/* Checkout CTAs */}
                <div style={styles.checkoutActions}>
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    style={styles.checkoutPrimaryBtn}
                  >
                    <span>Continue to Checkout</span>
                    <span>•</span>
                    <span style={{ fontWeight: 700 }}>৳ {estimatedTotal.toLocaleString()}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      arrow_forward
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/dresses')}
                    style={styles.continueShoppingBtn}
                  >
                    Continue Shopping
                  </button>
                </div>

                {/* Trust Badges */}
                <div style={styles.trustBadges}>
                  <div style={styles.trustItem}>
                    <span className="material-symbols-outlined" style={styles.trustIcon}>
                      cake
                    </span>
                    <span>Freshly baked on your chosen event date</span>
                  </div>
                  <div style={styles.trustItem}>
                    <span className="material-symbols-outlined" style={styles.trustIcon}>
                      checkroom
                    </span>
                    <span>Handcrafted with breathable soft fabrics</span>
                  </div>
                  <div style={styles.trustItem}>
                    <span className="material-symbols-outlined" style={styles.trustIcon}>
                      chat
                    </span>
                    <span>Direct WhatsApp support with Sanjida</span>
                  </div>
                </div>
              </div>

              {/* Studio Assurance Card */}
              <div style={styles.assuranceCard}>
                <div style={styles.assuranceIconCircle}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36' }}>
                    verified_user
                  </span>
                </div>
                <div>
                  <h4 style={styles.assuranceHeading}>Made to Order Promise</h4>
                  <p style={styles.assuranceText}>
                    Every dress is hand-cut and every cake is baked fresh within hours of dispatch.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* =============================================================== */}
      {/* STICKY MOBILE CHECKOUT BAR                                      */}
      {/* =============================================================== */}
      {items.length > 0 && (
        <div style={styles.mobileCheckoutBar} className="mobile-checkout-sticky">
          <div style={styles.mobileTotalCol}>
            <span style={styles.mobileTotalLabel}>Total</span>
            <span style={styles.mobileTotalValue}>৳ {estimatedTotal.toLocaleString()}</span>
          </div>
          <button
            type="button"
            onClick={handleProceedToCheckout}
            style={styles.mobileCheckoutBtn}
          >
            <span>Continue to Checkout</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              arrow_forward
            </span>
          </button>
        </div>
      )}

      {/* =============================================================== */}
      {/* REMOVE ITEM CONFIRMATION MODAL                                  */}
      {/* =============================================================== */}
      {itemToRemove && (
        <div style={styles.modalBackdrop} onClick={() => setItemToRemove(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Remove Item?</h3>
            <p style={styles.modalDesc}>
              Are you sure you want to remove <strong>{itemToRemove.name}</strong> from your shopping bag?
            </p>
            <div style={styles.modalBtnRow}>
              <button
                type="button"
                onClick={() => setItemToRemove(null)}
                style={styles.modalCancelBtn}
              >
                Keep in Bag
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                style={styles.modalConfirmBtn}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* CLEAR BAG CONFIRMATION MODAL                                    */}
      {/* =============================================================== */}
      {confirmClearOpen && (
        <div style={styles.modalBackdrop} onClick={() => setConfirmClearOpen(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Clear Entire Bag?</h3>
            <p style={styles.modalDesc}>
              This will remove all dresses and cakes from your shopping bag. You will need to re-add your selections.
            </p>
            <div style={styles.modalBtnRow}>
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                style={styles.modalCancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setConfirmClearOpen(false);
                }}
                style={styles.modalConfirmBtn}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: '80px', // Spacing for mobile sticky bars
  },
  notificationBanner: {
    backgroundColor: '#f5f3ef',
    borderBottom: '1px solid var(--color-border-subtle, #ece8e1)',
    padding: '10px 16px',
  },
  bannerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textAlign: 'center',
  },
  bannerText: {
    fontSize: '12px',
    color: '#8c5e51',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontWeight: 500,
    margin: 0,
  },
  mainCanvas: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '16px 16px 40px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  breadcrumbBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '8px',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#5c3e36',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 600,
    textDecoration: 'none',
  },
  clearCartBtn: {
    fontSize: '11px',
    color: '#991b1b',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontWeight: 600,
    textDecoration: 'underline',
  },
  pageHeader: {
    borderBottom: '1px solid var(--color-border-subtle, #ece8e1)',
    paddingBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
  },
  pageTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '32px',
    fontWeight: 500,
    color: '#2d2421',
    margin: 0,
    lineHeight: 1.15,
  },
  countBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: '9999px',
    backgroundColor: '#ffdad6',
    color: '#5c3e36',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '11px',
    fontWeight: 600,
  },
  pageSubtitle: {
    fontSize: '13px',
    color: '#6f6764',
    margin: 0,
    lineHeight: 1.5,
  },
  undoBanner: {
    backgroundColor: '#eeebe6',
    border: '1px solid #dfd8ce',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  undoLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  undoText: {
    fontSize: '13px',
    color: '#2d2421',
  },
  undoBtn: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 700,
    color: '#5c3e36',
    textDecoration: 'underline',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid var(--color-border-subtle, #ece8e1)',
    padding: '60px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    maxWidth: '540px',
    margin: '20px auto',
  },
  emptyIconCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '9999px',
    backgroundColor: '#f5ede9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px',
  },
  emptyTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '26px',
    fontWeight: 500,
    color: '#2d2421',
    margin: 0,
  },
  emptySubtitle: {
    fontSize: '13px',
    color: '#6f6764',
    lineHeight: 1.6,
    margin: 0,
    maxWidth: '380px',
  },
  emptyActionGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'center',
    marginTop: '12px',
  },
  emptyPrimaryBtn: {
    height: '44px',
    padding: '0 24px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  },
  emptySecondaryBtn: {
    height: '44px',
    padding: '0 24px',
    borderRadius: '9999px',
    backgroundColor: '#f5f3ef',
    color: '#5c3e36',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  },
  cartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '32px',
    alignItems: 'start',
  },
  itemsStream: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid var(--color-border-subtle, #ece8e1)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'row',
    gap: '16px',
    position: 'relative',
    transition: 'border-color 0.2s ease',
  },
  thumbnailWrapper: {
    width: '110px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f5f3ef',
    position: 'relative',
    flexShrink: 0,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  itemTypeBadge: {
    position: 'absolute',
    top: '6px',
    left: '6px',
    backgroundColor: 'rgba(251, 249, 245, 0.94)',
    color: '#5c3e36',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid var(--color-border-subtle, #ece8e1)',
  },
  itemBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  itemHeaderRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '6px',
  },
  itemCategoryTag: {
    fontSize: '10px',
    color: '#8c5e51',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '2px',
  },
  itemTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '16px',
    fontWeight: 600,
    color: '#2d2421',
    margin: 0,
    lineHeight: 1.3,
  },
  itemPrice: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '15px',
    fontWeight: 700,
    color: '#5c3e36',
    margin: 0,
    whiteSpace: 'nowrap',
  },
  dressSpecsBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '6px',
  },
  specLine: {
    fontSize: '12px',
    color: '#6f6764',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  specLabel: {
    fontSize: '11px',
    color: '#8c5e51',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  specVal: {
    color: '#2d2421',
    fontWeight: 600,
  },
  fabricLine: {
    fontSize: '12px',
    color: '#6f6764',
    margin: 0,
  },
  fabricItalic: {
    fontStyle: 'italic',
    color: '#2d2421',
  },
  shippingNotice: {
    fontSize: '11px',
    color: '#065f46',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '2px',
  },
  cakeSpecsBox: {
    backgroundColor: '#f5f3ef',
    borderRadius: '8px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '6px',
  },
  cakeSpecsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    fontSize: '12px',
    color: '#6f6764',
  },
  letteringRow: {
    borderTop: '1px solid #dfd8ce',
    paddingTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
  },
  letteringText: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontStyle: 'italic',
    fontSize: '12px',
    color: '#5c3e36',
    margin: 0,
  },
  handPipedNote: {
    fontStyle: 'normal',
    fontSize: '10px',
    color: '#6f6764',
  },
  cakeNoticeRow: {
    fontSize: '11px',
    color: '#8c5e51',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    borderTop: '1px solid #dfd8ce',
    paddingTop: '4px',
  },
  itemFooterRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '12px',
    marginTop: '12px',
    borderTop: '1px solid var(--color-border-subtle, #ece8e1)',
  },
  quantityStepper: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#fbf9f5',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '9999px',
  },
  stepperBtn: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#5c3e36',
    backgroundColor: 'transparent',
    border: 'none',
  },
  stepperValue: {
    width: '32px',
    textAlign: 'center',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    color: '#2d2421',
  },
  removeItemBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#991b1b',
    backgroundColor: 'transparent',
    border: 'none',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '6px 8px',
  },
  summarySidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid var(--color-border-subtle, #ece8e1)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(92,62,54,0.03))',
  },
  summaryTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '20px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: 0,
    paddingBottom: '10px',
    borderBottom: '1px solid var(--color-border-subtle, #ece8e1)',
  },
  summaryDl: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    margin: 0,
  },
  summaryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#6f6764',
  },
  summaryDt: {
    fontSize: '13px',
  },
  summaryDd: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#2d2421',
    margin: 0,
  },
  lightNote: {
    fontSize: '11px',
    color: '#988e8a',
  },
  discountRow: {
    backgroundColor: '#fff1ed',
    borderRadius: '8px',
    padding: '8px 10px',
    border: '1px solid #ffdad6',
  },
  discountInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#8c5e51',
    fontWeight: 600,
    fontSize: '12px',
  },
  discountDt: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  discountDd: {
    margin: 0,
  },
  discountSubtext: {
    fontSize: '11px',
    color: '#8c5e51',
    margin: '2px 0 0 20px',
  },
  totalRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    borderTop: '1px solid var(--color-border-default, #dfd8ce)',
    paddingTop: '12px',
    marginTop: '4px',
  },
  totalDt: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '17px',
    fontWeight: 600,
    color: '#2d2421',
  },
  totalDd: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '22px',
    fontWeight: 700,
    color: '#5c3e36',
    margin: 0,
  },
  noteSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    borderTop: '1px solid var(--color-border-subtle, #ece8e1)',
    paddingTop: '12px',
  },
  noteLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
    fontWeight: 600,
    color: '#5c3e36',
  },
  optionalPill: {
    fontSize: '10px',
    color: '#988e8a',
    fontWeight: 400,
  },
  noteTextarea: {
    borderRadius: '8px',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    backgroundColor: '#fbf9f5',
    padding: '8px 10px',
    fontSize: '12px',
    color: '#2d2421',
    outline: 'none',
    resize: 'vertical',
  },
  checkoutActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '4px',
  },
  checkoutPrimaryBtn: {
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
    cursor: 'pointer',
    boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(92,62,54,0.08))',
  },
  continueShoppingBtn: {
    height: '40px',
    borderRadius: '9999px',
    backgroundColor: '#ffffff',
    color: '#5c3e36',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  trustBadges: {
    borderTop: '1px solid var(--color-border-subtle, #ece8e1)',
    paddingTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    color: '#6f6764',
  },
  trustIcon: {
    color: '#8c5e51',
    fontSize: '16px',
  },
  assuranceCard: {
    backgroundColor: '#f5f3ef',
    borderRadius: '12px',
    border: '1px solid var(--color-border-subtle, #ece8e1)',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  assuranceIconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '9999px',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: '1px solid #dfd8ce',
  },
  assuranceHeading: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#5c3e36',
    margin: '0 0 2px 0',
  },
  assuranceText: {
    fontSize: '11px',
    color: '#6f6764',
    lineHeight: 1.45,
    margin: 0,
  },
  mobileCheckoutBar: {
    position: 'fixed',
    bottom: '56px', // Above docked bottom bar
    left: 0,
    right: 0,
    height: '56px',
    backgroundColor: 'rgba(251, 249, 245, 0.98)',
    backdropFilter: 'blur(8px)',
    borderTop: '1px solid var(--color-border-default, #dfd8ce)',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 44,
    boxShadow: '0 -2px 10px rgba(92, 62, 54, 0.08)',
  },
  mobileTotalCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  mobileTotalLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#8c5e51',
    fontWeight: 700,
  },
  mobileTotalValue: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '17px',
    fontWeight: 700,
    color: '#5c3e36',
  },
  mobileCheckoutBtn: {
    height: '40px',
    padding: '0 18px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: 'none',
    cursor: 'pointer',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(45, 36, 33, 0.5)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 100,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '380px',
    width: '100%',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(92, 62, 54, 0.16))',
  },
  modalTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '20px',
    fontWeight: 600,
    color: '#2d2421',
    margin: 0,
  },
  modalDesc: {
    fontSize: '13px',
    color: '#6f6764',
    lineHeight: 1.5,
    margin: 0,
  },
  modalBtnRow: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '6px',
  },
  modalCancelBtn: {
    height: '38px',
    padding: '0 16px',
    borderRadius: '9999px',
    backgroundColor: '#f5f3ef',
    color: '#2d2421',
    fontSize: '12px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  modalConfirmBtn: {
    height: '38px',
    padding: '0 18px',
    borderRadius: '9999px',
    backgroundColor: '#991b1b',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
};
