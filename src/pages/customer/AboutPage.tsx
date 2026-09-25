/**
 * Ababil’s Attire by Sanjida Bethi
 * About Page & Atelier Story (Mirrors Stitch brand guidelines)
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { settingsService } from '../../services/settings.service';
import type { StoreSettings } from '../../types';

export const AboutPage: React.FC = () => {
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    settingsService.getSettings().then((s) => setStoreSettings(s));
    const handleSettingsUpdated = (e: any) => {
      if (e.detail) setStoreSettings(e.detail);
    };
    window.addEventListener('store_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('store_settings_updated', handleSettingsUpdated);
  }, []);

  const storyTitle = storeSettings?.about_story_title || "Handmade Dresses & Cakes, Stitched & Baked with Love";
  const storySubtitle = storeSettings?.store_description || "Ababil’s Attire was born from a desire to bring timeless simplicity to children's milestones and family celebrations.";
  const storyContent = storeSettings?.about_story_content || `Growing up with an appreciation for vintage textiles and classical French pastry arts, Sanjida Bethi established Ababil’s Attire to unite two heartfelt arts: hand-smocked dresses for little girls and wholesome, scratch-baked celebration cakes.\n\nIn an era of mass production and pre-mix bakeries, our studio preserves the unhurried rhythm of authentic craftsmanship. Each dress takes days of careful tailoring, featuring hand-smocked silk embroidery, French seams, and pure natural fabrics that feel gentle on tender skin.`;
  const storyImageUrl = storeSettings?.about_story_image_url || "https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?auto=format&fit=crop&w=1200&q=80";
  const craftDressesDesc = storeSettings?.about_craft_dresses_desc || "We exclusively craft garments using breathable natural fibres: European flax linen, organic cotton muslin, and mulberry silk organza. Every pleat and smocking gather is stitched by hand so your child can move with grace and comfort.";
  const craftCakesDesc = storeSettings?.about_craft_cakes_desc || "Our confections are baked strictly from scratch with real dairy butter, farm-fresh eggs, and pure Madagascar bourbon vanilla. Never artificial stabilizers or pre-mix powders. Finished with hand-piped Lambeth ruffles, rose petals, and personalized calligraphy.";
  const artisanQuote = storeSettings?.about_artisan_quote || "“Stitched with love, baked with care — every piece created for timeless family memories.”";

  return (
    <div style={styles.container} className="customer-page-container about-page-container">
      {/* Editorial Header */}
      <section style={styles.headerSection} className="about-header-section">
        <span style={styles.eyebrow}>OUR STORY</span>
        <h1 style={styles.title}>{storyTitle}</h1>
        <p style={styles.subtitle}>{storySubtitle}</p>
      </section>

      {/* Meet Sanjida Story Card */}
      <section style={styles.storyCard} className="about-story-grid">
        <div style={styles.storyImageWrapper}>
          <img
            src={storyImageUrl}
            alt="Hand-smocking artisan needlework"
            style={styles.storyImage}
          />
        </div>

        <div style={styles.storyTextContent}>
          <span style={styles.founderTag}>SANJIDA BETHI • FOUNDER & ARTISAN</span>
          <h2 style={styles.storyHeading}>A Passion for Handcrafted Detail</h2>
          {storyContent.split('\n\n').map((paragraph, idx) => (
            <p key={idx} style={styles.storyParagraph}>
              {paragraph}
            </p>
          ))}
          {artisanQuote && (
            <blockquote style={{
              margin: '8px 0 0 0',
              paddingLeft: '14px',
              borderLeft: '3px solid #8c5e51',
              fontStyle: 'italic',
              color: '#5c3e36',
              fontSize: '13px',
              lineHeight: 1.5
            }}>
              {artisanQuote}
            </blockquote>
          )}
        </div>
      </section>

      {/* Dual Disciplines Exhibition */}
      <section style={styles.disciplinesSection} className="about-disciplines-grid">
        {/* Discipline 1: Handmade Tailoring */}
        <div style={styles.disciplineCard}>
          <div style={styles.disciplineIconWrapper}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#5c3e36' }}>
              checkroom
            </span>
          </div>
          <h3 style={styles.disciplineTitle}>Handmade Children's Dresses</h3>
          <p style={styles.disciplineText}>
            {craftDressesDesc}
          </p>
          <Link to="/dresses" style={styles.disciplineLink}>
            Explore Dresses →
          </Link>
        </div>

        {/* Discipline 2: Confectionery */}
        <div style={styles.disciplineCard}>
          <div style={styles.disciplineIconWrapper}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#5c3e36' }}>
              cake
            </span>
          </div>
          <h3 style={styles.disciplineTitle}>Homemade Celebration Cakes</h3>
          <p style={styles.disciplineText}>
            {craftCakesDesc}
          </p>
          <Link to="/cakes" style={styles.disciplineLink}>
            Explore Cakes →
          </Link>
        </div>
      </section>

      {/* Atelier Values */}
      <section style={styles.valuesSection}>
        <div style={styles.sectionHeaderCenter}>
          <span style={styles.eyebrow}>OUR PROMISE</span>
          <h2 style={styles.valuesTitle}>Why Families Cherish Us</h2>
        </div>

        <div style={styles.valuesGrid} className="about-values-grid">
          <div style={styles.valueItem}>
            <span style={styles.valueNumber}>01</span>
            <h4 style={styles.valueHeading}>No Shortcuts</h4>
            <p style={styles.valueText}>
              From pattern-cutting to butter whipping, everything is created fresh in small batches.
            </p>
          </div>

          <div style={styles.valueItem}>
            <span style={styles.valueNumber}>02</span>
            <h4 style={styles.valueHeading}>Gentle on Little Ones</h4>
            <p style={styles.valueText}>
              No synthetic linings or scratchy tags; pure hypoallergenic natural textiles.
            </p>
          </div>

          <div style={styles.valueItem}>
            <span style={styles.valueNumber}>03</span>
            <h4 style={styles.valueHeading}>Personalized Studio Care</h4>
            <p style={styles.valueText}>
              Every order is coordinated directly with Sanjida to make your family milestone special.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section style={styles.ctaBox} className="about-cta-box">
        <h3 style={styles.ctaTitle}>Planning an Upcoming Celebration?</h3>
        <p style={styles.ctaText}>
          Reach out to discuss custom sizing or request a signature celebration cake.
        </p>
        <Link to="/contact" style={styles.ctaButton}>
          Message Sanjida
        </Link>
      </section>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '16px 16px 60px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
  },
  headerSection: {
    textAlign: 'center',
    maxWidth: '680px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'center',
  },
  eyebrow: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    color: '#8c5e51',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '32px',
    fontWeight: 500,
    color: '#2d2421',
    lineHeight: 1.25,
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6f6764',
    lineHeight: 1.6,
    margin: 0,
  },
  storyCard: {
    backgroundColor: '#f5f3ef',
    borderRadius: '16px',
    overflow: 'hidden',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    padding: '24px',
    alignItems: 'center',
  },
  storyImageWrapper: {
    borderRadius: '12px',
    overflow: 'hidden',
    aspectRatio: '4 / 3',
    backgroundColor: '#eeebe6',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  storyTextContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  founderTag: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#8c5e51',
  },
  storyHeading: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '24px',
    fontWeight: 500,
    color: '#2d2421',
    margin: 0,
  },
  storyParagraph: {
    fontSize: '13px',
    color: '#6f6764',
    lineHeight: 1.6,
    margin: 0,
  },
  disciplinesSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  disciplineCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid var(--color-border-subtle, #ece8e1)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  disciplineIconWrapper: {
    width: '44px',
    height: '44px',
    borderRadius: '9999px',
    backgroundColor: '#f5ede9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px',
  },
  disciplineTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '20px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: 0,
  },
  disciplineText: {
    fontSize: '13px',
    color: '#6f6764',
    lineHeight: 1.6,
    margin: 0,
  },
  disciplineLink: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 600,
    color: '#5c3e36',
    textDecoration: 'none',
    marginTop: '6px',
  },
  valuesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionHeaderCenter: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'center',
  },
  valuesTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '24px',
    fontWeight: 500,
    color: '#2d2421',
    margin: 0,
  },
  valuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  valueItem: {
    backgroundColor: '#f5f3ef',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  valueNumber: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '20px',
    fontWeight: 600,
    color: '#8c5e51',
  },
  valueHeading: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '14px',
    fontWeight: 600,
    color: '#2d2421',
    margin: 0,
  },
  valueText: {
    fontSize: '12px',
    color: '#6f6764',
    lineHeight: 1.5,
    margin: 0,
  },
  ctaBox: {
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    borderRadius: '16px',
    padding: '36px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  ctaTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '24px',
    fontWeight: 500,
    margin: 0,
  },
  ctaText: {
    fontSize: '13px',
    color: '#f5f3ef',
    maxWidth: '460px',
    margin: 0,
    lineHeight: 1.5,
  },
  ctaButton: {
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
    marginTop: '6px',
  },
};
