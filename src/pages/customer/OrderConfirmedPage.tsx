/**
 * Ababil’s Attire by Sanjida Bethi
 * Order Confirmed Page (Mirrors Stitch project 1646646279704595948 - Screen 07220e8325854209830f479e87422220)
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { trackingService } from '../../services/tracking.service';
import type { OrderConfirmationResult, OrderTrackingResult } from '../../types';
import { STUDIO_CONFIG, getStudioWhatsAppUrl } from '../../lib/studio';

function formatDateDisplay(isoDateString?: string): string {
  if (!isoDateString) return 'Upcoming Delivery Date';
  try {
    const d = new Date(isoDateString);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoDateString;
  }
}

export const OrderConfirmedPage: React.FC = () => {
  const { invoiceNumber: paramInvoice } = useParams<{ invoiceNumber: string }>();
  const location = useLocation();

  // State from location or from tracking service lookup
  const initialConfirmation = (location.state as any)?.orderConfirmation as
    | OrderConfirmationResult
    | undefined;

  const [confirmation, setConfirmation] = useState<OrderConfirmationResult | null>(
    initialConfirmation || null
  );
  const [trackingData, setTrackingData] = useState<OrderTrackingResult | null>(null);
  const [loading, setLoading] = useState(!initialConfirmation);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  const cleanInvoice = (paramInvoice || confirmation?.invoice_number || '').trim().toUpperCase();

  useEffect(() => {
    let isMounted = true;

    async function fetchOrder() {
      if (!cleanInvoice) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await trackingService.trackOrderByInvoice(cleanInvoice);
        if (isMounted && data && data.found) {
          setTrackingData(data);
          setConfirmation((prev) =>
            prev || {
              success: true,
              order_id: '',
              invoice_number: data.invoice_number || cleanInvoice,
              customer_name: data.customer_name_initial || 'Valued Customer',
              subtotal: data.subtotal || 0,
              delivery_charge: data.delivery_charge || 0,
              total_amount: data.total_amount || 0,
              advance_amount: data.advance_amount || 500,
              advance_status: data.advance_status || 'pending',
              cash_due: data.cash_due || 0,
              delivery_date: data.delivery_date || '',
              status: data.status || 'review_required',
              created_at: data.created_at || new Date().toISOString(),
            }
          );
        }
      } catch (err) {
        console.warn('Could not load tracking record for confirmed order:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [cleanInvoice]);

  const handleCopyInvoice = () => {
    if (!cleanInvoice) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cleanInvoice);
      setCopiedInvoice(true);
      setTimeout(() => setCopiedInvoice(false), 2000);
    }
  };

  const navState = location.state as any;
  const customerPhone = navState?.customerPhone;
  const customerAddress = navState?.customerAddress;
  const deliveryTime = navState?.deliveryTime || trackingData?.delivery_time || 'Morning 10:00 AM - 1:00 PM';
  const stateItems = navState?.items;

  const displayTotal = confirmation?.total_amount ?? trackingData?.total_amount ?? 0;
  const displayAdvance = confirmation?.advance_amount ?? trackingData?.advance_amount ?? 500;
  const displayCashDue = confirmation?.cash_due ?? trackingData?.cash_due ?? Math.max(0, displayTotal - displayAdvance);
  const displayCustomerName = confirmation?.customer_name ?? trackingData?.customer_name_initial ?? 'Valued Customer';
  const displayDate = confirmation?.delivery_date ?? trackingData?.delivery_date;

  const whatsappMessage = encodeURIComponent(
    `Hello Sanjida, I have just placed order ${cleanInvoice} on Ababil's Attire. Could you please confirm my delivery schedule?`
  );

  if (loading && !confirmation) {
    return (
      <div style={styles.pageWrapper}>
        <div style={{ padding: '60px 16px', textAlign: 'center' }}>
          <div style={{ ...styles.heroIconCircle, margin: '0 auto' }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '28px', color: '#ffffff' }}
            >
              progress_activity
            </span>
          </div>
          <p style={{ marginTop: '16px', color: '#5c3e36', fontWeight: 600 }}>
            Fetching order confirmation details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      {/* ===================================================================== */}
      {/* 1. TOP HEADER & STEP TRACKER (Stitch Spec)                            */}
      {/* ===================================================================== */}
      <div style={styles.topBar}>
        <div style={styles.topBarInner}>
          <Link to="/" style={styles.homeLink}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              storefront
            </span>
            <span>Home</span>
          </Link>

          <div style={styles.headerBrand}>
            <span style={styles.brandTitle}>Ababil’s Attire</span>
            <span style={styles.brandSubtitle}>by Sanjida Bethi</span>
          </div>

          <div style={styles.atelierPill}>Order Confirmed</div>
        </div>

        {/* Step Progress Tracker */}
        <div style={styles.stepTracker}>
          <div style={styles.stepInner}>
            <div style={styles.stepItemDone}>
              <span style={styles.stepDotDone}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                  check
                </span>
              </span>
              <span style={styles.stepLabelDone}>1. Bag</span>
            </div>

            <span style={styles.stepArrow}>→</span>

            <div style={styles.stepItemDone}>
              <span style={styles.stepDotDone}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                  check
                </span>
              </span>
              <span style={styles.stepLabelDone}>2. Checkout</span>
            </div>

            <span style={styles.stepArrow}>→</span>

            <div style={styles.stepItemActive}>
              <span style={styles.stepDotActive}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                  check_circle
                </span>
              </span>
              <span style={styles.stepLabelActive}>3. Order Placed</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MAIN ORDER CONFIRMATION CANVAS                                        */}
      {/* ===================================================================== */}
      <main style={styles.mainCanvas}>
        {/* 1. SUCCESS HERO CARD */}
        <section style={styles.heroCard}>
          <div style={styles.heroGlow} />

          {/* Celebratory Checkmark Badge */}
          <div style={styles.heroIconWrapper}>
            <div style={styles.heroIconCircle}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#ffffff' }}>
                check
              </span>
            </div>
            <div style={styles.artisanSubBadge} title="Artisan Craft">
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#5c3e36' }}>
                local_florist
              </span>
            </div>
          </div>

          <h1 style={styles.heroTitle}>Your order is confirmed!</h1>
          <p style={styles.heroSubtitle}>
            Your advance payment has been recorded. Please pay the remaining amount when your order is delivered.
          </p>

          {/* Invoice Number Box */}
          <div style={styles.invoiceBox}>
            <div style={styles.invoiceHeaderRow}>
              <span style={styles.invoiceLabel}>Invoice Number</span>
              <span style={styles.invoiceTime}>Today at Dhaka Studio</span>
            </div>

            <div style={styles.invoiceDisplayRow}>
              <span style={styles.invoiceCode}>{cleanInvoice || 'AB-RECEIPT'}</span>
              <button
                type="button"
                onClick={handleCopyInvoice}
                style={styles.copyBtn}
                aria-label="Copy Invoice Number"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  {copiedInvoice ? 'check' : 'content_copy'}
                </span>
                <span>{copiedInvoice ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <p style={styles.invoiceHelpText}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#7e544f' }}>
                info
              </span>
              <span>Save this invoice number to track your order anytime.</span>
            </p>
          </div>
        </section>

        {/* 2. VISUAL ORDER STATUS TIMELINE (Stitch Spec) */}
        <section style={styles.cardSection}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Order Status Tracker</h2>
            <span style={styles.liveBadge}>Live Order Status</span>
          </div>

          <ol style={styles.timelineList}>
            {/* Step 1: Order Placed (Done) */}
            <li style={styles.timelineItem}>
              <span style={styles.timelineDotDone}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                  check
                </span>
              </span>
              <div style={styles.timelineContent}>
                <div style={styles.timelineTitleRow}>
                  <span style={styles.timelineStepTitle}>Order Placed</span>
                  <span style={styles.timelineStatusDone}>Done</span>
                </div>
                <p style={styles.timelineStepDesc}>Order received at Ababil’s Attire.</p>
              </div>
            </li>

            {/* Step 2: Confirmed (Active) */}
            <li style={styles.timelineItem}>
              <span style={styles.timelineDotActive}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                  check
                </span>
              </span>
              <div style={styles.timelineContent}>
                <div style={styles.timelineTitleRow}>
                  <span style={styles.timelineStepTitleActive}>Confirmed ✓</span>
                  <span style={styles.timelineStatusActive}>Current Status</span>
                </div>
                <p style={styles.timelineStepDescActive}>
                  Advance details recorded &amp; slotted into production docket.
                </p>
              </div>
            </li>

            {/* Step 3: Processing */}
            <li style={styles.timelineItemUpcoming}>
              <span style={styles.timelineDotUpcoming}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                  handyman
                </span>
              </span>
              <div style={styles.timelineContent}>
                <span style={styles.timelineStepTitleUpcoming}>Processing</span>
                <p style={styles.timelineStepDescUpcoming}>
                  Baking sponges &amp; hand-stitching smocked details.
                </p>
              </div>
            </li>

            {/* Step 4: Dispatched */}
            <li style={styles.timelineItemUpcoming}>
              <span style={styles.timelineDotUpcoming}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                  local_shipping
                </span>
              </span>
              <div style={styles.timelineContent}>
                <span style={styles.timelineStepTitleUpcoming}>Dispatched</span>
                <p style={styles.timelineStepDescUpcoming}>
                  Chilled private courier with fragile safety crate.
                </p>
              </div>
            </li>

            {/* Step 5: Delivered */}
            <li style={styles.timelineItemUpcoming}>
              <span style={styles.timelineDotUpcoming}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                  home
                </span>
              </span>
              <div style={styles.timelineContent}>
                <span style={styles.timelineStepTitleUpcoming}>Delivered</span>
                <p style={styles.timelineStepDescUpcoming}>
                  Handed over directly to {displayCustomerName}.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* 3. CUSTOMER & DELIVERY SUMMARY CARD */}
        <section style={styles.cardSection}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Delivery Summary</h2>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#8c5e51' }}>
              home_pin
            </span>
          </div>

          <div style={styles.summaryList}>
            <div style={styles.summaryDataRow}>
              <span style={styles.summaryDataLabel}>Customer:</span>
              <span style={styles.summaryDataValue}>{displayCustomerName}</span>
            </div>

            {customerPhone && (
              <div style={styles.summaryDataRow}>
                <span style={styles.summaryDataLabel}>Phone:</span>
                <span style={styles.summaryDataValue}>+880 {customerPhone}</span>
              </div>
            )}

            {customerAddress && (
              <div style={styles.summaryDataRow}>
                <span style={styles.summaryDataLabel}>Address:</span>
                <span style={styles.summaryDataValue}>{customerAddress}</span>
              </div>
            )}

            <div style={{ ...styles.summaryDataRow, borderTop: '1px solid #f0ede8', paddingTop: '8px' }}>
              <span style={styles.summaryDataLabel}>Scheduled:</span>
              <span style={{ ...styles.summaryDataValue, color: '#5c3e36', fontWeight: 600 }}>
                {formatDateDisplay(displayDate)} ({deliveryTime})
              </span>
            </div>

            <div style={styles.summaryDataRow}>
              <span style={styles.summaryDataLabel}>Method:</span>
              <span style={styles.summaryDataValue}>
                Hand Delivery <span style={{ color: '#7e544f' }}>(Temperature Controlled)</span>
              </span>
            </div>

            {/* Financial Box */}
            <div style={styles.financeBox}>
              <div style={styles.financeRow}>
                <span style={styles.financeLabel}>Total Amount:</span>
                <span style={styles.financeVal}>৳ {displayTotal.toLocaleString()}</span>
              </div>

              <div style={styles.financeRow}>
                <span style={styles.financeLabel}>Advance Paid (bKash):</span>
                <span style={{ ...styles.financeVal, color: '#065f46' }}>
                  - ৳ {displayAdvance.toLocaleString()}
                </span>
              </div>

              <div style={styles.financeSubRow}>
                <span>Invoice: {cleanInvoice}</span>
                <span style={{ color: '#065f46', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                    verified
                  </span>
                  Advance Recorded
                </span>
              </div>

              <div style={styles.dueOnDeliveryRow}>
                <span style={styles.dueOnDeliveryLabel}>Due on Delivery:</span>
                <span style={styles.dueOnDeliveryVal}>৳ {displayCashDue.toLocaleString()} (Cash)</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. ORDERED ITEMS SUMMARY (COMPACT REVIEW) */}
        {((stateItems && stateItems.length > 0) || (trackingData?.items && trackingData.items.length > 0)) && (
          <section style={styles.cardSection}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Ordered Items</h2>
              <span style={styles.artisanPiecesPill}>Artisan Pieces</span>
            </div>

            <div style={styles.itemsList}>
              {stateItems &&
                stateItems.map((item: any, idx: number) => (
                  <div key={item.id || idx} style={styles.orderItemCard}>
                    {item.imageUrl && (
                      <div
                        style={{
                          ...styles.orderItemThumbWrap,
                          aspectRatio: item.category === 'dress' ? '3 / 4' : '1 / 1',
                        }}
                      >
                        <img src={item.imageUrl} alt={item.name} style={styles.orderItemImg} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.orderItemHeaderRow}>
                        <h3 style={styles.orderItemName}>{item.name}</h3>
                        <span style={styles.orderItemPrice}>
                          ৳ {(item.unitPrice * item.quantity).toLocaleString()}
                        </span>
                      </div>

                      {item.category === 'dress' && (
                        <p style={styles.orderItemDetailText}>
                          Size: {item.selectedSize} • {item.fabricDetails || 'Cotton Smocked'} • Qty: {item.quantity}
                        </p>
                      )}

                      {item.category === 'cake' && (
                        <>
                          <p style={styles.orderItemDetailText}>
                            {item.selectedWeight} • {item.selectedFlavor} • Qty: {item.quantity}
                          </p>
                          {item.customMessage && (
                            <div style={styles.letteringCallout}>
                              Lettering: “{item.customMessage}”
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}

              {!stateItems &&
                trackingData?.items &&
                trackingData.items.map((it: any) => (
                  <div key={it.id} style={styles.orderItemCard}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.orderItemHeaderRow}>
                        <h3 style={styles.orderItemName}>{it.product_name}</h3>
                        <span style={styles.orderItemPrice}>৳ {it.subtotal.toLocaleString()}</span>
                      </div>
                      <p style={styles.orderItemDetailText}>
                        {it.selected_size ? `Size: ${it.selected_size} • ` : ''}
                        {it.cake_weight ? `${it.cake_weight} • ` : ''}
                        {it.cake_flavor ? `${it.cake_flavor} • ` : ''}
                        Qty: {it.quantity}
                      </p>
                      {it.cake_message && (
                        <div style={styles.letteringCallout}>Lettering: “{it.cake_message}”</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* 5. REASSURANCE & ARTISAN HELP BOX */}
        <section style={styles.helpBox}>
          <div style={styles.helpIconCircle}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36' }}>
              chat
            </span>
          </div>
          <h3 style={styles.helpTitle}>Need to adjust something or ask a question?</h3>
          <p style={styles.helpDesc}>
            Need to update the delivery timing or customize your cake lettering? Sanjida Bethi is directly
            reachable on WhatsApp.
          </p>

          <a
            href={getStudioWhatsAppUrl(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.whatsappBtn}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              chat_bubble
            </span>
            <span>Message Sanjida on WhatsApp</span>
          </a>

          <div style={{ marginTop: '8px' }}>
            <span style={styles.phoneDirectText}>
              or phone us directly: <a href={`tel:${STUDIO_CONFIG.phoneRaw}`} style={styles.phoneLink}>{STUDIO_CONFIG.phoneDisplay}</a>
            </span>
          </div>
        </section>

        {/* 6. PRIMARY ACTION BUTTONS */}
        <div style={styles.actionButtonGroup}>
          <Link
            to={cleanInvoice ? `/track-order?invoice=${encodeURIComponent(cleanInvoice)}` : '/track-order'}
            style={styles.trackOrderBtn}
          >
            <span>Track My Order</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              arrow_forward
            </span>
          </Link>

          <Link to="/" style={styles.continueShoppingBtn}>
            Continue Shopping
          </Link>
        </div>
      </main>
    </div>
  );
};

// =============================================================================
// CSS STYLES (Mirrors Stitch Screen 07220e8325854209830f479e87422220)
// =============================================================================
const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-surface, #fbf9f5)',
    color: '#2d2421',
    paddingBottom: '80px',
  },
  topBar: {
    position: 'sticky',
    top: 0,
    zIndex: 40,
    backgroundColor: 'rgba(251, 249, 245, 0.95)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid var(--color-border-subtle, #ece8e1)',
  },
  topBarInner: {
    maxWidth: '540px',
    margin: '0 auto',
    padding: '0 16px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  homeLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#6f6764',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 500,
  },
  headerBrand: {
    textAlign: 'center',
  },
  brandTitle: {
    display: 'block',
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '18px',
    fontWeight: 600,
    color: '#5c3e36',
  },
  brandSubtitle: {
    display: 'block',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#8c5e51',
  },
  atelierPill: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
    color: '#065f46',
    padding: '3px 8px',
    borderRadius: '9999px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
  },
  stepTracker: {
    backgroundColor: '#f5f3ef',
    borderTop: '1px solid #ece8e1',
    padding: '8px 16px',
  },
  stepInner: {
    maxWidth: '480px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItemDone: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    opacity: 0.8,
  },
  stepDotDone: {
    width: '18px',
    height: '18px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabelDone: {
    fontSize: '11px',
    color: '#2d2421',
  },
  stepItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  stepDotActive: {
    width: '20px',
    height: '20px',
    borderRadius: '9999px',
    backgroundColor: '#065f46',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabelActive: {
    fontSize: '11px',
    color: '#065f46',
    fontWeight: 700,
  },
  stepArrow: {
    color: '#d4c3bf',
    fontSize: '11px',
  },
  mainCanvas: {
    maxWidth: '540px',
    margin: '0 auto',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  heroCard: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '16px',
    padding: '24px 20px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(92, 62, 54, 0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: '-40px',
    right: '-40px',
    width: '120px',
    height: '120px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(255, 199, 193, 0.35)',
    filter: 'blur(30px)',
    pointerEvents: 'none',
  },
  heroIconWrapper: {
    position: 'relative',
    width: '64px',
    height: '64px',
    margin: '0 auto 16px auto',
  },
  heroIconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(92, 62, 54, 0.2)',
  },
  artisanSubBadge: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '24px',
    height: '24px',
    borderRadius: '9999px',
    backgroundColor: '#fbf9f5',
    border: '1px solid #dfd8ce',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '26px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: '0 0 8px 0',
  },
  heroSubtitle: {
    fontSize: '13px',
    color: '#6f6764',
    margin: '0 0 20px 0',
    lineHeight: 1.5,
  },
  invoiceBox: {
    backgroundColor: '#f5f3ef',
    border: '1px solid #dfd8ce',
    borderRadius: '10px',
    padding: '14px',
    textAlign: 'left',
  },
  invoiceHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  invoiceLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 700,
    color: '#7e544f',
  },
  invoiceTime: {
    fontSize: '11px',
    color: '#827470',
  },
  invoiceDisplayRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    border: '1px solid #dfd8ce',
    borderRadius: '6px',
    padding: '8px 12px',
    marginBottom: '8px',
  },
  invoiceCode: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '18px',
    fontWeight: 700,
    color: '#5c3e36',
    letterSpacing: '0.04em',
  },
  copyBtn: {
    padding: '8px 14px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    minHeight: '44px',
  },
  invoiceHelpText: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#6f6764',
    margin: 0,
  },
  cardSection: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 1px 4px rgba(92, 62, 54, 0.04)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '10px',
    borderBottom: '1px solid #ece8e1',
    marginBottom: '14px',
  },
  cardTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '18px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: 0,
  },
  liveBadge: {
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '9999px',
    backgroundColor: '#ffdad6',
    color: '#5c3e36',
    fontWeight: 600,
  },
  timelineList: {
    position: 'relative',
    margin: 0,
    padding: '0 0 0 24px',
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  timelineItem: {
    position: 'relative',
  },
  timelineDotDone: {
    position: 'absolute',
    left: '-24px',
    top: '2px',
    width: '18px',
    height: '18px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  timelineTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineStepTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#2d2421',
  },
  timelineStatusDone: {
    fontSize: '10px',
    padding: '1px 6px',
    borderRadius: '9999px',
    backgroundColor: '#f5f3ef',
    color: '#6f6764',
  },
  timelineStepDesc: {
    fontSize: '11px',
    color: '#6f6764',
    margin: '2px 0 0 0',
  },
  timelineDotActive: {
    position: 'absolute',
    left: '-24px',
    top: '2px',
    width: '18px',
    height: '18px',
    borderRadius: '9999px',
    backgroundColor: '#065f46',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineStepTitleActive: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#065f46',
  },
  timelineStatusActive: {
    fontSize: '10px',
    padding: '1px 6px',
    borderRadius: '9999px',
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    fontWeight: 600,
  },
  timelineStepDescActive: {
    fontSize: '11px',
    color: '#065f46',
    margin: '2px 0 0 0',
    fontWeight: 500,
  },
  timelineItemUpcoming: {
    position: 'relative',
    opacity: 0.6,
  },
  timelineDotUpcoming: {
    position: 'absolute',
    left: '-24px',
    top: '2px',
    width: '18px',
    height: '18px',
    borderRadius: '9999px',
    backgroundColor: '#e4e2de',
    color: '#6f6764',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineStepTitleUpcoming: {
    fontSize: '13px',
    color: '#6f6764',
  },
  timelineStepDescUpcoming: {
    fontSize: '11px',
    color: '#827470',
    margin: '2px 0 0 0',
  },
  summaryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  summaryDataRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  summaryDataLabel: {
    color: '#827470',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontSize: '10px',
    fontWeight: 600,
    minWidth: '85px',
  },
  summaryDataValue: {
    textAlign: 'right',
    color: '#2d2421',
    fontWeight: 500,
    maxWidth: '260px',
    lineHeight: 1.4,
  },
  financeBox: {
    backgroundColor: '#f5f3ef',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  financeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  financeLabel: {
    color: '#6f6764',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  financeVal: {
    fontWeight: 600,
    color: '#2d2421',
  },
  financeSubRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#827470',
    paddingBottom: '6px',
    borderBottom: '1px solid #dfd8ce',
  },
  dueOnDeliveryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '4px',
  },
  dueOnDeliveryLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#5c3e36',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  dueOnDeliveryVal: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '16px',
    fontWeight: 700,
    color: '#5c3e36',
  },
  artisanPiecesPill: {
    fontSize: '11px',
    color: '#827470',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  orderItemCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    paddingBottom: '10px',
    borderBottom: '1px solid #f0ede8',
  },
  orderItemThumbWrap: {
    width: '54px',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: '#f5f3ef',
    border: '1px solid #dfd8ce',
    flexShrink: 0,
  },
  orderItemImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  orderItemHeaderRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  orderItemName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: 0,
    lineHeight: 1.3,
  },
  orderItemPrice: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#5c3e36',
    marginLeft: '8px',
    flexShrink: 0,
  },
  orderItemDetailText: {
    fontSize: '11px',
    color: '#7e544f',
    margin: '3px 0 0 0',
  },
  letteringCallout: {
    fontSize: '11px',
    fontStyle: 'italic',
    color: '#5c3e36',
    backgroundColor: '#fbf9f5',
    padding: '3px 6px',
    borderRadius: '4px',
    marginTop: '4px',
  },
  helpBox: {
    backgroundColor: '#efeeea',
    border: '1px solid #dfd8ce',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
  },
  helpIconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '9999px',
    backgroundColor: '#ffffff',
    border: '1px solid #dfd8ce',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 10px auto',
  },
  helpTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: '0 0 6px 0',
  },
  helpDesc: {
    fontSize: '11px',
    color: '#6f6764',
    margin: '0 0 12px 0',
    lineHeight: 1.4,
  },
  whatsappBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    padding: '10px 16px',
    borderRadius: '9999px',
    backgroundColor: '#25D366',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 600,
    boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)',
  },
  phoneDirectText: {
    fontSize: '11px',
    color: '#827470',
  },
  phoneLink: {
    color: '#5c3e36',
    fontWeight: 600,
    textDecoration: 'none',
  },
  actionButtonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  trackOrderBtn: {
    height: '46px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow: '0 3px 8px rgba(92, 62, 54, 0.15)',
  },
  continueShoppingBtn: {
    height: '46px',
    borderRadius: '9999px',
    backgroundColor: 'transparent',
    border: '1px solid #5c3e36',
    color: '#5c3e36',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
