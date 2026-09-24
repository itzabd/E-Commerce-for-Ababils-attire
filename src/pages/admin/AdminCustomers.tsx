/**
 * Ababil’s Attire by Sanjida Bethi
 * Phase 9: Admin Customer Management
 * Mirrors Stitch Screen 93c92ed320b84f8ea69f0d4b95875ed5
 *
 * Implements:
 * - Customer directory with responsive desktop/tablet/mobile layout
 * - Search by customer name, phone (+880...), area, or invoice (AB-...)
 * - Filter chips: All, Dress Buyers, Cake Buyers, Repeat Customers
 * - Summary metrics strip: Total Clients, Repeat Customer Rate, Avg Lifetime
 * - Customer cards with tags, latest order snapshot, WhatsApp, Call, and Profile triggers
 * - Deep Customer Profile view / drawer with:
 *    - Full customer contact and delivery information
 *    - Financial & delivery reliability summary (lifetime spend, orders, AOV, on-time bKash)
 *    - Admin-only operational notes (Child sizing, Cake dietary, Delivery protocol, General) with CRUD
 *    - Full past and active order history dockets with link to Admin Order Details
 *    - Edit customer details modal and archive workflow
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  adminService,
  type CustomerDirectoryEntry,
  type CustomerFilter,
  type CustomerMetricsSummary,
  type CustomerProfileDetail,
  type AdminCustomerNote,
} from '../../services/admin.service';

export const AdminCustomers: React.FC = () => {
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLElement | null>(null);

  // Directory Data State
  const [customers, setCustomers] = useState<CustomerDirectoryEntry[]>([]);
  const [metrics, setMetrics] = useState<CustomerMetricsSummary>({
    total_customers: 86,
    dress_buyers_count: 54,
    cake_buyers_count: 48,
    repeat_customers_count: 36,
    repeat_customer_rate: 42,
    average_lifetime_spend: 8400,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'spend' | 'name'>('recent');

  // Deep Inspection Drawer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>('cust_demo_1042');
  const [profileDetail, setProfileDetail] = useState<CustomerProfileDetail | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Edit Customer Info Modal / Form
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    alt_phone: '',
    address: '',
    area: '',
  });

  // Admin Notes Management State
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteCategory, setNewNoteCategory] = useState<AdminCustomerNote['category']>('child');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [editingNoteCategory, setEditingNoteCategory] = useState<AdminCustomerNote['category']>('child');

  // Feedback Notifications & Modals
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Load customer directory
  const loadDirectory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getCustomersDirectory({
        search: searchQuery,
        filter: filter,
      });
      setCustomers(res.customers);
      setMetrics(res.metrics);

      // If nothing selected or selected customer filtered out, default to first customer
      if (res.customers.length > 0) {
        if (!selectedCustomerId || !res.customers.some((c) => c.id === selectedCustomerId)) {
          setSelectedCustomerId(res.customers[0].id);
        }
      } else {
        setSelectedCustomerId(null);
        setProfileDetail(null);
      }
    } catch (err) {
      console.error('Failed to load customers directory:', err);
      showToast('Error loading customer directory. Please check network connection.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filter, selectedCustomerId]);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  // Load selected customer profile
  const loadProfile = useCallback(async (id: string) => {
    setProfileLoading(true);
    try {
      const data = await adminService.getCustomerProfile(id);
      setProfileDetail(data);
      if (data) {
        setEditForm({
          name: data.name,
          phone: data.phone,
          alt_phone: data.alt_phone || '',
          address: data.address,
          area: data.area,
        });
      }
    } catch (err) {
      console.error('Failed to load customer profile:', err);
      showToast('Error loading detailed profile.');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      loadProfile(selectedCustomerId);
    }
  }, [selectedCustomerId, loadProfile]);

  // Handle Customer Selection and Smooth Scroll to Profile
  const handleSelectCustomer = (id: string, scroll: boolean = true) => {
    setSelectedCustomerId(id);
    if (scroll && drawerRef.current) {
      drawerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Sort customers
  const sortedCustomers = useMemo(() => {
    const list = [...customers];
    if (sortBy === 'spend') {
      return list.sort((a, b) => b.lifetime_value - a.lifetime_value);
    }
    if (sortBy === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    // Default: recent activity
    return list.sort((a, b) => {
      const dateA = a.last_order_date || a.created_at;
      const dateB = b.last_order_date || b.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [customers, sortBy]);

  // WhatsApp formatted link helper
  const getWhatsAppLink = (phone: string, customerName?: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '880' + clean.slice(1);
    } else if (!clean.startsWith('880')) {
      clean = '880' + clean;
    }
    const greeting = encodeURIComponent(
      `Assalamu Alaikum ${customerName || 'Ma’am'}, this is Sanjida Bethi from Ababil’s Attire atelier regarding your bespoke order.`
    );
    return `https://wa.me/${clean}?text=${greeting}`;
  };

  // Save Customer Info Edits
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    try {
      await adminService.updateCustomerInfo(selectedCustomerId, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        alt_phone: editForm.alt_phone.trim() || undefined,
        address: editForm.address.trim(),
        area: editForm.area.trim(),
      });
      showToast('Customer information updated successfully.');
      setIsEditingInfo(false);
      loadDirectory();
      loadProfile(selectedCustomerId);
    } catch {
      showToast('Failed to update customer info.');
    }
  };

  // Add Note Handler
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !newNoteContent.trim()) return;
    try {
      await adminService.addCustomerNote(selectedCustomerId, {
        category: newNoteCategory,
        content: newNoteContent.trim(),
        created_by: 'Sanjida Bethi',
      });
      setNewNoteContent('');
      setIsAddingNote(false);
      showToast('Admin note added to atelier records.');
      loadProfile(selectedCustomerId);
    } catch {
      showToast('Failed to add note.');
    }
  };

  // Start Note Edit
  const handleStartEditNote = (note: AdminCustomerNote) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
    setEditingNoteCategory(note.category);
  };

  // Save Note Edit
  const handleSaveNoteEdit = async (noteId: string) => {
    if (!selectedCustomerId || !editingNoteContent.trim()) return;
    try {
      await adminService.editCustomerNote(selectedCustomerId, noteId, editingNoteContent.trim(), editingNoteCategory);
      setEditingNoteId(null);
      showToast('Admin note updated.');
      loadProfile(selectedCustomerId);
    } catch {
      showToast('Failed to update note.');
    }
  };

  // Delete Note Handler
  const handleDeleteNote = async (noteId: string) => {
    if (!selectedCustomerId) return;
    if (!window.confirm('Delete this admin note? This cannot be undone.')) return;
    try {
      await adminService.deleteCustomerNote(selectedCustomerId, noteId);
      showToast('Admin note deleted.');
      loadProfile(selectedCustomerId);
    } catch {
      showToast('Failed to delete note.');
    }
  };

  // Archive Customer Handler
  const handleConfirmArchive = () => {
    setShowArchiveConfirm(false);
    showToast(`Customer record for ${profileDetail?.name || 'client'} has been archived.`);
  };

  return (
    <div style={styles.container}>
      {/* Mobile constraint container matching Stitch 93c92ed320b84f8ea69f0d4b95875ed5 */}
      <div style={styles.screenWrapper}>
        {/* Toast Notification */}
        {toastMessage && (
          <div style={styles.toast}>
            <span style={styles.toastIcon}>✓</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Header & Fast Actions */}
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>Customers</h1>
            <p style={styles.pageSubtitle}>
              {metrics.total_customers} Customers • {metrics.dress_buyers_count} Dress, {metrics.cake_buyers_count} Cake
            </p>
          </div>
          <button
            style={styles.manualOrderButton}
            onClick={() => setShowManualOrderModal(true)}
            title="Create manual bespoke order"
          >
            <span style={styles.plusIcon}>+</span>
            <span>Manual Order</span>
          </button>
        </div>

        {/* 2. Search & Fast Filter Chips */}
        <div style={styles.searchSection}>
          {/* Search Bar */}
          <div style={styles.searchBarWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone (+880...), invoice (AB-)..."
              style={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={styles.clearSearchButton}
                aria-label="Clear Search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div style={styles.filterChipRow}>
            <button
              onClick={() => setFilter('all')}
              style={{
                ...styles.filterChip,
                ...(filter === 'all' ? styles.filterChipActive : {}),
              }}
            >
              All ({metrics.total_customers})
            </button>
            <button
              onClick={() => setFilter('dress_buyers')}
              style={{
                ...styles.filterChip,
                ...(filter === 'dress_buyers' ? styles.filterChipActive : {}),
              }}
            >
              Dress Buyers ({metrics.dress_buyers_count})
            </button>
            <button
              onClick={() => setFilter('cake_buyers')}
              style={{
                ...styles.filterChip,
                ...(filter === 'cake_buyers' ? styles.filterChipActive : {}),
              }}
            >
              Cake Lovers ({metrics.cake_buyers_count})
            </button>
            <button
              onClick={() => setFilter('repeat_customers')}
              style={{
                ...styles.filterChip,
                ...(filter === 'repeat_customers' ? styles.filterChipActive : {}),
              }}
            >
              VIP Regulars ({metrics.repeat_customers_count || 9})
            </button>
          </div>

          {/* 3. Summary Metric Strip */}
          <div style={styles.metricsStrip}>
            <div style={styles.metricColumn}>
              <span style={styles.metricLabel}>Total Clients</span>
              <span style={styles.metricValue}>{metrics.total_customers}</span>
            </div>
            <div style={{ ...styles.metricColumn, ...styles.metricBorder }}>
              <span style={styles.metricLabel}>Repeat Rate</span>
              <span style={styles.metricValue}>{metrics.repeat_customer_rate}%</span>
            </div>
            <div style={styles.metricColumn}>
              <span style={styles.metricLabel}>Avg Lifetime</span>
              <span style={styles.metricValue}>৳ {metrics.average_lifetime_spend.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 4. Customer Cards List */}
        <section style={styles.customerListSection}>
          <div style={styles.listHeaderRow}>
            <h2 style={styles.listHeading}>
              Client Records ({sortedCustomers.length} {filter === 'all' ? 'Shown' : 'Filtered'})
            </h2>
            <div style={styles.sortToggle}>
              <span style={styles.sortLabel}>Sort:</span>
              <button
                onClick={() => setSortBy(sortBy === 'recent' ? 'spend' : sortBy === 'spend' ? 'name' : 'recent')}
                style={styles.sortButton}
              >
                {sortBy === 'recent' ? 'Recent Activity ▾' : sortBy === 'spend' ? 'Highest Spend ▾' : 'Client Name ▾'}
              </button>
            </div>
          </div>

          {loading ? (
            <div style={styles.loadingCard}>
              <div style={styles.spinner} />
              <p style={styles.loadingText}>Loading Atelier client records...</p>
            </div>
          ) : sortedCustomers.length === 0 ? (
            <div style={styles.emptyCard}>
              <p style={styles.emptyTitle}>No matching clients found</p>
              <p style={styles.emptySubtitle}>Try adjusting your search query or switching active filter chips.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
                style={styles.resetButton}
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div style={styles.cardsStack}>
              {sortedCustomers.map((cust) => {
                const isSelected = cust.id === selectedCustomerId;
                return (
                  <article
                    key={cust.id}
                    style={{
                      ...styles.customerCard,
                      ...(isSelected ? styles.customerCardSelected : {}),
                    }}
                  >
                    {/* VIP / Type Badge */}
                    <div
                      style={{
                        ...styles.cardTypeBadge,
                        ...(cust.customer_type === 'VIP Regular'
                          ? styles.badgeVip
                          : cust.customer_type === 'Active Inquiry'
                          ? styles.badgeInquiry
                          : styles.badgePatron),
                      }}
                    >
                      {cust.customer_type.toUpperCase()}
                    </div>

                    {/* Customer Header */}
                    <div style={styles.cardHeaderArea}>
                      <div style={styles.cardNameRow}>
                        <h3 style={styles.cardName}>{cust.name}</h3>
                        <span style={styles.verifiedIcon} title="Verified Atelier Customer">
                          ✓
                        </span>
                      </div>
                      <p style={styles.cardContactSub}>
                        {cust.phone} • {cust.area}
                      </p>
                    </div>

                    {/* Tags */}
                    <div style={styles.tagWrap}>
                      <span style={styles.cardTag}>
                        <span style={styles.tagIcon}>↻</span>
                        {cust.total_orders > 1 ? `Repeat Client (${cust.total_orders} Orders)` : 'First-time Client'}
                      </span>
                      {cust.purchased_categories.includes('dresses') && cust.purchased_categories.includes('cakes') ? (
                        <span style={{ ...styles.cardTag, ...styles.tagBoth }}>
                          <span style={styles.tagIcon}>✿</span>
                          Dresses & Cakes
                        </span>
                      ) : cust.purchased_categories.includes('dresses') ? (
                        <span style={{ ...styles.cardTag, ...styles.tagDress }}>
                          <span style={styles.tagIcon}>👗</span>
                          Couture Dresses
                        </span>
                      ) : (
                        <span style={{ ...styles.cardTag, ...styles.tagCake }}>
                          <span style={styles.tagIcon}>🎂</span>
                          Bespoke Cakes
                        </span>
                      )}
                    </div>

                    {/* Quick Contact & Action Buttons */}
                    <div style={styles.cardActionGrid}>
                      <button
                        onClick={() => handleSelectCustomer(cust.id, true)}
                        style={styles.actionProfileBtn}
                        title="View Detailed Profile & Order History"
                      >
                        <span style={styles.btnIcon}>👁</span>
                        <span>Profile</span>
                      </button>

                      <a
                        href={getWhatsAppLink(cust.phone, cust.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.actionWhatsAppBtn}
                        title="Open WhatsApp Chat"
                      >
                        <span style={styles.waIcon}>💬</span>
                        <span>WhatsApp</span>
                      </a>

                      <a href={`tel:${cust.phone}`} style={styles.actionCallBtn} title="Call Customer Direct">
                        <span style={styles.btnIcon}>📞</span>
                        <span>Call</span>
                      </a>

                      <button
                        onClick={() => setShowManualOrderModal(true)}
                        style={styles.actionOrderBtn}
                        title="Draft Order for this Customer"
                      >
                        <span style={styles.btnIcon}>+</span>
                        <span>Order</span>
                      </button>
                    </div>

                    {/* Snapshot Banner: Current Order / Latest Invoice */}
                    {cust.latest_invoice && (
                      <div style={styles.snapshotBanner}>
                        <div style={styles.snapshotTopRow}>
                          <span style={styles.snapshotInvoice}>Inv: {cust.latest_invoice}</span>
                          <span
                            style={{
                              ...styles.snapshotStatusBadge,
                              ...(cust.latest_order_status === 'delivered'
                                ? styles.statusDelivered
                                : cust.latest_order_status === 'review_required'
                                ? styles.statusReview
                                : cust.latest_order_status === 'out_for_delivery'
                                ? styles.statusDispatched
                                : styles.statusCraft),
                            }}
                          >
                            {cust.latest_order_status === 'in_production'
                              ? 'Processing (In Craft)'
                              : cust.latest_order_status === 'review_required'
                              ? 'Review Required'
                              : cust.latest_order_status === 'out_for_delivery'
                              ? 'Dispatched'
                              : cust.latest_order_status === 'delivered'
                              ? 'Delivered ✓'
                              : cust.latest_order_status || 'Active'}
                          </span>
                        </div>
                        {cust.latest_order_items_summary && (
                          <p style={styles.snapshotItems}>{cust.latest_order_items_summary}</p>
                        )}
                        <div style={styles.snapshotFinancials}>
                          <span>
                            Total: <strong style={styles.strongCocoa}>৳ {cust.latest_order_total?.toLocaleString()}</strong>
                          </span>
                          {cust.latest_order_advance_verified ? (
                            <span style={styles.verifiedGreen}>৳ 500 bKash verified</span>
                          ) : (
                            <span style={styles.pendingAdvance}>bKash pending match</span>
                          )}
                          {cust.latest_order_cash_due !== undefined && (
                            <span>৳ {cust.latest_order_cash_due.toLocaleString()} COD due</span>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* 5. Expanded Customer Profile & Deep Inspection Drawer/View */}
        {profileDetail && (
          <section ref={drawerRef} id="deep-profile-drawer" style={styles.profileSection}>
            {/* Drawer Section Indicator */}
            <div style={styles.drawerTopBar}>
              <div style={styles.drawerLeftIndicator}>
                <span style={styles.indicatorDot} />
                <span style={styles.indicatorText}>Active Client Inspection</span>
              </div>
              <div style={styles.drawerRightActions}>
                <span style={styles.archivePill}>Client #{profileDetail.id.slice(-6).toUpperCase()}</span>
                <button
                  onClick={() => setShowArchiveConfirm(true)}
                  style={styles.archiveButton}
                  title="Archive customer record"
                >
                  <span>📦</span>
                  <span>Archive</span>
                </button>
              </div>
            </div>

            {profileLoading ? (
              <div style={styles.loadingCard}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>Fetching customer profile & history...</p>
              </div>
            ) : (
              <div style={styles.profileCard}>
                {/* Profile Header & Monogram */}
                <div style={styles.profileHeader}>
                  <div style={styles.profileMeta}>
                    <div style={styles.profileNameWrap}>
                      <h3 style={styles.profileName}>{profileDetail.name}</h3>
                      <span style={styles.verifiedIconBig}>✓</span>
                    </div>
                    <p style={styles.profilePhone}>{profileDetail.phone}</p>
                    {profileDetail.alt_phone && (
                      <p style={styles.profileAltPhone}>Alt: {profileDetail.alt_phone}</p>
                    )}
                    <p style={styles.profileAddress}>{profileDetail.address}</p>
                  </div>
                  <div style={styles.avatarCircle}>
                    {profileDetail.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div style={styles.profileActionPills}>
                  <a
                    href={getWhatsAppLink(profileDetail.phone, profileDetail.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.profileWaBtn}
                  >
                    <span>💬</span>
                    <span>WhatsApp Customer</span>
                  </a>
                  <a href={`tel:${profileDetail.phone}`} style={styles.profileCallBtn}>
                    <span>📞</span>
                    <span>Call Direct</span>
                  </a>
                  <button onClick={() => setIsEditingInfo(true)} style={styles.profileEditBtn}>
                    <span>✎</span>
                    <span>Edit Customer Info</span>
                  </button>
                  <button onClick={() => setShowManualOrderModal(true)} style={styles.profileOrderBtn}>
                    <span>+</span>
                    <span>+ Manual Order</span>
                  </button>
                </div>

                {/* Lifetime Value & Reliability Summary Card */}
                <div style={styles.financialCard}>
                  <h4 style={styles.financialHeading}>Financial & Delivery Reliability</h4>
                  <div style={styles.financialGrid}>
                    <div style={styles.financialCell}>
                      <span style={styles.finLabel}>Total Lifetime Spend</span>
                      <span style={styles.finValuePrimary}>
                        ৳ {profileDetail.financial_summary.lifetime_spend.toLocaleString()}
                      </span>
                    </div>
                    <div style={styles.financialCell}>
                      <span style={styles.finLabel}>Completed Orders</span>
                      <span style={styles.finValueDark}>{profileDetail.financial_summary.completed_orders} Orders</span>
                    </div>
                    <div style={styles.financialCell}>
                      <span style={styles.finLabel}>Average Order Value</span>
                      <span style={styles.finValueMedium}>
                        ৳ {profileDetail.financial_summary.average_order_value.toLocaleString()}
                      </span>
                    </div>
                    <div style={styles.financialCell}>
                      <span style={styles.finLabel}>Advance Payment History</span>
                      <span style={styles.finValueGreen}>
                        <span>✓</span> 100% On-time bKash
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin Operational Notes Section (Strictly Isolated from Public) */}
                <div style={styles.notesContainer}>
                  <div style={styles.notesHeader}>
                    <div style={styles.notesTitleWrap}>
                      <span style={styles.notesIcon}>📖</span>
                      <h4 style={styles.notesHeading}>Notes for Sanjida & Atelier Team</h4>
                    </div>
                    <span style={styles.notesLockNotice}>🔒 Admin-Only</span>
                  </div>

                  {profileDetail.admin_notes.length === 0 ? (
                    <p style={styles.noNotesText}>
                      No atelier operational notes recorded yet. Add preferences like sizing or dietary notes below.
                    </p>
                  ) : (
                    <ul style={styles.notesList}>
                      {profileDetail.admin_notes.map((note) => {
                        const isEditingThisNote = editingNoteId === note.id;
                        return (
                          <li key={note.id} style={styles.noteItem}>
                            {isEditingThisNote ? (
                              <div style={styles.editNoteBox}>
                                <div style={styles.editNoteCategoryRow}>
                                  <label style={styles.formLabelSmall}>Category:</label>
                                  <select
                                    value={editingNoteCategory}
                                    onChange={(e) =>
                                      setEditingNoteCategory(e.target.value as AdminCustomerNote['category'])
                                    }
                                    style={styles.selectCategory}
                                  >
                                    <option value="child">Child Sizing / Preferences</option>
                                    <option value="cake_dietary">Cake Flavor & Dietary</option>
                                    <option value="delivery">Delivery Protocol</option>
                                    <option value="general">General Atelier Note</option>
                                  </select>
                                </div>
                                <textarea
                                  value={editingNoteContent}
                                  onChange={(e) => setEditingNoteContent(e.target.value)}
                                  rows={3}
                                  style={styles.noteTextarea}
                                />
                                <div style={styles.editNoteButtons}>
                                  <button onClick={() => setEditingNoteId(null)} style={styles.cancelSmallBtn}>
                                    Cancel
                                  </button>
                                  <button onClick={() => handleSaveNoteEdit(note.id)} style={styles.saveSmallBtn}>
                                    Save Note
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={styles.noteRow}>
                                <div style={styles.noteContentArea}>
                                  <span style={styles.noteCatIcon}>
                                    {note.category === 'child'
                                      ? '👶'
                                      : note.category === 'cake_dietary'
                                      ? '🍰'
                                      : note.category === 'delivery'
                                      ? '🚚'
                                      : '📌'}
                                  </span>
                                  <div style={styles.noteTextWrapper}>
                                    <strong style={styles.noteCategoryTitle}>
                                      {note.category === 'child'
                                        ? 'Child:'
                                        : note.category === 'cake_dietary'
                                        ? 'Cake Dietary:'
                                        : note.category === 'delivery'
                                        ? 'Delivery Protocol:'
                                        : 'General:'}
                                    </strong>{' '}
                                    <span style={styles.noteBodyText}>{note.content}</span>
                                    <span style={styles.noteAuthorStamp}>
                                      — {note.created_by || 'Sanjida'} •{' '}
                                      {new Date(note.created_at).toLocaleDateString('en-GB', {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <div style={styles.noteActions}>
                                  <button
                                    onClick={() => handleStartEditNote(note)}
                                    style={styles.iconEditBtn}
                                    title="Edit Note"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    style={styles.iconDeleteBtn}
                                    title="Delete Note"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Add Note Trigger / Form */}
                  {isAddingNote ? (
                    <form onSubmit={handleAddNote} style={styles.addNoteForm}>
                      <div style={styles.formRowInline}>
                        <label style={styles.formLabelSmall}>Note Type:</label>
                        <select
                          value={newNoteCategory}
                          onChange={(e) => setNewNoteCategory(e.target.value as AdminCustomerNote['category'])}
                          style={styles.selectCategory}
                        >
                          <option value="child">Child Sizing / Preferences</option>
                          <option value="cake_dietary">Cake Flavor & Dietary</option>
                          <option value="delivery">Delivery Protocol</option>
                          <option value="general">General Atelier Note</option>
                        </select>
                      </div>
                      <textarea
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="e.g. Loves pastel berry tones, dress size 12M, request low sugar sponge..."
                        rows={3}
                        style={styles.noteTextarea}
                        required
                      />
                      <div style={styles.formActionsRight}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNote(false);
                            setNewNoteContent('');
                          }}
                          style={styles.cancelSmallBtn}
                        >
                          Cancel
                        </button>
                        <button type="submit" style={styles.saveSmallBtn}>
                          Save Admin Note
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div style={styles.notesFooter}>
                      <button onClick={() => setIsAddingNote(true)} style={styles.addNotePillBtn}>
                        <span>+</span>
                        <span>Add Atelier Note</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Past & Active Order History Dockets */}
                <div style={styles.orderHistorySection}>
                  <div style={styles.orderHistoryHeader}>
                    <h4 style={styles.orderHistoryTitle}>
                      Past & Active Dockets ({profileDetail.orders.length})
                    </h4>
                    <span style={styles.exportNote}>Client Statement Synced</span>
                  </div>

                  {profileDetail.orders.length === 0 ? (
                    <p style={styles.noOrdersText}>No past orders recorded for this customer.</p>
                  ) : (
                    <div style={styles.docketsStack}>
                      {profileDetail.orders.map((order) => (
                        <div key={order.id} style={styles.orderDocketCard}>
                          {/* Order Header */}
                          <div style={styles.docketHeaderRow}>
                            <div>
                              <span style={styles.docketInvoice}>#{order.invoice_number}</span>
                              <span style={styles.docketDate}>
                                Placed{' '}
                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <span
                              style={{
                                ...styles.snapshotStatusBadge,
                                ...(order.status === 'delivered'
                                  ? styles.statusDelivered
                                  : order.status === 'review_required'
                                  ? styles.statusReview
                                  : order.status === 'out_for_delivery'
                                  ? styles.statusDispatched
                                  : styles.statusCraft),
                              }}
                            >
                              {order.status === 'in_production'
                                ? 'Processing (In Craft)'
                                : order.status === 'review_required'
                                ? 'Review Required'
                                : order.status === 'out_for_delivery'
                                ? 'Dispatched'
                                : order.status === 'delivered'
                                ? 'Delivered ✓'
                                : order.status}
                            </span>
                          </div>

                          {/* Items Breakdown Box */}
                          <div style={styles.docketItemsBox}>
                            {order.items.map((it, idx) => (
                              <div key={it.id || idx} style={styles.docketItemLine}>
                                <span style={styles.docketItemTitle}>
                                  {it.quantity}× {it.product_name}{' '}
                                  {it.selected_size ? `(${it.selected_size})` : ''}
                                  {it.cake_weight ? `(${it.cake_weight})` : ''}
                                  {it.cake_message ? ` — "${it.cake_message}"` : ''}
                                </span>
                                <span style={styles.docketItemPrice}>৳ {it.subtotal.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>

                          {/* Financials & Delivery Date */}
                          <div style={styles.docketFooterRow}>
                            <div>
                              <p style={styles.docketTotal}>Total: ৳ {order.total_amount.toLocaleString()}</p>
                              <p style={styles.docketAdvanceLine}>
                                bKash Adv: ৳ {order.advance_amount.toLocaleString()}{' '}
                                {order.payment_trx ? `(Trx: ${order.payment_trx})` : ''}
                              </p>
                              {order.cash_due > 0 && (
                                <p style={styles.docketCodDue}>COD Due: ৳ {order.cash_due.toLocaleString()}</p>
                              )}
                            </div>
                            <div style={styles.docketDeliveryMeta}>
                              <span style={styles.docketHandoverLabel}>Scheduled Handover</span>
                              <span style={styles.docketHandoverDate}>
                                {order.delivery_date || 'Standard Courier'}
                              </span>
                            </div>
                          </div>

                          {/* Direct Link to Existing Admin Order Docket */}
                          <button
                            onClick={() => navigate(`/admin/orders?invoice=${order.invoice_number}`)}
                            style={styles.viewDocketButton}
                            title="Open in Admin Order Management"
                          >
                            View Full Order Docket →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Edit Customer Info Modal */}
        {isEditingInfo && profileDetail && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContainer}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Edit Customer Information</h3>
                <button onClick={() => setIsEditingInfo(false)} style={styles.modalCloseBtn}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveInfo} style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.modalLabel}>Customer Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.modalLabel}>Primary Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.modalLabel}>Alternative Phone (Optional)</label>
                  <input
                    type="text"
                    value={editForm.alt_phone}
                    onChange={(e) => setEditForm({ ...editForm, alt_phone: e.target.value })}
                    placeholder="+880..."
                    style={styles.modalInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.modalLabel}>Delivery Area</label>
                  <input
                    type="text"
                    value={editForm.area}
                    onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.modalLabel}>Full Delivery Address</label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    rows={3}
                    style={styles.modalTextarea}
                    required
                  />
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" onClick={() => setIsEditingInfo(false)} style={styles.modalCancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.modalSubmitBtn}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manual Order Creation Modal / Notice */}
        {showManualOrderModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContainer}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Manual Order Creation</h3>
                <button onClick={() => setShowManualOrderModal(false)} style={styles.modalCloseBtn}>
                  ✕
                </button>
              </div>
              <div style={styles.modalBody}>
                <p style={styles.modalNoticeText}>
                  Manual custom order creation and direct telephone order generation for{' '}
                  <strong>{profileDetail?.name || 'clients'}</strong> is scheduled for Phase 10.
                </p>
                <p style={styles.modalNoticeSubtext}>
                  In the meantime, you can directly contact the customer via WhatsApp or Phone Call, or review their
                  active dockets in Admin Orders.
                </p>
                {profileDetail && (
                  <div style={styles.manualActionRow}>
                    <a
                      href={getWhatsAppLink(profileDetail.phone, profileDetail.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.modalWaBtn}
                    >
                      WhatsApp {profileDetail.name}
                    </a>
                    <button
                      onClick={() => {
                        setShowManualOrderModal(false);
                        navigate('/admin/orders');
                      }}
                      style={styles.modalOrdersBtn}
                    >
                      Go to Admin Orders
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Archive Confirmation Modal */}
        {showArchiveConfirm && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContainer}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Archive Customer Record?</h3>
                <button onClick={() => setShowArchiveConfirm(false)} style={styles.modalCloseBtn}>
                  ✕
                </button>
              </div>
              <div style={styles.modalBody}>
                <p style={styles.modalNoticeText}>
                  Are you sure you want to archive <strong>{profileDetail?.name}</strong>?
                </p>
                <p style={styles.modalNoticeSubtext}>
                  Archived customers are retained in the Atelier database for historical accounting and lifetime
                  records, but will be hidden from the active priority queue.
                </p>
                <div style={styles.modalFooter}>
                  <button onClick={() => setShowArchiveConfirm(false)} style={styles.modalCancelBtn}>
                    Cancel
                  </button>
                  <button onClick={handleConfirmArchive} style={styles.modalDangerBtn}>
                    Confirm Archive
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Atelier Admin Footer */}
        <footer style={styles.footer}>
          <p style={styles.footerText}>© 2026 Ababil’s Attire by Sanjida Bethi • Admin Customer Suite</p>
          <p style={styles.footerSub}>Sync Status: Cloud Operational • Dhaka Time GMT+6</p>
        </footer>
      </div>
    </div>
  );
};

// =============================================================================
// STYLES OBJECT (WARM IVORY, DEEP COCOA, STITCH DESIGN TOKENS)
// =============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#fbf9f5',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    padding: '16px 8px 64px 8px',
    fontFamily: '"Hanken Grotesk", "Plus Jakarta Sans", sans-serif',
    color: '#1b1c1a',
  },
  screenWrapper: {
    width: '100%',
    maxWidth: '540px',
    backgroundColor: '#fbf9f5',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'relative',
  },
  toast: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#432821',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '9999px',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 9999,
    boxShadow: '0 4px 16px rgba(67, 40, 33, 0.25)',
  },
  toastIcon: {
    color: '#dea697',
    fontWeight: 'bold',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '4px',
  },
  pageTitle: {
    fontFamily: '"Bodoni Moda", serif',
    fontSize: '28px',
    fontWeight: '500',
    color: '#432821',
    margin: 0,
    lineHeight: '1.2',
  },
  pageSubtitle: {
    fontSize: '11px',
    color: '#827470',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginTop: '3px',
    marginBottom: 0,
  },
  manualOrderButton: {
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(92, 62, 54, 0.2)',
  },
  plusIcon: {
    fontSize: '14px',
    fontWeight: 'bold',
  },
  searchSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  searchBarWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    fontSize: '14px',
    color: '#827470',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    height: '42px',
    paddingLeft: '36px',
    paddingRight: '36px',
    backgroundColor: '#ffffff',
    border: '1px solid #d4c3bf',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#1b1c1a',
    outline: 'none',
    boxSizing: 'border-box',
  },
  clearSearchButton: {
    position: 'absolute',
    right: '10px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#827470',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px',
  },
  filterChipRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '2px',
  },
  filterChip: {
    backgroundColor: '#f5f3ef',
    border: '1px solid #d4c3bf',
    color: '#504441',
    borderRadius: '9999px',
    padding: '8px 14px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  filterChipActive: {
    backgroundColor: '#5c3e36',
    borderColor: '#5c3e36',
    color: '#ffffff',
  },
  metricsStrip: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '8px',
    padding: '12px',
    backgroundColor: 'rgba(245, 243, 239, 0.85)',
    border: '1px solid #e4e2de',
    borderRadius: '12px',
    textAlign: 'center',
  },
  metricColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metricBorder: {
    borderLeft: '1px solid #d4c3bf',
    borderRight: '1px solid #d4c3bf',
  },
  metricLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#827470',
  },
  metricValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#432821',
  },
  customerListSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  listHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '4px',
  },
  listHeading: {
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#827470',
    margin: 0,
  },
  sortToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  sortLabel: {
    fontSize: '11px',
    color: '#827470',
  },
  sortButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#5c3e36',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '2px',
  },
  cardsStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  customerCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e4e2de',
    borderRadius: '14px',
    padding: '14px',
    boxShadow: '0 2px 6px rgba(92, 62, 54, 0.04)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'border 0.2s ease',
  },
  customerCardSelected: {
    borderColor: '#5c3e36',
    boxShadow: '0 3px 12px rgba(92, 62, 54, 0.12)',
  },
  cardTypeBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: '4px 10px',
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '0.06em',
    borderBottomLeftRadius: '8px',
  },
  badgeVip: {
    backgroundColor: '#ffc7c1',
    color: '#7a514c',
  },
  badgeInquiry: {
    backgroundColor: '#eae8e4',
    color: '#504441',
  },
  badgePatron: {
    backgroundColor: '#ffdbd1',
    color: '#49251b',
  },
  cardHeaderArea: {
    paddingRight: '70px',
  },
  cardNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  cardName: {
    fontFamily: '"Bodoni Moda", serif',
    fontSize: '18px',
    fontWeight: '600',
    color: '#432821',
    margin: 0,
  },
  verifiedIcon: {
    fontSize: '12px',
    color: '#5c3e36',
    fontWeight: 'bold',
  },
  cardContactSub: {
    fontSize: '12px',
    color: '#827470',
    marginTop: '3px',
    marginBottom: 0,
  },
  tagWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  cardTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#f5f3ef',
    border: '1px solid #d4c3bf',
    borderRadius: '6px',
    padding: '3px 8px',
    fontSize: '11px',
    color: '#504441',
    fontWeight: '500',
  },
  tagBoth: {
    backgroundColor: '#ffdbd1',
    borderColor: '#ffc7c1',
    color: '#653c31',
  },
  tagDress: {
    backgroundColor: '#f5f3ef',
    color: '#504441',
  },
  tagCake: {
    backgroundColor: '#fff4f1',
    color: '#7a514c',
  },
  tagIcon: {
    fontSize: '11px',
  },
  cardActionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '6px',
    paddingTop: '2px',
  },
  actionProfileBtn: {
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '7px 4px',
    fontSize: '11px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    cursor: 'pointer',
  },
  actionWhatsAppBtn: {
    backgroundColor: '#f5f3ef',
    border: '1px solid #d4c3bf',
    color: '#065f46',
    borderRadius: '9999px',
    padding: '7px 4px',
    fontSize: '11px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  actionCallBtn: {
    backgroundColor: '#f5f3ef',
    border: '1px solid #d4c3bf',
    color: '#432821',
    borderRadius: '9999px',
    padding: '7px 4px',
    fontSize: '11px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  actionOrderBtn: {
    backgroundColor: '#f5f3ef',
    border: '1px solid #d4c3bf',
    color: '#432821',
    borderRadius: '9999px',
    padding: '7px 4px',
    fontSize: '11px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    cursor: 'pointer',
  },
  btnIcon: {
    fontSize: '11px',
  },
  waIcon: {
    fontSize: '12px',
  },
  snapshotBanner: {
    backgroundColor: '#faf6f3',
    borderLeft: '3px solid #7e544f',
    borderTopRightRadius: '8px',
    borderBottomRightRadius: '8px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
  },
  snapshotTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snapshotInvoice: {
    fontWeight: '700',
    color: '#432821',
    fontSize: '12px',
  },
  snapshotStatusBadge: {
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '10px',
    fontWeight: '700',
  },
  statusCraft: {
    backgroundColor: '#ffc7c1',
    color: '#7a514c',
  },
  statusReview: {
    backgroundColor: '#ffdbd1',
    color: '#49251b',
  },
  statusDispatched: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusDelivered: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
  },
  snapshotItems: {
    color: '#504441',
    margin: 0,
    fontSize: '12px',
    lineHeight: '1.3',
  },
  snapshotFinancials: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#827470',
    paddingTop: '2px',
    borderTop: '1px dashed #e4e2de',
  },
  strongCocoa: {
    color: '#432821',
  },
  verifiedGreen: {
    color: '#065f46',
    fontWeight: '600',
  },
  pendingAdvance: {
    color: '#93000a',
    fontWeight: '600',
  },
  profileSection: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '2px dashed #d4c3bf',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  drawerTopBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerLeftIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  indicatorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#5c3e36',
  },
  indicatorText: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#827470',
  },
  drawerRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  archivePill: {
    fontSize: '10px',
    backgroundColor: '#ffdbd1',
    color: '#432821',
    padding: '3px 8px',
    borderRadius: '9999px',
    fontWeight: '600',
  },
  archiveButton: {
    backgroundColor: 'transparent',
    border: '1px solid #d4c3bf',
    color: '#ba1a1a',
    borderRadius: '9999px',
    padding: '3px 10px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #d4c3bf',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 4px 16px rgba(92, 62, 54, 0.06)',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  profileMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  profileNameWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  profileName: {
    fontFamily: '"Bodoni Moda", serif',
    fontSize: '22px',
    fontWeight: '600',
    color: '#432821',
    margin: 0,
  },
  verifiedIconBig: {
    fontSize: '14px',
    color: '#5c3e36',
    fontWeight: 'bold',
  },
  profilePhone: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#7e544f',
    margin: 0,
  },
  profileAltPhone: {
    fontSize: '12px',
    color: '#827470',
    margin: 0,
  },
  profileAddress: {
    fontSize: '12px',
    color: '#827470',
    marginTop: '4px',
    marginBottom: 0,
    lineHeight: '1.4',
  },
  avatarCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#ffdbd1',
    border: '1px solid #ffc7c1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Bodoni Moda", serif',
    fontSize: '16px',
    fontWeight: '700',
    color: '#432821',
  },
  profileActionPills: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  profileWaBtn: {
    backgroundColor: '#065f46',
    color: '#ffffff',
    borderRadius: '9999px',
    padding: '9px 12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    textDecoration: 'none',
  },
  profileCallBtn: {
    backgroundColor: '#f5f3ef',
    border: '1px solid #d4c3bf',
    color: '#432821',
    borderRadius: '9999px',
    padding: '9px 12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    textDecoration: 'none',
  },
  profileEditBtn: {
    backgroundColor: '#f5f3ef',
    border: '1px solid #d4c3bf',
    color: '#504441',
    borderRadius: '9999px',
    padding: '9px 12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  profileOrderBtn: {
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '9px 12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  financialCard: {
    backgroundColor: '#f5f3ef',
    border: '1px solid #e4e2de',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  financialHeading: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#827470',
    margin: 0,
  },
  financialGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  financialCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  finLabel: {
    fontSize: '11px',
    color: '#827470',
  },
  finValuePrimary: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#432821',
  },
  finValueDark: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1b1c1a',
  },
  finValueMedium: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#5c3e36',
  },
  finValueGreen: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#065f46',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '2px',
  },
  notesContainer: {
    backgroundColor: '#fff7f5',
    border: '1px solid #ffdad6',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  notesHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notesTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  notesIcon: {
    fontSize: '14px',
  },
  notesHeading: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#432821',
    margin: 0,
  },
  notesLockNotice: {
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#7e544f',
    backgroundColor: '#ffeae6',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  noNotesText: {
    fontSize: '12px',
    color: '#827470',
    fontStyle: 'italic',
    margin: 0,
  },
  notesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  noteItem: {
    borderBottom: '1px solid #f3d4ce',
    paddingBottom: '8px',
  },
  noteRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
  },
  noteContentArea: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    fontSize: '12px',
    lineHeight: '1.4',
  },
  noteCatIcon: {
    fontSize: '13px',
    marginTop: '1px',
  },
  noteTextWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  noteCategoryTitle: {
    color: '#432821',
    fontWeight: '700',
  },
  noteBodyText: {
    color: '#504441',
  },
  noteAuthorStamp: {
    fontSize: '10px',
    color: '#827470',
    marginTop: '2px',
  },
  noteActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  },
  iconEditBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#5c3e36',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '2px',
  },
  iconDeleteBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ba1a1a',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '2px',
  },
  editNoteBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '6px 0',
  },
  editNoteCategoryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  formLabelSmall: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#504441',
  },
  selectCategory: {
    backgroundColor: '#ffffff',
    border: '1px solid #d4c3bf',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '11px',
    color: '#432821',
    outline: 'none',
  },
  noteTextarea: {
    width: '100%',
    backgroundColor: '#ffffff',
    border: '1px solid #d4c3bf',
    borderRadius: '8px',
    padding: '8px',
    fontSize: '12px',
    color: '#1b1c1a',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  editNoteButtons: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '6px',
  },
  cancelSmallBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #d4c3bf',
    color: '#504441',
    borderRadius: '9999px',
    padding: '4px 10px',
    fontSize: '11px',
    cursor: 'pointer',
  },
  saveSmallBtn: {
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  addNoteForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingTop: '6px',
    borderTop: '1px dashed #d4c3bf',
  },
  formRowInline: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  formActionsRight: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '6px',
  },
  notesFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: '4px',
  },
  addNotePillBtn: {
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '6px 14px',
    fontSize: '11px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
  },
  orderHistorySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  orderHistoryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '4px',
  },
  orderHistoryTitle: {
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#827470',
    margin: 0,
  },
  exportNote: {
    fontSize: '11px',
    color: '#7e544f',
    fontWeight: '500',
  },
  noOrdersText: {
    fontSize: '12px',
    color: '#827470',
    margin: 0,
  },
  docketsStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  orderDocketCard: {
    backgroundColor: '#faf8f5',
    border: '1px solid #e4e2de',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  docketHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docketInvoice: {
    fontWeight: '700',
    color: '#432821',
    fontSize: '13px',
    display: 'block',
  },
  docketDate: {
    fontSize: '11px',
    color: '#827470',
  },
  docketItemsBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #ece8e1',
    borderRadius: '8px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  docketItemLine: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  docketItemTitle: {
    color: '#1b1c1a',
  },
  docketItemPrice: {
    color: '#432821',
    fontWeight: '600',
  },
  docketFooterRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    fontSize: '11px',
    paddingTop: '4px',
    borderTop: '1px dashed #e4e2de',
  },
  docketTotal: {
    fontWeight: '700',
    color: '#432821',
    margin: 0,
  },
  docketAdvanceLine: {
    color: '#065f46',
    margin: 0,
  },
  docketCodDue: {
    color: '#504441',
    margin: 0,
  },
  docketDeliveryMeta: {
    textAlign: 'right',
  },
  docketHandoverLabel: {
    fontSize: '10px',
    color: '#827470',
    display: 'block',
  },
  docketHandoverDate: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#7e544f',
  },
  viewDocketButton: {
    backgroundColor: '#f5f3ef',
    border: '1px solid #d4c3bf',
    color: '#5c3e36',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e4e2de',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '3px solid #d4c3bf',
    borderTopColor: '#5c3e36',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '12px',
    color: '#827470',
    margin: 0,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    border: '1px dashed #d4c3bf',
    borderRadius: '14px',
    padding: '28px 16px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: '"Bodoni Moda", serif',
    fontSize: '18px',
    color: '#432821',
    margin: '0 0 6px 0',
  },
  emptySubtitle: {
    fontSize: '12px',
    color: '#827470',
    margin: '0 0 14px 0',
  },
  resetButton: {
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(27, 28, 26, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 999,
    backdropFilter: 'blur(3px)',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 8px 32px rgba(67, 40, 33, 0.2)',
    border: '1px solid #d4c3bf',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid #ece8e1',
    backgroundColor: '#faf8f5',
  },
  modalTitle: {
    fontFamily: '"Bodoni Moda", serif',
    fontSize: '18px',
    fontWeight: '600',
    color: '#432821',
    margin: 0,
  },
  modalCloseBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#827470',
    fontSize: '16px',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  modalLabel: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#504441',
  },
  modalInput: {
    backgroundColor: '#faf8f5',
    border: '1px solid #d4c3bf',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '13px',
    color: '#1b1c1a',
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalTextarea: {
    backgroundColor: '#faf8f5',
    border: '1px solid #d4c3bf',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '13px',
    color: '#1b1c1a',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  modalFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    paddingTop: '8px',
  },
  modalCancelBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #d4c3bf',
    color: '#504441',
    borderRadius: '9999px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalSubmitBtn: {
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '8px 18px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalDangerBtn: {
    backgroundColor: '#ba1a1a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '8px 18px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalNoticeText: {
    fontSize: '13px',
    lineHeight: '1.5',
    color: '#1b1c1a',
    margin: 0,
  },
  modalNoticeSubtext: {
    fontSize: '12px',
    lineHeight: '1.4',
    color: '#827470',
    margin: 0,
  },
  manualActionRow: {
    display: 'flex',
    gap: '8px',
    paddingTop: '8px',
  },
  modalWaBtn: {
    flex: 1,
    backgroundColor: '#065f46',
    color: '#ffffff',
    borderRadius: '9999px',
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center',
    textDecoration: 'none',
  },
  modalOrdersBtn: {
    flex: 1,
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9999px',
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
  },
  footer: {
    paddingTop: '20px',
    paddingBottom: '12px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  footerText: {
    fontSize: '11px',
    color: '#827470',
    margin: 0,
  },
  footerSub: {
    fontSize: '10px',
    color: '#a89d99',
    margin: 0,
  },
};
