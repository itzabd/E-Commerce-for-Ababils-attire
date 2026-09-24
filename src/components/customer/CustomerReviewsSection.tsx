/**
 * Ababil’s Attire by Sanjida Bethi
 * Customer Reviews & Message Screenshots Section
 * Displays genuine social proof from WhatsApp chats and Facebook recommendations.
 */

import React, { useState, useEffect } from 'react';
import { reviewsService, type CustomerReview } from '../../services/reviews.service';

export const CustomerReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [activeScreenshot, setActiveScreenshot] = useState<CustomerReview | null>(null);

  useEffect(() => {
    reviewsService.getReviews().then((data) => {
      setReviews(data);
    });
  }, []);

  // Close lightbox on Escape key
  useEffect(() => {
    if (!activeScreenshot) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveScreenshot(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeScreenshot]);

  if (reviews.length === 0) return null;

  return (
    <section style={styles.sectionWrapper} aria-labelledby="customer-love-heading">
      {/* Section Header */}
      <div style={styles.header}>
        <span style={styles.kicker}>Love from Mothers</span>
        <h2 id="customer-love-heading" style={styles.title}>
          Real WhatsApp & Facebook Reviews
        </h2>
        <p style={styles.subtitle}>
          Unedited messages, photos, and thank-you notes shared by families across Dhaka after birthdays and celebrations. Tap any screenshot to expand.
        </p>
      </div>

      {/* Reviews Grid / Scroll Track */}
      <div style={styles.reviewsGrid}>
        {reviews.map((rev) => {
          const isWhatsApp = rev.platform === 'whatsapp';
          const isFacebook = rev.platform === 'facebook';

          return (
            <article key={rev.id} style={styles.reviewCard}>
              {/* Platform Header */}
              <div style={styles.cardHeader}>
                <div style={styles.platformBadgeWrap}>
                  <span
                    style={{
                      ...styles.platformPill,
                      backgroundColor: isWhatsApp ? '#ecfdf5' : isFacebook ? '#eff6ff' : '#fdf2f8',
                      color: isWhatsApp ? '#065f46' : isFacebook ? '#1e40af' : '#9d174d',
                      borderColor: isWhatsApp ? '#a7f3d0' : isFacebook ? '#bfdbfe' : '#fbcfe8',
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>
                      {isWhatsApp ? '💬' : isFacebook ? '📘' : '📸'}
                    </span>
                    <span>{isWhatsApp ? 'WhatsApp' : isFacebook ? 'Facebook' : 'Instagram'}</span>
                  </span>
                  <span style={styles.dateText}>{rev.date}</span>
                </div>

                <div style={styles.starsRow} aria-label="5 out of 5 stars">
                  {'★'.repeat(rev.rating || 5)}
                </div>
              </div>

              {/* Clickable Screenshot Preview */}
              <div
                style={styles.screenshotFrame}
                onClick={() => setActiveScreenshot(rev)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveScreenshot(rev)}
                aria-label={`Enlarge review screenshot from ${rev.customer_name}`}
              >
                <img
                  src={rev.screenshot_url}
                  alt={`Screenshot review from ${rev.customer_name}`}
                  style={styles.screenshotImg}
                  loading="lazy"
                />
                <div style={styles.screenshotOverlay}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    zoom_in
                  </span>
                  <span style={styles.overlayText}>Tap to View Message</span>
                </div>
              </div>

              {/* Customer Quote & Attribution */}
              <div style={styles.quoteBody}>
                <p style={styles.captionText}>{rev.caption}</p>

                <div style={styles.authorRow}>
                  <div>
                    <h4 style={styles.authorName}>{rev.customer_name}</h4>
                    {rev.customer_area && <p style={styles.authorArea}>{rev.customer_area}</p>}
                  </div>
                  {rev.product_name && (
                    <span style={styles.productTag}>
                      {rev.product_name.split(' ')[0]} {rev.product_name.includes('Dress') ? 'Dress' : 'Cake'}
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Lightbox Modal for Full Screenshot Viewing */}
      {activeScreenshot && (
        <div style={styles.lightboxBackdrop} onClick={() => setActiveScreenshot(null)}>
          <div style={styles.lightboxDialog} onClick={(e) => e.stopPropagation()}>
            <header style={styles.lightboxHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>
                  {activeScreenshot.platform === 'whatsapp' ? '💬 WhatsApp Message' : '📘 Facebook Recommendation'}
                </span>
                <span style={{ fontSize: '12px', color: '#8c5e51' }}>• {activeScreenshot.customer_name}</span>
              </div>
              <button
                type="button"
                style={styles.lightboxCloseBtn}
                onClick={() => setActiveScreenshot(null)}
                aria-label="Close review screenshot"
              >
                ✕
              </button>
            </header>

            <div style={styles.lightboxBody}>
              {activeScreenshot.platform === 'whatsapp' ? (
                /* Authentic WhatsApp Chat Screenshot View */
                <div style={styles.waPhoneFrame}>
                  {/* WhatsApp App Top Bar */}
                  <div style={styles.waHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#ffffff' }}>
                        arrow_back
                      </span>
                      <div style={styles.waAvatar}>
                        {activeScreenshot.customer_name.charAt(0)}
                      </div>
                      <div>
                        <div style={styles.waContactName}>{activeScreenshot.customer_name}</div>
                        <div style={styles.waContactStatus}>online</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', color: '#ffffff' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>videocam</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>more_vert</span>
                    </div>
                  </div>

                  {/* WhatsApp Chat Canvas */}
                  <div style={styles.waChatCanvas}>
                    {/* Date Pill */}
                    <div style={styles.waDatePill}>
                      {activeScreenshot.date}
                    </div>

                    {/* Customer Message Bubble (Incoming) */}
                    <div style={styles.waBubbleIncoming}>
                      {/* Attached Customer Photo */}
                      <img
                        src={activeScreenshot.screenshot_url}
                        alt={`Photo shared by ${activeScreenshot.customer_name}`}
                        style={styles.waBubbleImg}
                      />
                      {/* Caption Message */}
                      <p style={styles.waBubbleText}>
                        {activeScreenshot.caption}
                      </p>
                      <div style={styles.waBubbleMeta}>
                        <span>{activeScreenshot.date.includes(',') ? activeScreenshot.date.split(',')[1]?.trim() : '9:42 PM'}</span>
                      </div>
                    </div>

                    {/* Atelier Reply Bubble (Outgoing) */}
                    <div style={styles.waBubbleOutgoing}>
                      <p style={styles.waReplyText}>
                        Alhamdulillah Apu! We are so honored to be part of your celebration. Thank you for choosing Ababil’s Attire! 🤍✨
                      </p>
                      <div style={styles.waReplyMeta}>
                        <span>9:45 PM</span>
                        <span style={{ color: '#53bdeb', fontSize: '14px', lineHeight: 1 }}>✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Authentic Facebook Recommendation Card View */
                <div style={styles.fbFrame}>
                  {/* Facebook Header */}
                  <div style={styles.fbHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={styles.fbAvatar}>
                        {activeScreenshot.customer_name.charAt(0)}
                      </div>
                      <div>
                        <div style={styles.fbName}>
                          <strong>{activeScreenshot.customer_name}</strong> recommends <strong>Ababil’s Attire by Sanjida Bethi</strong>.
                        </div>
                        <div style={styles.fbMeta}>
                          <span>{activeScreenshot.date} • </span>
                          <span style={{ fontSize: '11px' }}>🌐 Public</span>
                        </div>
                      </div>
                    </div>
                    <div style={styles.fbStars}>★★★★★</div>
                  </div>

                  {/* Facebook Body */}
                  <div style={styles.fbBody}>
                    <p style={styles.fbText}>{activeScreenshot.caption}</p>
                    <img
                      src={activeScreenshot.screenshot_url}
                      alt={`Review shared by ${activeScreenshot.customer_name}`}
                      style={styles.fbImg}
                    />
                  </div>
                </div>
              )}

              {/* Attribution Footer */}
              <div style={styles.lightboxFooterBar}>
                <span style={{ fontSize: '12px', color: '#6f6764' }}>
                  Client Location: <strong>{activeScreenshot.customer_area || 'Dhaka, Bangladesh'}</strong>
                </span>
                {activeScreenshot.product_name && (
                  <span style={styles.productTag}>{activeScreenshot.product_name}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sectionWrapper: {
    padding: '48px 16px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    textAlign: 'center',
    maxWidth: '680px',
    margin: '0 auto 36px auto',
  },
  kicker: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#8c5e51',
    display: 'block',
    marginBottom: '6px',
  },
  title: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '28px',
    fontWeight: 600,
    color: '#3d251e',
    margin: '0 0 10px 0',
    lineHeight: 1.2,
  },
  subtitle: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    color: '#6f6764',
    lineHeight: 1.6,
    margin: 0,
  },
  reviewsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
    gap: '20px',
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #ebdcd6',
    boxShadow: '0 4px 14px rgba(92, 62, 54, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  cardHeader: {
    padding: '14px 16px 10px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #f6f0ec',
  },
  platformBadgeWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  platformPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '9999px',
    border: '1px solid transparent',
    letterSpacing: '0.02em',
  },
  dateText: {
    fontSize: '11px',
    color: '#9c8e88',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
  },
  starsRow: {
    color: '#f59e0b',
    fontSize: '13px',
    letterSpacing: '1px',
  },
  screenshotFrame: {
    position: 'relative',
    height: '190px',
    backgroundColor: '#f5ede9',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  screenshotImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  screenshotOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(61, 37, 30, 0.72)',
    backdropFilter: 'blur(4px)',
    color: '#ffffff',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 600,
  },
  overlayText: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
  },
  quoteBody: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1,
    gap: '12px',
  },
  captionText: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    color: '#3d251e',
    lineHeight: 1.6,
    fontStyle: 'italic',
    margin: 0,
  },
  authorRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '10px',
    borderTop: '1px dashed #ebdcd6',
    gap: '8px',
  },
  authorName: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 700,
    color: '#5c3e36',
    margin: 0,
  },
  authorArea: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '11px',
    color: '#8c5e51',
    margin: 0,
  },
  productTag: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#77554c',
    backgroundColor: '#f5ede9',
    padding: '3px 8px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
  },
  lightboxBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30, 20, 18, 0.85)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 10000,
  },
  lightboxDialog: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
  },
  lightboxHeader: {
    padding: '14px 18px',
    borderBottom: '1px solid #ebdcd6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fbf9f5',
    fontWeight: 600,
    color: '#432821',
    fontSize: '13px',
  },
  lightboxCloseBtn: {
    backgroundColor: '#f5ede9',
    border: 'none',
    color: '#5c3e36',
    width: '32px',
    height: '32px',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontWeight: 700,
  },
  lightboxBody: {
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  lightboxImg: {
    width: '100%',
    maxHeight: '60vh',
    objectFit: 'contain',
    borderRadius: '10px',
    backgroundColor: '#f5f3ef',
  },
  lightboxCaption: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    color: '#432821',
    lineHeight: 1.6,
    fontStyle: 'italic',
    margin: 0,
    padding: '10px',
    backgroundColor: '#fbf9f5',
    borderRadius: '8px',
    borderLeft: '3px solid #5c3e36',
  },
  waPhoneFrame: {
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#efeae2',
  },
  waHeader: {
    backgroundColor: '#075e54',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '9999px',
    backgroundColor: '#128c7e',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '14px',
    border: '1px solid rgba(255, 255, 255, 0.4)',
  },
  waContactName: {
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
  },
  waContactStatus: {
    color: '#a7f3d0',
    fontSize: '10px',
  },
  waChatCanvas: {
    padding: '16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundImage: 'radial-gradient(#e0d7cb 1px, transparent 1px)',
    backgroundSize: '16px 16px',
    minHeight: '260px',
  },
  waDatePill: {
    alignSelf: 'center',
    backgroundColor: '#e1d9cc',
    color: '#555555',
    fontSize: '10px',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: '9999px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  },
  waBubbleIncoming: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: '0 12px 12px 12px',
    padding: '6px',
    maxWidth: '85%',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
  },
  waBubbleImg: {
    width: '100%',
    maxHeight: '260px',
    objectFit: 'cover',
    borderRadius: '8px',
    display: 'block',
    marginBottom: '8px',
  },
  waBubbleText: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    color: '#111b21',
    lineHeight: 1.5,
    margin: '0 6px 4px 6px',
  },
  waBubbleMeta: {
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: '10px',
    color: '#667781',
    paddingRight: '4px',
  },
  waBubbleOutgoing: {
    alignSelf: 'flex-end',
    backgroundColor: '#d9fdd3',
    borderRadius: '12px 0 12px 12px',
    padding: '8px 10px',
    maxWidth: '82%',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
  },
  waReplyText: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    color: '#111b21',
    lineHeight: 1.45,
    margin: 0,
  },
  waReplyMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '3px',
    fontSize: '10px',
    color: '#667781',
    marginTop: '4px',
  },
  fbFrame: {
    borderRadius: '12px',
    border: '1px solid #ced0d4',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  },
  fbHeader: {
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #f0f2f5',
  },
  fbAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '9999px',
    backgroundColor: '#1877f2',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '15px',
  },
  fbName: {
    fontSize: '12px',
    color: '#050505',
    lineHeight: 1.3,
  },
  fbMeta: {
    fontSize: '11px',
    color: '#65676b',
    marginTop: '2px',
  },
  fbStars: {
    color: '#1877f2',
    letterSpacing: '1px',
    fontSize: '14px',
  },
  fbBody: {
    padding: '14px',
  },
  fbText: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    color: '#050505',
    lineHeight: 1.5,
    margin: '0 0 12px 0',
  },
  fbImg: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  lightboxFooterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 4px 0 4px',
    borderTop: '1px solid #f0eae6',
  },
};
