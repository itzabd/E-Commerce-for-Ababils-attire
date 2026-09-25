/**
 * Ababil’s Attire by Sanjida Bethi
 * Checkout & bKash Advance Payment Page
 * Mirrors Stitch project 1646646279704595948 (Screen 5707c6de91cc4a98aa4bbde8ec61aaea)
 */

import React, { useState, useEffect, useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { ordersService } from '../../services/orders.service';
import { settingsService } from '../../services/settings.service';
import type { CreateGuestOrderPayload, OrderItemInput, StoreSettings } from '../../types';

const STUDIO_BKASH_NUMBER = import.meta.env.VITE_STUDIO_BKASH_NUMBER || '01795-077102';
const MINIMUM_ADVANCE_AMOUNT = Number(import.meta.env.VITE_MINIMUM_ADVANCE_AMOUNT) || 500;

function cleanPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('880')) {
    return '0' + digits.slice(3);
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    return '0' + digits;
  }
  return digits;
}

function isValidBdPhone(raw: string): boolean {
  const cleaned = cleanPhoneNumber(raw);
  return /^01[3-9]\d{8}$/.test(cleaned);
}

// Compute the earliest allowed delivery date
function getEarliestDeliveryDate(hasCake: boolean): string {
  const date = new Date();
  // If cake is in bag, require minimum notice (typically 48 hours / 2 days)
  const addDays = hasCake ? 2 : 1;
  date.setDate(date.getDate() + addDays);
  return date.toISOString().split('T')[0];
}

function formatDateDisplay(isoDateString: string): string {
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

export const CheckoutPage: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    deliveryDiscount,
    hasDress,
    hasCake,
    specialNote,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  // Accessibility IDs
  const fullNameId = useId();
  const phoneId = useId();
  const altPhoneId = useId();
  const cityAreaId = useId();
  const addressId = useId();
  const deliveryDateId = useId();
  const deliveryTimeId = useId();
  const orderNoteId = useId();
  const trxIdInputId = useId();
  const senderLast4Id = useId();
  const refNameId = useId();

  // Customer Contact & Delivery State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [cityArea, setCityArea] = useState(
    'Dhaka Inside City - ৳ 120 / ৳ 250 Temperature Cake Courier'
  );
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => getEarliestDeliveryDate(hasCake));
  const [deliveryTime, setDeliveryTime] = useState('Morning 10:00 AM - 1:00 PM');
  const [orderNote, setOrderNote] = useState(specialNote || '');

  // bKash Advance Payment State
  const [bkashTrxId, setBkashTrxId] = useState('');
  const [bkashSenderLast4, setBkashSenderLast4] = useState('');
  const [bkashRefName, setBkashRefName] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Live Store Configuration
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    settingsService.getSettings().then((s) => {
      setStoreSettings(s);
    });
  }, []);

  const bkashNumber = storeSettings?.bkash_number || STUDIO_BKASH_NUMBER;
  const minimumAdvance = storeSettings?.minimum_advance_amount ?? MINIMUM_ADVANCE_AMOUNT;

  // Security: Honeypot field to catch dumb spam bots
  const [honeypot, setHoneypot] = useState('');

  // Financial Computations
  const dressFee = hasDress ? 120 : 0;
  const cakeFee = hasCake ? 250 : 0;
  const netDeliveryCharge = Math.max(0, dressFee + cakeFee - deliveryDiscount);
  const totalAmount = subtotal + netDeliveryCharge;
  const advanceAmount = Math.min(minimumAdvance, totalAmount);
  const cashDue = Math.max(0, totalAmount - advanceAmount);

  // Validation Flags
  const isNameValid = fullName.trim().length >= 2;
  const isPhoneValid = isValidBdPhone(phoneNumber);
  const isAddressValid = deliveryAddress.trim().length >= 8;
  const isDateValid = Boolean(deliveryDate);
  const isTrxValid = bkashTrxId.trim().length >= 6;
  const isSenderLast4Valid = /^\d{4}$/.test(bkashSenderLast4.trim());
  const isRefNameValid = bkashRefName.trim().length >= 2;

  const isFormValid =
    items.length > 0 &&
    isNameValid &&
    isPhoneValid &&
    isAddressValid &&
    isDateValid &&
    isTrxValid &&
    isSenderLast4Valid &&
    isRefNameValid;

  const handleCopyNumber = () => {
    const rawNumber = bkashNumber.replace(/\D/g, '');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(rawNumber);
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2500);
    }
  };

  const handleSenderLast4Change = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 4);
    setBkashSenderLast4(digitsOnly);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 🛡️ SPAM PREVENTION (HONEYPOT)
      // If a bot fills this hidden field, silently mock success
      if (honeypot) {
        console.warn('Bot detected by honeypot.');
        setIsSubmitting(true);
        setTimeout(() => {
          clearCart();
          navigate('/order-confirmed/AB-BOT-DETECTED', { replace: true });
        }, 1200);
        return;
      }

      const cleanPhone = cleanPhoneNumber(phoneNumber);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      const orderItemsPayload: OrderItemInput[] = items.map((item) => ({
        product_id: uuidRegex.test(item.productId) ? item.productId : undefined,
        product_name_snapshot: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
        selected_size: item.selectedSize || undefined,
        cake_weight: item.selectedWeight || undefined,
        cake_flavor: item.selectedFlavor || undefined,
        cake_message: item.customMessage || undefined,
        customization_details:
          item.category === 'dress'
            ? item.fabricDetails || 'Handmade Dress'
            : `Flavor: ${item.selectedFlavor || 'Custom'}, Inscription: ${item.customMessage || 'None'}`,
      }));

      const payload: CreateGuestOrderPayload = {
        customer: {
          name: fullName.trim(),
          phone: cleanPhone,
          address: deliveryAddress.trim(),
          area: cityArea,
          notes: altPhone.trim() ? `Alt Phone: ${altPhone.trim()}` : undefined,
        },
        order: {
          delivery_date: deliveryDate,
          delivery_time: deliveryTime,
          delivery_address: deliveryAddress.trim(),
          special_instructions: orderNote.trim() || undefined,
          subtotal,
          delivery_charge: netDeliveryCharge,
          total_amount: totalAmount,
          advance_amount: advanceAmount,
        },
        items: orderItemsPayload,
        payment: {
          trx_id: bkashTrxId.trim().toUpperCase(),
          sender_last4: bkashSenderLast4.trim(),
          reference_name: bkashRefName.trim(),
        },
      };

      const result = await ordersService.createGuestOrder(payload);

      if (result && result.invoice_number) {
        // Clear local shopping bag
        clearCart();

        // Navigate to Order Confirmed page
        navigate(`/order-confirmed/${encodeURIComponent(result.invoice_number)}`, {
          state: {
            orderConfirmation: result,
            customerPhone: cleanPhone,
            customerAddress: deliveryAddress.trim(),
            deliveryTime,
            items: items,
          },
          replace: true,
        });
      } else {
        throw new Error('Could not generate order confirmation record.');
      }
    } catch (err: any) {
      console.error('Checkout failed:', err);
      setSubmitError(
        err.message ||
        'Failed to record your order. Please check your network connection and bKash details.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // EMPTY CART GUARD STATE
  // =========================================================================
  if (items.length === 0) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <div style={styles.emptyCard}>
            <div style={styles.emptyIconCircle}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#8c5e51' }}>
                shopping_bag
              </span>
            </div>
            <h1 style={styles.emptyTitle}>Your Shopping Bag is Empty</h1>
            <p style={styles.emptyDesc}>
              You do not have any items in your bag to checkout. Please explore our handcrafted dresses
              and homemade cakes first.
            </p>
            <div style={styles.emptyBtnRow}>
              <Link to="/bag" style={styles.primaryBtn}>
                View My Bag
              </Link>
              <Link to="/dresses" style={styles.secondaryBtn}>
                Browse Dresses
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      {/* ===================================================================== */}
      {/* 1. TOP HEADER & PROGRESS TRACKER (Stitch Spec)                        */}
      {/* ===================================================================== */}
      <div style={styles.topBar}>
        <div style={styles.topBarInner}>
          <Link to="/bag" style={styles.backToBagLink} aria-label="Return to My Bag">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              arrow_back
            </span>
            <span>Back to Bag</span>
          </Link>

          <div style={styles.headerBrand}>
            <span style={styles.brandTitle}>Ababil’s Attire</span>
            <span style={styles.brandSubtitle}>Checkout</span>
          </div>

          <div style={styles.atelierPill}>Guest Checkout</div>
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

            <div style={styles.stepItemActive}>
              <span style={styles.stepDotActive}>2</span>
              <span style={styles.stepLabelActive}>2. Checkout</span>
            </div>

            <span style={styles.stepArrow}>→</span>

            <div style={styles.stepItemUpcoming}>
              <span style={styles.stepDotUpcoming}>3</span>
              <span style={styles.stepLabelUpcoming}>3. Done</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MAIN CHECKOUT FORM CANVAS                                             */}
      {/* ===================================================================== */}
      <main style={styles.mainCanvas} className="customer-page-container checkout-page-canvas">
        {/* Title Header */}
        <div style={styles.titleSection}>
          <div style={styles.guestBadge}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              lock_reset
            </span>
            <span>Guest Checkout • No Account Needed</span>
          </div>
          <h1 style={styles.pageHeading}>Checkout</h1>
          <p style={styles.pageSubheading}>
            Enter your delivery details and submit your bKash advance to reserve your order.
          </p>
        </div>

        {submitError && (
          <div style={styles.errorAlert} role="alert">
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#ba1a1a' }}>
              error
            </span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '13px', color: '#ba1a1a' }}>
                Order Placement Notice
              </strong>
              <span style={{ fontSize: '12px', color: '#504441' }}>{submitError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} style={styles.formFlow} className="checkout-form-desktop-grid">
          {/* ================================================================= */}
          {/* LEFT COLUMN: SCHEDULE & CUSTOMER DELIVERY DETAILS                 */}
          {/* ================================================================= */}
          <div className="checkout-desktop-left-col">
            {/* Scheduled Delivery Window Banner */}
            <section style={styles.scheduleCard}>
              <div style={styles.scheduleIconWrap}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#5c3e36' }}>
                  {hasCake ? 'calendar_month' : 'local_shipping'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.scheduleBadgeRow}>
                  <span style={styles.scheduleTag}>
                    {hasCake ? 'Scheduled Window' : 'Handcrafted Tailoring'}
                  </span>
                  <span style={styles.chilledPill}>{hasCake ? 'Chilled Van' : 'Standard Courier'}</span>
                </div>
                <p style={styles.scheduleTitle}>
                  {hasCake
                    ? `Cake Delivery Window: ${formatDateDisplay(deliveryDate)} (${deliveryTime})`
                    : `Estimated Dispatch: ${formatDateDisplay(deliveryDate)}`}
                </p>
                <p style={styles.scheduleSubtitle}>
                  {hasCake
                    ? 'Delivery mode: Hand Delivery by Chilled Private Courier'
                    : 'Delivery mode: Standard safe courier across Bangladesh'}
                </p>
              </div>
              {hasDress && hasCake && (
                <div style={styles.ecoNotice}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#7e544f' }}>
                    eco
                  </span>
                  <span>Your dress and cake will be delivered safely together in one combined dispatch.</span>
                </div>
              )}
            </section>

            {/* ================================================================= */}
            {/* STEP 1: CUSTOMER CONTACT & DELIVERY DETAILS                       */}
            {/* ================================================================= */}
            <section style={styles.cardSection}>
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderLeft}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36' }}>
                  person_pin_circle
                </span>
                <h2 style={styles.cardTitle}>Delivery Address</h2>
              </div>
              <span style={styles.stepBadge}>Step 1 of 2</span>
            </div>

            <div style={styles.formFields}>
              {/* SPAM HONEYPOT - Invisible to humans */}
              <div style={{ display: 'none', position: 'absolute', left: '-9999px' }} aria-hidden="true">
                <label htmlFor="website_url_honey">Website URL (Leave blank)</label>
                <input
                  type="text"
                  id="website_url_honey"
                  name="website_url_honey"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Full Name */}
              <div style={styles.fieldGroup}>
                <label htmlFor={fullNameId} style={styles.fieldLabel}>
                  Full Name <span style={styles.requiredStar}>*</span>
                </label>
                <input
                  id={fullNameId}
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ayesha Rahman"
                  style={{
                    ...styles.textInput,
                    borderColor: fullName && !isNameValid ? '#ba1a1a' : 'var(--color-border-default, #dfd8ce)',
                  }}
                />
              </div>

              {/* Phone Number */}
              <div style={styles.fieldGroup}>
                <label htmlFor={phoneId} style={styles.fieldLabel}>
                  Phone Number <span style={styles.requiredStar}>*</span>
                </label>
                <div style={styles.phoneInputGroup}>
                  <div style={styles.phonePrefixBlock}>
                    <span>🇧🇩</span>
                    <span style={{ fontWeight: 600, color: '#2d2421' }}>+880</span>
                  </div>
                  <input
                    id={phoneId}
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="1712 345678"
                    style={{
                      ...styles.phoneInput,
                      borderColor: phoneNumber && !isPhoneValid ? '#ba1a1a' : 'var(--color-border-default, #dfd8ce)',
                    }}
                  />
                </div>
                <p style={styles.fieldHelper}>
                  Please use an active phone number. Sanjida will call for delivery coordination.
                </p>
              </div>

              {/* Alternative Phone */}
              <div style={styles.fieldGroup}>
                <label htmlFor={altPhoneId} style={styles.fieldLabel}>
                  Alternative Phone <span style={styles.optionalText}>(Optional)</span>
                </label>
                <input
                  id={altPhoneId}
                  type="tel"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  placeholder="e.g. +880 1812..."
                  style={styles.textInput}
                />
              </div>

              {/* City / Area Dropdown */}
              <div style={styles.fieldGroup}>
                <label htmlFor={cityAreaId} style={styles.fieldLabel}>
                  City / Area <span style={styles.requiredStar}>*</span>
                </label>
                <select
                  id={cityAreaId}
                  value={cityArea}
                  onChange={(e) => setCityArea(e.target.value)}
                  style={styles.selectInput}
                >
                  <option value="Dhaka Inside City - ৳ 120 / ৳ 250 Temperature Cake Courier">
                    Dhaka Inside City - ৳ 120 / ৳ 250 Temperature Cake Courier
                  </option>
                  <option value="Dhaka Suburbs (Gazipur, Savar, Narayanganj) - ৳ 350">
                    Dhaka Suburbs (Gazipur, Savar, Narayanganj) - ৳ 350
                  </option>
                  <option value="Chittagong (Dress Only) - ৳ 150">
                    Chittagong (Dress Only) - ৳ 150
                  </option>
                  <option value="Sylhet (Dress Only) - ৳ 150">
                    Sylhet (Dress Only) - ৳ 150
                  </option>
                  <option value="Other Divisions (Dress Only) - ৳ 150">
                    Other Divisions (Dress Only) - ৳ 150
                  </option>
                </select>
              </div>

              {/* Delivery Date & Time Window */}
              <div style={styles.dateTimeGrid}>
                <div style={styles.fieldGroup}>
                  <label htmlFor={deliveryDateId} style={styles.fieldLabel}>
                    Delivery Date <span style={styles.requiredStar}>*</span>
                  </label>
                  <input
                    id={deliveryDateId}
                    type="date"
                    required
                    min={getEarliestDeliveryDate(hasCake)}
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    style={styles.textInput}
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label htmlFor={deliveryTimeId} style={styles.fieldLabel}>
                    Delivery Window <span style={styles.requiredStar}>*</span>
                  </label>
                  <select
                    id={deliveryTimeId}
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    style={styles.selectInput}
                  >
                    <option value="Morning 10:00 AM - 1:00 PM">Morning 10:00 AM - 1:00 PM</option>
                    <option value="Afternoon 2:00 PM - 6:00 PM">Afternoon 2:00 PM - 6:00 PM</option>
                    <option value="Evening 6:00 PM - 9:00 PM">Evening 6:00 PM - 9:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Full Address */}
              <div style={styles.fieldGroup}>
                <label htmlFor={addressId} style={styles.fieldLabel}>
                  Delivery Address <span style={styles.requiredStar}>*</span>
                </label>
                <textarea
                  id={addressId}
                  required
                  rows={3}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House, road, sector, area details..."
                  style={{
                    ...styles.textareaInput,
                    borderColor:
                      deliveryAddress && !isAddressValid ? '#ba1a1a' : 'var(--color-border-default, #dfd8ce)',
                  }}
                />
              </div>

              {/* Optional Order Note */}
              <div style={styles.fieldGroup}>
                <label htmlFor={orderNoteId} style={styles.fieldLabel}>
                  Optional Order Note <span style={styles.optionalText}>(Gift cards, requests)</span>
                </label>
                <input
                  id={orderNoteId}
                  type="text"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Gate code, gift message, or special request for Sanjida..."
                  style={styles.textInput}
                />
              </div>
            </div>
          </section>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: ORDER REVIEW, BKASH PAYMENT & SUMMARY               */}
        {/* ================================================================= */}
        <div className="checkout-desktop-right-col">
          {/* ================================================================= */}
          {/* ORDER ITEMS REVIEW (Compact Stream)                               */}
          {/* ================================================================= */}
          <section style={styles.cardSection}>
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderLeft}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36' }}>
                  shopping_bag
                </span>
                <h2 style={styles.cardTitle}>Order Review</h2>
              </div>
              <span style={styles.itemCountPill}>
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            <div style={styles.itemsReviewList}>
              {items.map((item) => (
                <div key={item.id} style={styles.reviewItemRow}>
                  <div
                    style={{
                      ...styles.reviewThumbnailWrapper,
                      aspectRatio: item.category === 'dress' ? '3 / 4' : '1 / 1',
                    }}
                  >
                    <img src={item.imageUrl} alt={item.name} style={styles.reviewThumbnailImg} />
                  </div>

                  <div style={styles.reviewItemInfo}>
                    <div style={styles.reviewTitlePriceRow}>
                      <h3 style={styles.reviewItemTitle}>{item.name}</h3>
                      <span style={styles.reviewItemPrice}>
                        ৳ {(item.unitPrice * item.quantity).toLocaleString()}
                      </span>
                    </div>

                    {item.category === 'dress' && (
                      <>
                        <p style={styles.reviewItemMeta}>
                          {item.fabricDetails || 'Handcrafted Cotton'}
                        </p>
                        <div style={styles.reviewChipsRow}>
                          <span style={styles.reviewChip}>Size: {item.selectedSize}</span>
                          <span style={styles.reviewChip}>Qty: {item.quantity}</span>
                        </div>
                      </>
                    )}

                    {item.category === 'cake' && (
                      <>
                        <p style={styles.reviewItemMeta}>
                          Size: {item.selectedWeight} • {item.selectedFlavor}
                        </p>
                        {item.customMessage && (
                          <div style={styles.reviewLetteringBox}>
                            <span style={{ fontWeight: 600 }}>Lettering:</span> “{item.customMessage}”
                          </div>
                        )}
                        <div style={styles.reviewChipsRow}>
                          <span style={styles.reviewChip}>Qty: {item.quantity}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ================================================================= */}
          {/* STEP 2: PAYMENT METHOD & BKASH ADVANCE DEPOSIT                    */}
          {/* ================================================================= */}
          <section style={styles.cardSection}>
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderLeft}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36' }}>
                  payments
                </span>
                <h2 style={styles.cardTitle}>Payment Method</h2>
              </div>
              <span style={styles.stepBadge}>Step 2 of 2</span>
            </div>

            {/* COD Radio Header */}
            <div style={styles.codCard}>
              <div style={styles.codHeaderRow}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#5c3e36' }}>
                  verified_user
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={styles.codTitle}>Cash on Delivery (Advance Deposit)</span>
                    <span style={styles.requiredPill}>Required</span>
                  </div>
                  <p style={styles.codDesc}>
                    {storeSettings?.remaining_balance_policy || `Send ৳ ${advanceAmount} advance via bKash to confirm your order. The remaining ৳ ${cashDue.toLocaleString()} will be paid as Cash on Delivery upon receiving your package.`}
                  </p>
                </div>
              </div>

              <div style={styles.advanceBar}>
                <span style={styles.advanceBarLabel}>Minimum Advance Deposit:</span>
                <span style={styles.advanceBarVal}>৳ {advanceAmount}</span>
              </div>
            </div>

            {/* bKash Payment Box */}
            <div style={styles.bkashBox}>
              <div style={styles.bkashBoxHeader}>
                <div>
                  <span style={styles.bkashSendLabel}>Send Advance via bKash</span>
                  <span style={styles.bkashNumber}>{bkashNumber}</span>
                  <span style={styles.bkashSubtype}>
                    {storeSettings?.bkash_type === 'merchant' ? '(bKash Merchant / Payment)' : '(bKash Personal / Send-Money)'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyNumber}
                  style={styles.copyBtn}
                  aria-label="Copy bKash Number"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {copiedNumber ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedNumber ? 'Copied!' : 'Copy Number'}</span>
                </button>
              </div>

              {/* Instructions */}
              <div style={styles.instructionsBlock}>
                <p style={styles.instructionsTitle}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#8c5e51' }}>
                    info
                  </span>
                  <span>Simple 3-Step Payment Instructions:</span>
                </p>
                <ol style={styles.instructionsList}>
                  <li>
                    Open bKash App or dial *247# → Choose <strong>‘Send Money’</strong>
                  </li>
                  <li>
                    Enter number <strong style={{ color: '#2d2421' }}>{bkashNumber}</strong> and
                    send exact amount <strong>৳ {advanceAmount}</strong>
                  </li>
                  <li>Copy the TrxID and fill in the 3 verification fields below</li>
                </ol>
              </div>

              {/* 3 Required bKash Verification Fields */}
              <div style={styles.bkashFields}>
                {/* 1. Transaction ID */}
                <div style={styles.fieldGroup}>
                  <div style={styles.fieldLabelRow}>
                    <label htmlFor={trxIdInputId} style={styles.fieldLabelBold}>
                      1. bKash Transaction ID (TrxID) <span style={styles.requiredStar}>*</span>
                    </label>
                    <span style={styles.reqText}>Required</span>
                  </div>
                  <input
                    id={trxIdInputId}
                    type="text"
                    required
                    value={bkashTrxId}
                    onChange={(e) => setBkashTrxId(e.target.value.toUpperCase())}
                    placeholder="Enter your bKash TrxID (e.g. 9K28FD4A)"
                    style={{
                      ...styles.textInput,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      borderColor:
                        bkashTrxId && !isTrxValid ? '#ba1a1a' : 'var(--color-border-default, #dfd8ce)',
                    }}
                  />
                </div>

                {/* 2. Last 4 Digits of Sender Number */}
                <div style={styles.fieldGroup}>
                  <div style={styles.fieldLabelRow}>
                    <label htmlFor={senderLast4Id} style={styles.fieldLabelBold}>
                      2. Last 4 Digits of Sender Number <span style={styles.requiredStar}>*</span>
                    </label>
                    <span style={styles.reqText}>Required</span>
                  </div>
                  <input
                    id={senderLast4Id}
                    type="text"
                    required
                    maxLength={4}
                    value={bkashSenderLast4}
                    onChange={(e) => handleSenderLast4Change(e.target.value)}
                    placeholder="e.g. 5678"
                    style={{
                      ...styles.textInput,
                      borderColor:
                        bkashSenderLast4 && !isSenderLast4Valid
                          ? '#ba1a1a'
                          : 'var(--color-border-default, #dfd8ce)',
                    }}
                  />
                </div>

                {/* 3. Reference Name */}
                <div style={styles.fieldGroup}>
                  <div style={styles.fieldLabelRow}>
                    <label htmlFor={refNameId} style={styles.fieldLabelBold}>
                      3. Sender Name / Reference <span style={styles.requiredStar}>*</span>
                    </label>
                    <span style={styles.reqText}>Required</span>
                  </div>
                  <input
                    id={refNameId}
                    type="text"
                    required
                    value={bkashRefName}
                    onChange={(e) => setBkashRefName(e.target.value)}
                    placeholder="Enter reference name used (e.g. Ayesha / Cake)"
                    style={{
                      ...styles.textInput,
                      borderColor:
                        bkashRefName && !isRefNameValid
                          ? '#ba1a1a'
                          : 'var(--color-border-default, #dfd8ce)',
                    }}
                  />
                </div>

                <div style={styles.fieldAlertNotice}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#5c3e36' }}>
                    check_circle
                  </span>
                  <span>All three fields are required before the order can be submitted.</span>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* PAYMENT SUMMARY                                                   */}
          {/* ================================================================= */}
          <section style={styles.cardSection}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Payment Summary</h2>
              <span style={styles.bdtLabel}>BDT (৳)</span>
            </div>

            <div style={styles.summaryRows}>
              <div style={styles.summaryRow}>
                <span style={styles.summaryRowLabel}>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                <span style={styles.summaryRowVal}>৳ {subtotal.toLocaleString()}</span>
              </div>

              {hasDress && (
                <div style={styles.summaryRow}>
                  <span style={styles.summaryRowLabel}>Dress Delivery</span>
                  <span style={styles.summaryRowVal}>৳ 120</span>
                </div>
              )}

              {hasCake && (
                <div style={styles.summaryRow}>
                  <span style={styles.summaryRowLabel}>Cake Chilled Courier</span>
                  <span style={styles.summaryRowVal}>৳ 250</span>
                </div>
              )}

              {deliveryDiscount > 0 && (
                <div style={{ ...styles.summaryRow, color: '#8c5e51' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      auto_awesome
                    </span>
                    Combined Delivery Discount
                  </span>
                  <span style={{ fontWeight: 600 }}>-৳ {deliveryDiscount}</span>
                </div>
              )}

              <div style={styles.totalDividerRow}>
                <span style={styles.totalLabel}>Total Order Value</span>
                <span style={styles.totalValue}>৳ {totalAmount.toLocaleString()}</span>
              </div>

              <div style={styles.advanceRow}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#5c3e36' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#065f46' }}>
                    check_circle
                  </span>
                  Advance Payment (bKash Paid)
                </span>
                <span style={{ fontWeight: 700, color: '#5c3e36' }}>-৳ {advanceAmount.toLocaleString()}</span>
              </div>

              <div style={styles.dueRow}>
                <span style={styles.dueLabel}>Remaining on Delivery (Cash)</span>
                <span style={styles.dueValue}>৳ {cashDue.toLocaleString()}</span>
              </div>
            </div>

            <div style={styles.guaranteeBox}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#8c5e51', marginTop: '2px' }}>
                ring_volume
              </span>
              <p style={styles.guaranteeText}>
                <strong>Direct Guarantee:</strong> After you submit, Sanjida will call to verify your advance
                payment and confirm cake delivery details.
              </p>
            </div>

            {/* Desktop-Only Submit Button inside Payment Summary */}
            <div className="desktop-checkout-submit-btn" style={{ marginTop: '20px' }}>
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                style={{
                  ...styles.submitOrderBtn,
                  opacity: !isFormValid || isSubmitting ? 0.55 : 1,
                  cursor: !isFormValid || isSubmitting ? 'not-allowed' : 'pointer',
                  width: '100%',
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>
                      progress_activity
                    </span>
                    <span>Placing Your Order...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Place Order • ৳ {totalAmount.toLocaleString()}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
              <p style={{ ...styles.stickyHelper, textAlign: 'center', marginTop: '8px' }}>
                {!isFormValid
                  ? 'Please complete all required address & bKash fields to confirm this order.'
                  : 'Your advance payment details are required to confirm this order.'}
              </p>
            </div>
          </section>
        </div>

        {/* ================================================================= */}
        {/* STICKY BOTTOM BAR / CHECKOUT CTA (Mobile Only)                    */}
        {/* ================================================================= */}
        <aside style={styles.stickyBar} className="mobile-checkout-sticky">
            <div style={styles.stickyBarInner}>
              <div style={styles.stickyPillsRow}>
                <span>Handmade with care</span>
                <span>•</span>
                <span>Fresh on delivery day</span>
                <span>•</span>
                <span>Direct call from Sanjida</span>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                style={{
                  ...styles.submitOrderBtn,
                  opacity: !isFormValid || isSubmitting ? 0.55 : 1,
                  cursor: !isFormValid || isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>
                      progress_activity
                    </span>
                    <span>Placing Your Order...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Place Order • ৳ {totalAmount.toLocaleString()}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      arrow_forward
                    </span>
                  </>
                )}
              </button>

              <p style={styles.stickyHelper}>
                {!isFormValid
                  ? 'Please complete all required address & bKash fields to confirm this order.'
                  : 'Your advance payment details are required to confirm this order.'}
              </p>

              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <Link to="/bag" style={styles.backToBagBottomLink}>
                  Back to Bag
                </Link>
              </div>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
};

// =============================================================================
// CSS STYLES (Aligned with Stitch Design Tokens & Customer Storefront Palette)
// =============================================================================
const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-surface, #fbf9f5)',
    color: '#2d2421',
    paddingBottom: '160px',
  },
  container: {
    maxWidth: '480px',
    margin: '0 auto',
    padding: '40px 16px',
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
    maxWidth: '520px',
    margin: '0 auto',
    padding: '0 16px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backToBagLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#6f6764',
    textDecoration: 'none',
    fontSize: '13px',
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
    letterSpacing: '0.02em',
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
    color: '#8c5e51',
    padding: '3px 8px',
    borderRadius: '9999px',
    backgroundColor: '#efeeea',
    border: '1px solid #dfd8ce',
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
    backgroundColor: '#ffdad6',
    color: '#301310',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabelDone: {
    fontSize: '11px',
    color: '#2d2421',
    fontWeight: 500,
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
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 700,
  },
  stepLabelActive: {
    fontSize: '11px',
    color: '#5c3e36',
    fontWeight: 700,
  },
  stepItemUpcoming: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    opacity: 0.5,
  },
  stepDotUpcoming: {
    width: '18px',
    height: '18px',
    borderRadius: '9999px',
    backgroundColor: '#e4e2de',
    color: '#6f6764',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
  },
  stepLabelUpcoming: {
    fontSize: '11px',
    color: '#6f6764',
  },
  stepArrow: {
    color: '#d4c3bf',
    fontSize: '11px',
  },
  mainCanvas: {
    maxWidth: '520px',
    margin: '0 auto',
    padding: '20px 16px',
  },
  titleSection: {
    marginBottom: '20px',
  },
  guestBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '9999px',
    backgroundColor: '#efeeea',
    border: '1px solid #d4c3bf',
    color: '#7e544f',
    fontSize: '11px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  pageHeading: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '28px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: 0,
    lineHeight: 1.2,
  },
  pageSubheading: {
    fontSize: '13px',
    color: '#6f6764',
    marginTop: '4px',
    lineHeight: 1.5,
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: '#ffdad6',
    borderRadius: '8px',
    border: '1px solid #ba1a1a',
    marginBottom: '20px',
  },
  scheduleCard: {
    backgroundColor: '#f5f3ef',
    border: '1px solid #dfd8ce',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '20px',
    position: 'relative',
  },
  scheduleIconWrap: {
    width: '38px',
    height: '38px',
    borderRadius: '9999px',
    backgroundColor: '#e4e2de',
    border: '1px solid #dfd8ce',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scheduleBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  scheduleTag: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 700,
    color: '#7e544f',
  },
  chilledPill: {
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '9999px',
    backgroundColor: '#ffffff',
    border: '1px solid #dfd8ce',
    color: '#5c3e36',
    fontWeight: 600,
  },
  scheduleTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: 0,
    lineHeight: 1.4,
  },
  scheduleSubtitle: {
    fontSize: '12px',
    color: '#6f6764',
    margin: '3px 0 0 0',
  },
  ecoNotice: {
    width: '100%',
    paddingTop: '10px',
    borderTop: '1px solid #dfd8ce',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#6f6764',
  },
  formFlow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
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
    paddingBottom: '12px',
    borderBottom: '1px solid #ece8e1',
    marginBottom: '16px',
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '18px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: 0,
  },
  stepBadge: {
    fontSize: '11px',
    color: '#7e544f',
    fontWeight: 600,
  },
  formFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2d2421',
  },
  fieldLabelBold: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#2d2421',
  },
  fieldLabelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requiredStar: {
    color: '#ba1a1a',
  },
  optionalText: {
    fontSize: '11px',
    fontWeight: 400,
    color: '#827470',
  },
  reqText: {
    fontSize: '11px',
    color: '#7e544f',
    fontWeight: 500,
  },
  textInput: {
    height: '46px',
    padding: '0 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    backgroundColor: '#ffffff',
    fontSize: '13px',
    color: '#2d2421',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  selectInput: {
    height: '46px',
    padding: '0 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    backgroundColor: '#ffffff',
    fontSize: '13px',
    color: '#2d2421',
    outline: 'none',
  },
  textareaInput: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    backgroundColor: '#ffffff',
    fontSize: '13px',
    color: '#2d2421',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
  },
  phoneInputGroup: {
    display: 'flex',
    borderRadius: '8px',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  phonePrefixBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 12px',
    backgroundColor: '#f5f3ef',
    borderRight: '1px solid #dfd8ce',
    fontSize: '12px',
    color: '#6f6764',
  },
  phoneInput: {
    flex: 1,
    height: '46px',
    border: 'none',
    padding: '0 12px',
    fontSize: '13px',
    color: '#2d2421',
    outline: 'none',
  },
  fieldHelper: {
    fontSize: '11px',
    color: '#6f6764',
    margin: '2px 0 0 0',
  },
  dateTimeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  itemCountPill: {
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '9999px',
    backgroundColor: '#efeeea',
    color: '#7e544f',
    fontWeight: 600,
  },
  itemsReviewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  reviewItemRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f0ede8',
  },
  reviewThumbnailWrapper: {
    width: '60px',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: '#f5f3ef',
    border: '1px solid #dfd8ce',
    flexShrink: 0,
  },
  reviewThumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  reviewItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  reviewTitlePriceRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
  },
  reviewItemTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '15px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: 0,
    lineHeight: 1.3,
  },
  reviewItemPrice: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#5c3e36',
    flexShrink: 0,
  },
  reviewItemMeta: {
    fontSize: '11px',
    color: '#7e544f',
    fontStyle: 'italic',
    margin: '2px 0 0 0',
  },
  reviewChipsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '6px',
  },
  reviewChip: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: '#f5f3ef',
    border: '1px solid #dfd8ce',
    color: '#504441',
  },
  reviewLetteringBox: {
    fontSize: '11px',
    color: '#5c3e36',
    backgroundColor: '#fbf9f5',
    padding: '3px 6px',
    borderRadius: '4px',
    border: '1px solid #ece8e1',
    marginTop: '4px',
  },
  codCard: {
    backgroundColor: '#fbf9f5',
    border: '2px solid #5c3e36',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '16px',
  },
  codHeaderRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  codTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#5c3e36',
  },
  requiredPill: {
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: '#ffdad6',
    color: '#301310',
  },
  codDesc: {
    fontSize: '12px',
    color: '#6f6764',
    margin: '4px 0 0 0',
    lineHeight: 1.4,
  },
  advanceBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    border: '1px solid #dfd8ce',
    borderRadius: '6px',
    padding: '8px 12px',
    marginTop: '10px',
  },
  advanceBarLabel: {
    fontSize: '12px',
    color: '#6f6764',
  },
  advanceBarVal: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#5c3e36',
  },
  bkashBox: {
    backgroundColor: '#f5f3ef',
    border: '1px solid #dfd8ce',
    borderRadius: '10px',
    padding: '14px',
  },
  bkashBoxHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    borderBottom: '1px solid #dfd8ce',
    marginBottom: '12px',
  },
  bkashSendLabel: {
    display: 'block',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 700,
    color: '#7e544f',
  },
  bkashNumber: {
    display: 'block',
    fontSize: '17px',
    fontWeight: 700,
    color: '#5c3e36',
    letterSpacing: '0.03em',
  },
  bkashSubtype: {
    display: 'block',
    fontSize: '11px',
    color: '#6f6764',
  },
  copyBtn: {
    height: '36px',
    padding: '0 12px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(92, 62, 54, 0.12)',
  },
  instructionsBlock: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '10px 12px',
    border: '1px solid #dfd8ce',
    marginBottom: '14px',
  },
  instructionsTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#5c3e36',
    margin: '0 0 6px 0',
  },
  instructionsList: {
    margin: 0,
    paddingLeft: '18px',
    fontSize: '12px',
    color: '#504441',
    lineHeight: 1.6,
  },
  bkashFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  fieldAlertNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 10px',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    border: '1px solid #dfd8ce',
    fontSize: '11px',
    color: '#7e544f',
  },
  bdtLabel: {
    fontSize: '11px',
    color: '#827470',
  },
  summaryRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  summaryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#504441',
  },
  summaryRowLabel: {
    color: '#6f6764',
  },
  summaryRowVal: {
    fontWeight: 500,
    color: '#2d2421',
  },
  totalDividerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid #ece8e1',
    paddingTop: '8px',
    marginTop: '4px',
  },
  totalLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#5c3e36',
  },
  totalValue: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '18px',
    fontWeight: 700,
    color: '#5c3e36',
  },
  advanceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f3ef',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #dfd8ce',
    fontSize: '12px',
  },
  dueRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '6px',
  },
  dueLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#5c3e36',
  },
  dueValue: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '20px',
    fontWeight: 700,
    color: '#5c3e36',
  },
  guaranteeBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    backgroundColor: '#fbf9f5',
    border: '1px solid #dfd8ce',
    borderRadius: '8px',
    padding: '10px 12px',
    marginTop: '12px',
  },
  guaranteeText: {
    fontSize: '11px',
    color: '#6f6764',
    margin: 0,
    lineHeight: 1.4,
  },
  stickyBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'rgba(251, 249, 245, 0.96)',
    backdropFilter: 'blur(8px)',
    borderTop: '1px solid var(--color-border-subtle, #ece8e1)',
    boxShadow: '0 -4px 16px rgba(92, 62, 54, 0.08)',
  },
  stickyBarInner: {
    maxWidth: '520px',
    margin: '0 auto',
    padding: '10px 16px 14px 16px',
  },
  stickyPillsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#827470',
    marginBottom: '8px',
  },
  submitOrderBtn: {
    width: '100%',
    height: '48px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    border: 'none',
    fontSize: '14px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(92, 62, 54, 0.2)',
    transition: 'all 0.15s ease',
  },
  stickyHelper: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#6f6764',
    margin: '6px 0 0 0',
  },
  backToBagBottomLink: {
    fontSize: '11px',
    color: '#7e544f',
    textDecoration: 'underline',
    fontWeight: 500,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #dfd8ce',
    borderRadius: '16px',
    padding: '36px 20px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(92, 62, 54, 0.05)',
  },
  emptyIconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '9999px',
    backgroundColor: '#f5f3ef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
  },
  emptyTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '22px',
    fontWeight: 600,
    color: '#5c3e36',
    margin: '0 0 8px 0',
  },
  emptyDesc: {
    fontSize: '13px',
    color: '#6f6764',
    lineHeight: 1.5,
    margin: '0 0 20px 0',
  },
  emptyBtnRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
  primaryBtn: {
    padding: '10px 18px',
    borderRadius: '9999px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 600,
  },
  secondaryBtn: {
    padding: '10px 18px',
    borderRadius: '9999px',
    backgroundColor: 'transparent',
    border: '1px solid #5c3e36',
    color: '#5c3e36',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 600,
  },
};
