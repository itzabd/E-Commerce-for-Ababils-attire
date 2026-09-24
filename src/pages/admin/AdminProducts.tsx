/**
 * Ababil’s Attire by Sanjida Bethi
 * Admin Product Management Page
 *
 * Implements the full catalog management view from Stitch screen 41df5b74c827466598486122115dd0e5
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ProductWithDetails, ProductCategory, ProductStatus } from '../../types';
import { productsService } from '../../services/products.service';
import { ProductCard } from '../../components/admin/products/ProductCard';
import { ProductFormModal } from '../../components/admin/products/ProductFormModal';
import { DeleteConfirmModal } from '../../components/admin/products/DeleteConfirmModal';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'dress' | 'cake'>('all');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_desc' | 'price_asc'>('newest');

  // Modal Controls
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithDetails | null>(null);
  const [formInitialCategory, setFormInitialCategory] = useState<ProductCategory>('dress');

  // Delete Modal
  const [productToDelete, setProductToDelete] = useState<ProductWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success / notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  /**
   * Fetch products from Supabase
   */
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await productsService.getAllProductsAdmin({
        category: categoryFilter,
        status: statusFilter,
        search: searchQuery,
      });
      setProducts(data);
    } catch (err: any) {
      console.error('Failed to load products:', err);
      setErrorMessage(err.message || 'Unable to fetch products. Check database connection.');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Client-side sorting
  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === 'newest') {
      return list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    if (sortBy === 'price_desc') {
      return list.sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'price_asc') {
      return list.sort((a, b) => a.price - b.price);
    }
    return list;
  }, [products, sortBy]);

  // Counts for category pills
  const counts = useMemo(() => {
    const dresses = products.filter((p) => p.category === 'dress').length;
    const cakes = products.filter((p) => p.category === 'cake').length;
    return { all: products.length, dresses, cakes };
  }, [products]);

  // Handlers
  const handleOpenAddModal = (cat: ProductCategory) => {
    setEditingProduct(null);
    setFormInitialCategory(cat);
    setIsFormOpen(true);
  };

  const handleEdit = (product: ProductWithDetails) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDuplicate = async (product: ProductWithDetails) => {
    try {
      showToast(`Duplicating "${product.name}"...`);
      await productsService.duplicateProduct(product.id);
      showToast(`Duplicate created as draft!`);
      loadProducts();
    } catch (err: any) {
      alert(`Duplication failed: ${err.message}`);
    }
  };

  const handleToggleStatus = async (product: ProductWithDetails) => {
    const newStatus: ProductStatus = product.status === 'published' ? 'hidden' : 'published';
    try {
      await productsService.updateProductStatus(product.id, newStatus);
      showToast(`"${product.name}" status set to ${newStatus}.`);
      loadProducts();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleToggleOutOfStock = async (product: ProductWithDetails) => {
    const newStatus: ProductStatus = product.status === 'out_of_stock' ? 'published' : 'out_of_stock';
    try {
      await productsService.updateProductStatus(product.id, newStatus);
      showToast(`"${product.name}" marked as ${newStatus === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}.`);
      loadProducts();
    } catch (err: any) {
      alert(`Stock update failed: ${err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await productsService.deleteProduct(productToDelete.id);
      showToast(`"${productToDelete.name}" deleted.`);
      setProductToDelete(null);
      loadProducts();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={styles.toast}>
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header & Stats */}
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>
            <span>Catalog Archive</span>
            <span>•</span>
            <span>Heirloom Couture &amp; Pâtisserie</span>
          </div>
          <h1 style={styles.title}>Product Management</h1>
          <p style={styles.subtitle}>
            {counts.all} Products Total ({counts.dresses} Dresses, {counts.cakes} Cakes)
          </p>
        </div>

        {/* Action Buttons */}
        <div style={styles.headerActions}>
          <button
            type="button"
            onClick={() => handleOpenAddModal('dress')}
            style={styles.addDressBtn}
          >
            👗 + Add Dress
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal('cake')}
            style={styles.addCakeBtn}
          >
            🎂 + Add Cake
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={styles.filterCard}>
        {/* Search Row */}
        <div style={styles.searchRow}>
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, product code..."
              style={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={styles.clearSearchBtn}
              >
                ✕
              </button>
            )}
          </div>

          <div style={styles.sortWrapper}>
            <label style={styles.sortLabel}>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={styles.sortSelect}
            >
              <option value="newest">Newest First</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
            </select>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div style={styles.pillsRow}>
          {/* Category Filter */}
          <div style={styles.categoryPills}>
            <span style={styles.filterSectionLabel}>Category:</span>
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              style={{
                ...styles.pillBtn,
                ...(categoryFilter === 'all' ? styles.pillBtnActive : {}),
              }}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('dress')}
              style={{
                ...styles.pillBtn,
                ...(categoryFilter === 'dress' ? styles.pillBtnActive : {}),
              }}
            >
              Dresses ({counts.dresses})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('cake')}
              style={{
                ...styles.pillBtn,
                ...(categoryFilter === 'cake' ? styles.pillBtnActive : {}),
              }}
            >
              Cakes ({counts.cakes})
            </button>
          </div>

          {/* Status Filter */}
          <div style={styles.statusFilterGroup}>
            <span style={styles.filterSectionLabel}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={styles.statusSelect}
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="made_to_order">Made to Order</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Fetching boutique catalog...</p>
        </div>
      ) : errorMessage ? (
        <div style={styles.errorState}>
          <span style={styles.errorStateIcon}>!</span>
          <h3 style={styles.errorStateTitle}>Database Notice</h3>
          <p style={styles.errorStateDesc}>{errorMessage}</p>
          <button type="button" onClick={loadProducts} style={styles.retryBtn}>
            Retry Connection
          </button>
        </div>
      ) : sortedProducts.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📦</span>
          <h3 style={styles.emptyTitle}>No Products Found</h3>
          <p style={styles.emptyDesc}>
            {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'No products matched your active search and filter settings.'
              : 'Your boutique catalog has no products yet. Add your first heirloom dress or celebration cake.'}
          </p>
          <div style={styles.emptyActions}>
            <button
              type="button"
              onClick={() => handleOpenAddModal('dress')}
              style={styles.addDressBtn}
            >
              Add New Dress
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('cake')}
              style={styles.addCakeBtn}
            >
              Add New Cake
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.productList}>
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onToggleStatus={handleToggleStatus}
              onToggleOutOfStock={handleToggleOutOfStock}
              onDelete={(p) => setProductToDelete(p)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        productToEdit={editingProduct}
        initialCategory={formInitialCategory}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSaved={() => {
          showToast('Product successfully saved to catalog!');
          loadProducts();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={Boolean(productToDelete)}
        productName={productToDelete?.name || ''}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '9999px',
    boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(92, 62, 54, 0.16))',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 600,
    zIndex: 150,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  kicker: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: '#8c5e51',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '28px',
    fontWeight: 600,
    color: '#2d2421',
    lineHeight: 1.2,
    marginTop: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#6f6764',
    marginTop: '4px',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  addDressBtn: {
    height: '40px',
    padding: '0 18px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    borderRadius: '9999px',
    fontSize: '13px',
    fontWeight: 600,
    border: 'none',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.08))',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  addCakeBtn: {
    height: '40px',
    padding: '0 18px',
    backgroundColor: '#7e544f',
    color: '#ffffff',
    borderRadius: '9999px',
    fontSize: '13px',
    fontWeight: 600,
    border: 'none',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.08))',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  filterCard: {
    backgroundColor: '#f5f3ef',
    border: '1px solid #dfd8ce',
    borderRadius: '14px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.02))',
  },
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    flex: 1,
    minWidth: '260px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    fontSize: '14px',
    pointerEvents: 'none',
    color: '#988e8a',
  },
  searchInput: {
    width: '100%',
    height: '42px',
    backgroundColor: '#ffffff',
    border: '1px solid #dfd8ce',
    borderRadius: '9999px',
    padding: '0 36px 0 36px',
    fontSize: '13px',
    color: '#2d2421',
    outline: 'none',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '12px',
    fontSize: '12px',
    color: '#988e8a',
    cursor: 'pointer',
  },
  sortWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sortLabel: {
    fontSize: '12px',
    color: '#6f6764',
    whiteSpace: 'nowrap',
  },
  sortSelect: {
    height: '40px',
    backgroundColor: '#ffffff',
    border: '1px solid #dfd8ce',
    borderRadius: '9999px',
    padding: '0 14px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#2d2421',
    outline: 'none',
  },
  pillsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    borderTop: '1px solid #e7e4df',
    paddingTop: '12px',
    flexWrap: 'wrap',
  },
  categoryPills: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  filterSectionLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#6f6764',
    marginRight: '4px',
  },
  pillBtn: {
    padding: '5px 14px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6f6764',
    backgroundColor: '#ffffff',
    border: '1px solid #dfd8ce',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  pillBtnActive: {
    backgroundColor: '#5c3e36',
    borderColor: '#5c3e36',
    color: '#ffffff',
  },
  statusFilterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusSelect: {
    height: '32px',
    backgroundColor: '#ffffff',
    border: '1px solid #dfd8ce',
    borderRadius: '9999px',
    padding: '0 12px',
    fontSize: '12px',
    color: '#2d2421',
    outline: 'none',
  },
  loadingState: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #dfd8ce',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f5ede9',
    borderTopColor: '#5c3e36',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 12px',
  },
  loadingText: {
    fontSize: '13px',
    color: '#6f6764',
  },
  errorState: {
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #fecaca',
  },
  errorStateIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    fontWeight: 700,
    marginBottom: '10px',
  },
  errorStateTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '18px',
    color: '#991b1b',
    marginBottom: '4px',
  },
  errorStateDesc: {
    fontSize: '13px',
    color: '#6f6764',
    marginBottom: '16px',
  },
  retryBtn: {
    padding: '8px 20px',
    borderRadius: '9999px',
    border: 'none',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 600,
  },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #dfd8ce',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  emptyIcon: {
    fontSize: '36px',
    marginBottom: '6px',
  },
  emptyTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '20px',
    fontWeight: 600,
    color: '#2d2421',
  },
  emptyDesc: {
    fontSize: '13px',
    color: '#6f6764',
    maxWidth: '420px',
    lineHeight: 1.5,
  },
  emptyActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '12px',
  },
  productList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
};
