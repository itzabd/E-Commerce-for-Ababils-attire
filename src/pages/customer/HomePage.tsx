/**
 * Ababil’s Attire by Sanjida Bethi
 * Customer Storefront Homepage (Mirrors Stitch project 1646646279704595948)
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productsService } from '../../services/products.service';
import type { ProductWithDetails } from '../../types';
import { DressCard } from '../../components/customer/DressCard';
import { CakeCard } from '../../components/customer/CakeCard';
import { CustomerReviewsSection } from '../../components/customer/CustomerReviewsSection';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [featuredDresses, setFeaturedDresses] = useState<ProductWithDetails[]>([]);
  const [featuredCakes, setFeaturedCakes] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadFeatured() {
      try {
        setLoading(true);
        const [dresses, cakes] = await Promise.all([
          productsService.getPublishedProducts('dress'),
          productsService.getPublishedProducts('cake'),
        ]);

        if (isMounted) {
          const featDresses = dresses.filter((d) => d.featured).slice(0, 4);
          const featCakes = cakes.filter((c) => c.featured).slice(0, 4);
          setFeaturedDresses(featDresses.length > 0 ? featDresses : dresses.slice(0, 4));
          setFeaturedCakes(featCakes.length > 0 ? featCakes : cakes.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load featured catalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackingNumber.trim().toUpperCase();
    if (!clean) return;
    navigate(`/track-order?invoice=${encodeURIComponent(clean)}`);
  };

  return (
    <div style={styles.container}>
      {/* ================================================================= */}
      {/* 2. HERO SECTION                                                   */}
      {/* ================================================================= */}
      <section style={styles.heroSection}>
        {/* Ambient Image Arch */}
        <div style={styles.heroImageWrapper}>
          <img
            src="https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=1200&q=80"
            alt="Handmade baby dress and celebration cake in sunlit studio"
            style={styles.heroImage}
          />
          <div style={styles.heroImageGradient} />
          <div style={styles.heroBadgeRow}>
            <span style={styles.heroTopBadge}>Handmade with Love</span>
            <span style={styles.heroBottomBadge}>Custom Orders & Worldwide Delivery</span>
          </div>
        </div>

        {/* Hero Typography */}
        <div style={styles.heroTextWrapper}>
          <p style={styles.heroEyebrow}>MADE WITH LOVE BY SANJIDA BETHI</p>
          <h1 style={styles.heroHeadline}>
            Handmade Dresses & Homemade Cakes, Crafted with Care
          </h1>
          <p style={styles.heroDescription}>
            Sweet handmade dresses for little girls and delicious homemade cakes, baked and sewn
            with love for your special family celebrations in Dhaka.
          </p>
        </div>

        {/* Action Button Group */}
        <div style={styles.heroActionGroup}>
          <Link to="/dresses" style={styles.heroPrimaryBtn}>
            Explore Dresses
          </Link>
          <Link to="/cakes" style={styles.heroSecondaryBtn}>
            Explore Cakes
          </Link>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. SHOP BY COLLECTION (Dual Category Cards)                       */}
      {/* ================================================================= */}
      <section style={styles.sectionWrapper}>
        <div style={styles.sectionHeaderCenter}>
          <span style={styles.eyebrow}>OUR FAVORITES</span>
          <h2 style={styles.sectionTitle}>Shop by Collection</h2>
        </div>

        <div style={styles.dualCollectionGrid}>
          {/* Collection 1: Dresses */}
          <article style={styles.collectionCard}>
            <div style={styles.collectionImageWrapper}>
              <img
                src="https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?auto=format&fit=crop&w=900&q=80"
                alt="Handcrafted girls dresses"
                style={styles.collectionImage}
              />
            </div>
            <div style={styles.collectionCardBody}>
              <div style={styles.collectionTitleRow}>
                <h3 style={styles.collectionTitle}>Girls' Handmade Dresses</h3>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36' }}>
                  arrow_forward
                </span>
              </div>
              <p style={styles.collectionDesc}>
                Soft, comfortable dresses made with gentle cotton and linen for your little girl’s sweetest days.
              </p>
              <div style={{ paddingTop: '8px' }}>
                <Link to="/dresses" style={styles.collectionLink}>
                  See All Dresses →
                </Link>
              </div>
            </div>
          </article>

          {/* Collection 2: Cakes */}
          <article style={styles.collectionCard}>
            <div style={styles.collectionImageWrapper}>
              <img
                src="https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=900&q=80"
                alt="Homemade celebration cakes"
                style={styles.collectionImage}
              />
            </div>
            <div style={styles.collectionCardBody}>
              <div style={styles.collectionTitleRow}>
                <h3 style={styles.collectionTitle}>Homemade Celebration Cakes</h3>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36' }}>
                  arrow_forward
                </span>
              </div>
              <p style={styles.collectionDesc}>
                Freshly baked cakes made from scratch with pure butter and real ingredients, decorated just for your party.
              </p>
              <div style={{ paddingTop: '8px' }}>
                <Link to="/cakes" style={styles.collectionLink}>
                  See All Cakes →
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. FEATURED DRESSES SECTION                                       */}
      {/* ================================================================= */}
      <section style={styles.sectionWrapper} id="featured-dresses">
        <div style={styles.sectionHeaderCenter}>
          <span style={styles.eyebrow}>LITTLE GIRLS' DRESSES</span>
          <h2 style={styles.sectionTitle}>Featured Dresses</h2>
          <p style={styles.sectionSubtitle}>
            Made with soft, breathable fabrics and sweet hand-stitched details.
          </p>
          <div style={{ paddingTop: '4px' }}>
            <Link to="/dresses" style={styles.sectionHeaderLink}>
              See All Dresses ({featuredDresses.length > 0 ? '16+' : 'Collection'})
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={styles.loadingGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={styles.skeletonCard} />
            ))}
          </div>
        ) : (
          <div style={styles.productsGrid}>
            {featuredDresses.map((dress) => (
              <DressCard key={dress.id} product={dress} />
            ))}
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 5. FEATURED CAKES SECTION                                         */}
      {/* ================================================================= */}
      <section style={styles.sectionWrapper} id="featured-cakes">
        <div style={styles.sectionHeaderCenter}>
          <span style={styles.eyebrow}>HOMEMADE CAKES</span>
          <h2 style={styles.sectionTitle}>Celebration Cakes</h2>
          <p style={styles.sectionSubtitle}>
            Baked fresh for your celebration. Please order at least 2 days ahead.
          </p>
          <div style={{ paddingTop: '4px' }}>
            <Link to="/cakes" style={styles.sectionHeaderLink}>
              See All Cakes
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={styles.loadingGrid}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={styles.skeletonCard} />
            ))}
          </div>
        ) : (
          <div style={styles.productsGrid}>
            {featuredCakes.map((cake) => (
              <CakeCard key={cake.id} product={cake} />
            ))}
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 6. MEET SANJIDA BETHI (Artisan Story Pillars)                     */}
      {/* ================================================================= */}
      <section style={styles.artisanSection} id="artisan-story">
        <div style={styles.sectionHeaderCenter}>
          <span style={styles.makerBadge}>A NOTE FROM THE MAKER</span>
          <h2 style={styles.sectionTitle}>Meet Sanjida Bethi</h2>
          <p style={styles.artisanIntro}>
            "Every stitch in our dresses is placed by hand, and every cake is baked fresh from scratch
            using pure ingredients—never pre-mixes. We believe family celebrations deserve thoughtful craft."
          </p>
        </div>

        <div style={styles.pillarsGrid}>
          {/* Pillar 1 */}
          <div style={styles.pillarCard}>
            <div style={styles.pillarIconWrapper}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36' }}>
                favorite
              </span>
            </div>
            <h3 style={styles.pillarTitle}>Handmade with Love</h3>
            <p style={styles.pillarDesc}>
              Every stitch, gather, and ruffle is carefully cut and sewn by hand in our Dhaka studio.
            </p>
          </div>

          {/* Pillar 2 */}
          <div style={styles.pillarCard}>
            <div style={styles.pillarIconWrapper}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36' }}>
                eco
              </span>
            </div>
            <h3 style={styles.pillarTitle}>Real, Fresh Ingredients</h3>
            <p style={styles.pillarDesc}>
              No artificial mixes. Baked with pure butter, farm-fresh eggs, and real vanilla bean.
            </p>
          </div>

          {/* Pillar 3 */}
          <div style={styles.pillarCard}>
            <div style={styles.pillarIconWrapper}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36' }}>
                palette
              </span>
            </div>
            <h3 style={styles.pillarTitle}>Custom Sizing & Designs</h3>
            <p style={styles.pillarDesc}>
              Need a custom dress size or specific cake palette? We happily tailor to your event.
            </p>
          </div>

          {/* Pillar 4 */}
          <div style={styles.pillarCard}>
            <div style={styles.pillarIconWrapper}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36' }}>
                support_agent
              </span>
            </div>
            <h3 style={styles.pillarTitle}>Friendly Personal Service</h3>
            <p style={styles.pillarDesc}>
              Message directly with Sanjida via WhatsApp to consult on dress sizing or cake flavors.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6.5. CUSTOMER REVIEWS & REAL SCREENSHOTS                         */}
      {/* ================================================================= */}
      <CustomerReviewsSection />

      {/* ================================================================= */}
      {/* 7. TRACK YOUR ORDER (Live Lookup Section)                         */}
      {/* ================================================================= */}
      <section style={styles.trackSection} id="track-order-section">
        <div style={styles.trackInner}>
          <div style={styles.trackIconCircle}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#5c3e36' }}>
              local_shipping
            </span>
          </div>

          <div style={styles.sectionHeaderCenter}>
            <h2 style={styles.sectionTitle}>Track Your Order</h2>
            <p style={styles.sectionSubtitle}>
              Already placed an order? Enter your order number or invoice code to see tailoring and baking progress.
            </p>
          </div>

          <form onSubmit={handleTrackOrder} style={styles.trackForm}>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. AA-84920 or 01711..."
              required
              style={styles.trackInput}
            />
            <button type="submit" style={styles.trackButton}>
              <span>Check Order Status</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                search
              </span>
            </button>
          </form>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 8. LET'S CELEBRATE CALL TO ACTION                                 */}
      {/* ================================================================= */}
      <section style={styles.inquireBanner} id="inquire-section">
        <div style={styles.inquireInner}>
          <span style={styles.inquireEyebrow}>LET'S CELEBRATE</span>
          <h2 style={styles.inquireHeadline}>Have a Special Day Coming Up?</h2>
          <p style={styles.inquireText}>
            Whether you’re dressing your little one for a birthday or planning a yummy cake, we'd love
            to help make your family milestone unforgettable.
          </p>

          <div style={styles.inquireButtonRow}>
            <Link to="/dresses" style={styles.inquireLightBtn}>
              Shop Girls' Dresses
            </Link>
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.inquireOutlineBtn}
            >
              Ask About a Custom Cake 💬
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '12px 16px 40px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
  },
  heroSection: {
    backgroundColor: '#f5f3ef',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    overflow: 'hidden',
  },
  heroImageWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 10',
    maxHeight: '440px',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#eeebe6',
    marginBottom: '20px',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  heroImageGradient: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(67, 40, 33, 0.45) 0%, transparent 60%)',
  },
  heroBadgeRow: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
  },
  heroTopBadge: {
    backgroundColor: 'rgba(251, 249, 245, 0.94)',
    backdropFilter: 'blur(4px)',
    color: '#5c3e36',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  heroBottomBadge: {
    backgroundColor: 'rgba(251, 249, 245, 0.94)',
    backdropFilter: 'blur(4px)',
    color: '#8c5e51',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '10px',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '9999px',
  },
  heroTextWrapper: {
    maxWidth: '560px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  heroEyebrow: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    color: '#8c5e51',
    margin: 0,
  },
  heroHeadline: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '30px',
    fontWeight: 500,
    color: '#2d2421',
    lineHeight: 1.25,
    margin: 0,
  },
  heroDescription: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '14px',
    color: '#6f6764',
    lineHeight: 1.6,
    margin: 0,
  },
  heroActionGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
    width: '100%',
    maxWidth: '360px',
    marginTop: '20px',
  },
  heroPrimaryBtn: {
    height: '46px',
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
    boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(92,62,54,0.06))',
  },
  heroSecondaryBtn: {
    height: '46px',
    borderRadius: '9999px',
    backgroundColor: '#eeebe6',
    color: '#5c3e36',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  },
  sectionWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionHeaderCenter: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    maxWidth: '560px',
    margin: '0 auto',
  },
  eyebrow: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    color: '#8c5e51',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '24px',
    fontWeight: 500,
    color: '#2d2421',
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: '13px',
    color: '#6f6764',
    margin: 0,
    lineHeight: 1.4,
  },
  sectionHeaderLink: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 600,
    color: '#5c3e36',
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
  },
  dualCollectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  collectionCard: {
    backgroundColor: '#f5f3ef',
    borderRadius: '14px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'background-color 0.2s ease',
  },
  collectionImageWrapper: {
    width: '100%',
    aspectRatio: '16 / 10',
    borderRadius: '10px',
    overflow: 'hidden',
    backgroundColor: '#eeebe6',
    marginBottom: '12px',
  },
  collectionImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  collectionCardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    textAlign: 'center',
    alignItems: 'center',
  },
  collectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    justifyContent: 'center',
  },
  collectionTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '18px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: 0,
  },
  collectionDesc: {
    fontSize: '13px',
    color: '#6f6764',
    lineHeight: 1.5,
    margin: 0,
  },
  collectionLink: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 600,
    color: '#5c3e36',
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  loadingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  skeletonCard: {
    height: '240px',
    borderRadius: '12px',
    backgroundColor: '#f5f3ef',
    animation: 'pulse 1.5s infinite',
  },
  artisanSection: {
    backgroundColor: '#f5f3ef',
    borderRadius: '16px',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  makerBadge: {
    backgroundColor: '#ffffff',
    color: '#8c5e51',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    padding: '4px 12px',
    borderRadius: '9999px',
    display: 'inline-block',
  },
  artisanIntro: {
    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
    fontStyle: 'italic',
    fontSize: '14px',
    color: '#5c3e36',
    lineHeight: 1.6,
    marginTop: '6px',
  },
  pillarsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  pillarCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '6px',
  },
  pillarIconWrapper: {
    width: '36px',
    height: '36px',
    borderRadius: '9999px',
    backgroundColor: '#f5ede9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '2px',
  },
  pillarTitle: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 600,
    color: '#2d2421',
    margin: 0,
  },
  pillarDesc: {
    fontSize: '11px',
    color: '#6f6764',
    lineHeight: 1.45,
    margin: 0,
  },
  trackSection: {
    backgroundColor: '#f5f3ef',
    borderRadius: '16px',
    padding: '30px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  trackInner: {
    maxWidth: '460px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  trackIconCircle: {
    width: '52px',
    height: '52px',
    borderRadius: '9999px',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(92,62,54,0.06))',
  },
  trackForm: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  trackInput: {
    height: '46px',
    borderRadius: '9999px',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    backgroundColor: '#ffffff',
    padding: '0 20px',
    fontSize: '13px',
    color: '#2d2421',
    textAlign: 'center',
    outline: 'none',
  },
  trackButton: {
    height: '46px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(92,62,54,0.08))',
  },
  trackResultCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    textAlign: 'left',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultOrderNum: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 700,
    color: '#8c5e51',
  },
  resultStatusBadge: {
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    fontSize: '10px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  resultSummary: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#2d2421',
    margin: 0,
  },
  resultDispatch: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#6f6764',
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '9999px',
    backgroundColor: '#8c5e51',
  },
  inquireBanner: {
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    borderRadius: '16px',
    padding: '36px 20px',
    textAlign: 'center',
  },
  inquireInner: {
    maxWidth: '520px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  inquireEyebrow: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    color: '#e8bdb2',
  },
  inquireHeadline: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '28px',
    fontWeight: 500,
    lineHeight: 1.25,
    margin: 0,
  },
  inquireText: {
    fontSize: '13px',
    color: '#f5f3ef',
    lineHeight: 1.6,
    margin: 0,
  },
  inquireButtonRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center',
    width: '100%',
    marginTop: '12px',
  },
  inquireLightBtn: {
    height: '44px',
    padding: '0 24px',
    borderRadius: '9999px',
    backgroundColor: '#ffffff',
    color: '#5c3e36',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  },
  inquireOutlineBtn: {
    height: '44px',
    padding: '0 20px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
};
