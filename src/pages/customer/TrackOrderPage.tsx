/**
 * Ababil’s Attire by Sanjida Bethi
 * Phase 7: Customer Track Order Page
 * Follows Stitch screen 8bfbf6466c224f7383f40d6cecdc22d3
 *
 * Safe public tracking via invoice number without login.
 * Never exposes customer PII or sensitive payment details.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { trackingService } from '../../services/tracking.service';
import type { OrderTrackingResult } from '../../types';

export const TrackOrderPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const routeParams = useParams<{ invoiceNumber?: string }>();
  const invoiceParam = searchParams.get('invoice') || routeParams.invoiceNumber || '';

  const [inputInvoice, setInputInvoice] = useState(invoiceParam);
  const [activeInvoice, setActiveInvoice] = useState(invoiceParam.trim().toUpperCase());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderTrackingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  // Optional status override for interactive demo preview (as designed in Stitch mockup)
  const [simulatedStatus, setSimulatedStatus] = useState<string | null>(null);

  const normalizeInvoice = (raw: string): string => {
    return raw.trim().toUpperCase().replace(/^#/, '');
  };

  const performLookup = useCallback(async (invoiceToFind: string) => {
    const clean = normalizeInvoice(invoiceToFind);
    if (!clean) {
      setErrorMsg('Please enter an invoice number (e.g. AB-260923-1042)');
      setResult(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSimulatedStatus(null);

    try {
      const res = await trackingService.trackOrderByInvoice(clean);
      if (res.found) {
        setResult(res);
        setActiveInvoice(clean);
      } else {
        setResult(null);
        setErrorMsg(
          res.error || "We couldn't find an order with that number. Please check the number or contact Sanjida directly."
        );
      }
    } catch {
      setResult(null);
      setErrorMsg('Network error connecting to order database. Please verify your connection or try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync on initial mount or when query param changes
  useEffect(() => {
    if (invoiceParam) {
      const clean = normalizeInvoice(invoiceParam);
      setInputInvoice(clean);
      performLookup(clean);
    }
  }, [invoiceParam, performLookup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeInvoice(inputInvoice);
    if (!clean) {
      setErrorMsg('Please enter an invoice number to track.');
      return;
    }
    setSearchParams({ invoice: clean });
    performLookup(clean);
  };

  const handleClear = () => {
    setInputInvoice('');
    setErrorMsg(null);
    setResult(null);
    setSimulatedStatus(null);
    setSearchParams({});
  };

  const handleCopyInvoice = () => {
    const invoiceToCopy = result?.invoice_number || activeInvoice;
    if (!invoiceToCopy) return;
    navigator.clipboard.writeText(invoiceToCopy).then(() => {
      setCopiedInvoice(true);
      setTimeout(() => setCopiedInvoice(false), 2000);
    });
  };

  // Determine active display status (supports simulated status preview)
  const currentStatus: string = (simulatedStatus || result?.status || 'review_required').toLowerCase();

  // Helper for status timeline steps
  // Standard progression: Order Placed (1) -> Confirmed (2) -> Processing (3) -> Dispatched (4) -> Delivered (5)
  const getStepProgress = (status: string) => {
    switch (status) {
      case 'delivered':
        return { activeStep: 5, completed: [1, 2, 3, 4, 5], isException: false };
      case 'out_for_delivery':
      case 'dispatch_ready':
      case 'dispatched':
        return { activeStep: 4, completed: [1, 2, 3], isException: false };
      case 'in_production':
      case 'processing':
        return { activeStep: 3, completed: [1, 2], isException: false };
      case 'advance_verified':
      case 'confirmed':
        return { activeStep: 2, completed: [1], isException: false };
      case 'cancelled':
        return { activeStep: 0, completed: [], isException: true, exceptionType: 'cancelled' };
      case 'returned':
        return { activeStep: 0, completed: [1, 2, 3, 4], isException: true, exceptionType: 'returned' };
      case 'unable_to_reach':
        return { activeStep: 4, completed: [1, 2, 3], isException: true, exceptionType: 'unable_to_reach' };
      case 'review_required':
      default:
        return { activeStep: 1, completed: [], isException: false };
    }
  };

  const stepProgress = getStepProgress(currentStatus);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return {
          label: 'Delivered • Handed Over',
          bg: '#ecfdf5',
          color: '#065f46',
          border: '#a7f3d0',
          dot: '#10b981',
          icon: 'check_circle',
        };
      case 'out_for_delivery':
      case 'dispatch_ready':
      case 'dispatched':
        return {
          label: 'Out for Delivery • In Transit',
          bg: '#eff6ff',
          color: '#1e40af',
          border: '#bfdbfe',
          dot: '#3b82f6',
          icon: 'local_shipping',
        };
      case 'in_production':
      case 'processing':
        return {
          label: 'Being Made • In Production',
          bg: '#fbf5e6',
          color: '#854d0e',
          border: '#fde68a',
          dot: '#eab308',
          icon: 'precision_manufacturing',
        };
      case 'advance_verified':
      case 'confirmed':
        return {
          label: 'Confirmed • Advance Verified',
          bg: '#ecfdf5',
          color: '#065f46',
          border: '#a7f3d0',
          dot: '#10b981',
          icon: 'verified',
        };
      case 'cancelled':
        return {
          label: 'Order Cancelled',
          bg: '#fef2f2',
          color: '#991b1b',
          border: '#fecaca',
          dot: '#ef4444',
          icon: 'cancel',
        };
      case 'returned':
        return {
          label: 'Returned to Studio',
          bg: '#fff7ed',
          color: '#9a3412',
          border: '#fed7aa',
          dot: '#f97316',
          icon: 'assignment_return',
        };
      case 'unable_to_reach':
        return {
          label: 'Unable to Reach Customer',
          bg: '#fefce8',
          color: '#854d0e',
          border: '#fef08a',
          dot: '#eab308',
          icon: 'phone_missed',
        };
      case 'review_required':
      default:
        return {
          label: 'Order Placed • Review Pending',
          bg: '#f5ede9',
          color: '#5c3e36',
          border: '#dfd8ce',
          dot: '#77554c',
          icon: 'hourglass_empty',
        };
    }
  };

  const badgeInfo = getStatusBadge(currentStatus);

  const getStatusNotice = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Your package has been safely hand-delivered at your doorstep. We hope our handmade attire and homemade treats bring joy to your family celebration!';
      case 'out_for_delivery':
      case 'dispatch_ready':
      case 'dispatched':
        return 'Your order is currently with our dedicated delivery rider on van dispatch. Please keep your phone reachable for smooth doorstep handover.';
      case 'in_production':
      case 'processing':
        return 'Sanjida Bethi and our team are handcrafting your handmade dress and preparing your celebration cake fresh in our Banani kitchen.';
      case 'advance_verified':
      case 'confirmed':
        return 'bKash advance payment has been verified. Your items are scheduled for studio production.';
      case 'cancelled':
        return 'This order has been cancelled. If this was unexpected or you require assistance with advance refunds, please reach Sanjida on WhatsApp.';
      case 'returned':
        return 'The delivery courier could not complete handover and the package has returned safely to our Banani studio. Please contact us to arrange redelivery.';
      case 'unable_to_reach':
        return 'Our courier was unable to connect with you at your delivery address or contact number. Please message Sanjida immediately to reschedule.';
      case 'review_required':
      default:
        return 'Your order details and bKash advance information have been received. Sanjida Bethi is reviewing your order specifications at our Dhaka studio.';
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Today';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const whatsappInquiry = encodeURIComponent(
    `Hello Sanjida, I would like to check the status of my order ${activeInvoice || inputInvoice || ''}.`
  );

  return (
    <div style={styles.pageContainer}>
      {/* ===================================================================== */}
      {/* 1. TOP HEADER & BREADCRUMB                                            */}
      {/* ===================================================================== */}
      <div style={styles.breadcrumbBar}>
        <div style={styles.breadcrumbInner}>
          <Link to="/" style={styles.breadcrumbLink}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              storefront
            </span>
            <span>Home</span>
          </Link>
          <span style={styles.breadcrumbDivider}>/</span>
          <span style={styles.breadcrumbCurrent}>Track Order</span>
        </div>
      </div>

      <div style={styles.contentWrapper}>
        {/* ===================================================================== */}
        {/* 2. ORDER SEARCH / LOOKUP HERO CARD                                    */}
        {/* ===================================================================== */}
        <section style={styles.searchCard}>
          <div style={styles.searchHeader}>
            <div style={styles.searchIconBox}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#5c3e36' }}>
                local_shipping
              </span>
            </div>
            <div>
              <h1 style={styles.searchTitle}>Track Your Order</h1>
              <p style={styles.searchSubtitle}>
                Enter your invoice number to view live tailoring and baking progress and delivery logistics.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={styles.searchForm}>
            <div style={styles.inputGroup}>
              <span className="material-symbols-outlined" style={styles.inputIcon}>
                receipt_long
              </span>
              <input
                type="text"
                value={inputInvoice}
                onChange={(e) => setInputInvoice(e.target.value.toUpperCase())}
                placeholder="e.g. AB-260923-1042"
                style={styles.inputField}
                aria-label="Invoice Number"
                autoComplete="off"
                spellCheck={false}
              />
              {inputInvoice && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={styles.clearBtn}
                  aria-label="Clear input"
                  title="Clear"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    close
                  </span>
                </button>
              )}
            </div>

            <button type="submit" disabled={loading} style={styles.trackSubmitBtn}>
              {loading ? (
                <>
                  <span className="material-symbols-outlined spin" style={{ fontSize: '20px' }}>
                    progress_activity
                  </span>
                  <span>Looking up...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    search
                  </span>
                  <span>Track Order</span>
                </>
              )}
            </button>
          </form>

          {/* Quick example hint */}
          <div style={styles.sampleHintRow}>
            <span style={styles.sampleHintLabel}>Try sample invoice:</span>
            <button
              type="button"
              onClick={() => {
                setInputInvoice('AB-260923-1042');
                setSearchParams({ invoice: 'AB-260923-1042' });
                performLookup('AB-260923-1042');
              }}
              style={styles.sampleChip}
            >
              AB-260923-1042
            </button>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 3. ERROR / INVALID INVOICE BANNER                                     */}
        {/* ===================================================================== */}
        {errorMsg && (
          <div style={styles.errorCard} role="alert">
            <div style={styles.errorIconCircle}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#991b1b' }}>
                error_outline
              </span>
            </div>
            <div style={styles.errorContent}>
              <h3 style={styles.errorTitle}>Order Lookup Failed</h3>
              <p style={styles.errorDescription}>{errorMsg}</p>
              <div style={styles.errorActionRow}>
                <a
                  href={`https://wa.me/8801712345678?text=${whatsappInquiry}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.errorWhatsappBtn}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    chat
                  </span>
                  <span>Message Sanjida on WhatsApp</span>
                </a>
                <a href="tel:+8801712345678" style={styles.errorCallLink}>
                  or call +880 1712-345678
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 4. LOADING STATE                                                      */}
        {/* ===================================================================== */}
        {loading && (
          <div style={styles.loadingCard}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Retrieving order records for {inputInvoice}...</p>
            <span style={styles.loadingSubtext}>Connecting to order database</span>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 5. SUCCESS RESULT CANVAS                                              */}
        {/* ===================================================================== */}
        {result && !loading && (
          <div style={styles.resultContainer}>
            {/* Interactive Preview Bar (Designed in Stitch for demo inspection) */}
            <div style={styles.simulationBar}>
              <div style={styles.simulationHeader}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#77554c' }}>
                  tune
                </span>
                <span style={styles.simulationTitle}>Preview Lifecycle States:</span>
              </div>
              <div style={styles.simulationButtons}>
                {[
                  { label: 'Placed', status: 'review_required' },
                  { label: 'Confirmed', status: 'advance_verified' },
                  { label: 'Being Made', status: 'in_production' },
                  { label: 'Dispatched', status: 'out_for_delivery' },
                  { label: 'Delivered', status: 'delivered' },
                  { label: 'Cancelled', status: 'cancelled' },
                  { label: 'Returned', status: 'returned' },
                  { label: 'Unable to Reach', status: 'unable_to_reach' },
                ].map((st) => (
                  <button
                    key={st.status}
                    type="button"
                    onClick={() => setSimulatedStatus(st.status)}
                    style={{
                      ...styles.simBtn,
                      backgroundColor:
                        currentStatus === st.status ? '#5c3e36' : '#ffffff',
                      color: currentStatus === st.status ? '#ffffff' : '#5c3e36',
                      borderColor:
                        currentStatus === st.status ? '#5c3e36' : '#dfd8ce',
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE STATUS BANNER */}
            <div style={styles.statusBannerCard}>
              <div style={styles.statusBannerTopRow}>
                <div>
                  <span style={styles.invoiceSmallLabel}>Invoice Reference</span>
                  <div style={styles.invoiceNumberRow}>
                    <h2 style={styles.invoiceDisplayCode}>{result.invoice_number}</h2>
                    <button
                      type="button"
                      onClick={handleCopyInvoice}
                      style={styles.copyCodeBtn}
                      title="Copy Invoice"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                        {copiedInvoice ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedInvoice ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: badgeInfo.bg,
                    color: badgeInfo.color,
                    borderColor: badgeInfo.border,
                  }}
                >
                  <span
                    style={{
                      ...styles.pulseDot,
                      backgroundColor: badgeInfo.dot,
                    }}
                  />
                  <span>{badgeInfo.label}</span>
                </div>
              </div>

              {/* Status Note explanation */}
              <div style={styles.atelierNoticeBox}>
                <div style={styles.noticeHeaderRow}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#5c3e36' }}>
                    storefront
                  </span>
                  <strong style={styles.noticeHeading}>Order Update</strong>
                </div>
                <p style={styles.noticeText}>{getStatusNotice(currentStatus)}</p>
              </div>
            </div>

            {/* STATUS TIMELINE (5-STAGE PROGRESSION) */}
            <div style={styles.timelineCard}>
              <div style={styles.sectionHeader}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36' }}>
                  timeline
                </span>
                <h3 style={styles.sectionTitle}>Fulfillment Progress</h3>
              </div>

              {/* Exception Alert if Order is Cancelled, Returned, or Unable to Reach */}
              {stepProgress.isException && (
                <div
                  style={{
                    ...styles.exceptionAlert,
                    backgroundColor:
                      stepProgress.exceptionType === 'cancelled'
                        ? '#fef2f2'
                        : stepProgress.exceptionType === 'returned'
                        ? '#fff7ed'
                        : '#fefce8',
                    borderColor:
                      stepProgress.exceptionType === 'cancelled'
                        ? '#fecaca'
                        : stepProgress.exceptionType === 'returned'
                        ? '#fed7aa'
                        : '#fef08a',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '22px',
                      color:
                        stepProgress.exceptionType === 'cancelled'
                          ? '#991b1b'
                          : stepProgress.exceptionType === 'returned'
                          ? '#9a3412'
                          : '#854d0e',
                    }}
                  >
                    {stepProgress.exceptionType === 'cancelled'
                      ? 'highlight_off'
                      : stepProgress.exceptionType === 'returned'
                      ? 'keyboard_return'
                      : 'contact_phone'}
                  </span>
                  <div>
                    <h4
                      style={{
                        ...styles.exceptionAlertTitle,
                        color:
                          stepProgress.exceptionType === 'cancelled'
                            ? '#991b1b'
                            : stepProgress.exceptionType === 'returned'
                            ? '#9a3412'
                            : '#854d0e',
                      }}
                    >
                      {stepProgress.exceptionType === 'cancelled'
                        ? 'Order Processing Cancelled'
                        : stepProgress.exceptionType === 'returned'
                        ? 'Package Returned to Dhaka Studio'
                        : 'Delivery Courier Could Not Reach You'}
                    </h4>
                    <p style={styles.exceptionAlertBody}>
                      {stepProgress.exceptionType === 'cancelled'
                        ? 'This order has been voided. Any pending refunds are handled directly by Sanjida Bethi.'
                        : stepProgress.exceptionType === 'returned'
                        ? 'Our van returned the parcel to Banani studio. Contact us to schedule redelivery.'
                        : 'Please verify your phone number and delivery location with our concierge on WhatsApp.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Vertical Stepper */}
              <div style={styles.stepperContainer}>
                {[
                  {
                    stepNum: 1,
                    title: 'Order Placed',
                    desc: 'Order received at Ababil’s Attire with bKash advance info.',
                    icon: 'assignment_turned_in',
                    time: formatDate(result.created_at),
                  },
                  {
                    stepNum: 2,
                    title: 'Confirmed',
                    desc: 'bKash advance deposit of ৳500 verified by Sanjida Bethi.',
                    icon: 'verified',
                    time: stepProgress.completed.includes(1) ? 'Advance Verified' : 'Awaiting review',
                  },
                  {
                    stepNum: 3,
                    title: 'Processing',
                    desc: 'Tailoring smocked dress details & baking fresh homemade cakes.',
                    icon: 'cut',
                    time:
                      stepProgress.activeStep === 3
                        ? 'Active in Studio'
                        : stepProgress.completed.includes(2)
                        ? 'Completed'
                        : 'Scheduled next',
                  },
                  {
                    stepNum: 4,
                    title: 'Dispatched',
                    desc: 'Chilled private direct courier transit across Dhaka metropolitan.',
                    icon: 'local_shipping',
                    time:
                      stepProgress.activeStep === 4
                        ? 'Out for delivery'
                        : stepProgress.completed.includes(3)
                        ? 'Dispatched'
                        : 'Pending packaging',
                  },
                  {
                    stepNum: 5,
                    title: 'Delivered',
                    desc: 'Direct gentle handover at your doorstep with Cash on Delivery balance.',
                    icon: 'task_alt',
                    time:
                      stepProgress.activeStep === 5
                        ? 'Delivered safely'
                        : `Target: ${formatDate(result.delivery_date)}`,
                  },
                ].map((step, idx) => {
                  const isDone = stepProgress.completed.includes(step.stepNum);
                  const isCurrent =
                    !stepProgress.isException && stepProgress.activeStep === step.stepNum;
                  const isPending = !isDone && !isCurrent;

                  return (
                    <div key={step.stepNum} style={styles.stepRow}>
                      {/* Left icon circle & vertical line */}
                      <div style={styles.stepIndicatorCol}>
                        <div
                          style={{
                            ...styles.stepNode,
                            backgroundColor: isDone
                              ? '#5c3e36'
                              : isCurrent
                              ? '#ffffff'
                              : '#f5f3ef',
                            borderColor: isDone
                              ? '#5c3e36'
                              : isCurrent
                              ? '#5c3e36'
                              : '#dfd8ce',
                            color: isDone
                              ? '#ffffff'
                              : isCurrent
                              ? '#5c3e36'
                              : '#988e8a',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            {isDone ? 'check' : step.icon}
                          </span>
                        </div>
                        {idx < 4 && (
                          <div
                            style={{
                              ...styles.stepLine,
                              backgroundColor: isDone ? '#5c3e36' : '#dfd8ce',
                            }}
                          />
                        )}
                      </div>

                      {/* Right step details */}
                      <div
                        style={{
                          ...styles.stepContentBox,
                          opacity: isPending ? 0.75 : 1,
                        }}
                      >
                        <div style={styles.stepHeaderRow}>
                          <div style={styles.stepTitleCluster}>
                            <h4
                              style={{
                                ...styles.stepTitle,
                                color: isCurrent ? '#5c3e36' : isDone ? '#2d2421' : '#6f6764',
                                fontWeight: isCurrent ? 700 : 600,
                              }}
                            >
                              {step.title}
                            </h4>
                            {isCurrent && (
                              <span style={styles.activeStepTag}>Current Status</span>
                            )}
                          </div>
                          <span style={styles.stepTimeBadge}>{step.time}</span>
                        </div>
                        <p style={styles.stepDesc}>{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LOGISTICS & SCHEDULE DELIVERY SUMMARY */}
            <div style={styles.detailsGrid}>
              <div style={styles.detailCard}>
                <div style={styles.detailHeader}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#5c3e36' }}>
                    person
                  </span>
                  <span style={styles.detailHeading}>Recipient</span>
                </div>
                <p style={styles.detailMainText}>{result.customer_name_initial || 'Valued Customer'}</p>
                <p style={styles.detailSubText}>Dhaka, Bangladesh</p>
              </div>

              <div style={styles.detailCard}>
                <div style={styles.detailHeader}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#5c3e36' }}>
                    location_on
                  </span>
                  <span style={styles.detailHeading}>Delivery Destination</span>
                </div>
                <p style={styles.detailMainText}>{result.delivery_area || 'Dhaka Metropolitan'}</p>
                <p style={styles.detailSubText}>Standard Direct Van Courier</p>
              </div>

              <div style={styles.detailCard}>
                <div style={styles.detailHeader}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#5c3e36' }}>
                    calendar_month
                  </span>
                  <span style={styles.detailHeading}>Expected Delivery Date</span>
                </div>
                <p style={styles.detailMainText}>{formatDate(result.delivery_date)}</p>
                <p style={styles.detailSubText}>{result.delivery_time || '10:00 AM - 1:00 PM'}</p>
              </div>

              <div style={styles.detailCard}>
                <div style={styles.detailHeader}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#5c3e36' }}>
                    ac_unit
                  </span>
                  <span style={styles.detailHeading}>Handling & Packaging</span>
                </div>
                <p style={styles.detailMainText}>Chilled Van Transit</p>
                <p style={styles.detailSubText}>Signature ribbon box</p>
              </div>
            </div>

            {/* ORDERED ITEMS BREAKDOWN */}
            <div style={styles.itemsCard}>
              <div style={styles.sectionHeader}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36' }}>
                  inventory_2
                </span>
                <h3 style={styles.sectionTitle}>
                  Ordered Items ({result.items?.length || 0})
                </h3>
              </div>

              <div style={styles.itemsList}>
                {(result.items || []).map((item, idx) => (
                  <div key={item.id || idx} style={styles.itemRow}>
                    <div style={styles.itemAvatar}>
                      <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#5c3e36' }}>
                        {item.cake_weight ? 'cake' : 'checkroom'}
                      </span>
                    </div>

                    <div style={styles.itemDetails}>
                      <div style={styles.itemTitleRow}>
                        <h4 style={styles.itemName}>{item.product_name}</h4>
                        <span style={styles.itemSubtotal}>
                          ৳ {(item.subtotal || item.unit_price * item.quantity).toLocaleString()}
                        </span>
                      </div>

                      <div style={styles.itemMetaRow}>
                        <span style={styles.itemQtyBadge}>Qty: {item.quantity}</span>
                        <span style={styles.itemUnitPrice}>
                          @ ৳ {item.unit_price.toLocaleString()} each
                        </span>
                      </div>

                      {/* Dress attributes */}
                      {item.selected_size && (
                        <div style={styles.optionPill}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            straighten
                          </span>
                          <span>Size: {item.selected_size}</span>
                        </div>
                      )}

                      {/* Cake attributes */}
                      {(item.cake_weight || item.cake_flavor || item.cake_message) && (
                        <div style={styles.cakeSpecList}>
                          {item.cake_weight && (
                            <div style={styles.optionPill}>
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                scale
                              </span>
                              <span>Weight: {item.cake_weight}</span>
                            </div>
                          )}
                          {item.cake_flavor && (
                            <div style={styles.optionPill}>
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                restaurant
                              </span>
                              <span>Flavor: {item.cake_flavor}</span>
                            </div>
                          )}
                          {item.cake_message && (
                            <div style={styles.cakeMessagePill}>
                              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#5c3e36' }}>
                                edit_note
                              </span>
                              <span style={{ fontStyle: 'italic' }}>
                                Calligraphy: "{item.cake_message}"
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PAYMENT SUMMARY */}
            <div style={styles.paymentCard}>
              <div style={styles.sectionHeader}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36' }}>
                  payments
                </span>
                <h3 style={styles.sectionTitle}>Payment & Balance</h3>
              </div>

              <div style={styles.paymentRows}>
                <div style={styles.financeRow}>
                  <span style={styles.financeLabel}>Items Subtotal</span>
                  <span style={styles.financeValue}>
                    ৳ {(result.subtotal || 0).toLocaleString()}
                  </span>
                </div>

                <div style={styles.financeRow}>
                  <span style={styles.financeLabel}>Delivery Charge</span>
                  <span style={styles.financeValue}>
                    ৳ {(result.delivery_charge || 0).toLocaleString()}
                  </span>
                </div>

                <div style={styles.financeDivider} />

                <div style={styles.financeRowBold}>
                  <span style={styles.financeLabelTotal}>Total Order Value</span>
                  <span style={styles.financeValueTotal}>
                    ৳ {(result.total_amount || 0).toLocaleString()}
                  </span>
                </div>

                <div style={styles.advanceRow}>
                  <div style={styles.advanceLabelCluster}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#065f46' }}>
                      verified
                    </span>
                    <span style={styles.advanceLabel}>Advance Paid (bKash)</span>
                  </div>
                  <span style={styles.advanceValue}>
                    - ৳ {(result.advance_amount || 500).toLocaleString()}
                  </span>
                </div>

                <div style={styles.dueRowHighlight}>
                  <div>
                    <span style={styles.dueLabel}>Cash Due on Delivery</span>
                    <p style={styles.dueSubLabel}>Payable upon doorstep handover</p>
                  </div>
                  <span style={styles.dueValue}>
                    ৳ {(result.cash_due || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* ARTISAN CONCIERGE HELP CARD */}
            <div style={styles.conciergeCard}>
              <div style={styles.conciergeAvatarCircle}>
                <span className="material-symbols-outlined" style={{ fontSize: '26px', color: '#ffffff' }}>
                  support_agent
                </span>
              </div>
              <div style={styles.conciergeInfo}>
                <h4 style={styles.conciergeTitle}>Need Delivery Assistance or Customization?</h4>
                <p style={styles.conciergeText}>
                  Want to modify your delivery timing, address, or custom cake calligraphy? Sanjida Bethi
                  is directly reachable on WhatsApp.
                </p>
                <div style={styles.conciergeActionRow}>
                  <a
                    href={`https://wa.me/8801712345678?text=${whatsappInquiry}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.conciergeWhatsappBtn}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      chat
                    </span>
                    <span>Chat on WhatsApp</span>
                  </a>
                  <a href="tel:+8801712345678" style={styles.conciergeCallBtn}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      call
                    </span>
                    <span>+880 1712-345678</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 6. INITIAL EMPTY STATE                                                */}
        {/* ===================================================================== */}
        {!result && !loading && !errorMsg && (
          <div style={styles.initialStateCard}>
            <div style={styles.initialIconCircle}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#5c3e36' }}>
                inventory
              </span>
            </div>
            <h3 style={styles.initialTitle}>Check Live Order Progress</h3>
            <p style={styles.initialText}>
              Keep track of every step of your order — from hand tailoring and cake baking to direct courier dispatch.
            </p>
            <div style={styles.featurePointsList}>
              <div style={styles.featurePointItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#065f46' }}>
                  check_circle
                </span>
                <span>No customer login or password needed</span>
              </div>
              <div style={styles.featurePointItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#065f46' }}>
                  check_circle
                </span>
                <span>Real-time studio progress updates</span>
              </div>
              <div style={styles.featurePointItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#065f46' }}>
                  check_circle
                </span>
                <span>Clear bKash advance & remaining cash breakdown</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// CSS STYLES (Mirrors Stitch Screen 8bfbf6466c224f7383f40d6cecdc22d3)
// =============================================================================
const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#fbf9f5',
    color: '#2d2421',
    paddingBottom: '80px',
  },
  breadcrumbBar: {
    borderBottom: '1px solid #ece8e1',
    backgroundColor: '#ffffff',
  },
  breadcrumbInner: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#6f6764',
  },
  breadcrumbLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#6f6764',
    textDecoration: 'none',
  },
  breadcrumbDivider: {
    color: '#988e8a',
  },
  breadcrumbCurrent: {
    color: '#5c3e36',
    fontWeight: 600,
  },
  contentWrapper: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  /* Search Hero Card */
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #dfd8ce',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(92, 62, 54, 0.05)',
  },
  searchHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '20px',
  },
  searchIconBox: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    backgroundColor: '#f5ede9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  searchTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '24px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: '0 0 6px 0',
  },
  searchSubtitle: {
    fontSize: '13px',
    color: '#6f6764',
    lineHeight: 1.5,
    margin: 0,
  },
  searchForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  inputGroup: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: '#77554c',
    fontSize: '22px',
    pointerEvents: 'none',
  },
  inputField: {
    width: '100%',
    height: '50px',
    padding: '0 40px 0 46px',
    borderRadius: '10px',
    border: '1.5px solid #dfd8ce',
    backgroundColor: '#fbf9f5',
    fontSize: '15px',
    fontWeight: 600,
    color: '#2d2421',
    letterSpacing: '0.04em',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  clearBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#988e8a',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackSubmitBtn: {
    height: '48px',
    borderRadius: '10px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    border: 'none',
    fontSize: '15px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  sampleHintRow: {
    marginTop: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#6f6764',
  },
  sampleHintLabel: {
    color: '#988e8a',
  },
  sampleChip: {
    background: '#f5ede9',
    border: '1px solid #dfd8ce',
    borderRadius: '6px',
    padding: '3px 8px',
    color: '#5c3e36',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  /* Error / Invalid State */
  errorCard: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
  },
  errorIconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#fee2e2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#991b1b',
    margin: '0 0 4px 0',
  },
  errorDescription: {
    fontSize: '13px',
    color: '#7f1d1d',
    lineHeight: 1.5,
    margin: '0 0 12px 0',
  },
  errorActionRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  errorWhatsappBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#065f46',
    color: '#ffffff',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    textDecoration: 'none',
  },
  errorCallLink: {
    fontSize: '12px',
    color: '#991b1b',
    textDecoration: 'underline',
    fontWeight: 500,
  },

  /* Loading State */
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #dfd8ce',
    padding: '40px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #f5ede9',
    borderTopColor: '#5c3e36',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: 0,
  },
  loadingSubtext: {
    fontSize: '12px',
    color: '#988e8a',
  },

  /* Simulation Preview Bar */
  simulationBar: {
    backgroundColor: '#f5ede9',
    borderRadius: '12px',
    border: '1px solid #dfd8ce',
    padding: '12px',
  },
  simulationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px',
  },
  simulationTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#5c3e36',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  simulationButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  simBtn: {
    border: '1px solid #dfd8ce',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  /* Result Container */
  resultContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  /* Status Banner Card */
  statusBannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #dfd8ce',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(92, 62, 54, 0.05)',
  },
  statusBannerTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '18px',
  },
  invoiceSmallLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#988e8a',
    display: 'block',
    marginBottom: '2px',
  },
  invoiceNumberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  invoiceDisplayCode: {
    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
    fontSize: '20px',
    fontWeight: 700,
    color: '#5c3e36',
    margin: 0,
  },
  copyCodeBtn: {
    background: '#f5ede9',
    border: '1px solid #dfd8ce',
    borderRadius: '6px',
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#5c3e36',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    borderRadius: '9999px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: 700,
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  atelierNoticeBox: {
    backgroundColor: '#fbf9f5',
    border: '1px solid #ece8e1',
    borderRadius: '10px',
    padding: '16px',
  },
  noticeHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  noticeHeading: {
    fontSize: '13px',
    color: '#5c3e36',
  },
  noticeText: {
    fontSize: '13px',
    color: '#4a3f3b',
    lineHeight: 1.5,
    margin: 0,
  },

  /* Timeline Card */
  timelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #dfd8ce',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(92, 62, 54, 0.05)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid #ece8e1',
  },
  sectionTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '18px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: 0,
  },
  exceptionAlert: {
    border: '1px solid',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '20px',
  },
  exceptionAlertTitle: {
    fontSize: '14px',
    fontWeight: 700,
    margin: '0 0 4px 0',
  },
  exceptionAlertBody: {
    fontSize: '12px',
    color: '#4a3f3b',
    lineHeight: 1.4,
    margin: 0,
  },
  stepperContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  stepRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  },
  stepIndicatorCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '36px',
  },
  stepNode: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 2,
    transition: 'all 0.2s',
  },
  stepLine: {
    width: '2px',
    minHeight: '44px',
    margin: '4px 0',
  },
  stepContentBox: {
    flex: 1,
    paddingBottom: '24px',
  },
  stepHeaderRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '4px',
  },
  stepTitleCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  stepTitle: {
    fontSize: '15px',
    margin: 0,
  },
  activeStepTag: {
    backgroundColor: '#f5ede9',
    color: '#5c3e36',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  stepTimeBadge: {
    fontSize: '11px',
    color: '#988e8a',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  stepDesc: {
    fontSize: '13px',
    color: '#6f6764',
    lineHeight: 1.4,
    margin: 0,
  },

  /* Logistics Details Grid */
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #dfd8ce',
    padding: '16px',
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px',
  },
  detailHeading: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#77554c',
    fontWeight: 700,
  },
  detailMainText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2d2421',
    margin: '0 0 2px 0',
  },
  detailSubText: {
    fontSize: '12px',
    color: '#6f6764',
    margin: 0,
  },

  /* Items Card */
  itemsCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #dfd8ce',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(92, 62, 54, 0.05)',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f5f3ef',
  },
  itemAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#f5ede9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitleRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '4px',
  },
  itemName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2d2421',
    margin: 0,
  },
  itemSubtotal: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#5c3e36',
  },
  itemMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#6f6764',
    marginBottom: '6px',
  },
  itemQtyBadge: {
    backgroundColor: '#f5ede9',
    color: '#5c3e36',
    fontWeight: 600,
    padding: '1px 6px',
    borderRadius: '4px',
  },
  itemUnitPrice: {
    color: '#988e8a',
  },
  optionPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#fbf9f5',
    border: '1px solid #ece8e1',
    borderRadius: '6px',
    padding: '2px 8px',
    fontSize: '11px',
    color: '#5c3e36',
    fontWeight: 500,
    marginRight: '6px',
    marginTop: '4px',
  },
  cakeSpecList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '4px',
  },
  cakeMessagePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#fefce8',
    border: '1px solid #fef08a',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '11px',
    color: '#854d0e',
    marginTop: '4px',
  },

  /* Payment Card */
  paymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #dfd8ce',
    padding: '24px',
    boxShadow: '0 4px 16px rgba(92, 62, 54, 0.05)',
  },
  paymentRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  financeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#6f6764',
  },
  financeLabel: {
    color: '#6f6764',
  },
  financeValue: {
    color: '#2d2421',
    fontWeight: 500,
  },
  financeDivider: {
    height: '1px',
    backgroundColor: '#ece8e1',
    margin: '4px 0',
  },
  financeRowBold: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '15px',
    fontWeight: 700,
    color: '#2d2421',
  },
  financeLabelTotal: {
    color: '#2d2421',
  },
  financeValueTotal: {
    color: '#5c3e36',
  },
  advanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '8px',
    padding: '8px 12px',
    marginTop: '4px',
  },
  advanceLabelCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  advanceLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#065f46',
  },
  advanceValue: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#065f46',
  },
  dueRowHighlight: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5ede9',
    border: '1.5px solid #dfd8ce',
    borderRadius: '10px',
    padding: '12px 14px',
    marginTop: '6px',
  },
  dueLabel: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#5c3e36',
    display: 'block',
  },
  dueSubLabel: {
    fontSize: '11px',
    color: '#77554c',
    margin: 0,
  },
  dueValue: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '20px',
    fontWeight: 700,
    color: '#5c3e36',
  },

  /* Artisan Concierge Card */
  conciergeCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #dfd8ce',
    padding: '20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    boxShadow: '0 4px 16px rgba(92, 62, 54, 0.05)',
  },
  conciergeAvatarCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#5c3e36',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  conciergeInfo: {
    flex: 1,
  },
  conciergeTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#5c3e36',
    margin: '0 0 4px 0',
  },
  conciergeText: {
    fontSize: '12px',
    color: '#6f6764',
    lineHeight: 1.5,
    margin: '0 0 12px 0',
  },
  conciergeActionRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  conciergeWhatsappBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#065f46',
    color: '#ffffff',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    textDecoration: 'none',
  },
  conciergeCallBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#f5ede9',
    color: '#5c3e36',
    border: '1px solid #dfd8ce',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    textDecoration: 'none',
  },

  /* Initial Empty State */
  initialStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #dfd8ce',
    padding: '36px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 4px 16px rgba(92, 62, 54, 0.05)',
  },
  initialIconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#f5ede9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '20px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: 0,
  },
  initialText: {
    fontSize: '13px',
    color: '#6f6764',
    maxWidth: '460px',
    lineHeight: 1.5,
    margin: 0,
  },
  featurePointsList: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    textAlign: 'left',
  },
  featurePointItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#4a3f3b',
  },
};
