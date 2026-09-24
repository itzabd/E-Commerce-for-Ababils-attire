/**
 * Ababil’s Attire by Sanjida Bethi
 * Phase 8: Admin Order Management + bKash Advance Matching
 * Mirrors Stitch Screen ac21cdd217164898baab53fe592e4abf
 *
 * Implements:
 * - Admin order listing with search and filters (status, category, date)
 * - Review Required prominent queue (pending_match bKash advance)
 * - Production & Dispatched queues with operational dockets
 * - Dedicated bKash TrxID matching tool with multi-state reconciliation
 * - Interactive Order Details drawer with 5-stage status pipeline & audit trail
 * - Printable delivery slip modal
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ordersService, type AdminOrderSummary } from '../../services/orders.service';
import type { OrderStatus, TrxMatchingPreview } from '../../types';
import { ManualOrderModal } from '../../components/admin/ManualOrderModal';

type MatchingState =
  | 'idle'
  | 'match_found'
  | 'no_match'
  | 'trx_mismatch'
  | 'already_confirmed'
  | 'amount_mismatch'
  | 'invalid_input'
  | 'error';

export const AdminOrders: React.FC = () => {
  // Orders Data State
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'dress' | 'cake' | 'bundle'>('all');

  // Manual Order Modal State
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);

  // Selected Order for Detail Drawer
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderSummary | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [auditNote, setAuditNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delivery Slip Modal State
  const [slipOrder, setSlipOrder] = useState<AdminOrderSummary | null>(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);

  // bKash Matching Area State
  const [trxInput, setTrxInput] = useState('9K28FD4A');
  const [matchingState, setMatchingState] = useState<MatchingState>('idle');
  const [matchedData, setMatchedData] = useState<TrxMatchingPreview | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load orders from service
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ordersService.getOrdersAdmin({
        status: statusFilter,
        search: searchQuery,
        productCategory: categoryFilter,
      });
      setOrders(data);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, categoryFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Handle escape key to close drawer or modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (slipModalOpen) {
          setSlipModalOpen(false);
        } else if (drawerOpen) {
          setDrawerOpen(false);
        }
      }
    };
    if (drawerOpen || slipModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [drawerOpen, slipModalOpen]);

  // Show auto-dismissing toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Perform TrxID lookup
  const handleFindOrder = async (trxToSearch?: string) => {
    const raw = (trxToSearch || trxInput).trim().toUpperCase();
    if (!raw) {
      setMatchingState('invalid_input');
      setMatchError('Please enter an incoming bKash TrxID (e.g. 9K28FD4A).');
      setMatchedData(null);
      return;
    }

    setMatchLoading(true);
    setMatchError(null);

    try {
      const result = await ordersService.findOrderByTrxId(raw);
      if (result.found) {
        setMatchedData(result);
        if (result.payment_status === 'matched' || result.advance_status === 'verified') {
          setMatchingState('already_confirmed');
        } else if (result.expected_advance && result.payment_amount && result.expected_advance !== result.payment_amount) {
          setMatchingState('amount_mismatch');
        } else {
          setMatchingState('match_found');
        }
      } else {
        setMatchedData(null);
        setMatchingState('no_match');
        setMatchError(`No order found matching TrxID: ${raw}`);
      }
    } catch (err: any) {
      setMatchedData(null);
      setMatchingState('error');
      setMatchError(err?.message || 'Error occurred during TrxID reconciliation query.');
    } finally {
      setMatchLoading(false);
    }
  };

  // Confirm Advance Payment
  const handleConfirmAdvance = async (trxId: string, invoice?: string) => {
    try {
      const res = await ordersService.matchBkashPayment(
        trxId,
        true,
        `bKash advance payment verified by Sanjida Bethi against bKash statement.`
      );
      if (res.success) {
        showToast(`Advance payment of ৳500 verified for ${invoice || trxId}.`);
        setMatchingState('already_confirmed');
        loadOrders();
      } else {
        alert(res.error || 'Failed to confirm payment.');
      }
    } catch (err: any) {
      alert(err.message || 'Payment confirmation failed');
    }
  };

  // Flag Mismatch
  const handleFlagMismatch = async (trxId: string) => {
    try {
      const res = await ordersService.matchBkashPayment(
        trxId,
        false,
        `Flagged mismatch by admin operator. Customer SMS notification scheduled.`
      );
      if (res.success) {
        showToast(`TrxID ${trxId} flagged for mismatch review.`);
        setMatchingState('trx_mismatch');
        loadOrders();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to flag mismatch');
    }
  };

  // Quick check from order card
  const quickCheckBkash = (trx: string) => {
    setTrxInput(trx);
    handleFindOrder(trx);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Open Order Drawer
  const openOrderDrawer = (order: AdminOrderSummary) => {
    setSelectedOrder(order);
    setAuditNote('');
    setDrawerOpen(true);
  };

  // Close Order Drawer
  const closeOrderDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrder(null);
  };

  // Change Status from Pipeline
  const handleTransitionStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    try {
      await ordersService.updateOrderStatus(
        selectedOrder.id,
        newStatus,
        auditNote.trim() || `Status updated to ${newStatus} by admin.`
      );
      showToast(`Order ${selectedOrder.invoice_number} moved to ${newStatus}.`);

      // Update local state
      const histId = 'hist_' + selectedOrder.id + '_' + ((selectedOrder.history?.length || 0) + 1);
      const currentTime = new Date().toISOString();
      const updatedOrder = {
        ...selectedOrder,
        status: newStatus,
        history: [
          ...(selectedOrder.history || []),
          {
            id: histId,
            order_id: selectedOrder.id,
            status: newStatus,
            changed_by: null,
            note: auditNote.trim() || `Status moved to ${newStatus}.`,
            created_at: currentTime,
          },
        ],
      };
      setSelectedOrder(updatedOrder);
      setAuditNote('');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to transition order status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Open Printable Delivery Slip
  const openDeliverySlip = (order: AdminOrderSummary) => {
    setSlipOrder(order);
    setSlipModalOpen(true);
  };

  // Counts for status chips
  const counts = useMemo(() => {
    const total = orders.length;
    const review = orders.filter((o) => o.status === 'review_required').length;
    const confirmed = orders.filter((o) => o.status === 'advance_verified').length;
    const processing = orders.filter((o) => o.status === 'in_production').length;
    const dispatched = orders.filter(
      (o) => o.status === 'dispatch_ready' || o.status === 'out_for_delivery'
    ).length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;
    return { total, review, confirmed, processing, dispatched, delivered, cancelled };
  }, [orders]);

  // Scenario simulation switcher (matching Stitch design specification)
  const setScenario = (scenario: 'matched' | 'not_found' | 'mismatch' | 'confirmed' | 'duplicate') => {
    switch (scenario) {
      case 'matched':
        setTrxInput('9K28FD4A');
        handleFindOrder('9K28FD4A');
        break;
      case 'not_found':
        setTrxInput('INVALID00');
        setMatchedData(null);
        setMatchingState('no_match');
        setMatchError('No order found with TrxID: INVALID00');
        break;
      case 'mismatch':
        setTrxInput('7P43XX89');
        setMatchingState('trx_mismatch');
        setMatchError('TrxID does not match expected sender format or amount.');
        break;
      case 'confirmed':
        setTrxInput('9K28FD4A');
        setMatchingState('already_confirmed');
        break;
      case 'duplicate':
        setTrxInput('9K28FD4A');
        setMatchingState('already_confirmed');
        setMatchError('Warning: This TrxID was already confirmed for another invoice.');
        break;
    }
  };

  return (
    <div style={styles.container}>
      {/* ===================================================================== */}
      {/* 1. TITLE & SUMMARY HEADER                                             */}
      {/* ===================================================================== */}
      <div style={styles.headerRow}>
        <div>
          <div style={styles.titleBadgeCluster}>
            <h1 style={styles.pageTitle}>Orders</h1>
            <span style={styles.needsReviewPill}>
              {counts.review} Needs Review
            </span>
          </div>
          <p style={styles.pageSubtitle}>
            {counts.total} orders placed across Dresses & Cakes
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowManualOrderModal(true)}
          style={styles.manualOrderBtn}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            add
          </span>
          <span>+ Manual Order</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 2. ADVANCE PAYMENT & bKASH MATCHING WORKSPACE                         */}
      {/* ===================================================================== */}
      <section style={styles.matchingSection}>
        <div style={styles.matchingGradientBar} />

        <div style={styles.matchingHeaderRow}>
          <div style={styles.matchingHeaderLeft}>
            <div style={styles.matchingIconBox}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#432821' }}>
                currency_exchange
              </span>
            </div>
            <div>
              <h2 style={styles.matchingTitle}>bKash Advance Payment Matching</h2>
              <span style={styles.matchingSubtitle}>Automated Verification & Reconcile</span>
            </div>
          </div>
          <span style={styles.strictPolicyBadge}>Strict ৳500 Policy</span>
        </div>

        <p style={styles.matchingDescription}>
          Match incoming bKash SMS transactions with customer checkout details to confirm ৳500 advance payments.
        </p>

        {/* Input and Search Form */}
        <div style={styles.matchingForm}>
          <label style={styles.matchingLabel} htmlFor="adminTrxInput">
            Paste bKash TrxID to Find Order
          </label>
          <div style={styles.matchingInputRow}>
            <div style={styles.inputWithIconWrapper}>
              <span className="material-symbols-outlined" style={styles.pasteIcon}>
                content_paste
              </span>
              <input
                id="adminTrxInput"
                type="text"
                value={trxInput}
                onChange={(e) => setTrxInput(e.target.value.toUpperCase())}
                placeholder="e.g. 9K28FD4A or last 4 digits 5678"
                style={styles.trxInput}
                spellCheck={false}
              />
            </div>

            <button
              type="button"
              disabled={matchLoading}
              onClick={() => handleFindOrder()}
              style={styles.findOrderBtn}
            >
              {matchLoading ? (
                <>
                  <span className="material-symbols-outlined spin" style={{ fontSize: '18px' }}>
                    progress_activity
                  </span>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    search
                  </span>
                  <span>Find Order</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Matching States Display Box */}
        {matchingState !== 'idle' && (
          <div style={styles.matchingResultCard}>
            {/* Header Status */}
            <div style={styles.matchingResultHeader}>
              <div style={styles.matchingStateIndicator}>
                <span
                  style={{
                    ...styles.pulseIndicatorDot,
                    backgroundColor:
                      matchingState === 'match_found'
                        ? '#065f46'
                        : matchingState === 'already_confirmed'
                        ? '#1e40af'
                        : '#991b1b',
                  }}
                />
                <span
                  style={{
                    ...styles.matchingStateText,
                    color:
                      matchingState === 'match_found'
                        ? '#065f46'
                        : matchingState === 'already_confirmed'
                        ? '#1e40af'
                        : '#991b1b',
                  }}
                >
                  {matchingState === 'match_found' && 'Match Found • Advance Verified: ৳ 500'}
                  {matchingState === 'already_confirmed' && 'Already Confirmed • Verified bKash Deposit'}
                  {matchingState === 'trx_mismatch' && 'TrxID Mismatch • Requires Verification'}
                  {matchingState === 'amount_mismatch' && 'Amount Mismatch • Verify SMS'}
                  {matchingState === 'no_match' && 'No Matching Order Found'}
                  {matchingState === 'invalid_input' && 'Invalid Input'}
                  {matchingState === 'error' && 'Lookup Error'}
                </span>
              </div>
              {matchedData?.invoice_number && (
                <span style={styles.invoiceNumberPill}>
                  Invoice {matchedData.invoice_number}
                </span>
              )}
            </div>

            {/* Error Message if present */}
            {matchError && (
              <p style={styles.matchingErrorMessage}>{matchError}</p>
            )}

            {/* Matched Order Details Box */}
            {matchedData && (
              <div style={styles.matchedDetailsGridWrapper}>
                <div style={styles.matchedCustomerRow}>
                  <div>
                    <span style={styles.matchedCustomerName}>{matchedData.customer_name}</span>
                    <span style={styles.matchedCustomerMeta}>
                      {matchedData.customer_phone} • {matchedData.customer_area || 'Dhaka'}
                    </span>
                  </div>
                  <span style={styles.matchedProductPill}>
                    {matchedData.items?.[0]?.product_name || 'Custom Order'}
                  </span>
                </div>

                <div style={styles.matchedMetricsGrid}>
                  <div style={styles.metricCell}>
                    <span style={styles.metricLabel}>Submitted TrxID</span>
                    <span style={styles.metricValue}>{matchedData.trx_id}</span>
                  </div>
                  <div style={styles.metricCell}>
                    <span style={styles.metricLabel}>Sender Last 4</span>
                    <span style={styles.metricValue}>•••• {matchedData.sender_last4 || 'N/A'}</span>
                  </div>
                  <div style={styles.metricCell}>
                    <span style={styles.metricLabel}>Reference</span>
                    <span style={styles.metricValue}>{matchedData.reference_name || 'Direct Deposit'}</span>
                  </div>
                  <div style={styles.metricCell}>
                    <span style={styles.metricLabel}>Expected Advance</span>
                    <span style={{ ...styles.metricValue, color: '#7e544f' }}>
                      ৳ {matchedData.expected_advance || 500}
                    </span>
                  </div>
                  <div style={styles.metricSpanRow}>
                    <span>
                      Order Total: <strong>৳ {(matchedData.total_amount || 0).toLocaleString()}</strong>
                    </span>
                    <span style={{ color: '#7e544f' }}>
                      Due on Delivery: <strong>৳ {(matchedData.cash_due || 0).toLocaleString()}</strong>
                    </span>
                  </div>
                </div>

                {/* Confirm / Flag Actions */}
                <div style={styles.matchingActionsRow}>
                  <button
                    type="button"
                    onClick={() => handleConfirmAdvance(matchedData.trx_id!, matchedData.invoice_number)}
                    style={styles.confirmAdvanceBtn}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      verified
                    </span>
                    <span>Confirm Advance Payment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFlagMismatch(matchedData.trx_id!)}
                    style={styles.flagMismatchBtn}
                  >
                    Flag Mismatch
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Simulation Scenario Buttons (from Stitch mockup) */}
        <div style={styles.simulationContainer}>
          <div style={styles.simulationHeader}>
            <span style={styles.simLabel}>Simulate Scenario:</span>
            <span style={styles.simHint}>Test audit workflows</span>
          </div>
          <div style={styles.simButtonsRow}>
            <button
              type="button"
              onClick={() => setScenario('matched')}
              style={styles.simPillActive}
            >
              Match Found
            </button>
            <button
              type="button"
              onClick={() => setScenario('not_found')}
              style={styles.simPill}
            >
              No Match
            </button>
            <button
              type="button"
              onClick={() => setScenario('mismatch')}
              style={styles.simPill}
            >
              TrxID Mismatch
            </button>
            <button
              type="button"
              onClick={() => setScenario('confirmed')}
              style={styles.simPill}
            >
              Already Confirmed
            </button>
            <button
              type="button"
              onClick={() => setScenario('duplicate')}
              style={styles.simPill}
            >
              Duplicate TrxID
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. SEARCH & STATUS FILTERS                                            */}
      {/* ===================================================================== */}
      <section style={styles.filterSection}>
        {/* Search input */}
        <div style={styles.searchWrapper}>
          <span className="material-symbols-outlined" style={styles.searchIcon}>
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice, customer name, phone (e.g. AB-260923, 01712)..."
            style={styles.searchInput}
          />
        </div>

        {/* Status Chips */}
        <div style={styles.statusChipsRow}>
          {[
            { id: 'all', label: `All (${counts.total})` },
            { id: 'review_required', label: `New / Review (${counts.review})`, dot: true },
            { id: 'advance_verified', label: `Confirmed (${counts.confirmed})` },
            { id: 'in_production', label: `Processing (${counts.processing})` },
            { id: 'out_for_delivery', label: `Dispatched (${counts.dispatched})` },
            { id: 'delivered', label: `Delivered (${counts.delivered})` },
            { id: 'cancelled', label: `Cancelled (${counts.cancelled})` },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setStatusFilter(chip.id as any)}
              style={{
                ...styles.chipBtn,
                backgroundColor: statusFilter === chip.id ? '#5c3e36' : '#ffffff',
                color: statusFilter === chip.id ? '#ffffff' : '#504441',
                borderColor: statusFilter === chip.id ? '#5c3e36' : '#d4c3bf',
                fontWeight: statusFilter === chip.id ? 700 : 500,
              }}
            >
              {chip.dot && <span style={styles.chipDot} />}
              {chip.label}
            </button>
          ))}
        </div>

        {/* Secondary Filter Row: Category & Schedule */}
        <div style={styles.secondaryFilterRow}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            style={styles.categorySelect}
          >
            <option value="all">All Products (Dresses & Cakes)</option>
            <option value="dress">Dresses Only</option>
            <option value="cake">Celebration Cakes Only</option>
            <option value="bundle">Dress & Cake Bundles</option>
          </select>

          <div style={styles.scheduleFilterBox}>
            <span style={{ fontSize: '11px', color: '#432821', fontWeight: 600 }}>
              Today & Upcoming Dispatch
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#827470' }}>
              calendar_today
            </span>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. ORDERS QUEUE (STACKED OPERATIONAL CARDS)                           */}
      {/* ===================================================================== */}
      <section style={styles.orderCardsList}>
        {loading && (
          <div style={styles.loadingBox}>
            <span className="material-symbols-outlined spin" style={{ fontSize: '28px', color: '#5c3e36' }}>
              progress_activity
            </span>
            <p style={{ margin: 0, fontSize: '13px', color: '#6f6764' }}>Loading orders...</p>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div style={styles.emptyBox}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#827470' }}>
              inbox
            </span>
            <h3 style={{ margin: '4px 0', fontSize: '15px', color: '#432821' }}>No orders found</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#6f6764' }}>
              Try adjusting your search query or status filter.
            </p>
          </div>
        )}

        {!loading &&
          orders.map((order) => {
            const isReviewRequired = order.status === 'review_required';
            const isProcessing = order.status === 'in_production';
            const isDispatched = order.status === 'dispatch_ready' || order.status === 'out_for_delivery';
            const isDelivered = order.status === 'delivered';
            const isCancelled = order.status === 'cancelled';

            const payment = order.payments?.[0];

            return (
              <article
                key={order.id}
                style={{
                  ...styles.orderCard,
                  borderColor: isReviewRequired ? 'rgba(126, 84, 79, 0.4)' : '#d4c3bf',
                  borderWidth: isReviewRequired ? '2px' : '1px',
                }}
              >
                {/* Header */}
                <div style={styles.orderCardHeader}>
                  <div>
                    <span style={styles.cardInvoiceNumber}>{order.invoice_number}</span>
                    <span style={styles.cardPlacedTime}>
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div style={styles.statusBadgeGroup}>
                    {isReviewRequired && (
                      <span style={styles.reviewPill}>Review Required</span>
                    )}
                    {isProcessing && (
                      <span style={styles.processingPill}>Processing (In Craft)</span>
                    )}
                    {isDispatched && (
                      <span style={styles.dispatchedPill}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                          local_shipping
                        </span>
                        <span>Dispatched</span>
                      </span>
                    )}
                    {isDelivered && (
                      <span style={styles.deliveredPill}>Delivered ✓</span>
                    )}
                    {isCancelled && (
                      <span style={styles.cancelledPill}>Cancelled</span>
                    )}

                    <span style={styles.advanceStatusBadge}>
                      {order.advance_status === 'verified'
                        ? 'Advance Verified ✓'
                        : order.advance_status === 'rejected'
                        ? 'Advance Rejected'
                        : 'Advance Pending'}
                    </span>
                  </div>
                </div>

                {/* Customer Metadata */}
                <div style={styles.cardCustomerRow}>
                  <div>
                    <div style={styles.cardCustomerName}>{order.customer?.name}</div>
                    <div style={styles.cardCustomerPhone}>
                      {order.customer?.phone} • {order.customer?.area || 'Dhaka'}
                    </div>
                  </div>
                  <div style={styles.quickContactCluster}>
                    <a
                      href={`tel:${order.customer?.phone}`}
                      style={styles.quickCallIconBtn}
                      title="Direct Phone Call"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        call
                      </span>
                    </a>
                    <a
                      href={`https://wa.me/${order.customer?.phone?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.quickCallIconBtn}
                      title="WhatsApp Chat"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        chat
                      </span>
                    </a>
                  </div>
                </div>

                {/* Items Summary */}
                <div style={styles.cardItemsSection}>
                  {order.items?.map((item, idx) => (
                    <div key={item.id || idx} style={styles.cardItemRow}>
                      <div style={styles.itemTitleLine}>
                        <span style={styles.cardItemName}>{item.product_name_snapshot}</span>
                        <span style={styles.cardItemSubtotal}>
                          ৳ {(item.subtotal || item.unit_price * item.quantity).toLocaleString()}
                        </span>
                      </div>

                      {item.selected_size && (
                        <p style={styles.itemDetailNote}>Size: {item.selected_size}</p>
                      )}
                      {(item.cake_weight || item.cake_flavor || item.cake_message) && (
                        <p style={styles.itemDetailNote}>
                          {item.cake_weight && `Weight: ${item.cake_weight} • `}
                          {item.cake_flavor && `Flavor: ${item.cake_flavor} • `}
                          {item.cake_message && `Lettering: "${item.cake_message}"`}
                        </p>
                      )}
                    </div>
                  ))}

                  <div style={styles.handoverScheduleBadge}>
                    <span>
                      Delivery: {order.delivery_date} ({order.delivery_time || 'Morning 10 AM'})
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                        ac_unit
                      </span>
                      <span>Chilled Courier</span>
                    </span>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div style={styles.cardFinanceBox}>
                  <div style={styles.financeLine}>
                    <span style={styles.financeLineLabel}>Total Invoice</span>
                    <span style={styles.financeLineTotal}>৳ {order.total_amount.toLocaleString()}</span>
                  </div>
                  <div style={styles.financeLineBorder}>
                    <span style={styles.financeLineLabel}>Advance Payment</span>
                    <span style={{ fontWeight: 600, color: '#7e544f' }}>
                      ৳ {order.advance_amount.toLocaleString()}
                      {payment?.trx_id && (
                        <span style={styles.trxPillInFinance}>
                          (TrxID: {payment.trx_id} • From: {payment.sender_last4})
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={styles.financeLineBorder}>
                    <span style={styles.financeLineLabel}>Cash on Delivery Due</span>
                    <span style={styles.financeLineDue}>৳ {order.cash_due.toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div style={styles.cardActionFooter}>
                  {isReviewRequired && payment?.trx_id && (
                    <button
                      type="button"
                      onClick={() => quickCheckBkash(payment.trx_id)}
                      style={styles.cardPrimaryActionBtn}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        search_check
                      </span>
                      <span>Check bKash</span>
                    </button>
                  )}

                  {isDispatched && (
                    <button
                      type="button"
                      onClick={async () => {
                        await ordersService.updateOrderStatus(order.id, 'delivered', 'Marked delivered at doorstep.');
                        showToast(`Order ${order.invoice_number} marked Delivered.`);
                        loadOrders();
                      }}
                      style={styles.cardPrimaryActionBtn}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        check_circle
                      </span>
                      <span>Mark Delivered</span>
                    </button>
                  )}

                  {!isReviewRequired && !isDispatched && (
                    <button
                      type="button"
                      onClick={() => openOrderDrawer(order)}
                      style={styles.cardPrimaryActionBtn}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        inventory_2
                      </span>
                      <span>View Docket</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openDeliverySlip(order)}
                    style={styles.cardOutlineActionBtn}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      print
                    </span>
                    <span>Slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openOrderDrawer(order)}
                    style={styles.cardDetailsActionBtn}
                  >
                    Details
                  </button>
                </div>
              </article>
            );
          })}
      </section>

      {/* ===================================================================== */}
      {/* 5. EXPANDED ORDER OPERATIONAL DOCKET (DRAWER / MODAL)                 */}
      {/* ===================================================================== */}
      {drawerOpen && selectedOrder && (
        <div style={styles.drawerBackdrop} onClick={closeOrderDrawer}>
          <div style={styles.drawerCard} onClick={(e) => e.stopPropagation()}>
            {/* Drawer Handle */}
            <div style={styles.drawerHandleBar} />

            <div style={styles.drawerHeaderRow}>
              <div>
                <span style={styles.drawerSubHeading}>Operational Docket</span>
                <h3 style={styles.drawerInvoiceTitle}>{selectedOrder.invoice_number}</h3>
              </div>
              <button
                type="button"
                onClick={closeOrderDrawer}
                style={styles.drawerCloseBtn}
                aria-label="Close Docket"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  close
                </span>
              </button>
            </div>

            {/* Recipient Details */}
            <div style={styles.drawerCustomerCard}>
              <div style={styles.drawerDetailRow}>
                <span style={styles.drawerLabel}>Recipient:</span>
                <strong style={styles.drawerVal}>
                  {selectedOrder.customer?.name} ({selectedOrder.customer?.phone})
                </strong>
              </div>
              <div style={styles.drawerDetailRow}>
                <span style={styles.drawerLabel}>Delivery Address:</span>
                <span style={styles.drawerVal}>{selectedOrder.delivery_address}</span>
              </div>
              <div style={styles.drawerDetailRow}>
                <span style={styles.drawerLabel}>Required Handover:</span>
                <strong style={{ color: '#7e544f' }}>
                  {selectedOrder.delivery_date} ({selectedOrder.delivery_time || 'Morning Transport'})
                </strong>
              </div>
            </div>

            {/* Status Pipeline Step Buttons */}
            <div>
              <label style={styles.pipelineHeading}>Status Transition Pipeline</label>
              <div style={styles.pipelineGrid}>
                {[
                  { key: 'review_required', label: '1. Placed' },
                  { key: 'advance_verified', label: '2. Confirmed ✓' },
                  { key: 'in_production', label: '3. Processing' },
                  { key: 'out_for_delivery', label: '4. Dispatched' },
                  { key: 'delivered', label: '5. Delivered & Closed' },
                ].map((st) => {
                  const isActive = selectedOrder.status === st.key;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleTransitionStatus(st.key as OrderStatus)}
                      style={{
                        ...styles.pipelineBtn,
                        backgroundColor: isActive ? '#5c3e36' : '#ffffff',
                        color: isActive ? '#ffffff' : '#432821',
                        borderColor: isActive ? '#5c3e36' : '#d4c3bf',
                        fontWeight: isActive ? 700 : 500,
                      }}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Operational Exceptions Actions */}
            <div style={styles.exceptionCard}>
              <span style={styles.exceptionTitle}>Operational Exceptions & Actions:</span>
              <div style={styles.exceptionBtnRow}>
                <button
                  type="button"
                  onClick={() => handleTransitionStatus('unable_to_reach' as OrderStatus)}
                  style={styles.exceptionBtn}
                >
                  Unable to Reach
                </button>
                <button
                  type="button"
                  onClick={() => handleTransitionStatus('returned' as OrderStatus)}
                  style={styles.exceptionBtn}
                >
                  Mark Returned
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to cancel order ${selectedOrder.invoice_number}?`)) {
                      handleTransitionStatus('cancelled');
                    }
                  }}
                  style={styles.cancelOrderBtn}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    warning
                  </span>
                  <span>Cancel Order</span>
                </button>
              </div>
            </div>

            {/* Audit Log / History Trail */}
            <div>
              <h4 style={styles.auditTrailHeading}>Audit Trail & Timeline</h4>
              <div style={styles.auditList}>
                {(selectedOrder.history || []).map((h, idx) => (
                  <div key={h.id || idx} style={styles.auditItem}>
                    <span style={styles.auditDot} />
                    <span style={styles.auditTime}>
                      {new Date(h.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <p style={styles.auditNote}>{h.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Note input before status change */}
            <div>
              <label style={styles.auditNoteLabel}>Add Audit Note for Status Update:</label>
              <input
                type="text"
                value={auditNote}
                onChange={(e) => setAuditNote(e.target.value)}
                placeholder="e.g. Linen cutting started / bKash confirmed / van dispatched"
                style={styles.auditNoteInput}
              />
            </div>

            {/* Bottom Actions */}
            <div style={styles.drawerBottomActions}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={`https://wa.me/${selectedOrder.customer?.phone?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.drawerWhatsappBtn}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    chat
                  </span>
                  <span>WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    closeOrderDrawer();
                    openDeliverySlip(selectedOrder);
                  }}
                  style={styles.drawerDocketBtn}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    print
                  </span>
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. PRINTABLE DELIVERY SLIP MODAL (Stitch eff127744bbb4242b88d7b6ed55e765e) */}
      {/* ===================================================================== */}
      {slipModalOpen && slipOrder && (
        <div style={styles.slipBackdrop} onClick={() => setSlipModalOpen(false)}>
          <div style={styles.slipCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.slipHeader}>
              <div>
                <h2 style={styles.slipBrandTitle}>Ababil’s Attire</h2>
                <p style={styles.slipBrandSub}>Handmade Dresses & Homemade Cakes by Sanjida Bethi</p>
                <p style={styles.slipAtelierDhaka}>Banani Studio, Dhaka • +880 1712-345678</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={styles.slipInvoiceCode}>{slipOrder.invoice_number}</span>
                <span style={styles.slipDateText}>
                  Date: {new Date(slipOrder.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <hr style={styles.slipDivider} />

            <div style={styles.slipRecipientBox}>
              <strong>Deliver To:</strong>
              <div>{slipOrder.customer?.name}</div>
              <div>{slipOrder.delivery_address}</div>
              <div>Phone: {slipOrder.customer?.phone}</div>
              <div>Delivery Target: {slipOrder.delivery_date} ({slipOrder.delivery_time})</div>
            </div>

            <table style={styles.slipTable}>
              <thead>
                <tr style={styles.slipTableHeaderRow}>
                  <th style={styles.slipTh}>Item Description</th>
                  <th style={styles.slipTh}>Qty</th>
                  <th style={styles.slipTh}>Unit Price</th>
                  <th style={styles.slipTh}>Total</th>
                </tr>
              </thead>
              <tbody>
                {slipOrder.items?.map((it, idx) => (
                  <tr key={idx} style={styles.slipTableRow}>
                    <td style={styles.slipTd}>
                      <strong>{it.product_name_snapshot}</strong>
                      {it.selected_size && <div>Size: {it.selected_size}</div>}
                      {it.cake_weight && <div>Weight: {it.cake_weight}</div>}
                      {it.cake_flavor && <div>Flavor: {it.cake_flavor}</div>}
                      {it.cake_message && <div>Message: "{it.cake_message}"</div>}
                    </td>
                    <td style={styles.slipTd}>{it.quantity}</td>
                    <td style={styles.slipTd}>৳ {it.unit_price.toLocaleString()}</td>
                    <td style={styles.slipTd}>৳ {(it.subtotal || it.unit_price * it.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.slipTotalsGrid}>
              <div style={styles.slipSignatureBox}>
                <div style={styles.slipSignLine} />
                <span style={styles.slipSignLabel}>Artisan / Studio Lead Sign-off</span>
              </div>
              <div style={styles.slipTotalsBox}>
                <div>Subtotal: ৳ {slipOrder.subtotal.toLocaleString()}</div>
                <div>Delivery: ৳ {slipOrder.delivery_charge.toLocaleString()}</div>
                <div>Total: ৳ {slipOrder.total_amount.toLocaleString()}</div>
                <div style={{ color: '#065f46' }}>Advance Paid (bKash): - ৳ {slipOrder.advance_amount.toLocaleString()}</div>
                <strong style={styles.slipDueToCollect}>
                  CASH TO COLLECT: ৳ {slipOrder.cash_due.toLocaleString()}
                </strong>
              </div>
            </div>

            <div style={styles.slipActionRow}>
              <button
                type="button"
                onClick={() => window.print()}
                style={styles.slipPrintBtn}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  print
                </span>
                <span>Print Delivery Slip</span>
              </button>
              <button
                type="button"
                onClick={() => setSlipModalOpen(false)}
                style={styles.slipCloseBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. TOAST NOTIFICATION CONTAINER                                       */}
      {/* ===================================================================== */}
      {toastMessage && (
        <div style={styles.toastContainer}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#ffdad6' }}>
            check_circle
          </span>
          <span style={styles.toastText}>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={styles.toastCloseBtn}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              close
            </span>
          </button>
        </div>
      )}

      {/* Manual Order Creation Modal */}
      <ManualOrderModal
        isOpen={showManualOrderModal}
        onClose={() => setShowManualOrderModal(false)}
        onOrderCreated={(order) => {
          showToast(`Manual order ${order.invoice_number} created successfully.`);
          loadOrders();
        }}
      />
    </div>
  );
};

// =============================================================================
// CSS STYLES (Mirrors Stitch Screen ac21cdd217164898baab53fe592e4abf)
// =============================================================================
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '540px',
    margin: '0 auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '8px',
    paddingTop: '4px',
  },
  titleBadgeCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pageTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '24px',
    fontWeight: 500,
    color: '#432821',
    margin: 0,
    lineHeight: 1.2,
  },
  needsReviewPill: {
    backgroundColor: '#eae8e4',
    color: '#504441',
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  pageSubtitle: {
    fontSize: '13px',
    color: '#827470',
    margin: '4px 0 0 0',
  },
  manualOrderBtn: {
    height: '36px',
    padding: '0 14px',
    borderRadius: '9999px',
    border: '1px solid #5c3e36',
    color: '#5c3e36',
    backgroundColor: '#ffffff',
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  /* bKash Matching Section */
  matchingSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid rgba(212, 195, 191, 0.8)',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(92, 62, 54, 0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  matchingGradientBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(to right, rgba(126, 84, 79, 0.4), #5c3e36, rgba(126, 84, 79, 0.3))',
  },
  matchingHeaderRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '6px',
    paddingTop: '4px',
  },
  matchingHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  matchingIconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 218, 214, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  matchingTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#432821',
    margin: 0,
    lineHeight: 1.2,
  },
  matchingSubtitle: {
    fontSize: '11px',
    color: '#827470',
    fontWeight: 500,
  },
  strictPolicyBadge: {
    backgroundColor: 'rgba(126, 84, 79, 0.15)',
    color: '#432821',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(126, 84, 79, 0.2)',
  },
  matchingDescription: {
    fontSize: '12px',
    color: '#504441',
    lineHeight: 1.5,
    margin: '0 0 12px 0',
  },
  matchingForm: {
    marginBottom: '12px',
  },
  matchingLabel: {
    display: 'block',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#827470',
    fontWeight: 600,
    marginBottom: '6px',
  },
  matchingInputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  inputWithIconWrapper: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  pasteIcon: {
    position: 'absolute',
    left: '10px',
    color: '#827470',
    fontSize: '18px',
    pointerEvents: 'none',
  },
  trxInput: {
    width: '100%',
    height: '44px',
    padding: '0 12px 0 36px',
    borderRadius: '8px',
    border: '1.5px solid #d4c3bf',
    fontSize: '13px',
    fontWeight: 600,
    color: '#432821',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    outline: 'none',
  },
  findOrderBtn: {
    height: '44px',
    padding: '0 16px',
    borderRadius: '8px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  /* Matching Results Box */
  matchingResultCard: {
    backgroundColor: 'rgba(245, 243, 239, 0.7)',
    border: '1px solid rgba(212, 195, 191, 0.8)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
  },
  matchingResultHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(212, 195, 191, 0.5)',
    paddingBottom: '8px',
    marginBottom: '8px',
  },
  matchingStateIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  pulseIndicatorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  matchingStateText: {
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  invoiceNumberPill: {
    fontSize: '11px',
    color: '#827470',
    fontWeight: 500,
  },
  matchingErrorMessage: {
    fontSize: '12px',
    color: '#ba1a1a',
    margin: '4px 0 8px 0',
  },
  matchedDetailsGridWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  matchedCustomerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchedCustomerName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#432821',
    display: 'block',
  },
  matchedCustomerMeta: {
    fontSize: '11px',
    color: '#827470',
  },
  matchedProductPill: {
    fontSize: '10px',
    backgroundColor: '#efeeea',
    color: '#432821',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(212, 195, 191, 0.6)',
    textTransform: 'uppercase',
  },
  matchedMetricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    backgroundColor: '#ffffff',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid rgba(212, 195, 191, 0.5)',
  },
  metricCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metricLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#827470',
    fontWeight: 600,
  },
  metricValue: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#432821',
  },
  metricSpanRow: {
    gridColumn: 'span 2',
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid rgba(212, 195, 191, 0.4)',
    paddingTop: '6px',
    fontSize: '12px',
  },
  matchingActionsRow: {
    display: 'flex',
    gap: '8px',
    paddingTop: '4px',
  },
  confirmAdvanceBtn: {
    flex: 1,
    minHeight: '40px',
    borderRadius: '9999px',
    backgroundColor: '#432821',
    color: '#ffffff',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  flagMismatchBtn: {
    minHeight: '40px',
    padding: '0 14px',
    borderRadius: '9999px',
    border: '1px solid #7e544f',
    color: '#7e544f',
    backgroundColor: '#ffffff',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  /* Simulation Area */
  simulationContainer: {
    marginTop: '12px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(212, 195, 191, 0.4)',
  },
  simulationHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  simLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#827470',
    fontWeight: 600,
  },
  simHint: {
    fontSize: '10px',
    color: '#827470',
    fontStyle: 'italic',
  },
  simButtonsRow: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  simPillActive: {
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '10px',
    fontWeight: 600,
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  simPill: {
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '10px',
    fontWeight: 500,
    backgroundColor: '#efeeea',
    color: '#504441',
    border: '1px solid #d4c3bf',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  /* Filter Section */
  filterSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '10px',
    color: '#827470',
    fontSize: '18px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    height: '42px',
    padding: '0 12px 0 34px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(212, 195, 191, 0.8)',
    fontSize: '13px',
    color: '#1b1c1a',
    outline: 'none',
  },
  statusChipsRow: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    paddingBottom: '2px',
  },
  chipBtn: {
    padding: '6px 12px',
    borderRadius: '9999px',
    fontSize: '11px',
    border: '1px solid',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  chipDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#7e544f',
  },
  secondaryFilterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  categorySelect: {
    flex: 1,
    height: '36px',
    borderRadius: '6px',
    backgroundColor: '#f5f3ef',
    border: '1px solid rgba(212, 195, 191, 0.7)',
    fontSize: '11px',
    color: '#432821',
    padding: '0 8px',
    outline: 'none',
  },
  scheduleFilterBox: {
    flex: 1,
    height: '36px',
    borderRadius: '6px',
    backgroundColor: '#f5f3ef',
    border: '1px solid rgba(212, 195, 191, 0.7)',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 10px',
  },

  /* Order Cards */
  orderCardsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '40px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '40px 16px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #d4c3bf',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '14px',
    boxShadow: '0 2px 8px rgba(92, 62, 54, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  orderCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(212, 195, 191, 0.4)',
    paddingBottom: '10px',
  },
  cardInvoiceNumber: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#432821',
    letterSpacing: '0.02em',
    display: 'block',
  },
  cardPlacedTime: {
    fontSize: '11px',
    color: '#827470',
    marginTop: '2px',
    display: 'block',
  },
  statusBadgeGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  reviewPill: {
    backgroundColor: 'rgba(255, 218, 214, 0.5)',
    color: '#7e544f',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    border: '1px solid rgba(126, 84, 79, 0.3)',
  },
  processingPill: {
    backgroundColor: '#eae8e4',
    color: '#432821',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  dispatchedPill: {
    backgroundColor: 'rgba(67, 40, 33, 0.1)',
    color: '#432821',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  deliveredPill: {
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  cancelledPill: {
    backgroundColor: '#fef2f2',
    color: '#ba1a1a',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  advanceStatusBadge: {
    backgroundColor: '#efeeea',
    color: '#504441',
    fontSize: '10px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '4px',
  },
  cardCustomerRow: {
    backgroundColor: 'rgba(245, 243, 239, 0.5)',
    borderRadius: '8px',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid rgba(212, 195, 191, 0.4)',
  },
  cardCustomerName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#432821',
  },
  cardCustomerPhone: {
    fontSize: '11px',
    color: '#827470',
  },
  quickContactCluster: {
    display: 'flex',
    gap: '6px',
  },
  quickCallIconBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#efeeea',
    border: '1px solid #d4c3bf',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#432821',
    textDecoration: 'none',
  },
  cardItemsSection: {
    borderLeft: '2px solid rgba(126, 84, 79, 0.4)',
    paddingLeft: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  cardItemRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemTitleLine: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    fontWeight: 600,
    color: '#432821',
  },
  cardItemName: {
    fontSize: '12px',
    color: '#432821',
  },
  cardItemSubtotal: {
    fontWeight: 700,
    color: '#5c3e36',
  },
  itemDetailNote: {
    fontSize: '11px',
    color: '#827470',
    margin: 0,
  },
  handoverScheduleBadge: {
    marginTop: '4px',
    fontSize: '11px',
    color: '#7e544f',
    backgroundColor: 'rgba(245, 243, 239, 0.7)',
    padding: '4px 8px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontWeight: 600,
  },
  cardFinanceBox: {
    backgroundColor: '#f5f3ef',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    border: '1px solid rgba(212, 195, 191, 0.4)',
  },
  financeLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financeLineBorder: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(212, 195, 191, 0.3)',
    paddingTop: '4px',
  },
  financeLineLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#827470',
    fontWeight: 600,
  },
  financeLineTotal: {
    fontWeight: 700,
    color: '#432821',
    fontSize: '13px',
  },
  trxPillInFinance: {
    fontSize: '10px',
    color: '#827470',
    marginLeft: '4px',
  },
  financeLineDue: {
    fontWeight: 700,
    color: '#432821',
    fontSize: '13px',
  },
  cardActionFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingTop: '4px',
  },
  cardPrimaryActionBtn: {
    flex: 1,
    minHeight: '40px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  cardOutlineActionBtn: {
    minHeight: '40px',
    padding: '0 14px',
    borderRadius: '9999px',
    border: '1px solid #d4c3bf',
    color: '#432821',
    backgroundColor: '#ffffff',
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
  },
  cardDetailsActionBtn: {
    minHeight: '40px',
    padding: '0 16px',
    borderRadius: '9999px',
    border: '1px solid #5c3e36',
    color: '#5c3e36',
    backgroundColor: 'transparent',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  /* Drawer Modal */
  drawerBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    backgroundColor: 'rgba(67, 40, 33, 0.4)',
    backdropFilter: 'blur(2px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  drawerCard: {
    backgroundColor: '#fbf9f5',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    borderTop: '1px solid #d4c3bf',
    maxHeight: '85vh',
    overflowY: 'auto',
    maxWidth: '540px',
    width: '100%',
    margin: '0 auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
  },
  drawerHandleBar: {
    width: '40px',
    height: '4px',
    borderRadius: '9999px',
    backgroundColor: '#d4c3bf',
    margin: '0 auto 6px auto',
  },
  drawerHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerSubHeading: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#827470',
    display: 'block',
  },
  drawerInvoiceTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '19px',
    fontWeight: 600,
    color: '#432821',
    margin: 0,
  },
  drawerCloseBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#efeeea',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#827470',
  },
  drawerCustomerCard: {
    backgroundColor: '#f5f3ef',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  drawerDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
  },
  drawerLabel: {
    color: '#827470',
  },
  drawerVal: {
    color: '#432821',
    textAlign: 'right',
  },
  pipelineHeading: {
    display: 'block',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#827470',
    fontWeight: 600,
    marginBottom: '8px',
  },
  pipelineGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
  },
  pipelineBtn: {
    padding: '8px 4px',
    borderRadius: '6px',
    fontSize: '11px',
    border: '1px solid',
    cursor: 'pointer',
    textAlign: 'center',
  },
  exceptionCard: {
    backgroundColor: '#ffffff',
    border: '1px solid rgba(212, 195, 191, 0.6)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  exceptionTitle: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#827470',
    fontWeight: 600,
  },
  exceptionBtnRow: {
    display: 'flex',
    gap: '6px',
  },
  exceptionBtn: {
    flex: 1,
    minHeight: '36px',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #d4c3bf',
    color: '#827470',
    backgroundColor: '#ffffff',
    fontSize: '11px',
    cursor: 'pointer',
  },
  cancelOrderBtn: {
    flex: 1,
    minHeight: '36px',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1.5px solid rgba(186, 26, 26, 0.5)',
    color: '#ba1a1a',
    backgroundColor: '#ffffff',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  auditTrailHeading: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#827470',
    fontWeight: 600,
    margin: '0 0 8px 0',
  },
  auditList: {
    borderLeft: '2px solid #d4c3bf',
    marginLeft: '8px',
    paddingLeft: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '11px',
  },
  auditItem: {
    position: 'relative',
  },
  auditDot: {
    position: 'absolute',
    left: '-17px',
    top: '4px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#5c3e36',
  },
  auditTime: {
    color: '#827470',
    display: 'block',
    fontSize: '10px',
  },
  auditNote: {
    color: '#432821',
    fontWeight: 500,
    margin: '2px 0 0 0',
  },
  auditNoteLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#827470',
    marginBottom: '4px',
  },
  auditNoteInput: {
    width: '100%',
    height: '38px',
    padding: '0 10px',
    borderRadius: '6px',
    border: '1px solid #d4c3bf',
    fontSize: '12px',
    color: '#432821',
    outline: 'none',
  },
  drawerBottomActions: {
    paddingTop: '8px',
    borderTop: '1px solid #d4c3bf',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  drawerWhatsappBtn: {
    flex: 1,
    height: '40px',
    borderRadius: '9999px',
    border: '1px solid #5c3e36',
    color: '#5c3e36',
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    textDecoration: 'none',
  },
  drawerDocketBtn: {
    flex: 1,
    height: '40px',
    borderRadius: '9999px',
    border: '1px solid #5c3e36',
    color: '#5c3e36',
    backgroundColor: 'transparent',
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
  },

  /* Delivery Slip Modal */
  slipBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  slipCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '24px',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
  },
  slipHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  slipBrandTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '22px',
    color: '#5c3e36',
    margin: 0,
  },
  slipBrandSub: {
    fontSize: '12px',
    color: '#6f6764',
    margin: '2px 0',
  },
  slipAtelierDhaka: {
    fontSize: '11px',
    color: '#827470',
    margin: 0,
  },
  slipInvoiceCode: {
    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
    fontSize: '16px',
    fontWeight: 700,
    color: '#5c3e36',
    display: 'block',
  },
  slipDateText: {
    fontSize: '11px',
    color: '#827470',
  },
  slipDivider: {
    border: 'none',
    borderTop: '1px solid #ece8e1',
    margin: '16px 0',
  },
  slipRecipientBox: {
    backgroundColor: '#fbf9f5',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '12px',
    lineHeight: 1.5,
    marginBottom: '16px',
  },
  slipTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
    marginBottom: '16px',
  },
  slipTableHeaderRow: {
    backgroundColor: '#f5ede9',
    borderBottom: '1px solid #dfd8ce',
  },
  slipTh: {
    padding: '8px',
    textAlign: 'left',
    color: '#5c3e36',
    fontWeight: 600,
  },
  slipTableRow: {
    borderBottom: '1px solid #f5f3ef',
  },
  slipTd: {
    padding: '8px',
    verticalAlign: 'top',
  },
  slipTotalsGrid: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTop: '1px solid #dfd8ce',
    paddingTop: '16px',
    fontSize: '12px',
  },
  slipSignatureBox: {
    width: '200px',
  },
  slipSignLine: {
    borderBottom: '1px dashed #827470',
    height: '40px',
    marginBottom: '4px',
  },
  slipSignLabel: {
    fontSize: '10px',
    color: '#827470',
  },
  slipTotalsBox: {
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  slipDueToCollect: {
    fontSize: '14px',
    color: '#5c3e36',
    marginTop: '4px',
  },
  slipActionRow: {
    marginTop: '20px',
    display: 'flex',
    gap: '10px',
  },
  slipPrintBtn: {
    flex: 1,
    height: '42px',
    borderRadius: '8px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    border: 'none',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  slipCloseBtn: {
    padding: '0 20px',
    borderRadius: '8px',
    backgroundColor: '#efeeea',
    border: 'none',
    color: '#504441',
    fontWeight: 600,
    cursor: 'pointer',
  },

  /* Toast Notification */
  toastContainer: {
    position: 'fixed',
    bottom: '24px',
    left: '16px',
    right: '16px',
    maxWidth: '430px',
    margin: '0 auto',
    zIndex: 70,
    backgroundColor: '#432821',
    color: '#fbf9f5',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid rgba(255, 218, 214, 0.3)',
  },
  toastText: {
    flex: 1,
    fontSize: '12px',
    fontWeight: 500,
  },
  toastCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
  },
};
