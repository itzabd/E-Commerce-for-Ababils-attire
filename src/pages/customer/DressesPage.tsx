/**
 * Ababil’s Attire by Sanjida Bethi
 * Handmade Dresses Shop Catalog (Mirrors Stitch project 1646646279704595948)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsService } from '../../services/products.service';
import type { ProductWithDetails } from '../../types';
import { DressCard } from '../../components/customer/DressCard';

type FilterTab = 'all' | 'new' | 'ready_to_ship' | 'made_to_order';
type SortOption = 'popular' | 'price_low' | 'price_high' | 'newest';

export const DressesPage: React.FC = () => {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const fetchDresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsService.getPublishedProducts('dress');
      setProducts(data);
    } catch (err: any) {
      console.error('Failed to load dresses catalog:', err);
      setError(err?.message || 'Could not load dresses. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDresses();
  }, []);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchName = p.name.toLowerCase().includes(term);
          const matchDesc = (p.description || '').toLowerCase().includes(term);
          const matchFabric = (p.dress_details?.fabric_details || '').toLowerCase().includes(term);
          if (!matchName && !matchDesc && !matchFabric) return false;
        }

        // Tab Filter
        if (activeTab === 'new') return p.new_arrival;
        if (activeTab === 'ready_to_ship') return p.status === 'published' && p.stock_quantity > 0;
        if (activeTab === 'made_to_order') return p.status === 'made_to_order';

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        // Popular / featured default
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, searchTerm, activeTab, sortBy]);

  return (
    <div style={styles.container} className="customer-page-container">
      {/* ================================================================= */}
      {/* 1. BREADCRUMB BAR                                                 */}
      {/* ================================================================= */}
      <nav aria-label="Breadcrumb" style={styles.breadcrumbBar}>
        <div style={styles.breadcrumbPath}>
          <Link to="/" style={styles.backLink}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              arrow_back
            </span>
            <span>Home</span>
          </Link>
          <span style={styles.breadcrumbDivider}>/</span>
          <span style={styles.breadcrumbCurrent}>Girls’ Dresses</span>
        </div>

        <span style={styles.itemCountBadge}>
          {products.length} Handmade Pieces
        </span>
      </nav>

      {/* ================================================================= */}
      {/* 2. EDITORIAL HEADER SECTION                                       */}
      {/* ================================================================= */}
      <section style={styles.editorialHeader}>
        <h1 style={styles.pageTitle}>Handmade Girls’ Dresses</h1>
        <p style={styles.pageDescription}>
          Delicate handmade dresses handcrafted with natural cotton, pure linen, and intricate
          hand-smocking for your little one’s special milestones.
        </p>

        {/* Cross-Collection Callout Banner */}
        <div style={styles.crossCalloutContainer}>
          <Link to="/cakes" style={styles.crossCallout}>
            <span style={styles.crossCalloutPrompt}>Also looking for celebration cakes?</span>
            <span style={styles.crossCalloutLink}>
              Explore Homemade Cakes
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                arrow_forward
              </span>
            </span>
          </Link>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. SEARCH AND QUICK FILTER CHIPS                                  */}
      {/* ================================================================= */}
      <section style={styles.controlsSection}>
        {/* Search Bar */}
        <div style={styles.searchWrapper}>
          <span className="material-symbols-outlined" style={styles.searchIcon}>
            search
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search dresses, fabrics (e.g. linen, muslin, lace)..."
            style={styles.searchInput}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={styles.clearSearchBtn}
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                close
              </span>
            </button>
          )}
        </div>

        {/* Horizontal Quick Filter Chips */}
        <div style={styles.filterRow} className="no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            style={activeTab === 'all' ? styles.chipActive : styles.chipInactive}
          >
            All Dresses ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            style={activeTab === 'new' ? styles.chipActive : styles.chipInactive}
          >
            New Arrivals
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ready_to_ship')}
            style={activeTab === 'ready_to_ship' ? styles.chipActive : styles.chipInactive}
          >
            Ready to Ship
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('made_to_order')}
            style={activeTab === 'made_to_order' ? styles.chipActive : styles.chipInactive}
          >
            Made to Order
          </button>

          {/* Sort Dropdown */}
          <div style={styles.sortDropdownContainer}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={styles.sortSelect}
              aria-label="Sort dresses"
            >
              <option value="popular">Sort: Featured</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. PRODUCT GRID & STATE MANAGEMENT                                */}
      {/* ================================================================= */}
      {loading ? (
        <div style={styles.skeletonGrid}>
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} style={styles.skeletonCard} />
          ))}
        </div>
      ) : error ? (
        <div style={styles.stateCard}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#ba1a1a' }}>
            error
          </span>
          <h3 style={styles.stateTitle}>Unable to load dresses</h3>
          <p style={styles.stateDesc}>{error}</p>
          <button type="button" onClick={fetchDresses} style={styles.retryBtn}>
            Retry Loading
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={styles.stateCard}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#8c5e51' }}>
            search_off
          </span>
          <h3 style={styles.stateTitle}>No dresses found</h3>
          <p style={styles.stateDesc}>
            {searchTerm
              ? `No dresses matched "${searchTerm}". Try a different keyword or fabric type.`
              : 'No items currently match the selected filter.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setActiveTab('all');
            }}
            style={styles.retryBtn}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={styles.productsGrid} className="customer-products-grid">
          {filteredProducts.map((product) => (
            <DressCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '8px 16px 40px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  breadcrumbBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
  },
  breadcrumbPath: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#5c3e36',
    textDecoration: 'none',
    fontWeight: 500,
  },
  breadcrumbDivider: {
    color: '#dfd8ce',
  },
  breadcrumbCurrent: {
    color: '#2d2421',
    fontWeight: 600,
  },
  itemCountBadge: {
    fontSize: '11px',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    color: '#8c5e51',
    backgroundColor: '#eeebe6',
    padding: '3px 10px',
    borderRadius: '9999px',
    border: '1px solid #dfd8ce',
  },
  editorialHeader: {
    textAlign: 'center',
    maxWidth: '640px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  pageTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '28px',
    fontWeight: 500,
    color: '#2d2421',
    margin: 0,
    lineHeight: 1.2,
  },
  pageDescription: {
    fontSize: '13px',
    color: '#6f6764',
    lineHeight: 1.55,
    margin: 0,
  },
  crossCalloutContainer: {
    marginTop: '6px',
  },
  crossCallout: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '9999px',
    backgroundColor: '#f5f3ef',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    textDecoration: 'none',
    fontSize: '11px',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
  },
  crossCalloutPrompt: {
    color: '#6f6764',
  },
  crossCalloutLink: {
    color: '#5c3e36',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
  },
  controlsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
  },
  searchWrapper: {
    position: 'relative',
    width: '100%',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#988e8a',
    fontSize: '20px',
  },
  searchInput: {
    width: '100%',
    height: '44px',
    borderRadius: '9999px',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    backgroundColor: '#ffffff',
    padding: '0 40px 0 42px',
    fontSize: '13px',
    color: '#2d2421',
    outline: 'none',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#988e8a',
    padding: '4px',
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '4px',
    justifyContent: 'flex-start',
  },
  chipActive: {
    whiteSpace: 'nowrap',
    minHeight: '44px',
    padding: '0 16px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  chipInactive: {
    whiteSpace: 'nowrap',
    minHeight: '44px',
    padding: '0 16px',
    borderRadius: '9999px',
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    color: '#6f6764',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  sortDropdownContainer: {
    marginLeft: 'auto',
  },
  sortSelect: {
    minHeight: '44px',
    padding: '0 14px',
    borderRadius: '9999px',
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '12px',
    color: '#5c3e36',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: '12px',
  },
  skeletonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: '12px',
  },
  skeletonCard: {
    height: '280px',
    borderRadius: '12px',
    backgroundColor: '#f5f3ef',
  },
  stateCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid var(--color-border-subtle, #ece8e1)',
    padding: '40px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  stateTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '20px',
    fontWeight: 600,
    color: '#2d2421',
    margin: 0,
  },
  stateDesc: {
    fontSize: '13px',
    color: '#6f6764',
    maxWidth: '360px',
    lineHeight: 1.5,
    margin: 0,
  },
  retryBtn: {
    marginTop: '10px',
    height: '40px',
    padding: '0 20px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: 600,
  },
};
