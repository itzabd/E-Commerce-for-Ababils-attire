/**
 * Ababil’s Attire by Sanjida Bethi
 * Manual Order Creation Modal
 * Enables staff and artisans to create custom atelier orders for existing or new clients.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ordersService } from '../../services/orders.service';
import { productsService } from '../../services/products.service';
import { settingsService } from '../../services/settings.service';
import { adminService, type CustomerDirectoryEntry } from '../../services/admin.service';
import { telegramNotificationService } from '../../services/telegram.service';
import type { ProductWithDetails, ManualOrderItemInput, CreateManualOrderPayload, ManualOrderResult } from '../../types';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (order: ManualOrderResult) => void;
  initialCustomer?: CustomerDirectoryEntry | null;
}

const COMMON_DRESS_SIZES = ['0-3M', '3-6M', '6-12M', '12-18M', '2-3Y', '3-4Y', '4-5Y', 'Custom Sizing'];
const COMMON_CAKE_WEIGHTS = ['0.5 lb Bento', '1.0 lb', '1.5 lb', '2.0 lb', '3.0 lb Tiered'];
const COMMON_CAKE_FLAVORS = [
  'Madagascar Vanilla & Fresh Berries',
  'Belgian Chocolate Fudge',
  'Red Velvet Cream Cheese',
  'Salted Caramel Buttercream',
  'Lemon Fig Sponge',
];

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  initialCustomer,
}) => {
  // Catalog & Settings State
  const [catalogProducts, setCatalogProducts] = useState<ProductWithDetails[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<CustomerDirectoryEntry[]>([]);
  const [_isLoadingDependencies, setIsLoadingDependencies] = useState(false);

  // Customer Mode & Form
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>(initialCustomer ? 'existing' : 'new');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDirectoryEntry | null>(initialCustomer || null);

  // New Customer Form State
  const [custName, setCustName] = useState(initialCustomer?.name || '');
  const [custPhone, setCustPhone] = useState(initialCustomer?.phone || '');
  const [custAltPhone, setCustAltPhone] = useState(initialCustomer?.alt_phone || '');
  const [custEmail, setCustEmail] = useState(initialCustomer?.email || '');
  const [custAddress, setCustAddress] = useState(initialCustomer?.address || '');
  const [custArea, setCustArea] = useState(initialCustomer?.area || 'Uttara, Dhaka');
  const [custNotes, setCustNotes] = useState(initialCustomer?.notes || '');

  // Line Items in Cart
  const [items, setItems] = useState<ManualOrderItemInput[]>([]);

  // Item Draft Form
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [itemCategory, setItemCategory] = useState<'dress' | 'cake'>('dress');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState<number>(3500);
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemSize, setItemSize] = useState('12-18M');
  const [itemWeight, setItemWeight] = useState('1.0 lb');
  const [itemFlavor, setItemFlavor] = useState('Madagascar Vanilla & Fresh Berries');
  const [itemCakeMsg, setItemCakeMsg] = useState('');
  const [itemSpecialNotes, setItemSpecialNotes] = useState('');

  // Order Details
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  }, []);

  const [deliveryDate, setDeliveryDate] = useState(tomorrow);
  const [deliveryTime, setDeliveryTime] = useState('Morning Slot (10 AM - 1 PM)');
  const [deliveryRateType, setDeliveryRateType] = useState<'dhaka' | 'outside' | 'cake_van' | 'pickup' | 'custom'>('dhaka');
  const [deliveryCharge, setDeliveryCharge] = useState<number>(80);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Payment & Advance
  const [advanceAmount, setAdvanceAmount] = useState<number>(500);
  const [advanceVerified, setAdvanceVerified] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'cash_on_delivery' | 'manual_adjustment'>('bkash');
  const [trxId, setTrxId] = useState('');
  const [senderLast4, setSenderLast4] = useState('');
  const [referenceName, setReferenceName] = useState('');

  // Submission & Validation Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrderSuccess, setCreatedOrderSuccess] = useState<ManualOrderResult | null>(null);

  // Escape key handler to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load products and customer directory on mount
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingDependencies(true);
    setErrorMessage(null);
    setCreatedOrderSuccess(null);

    Promise.all([
      productsService.getAllProductsAdmin().catch(() => []),
      adminService.getCustomersDirectory().catch(() => ({ customers: [] })),
      settingsService.getSettings().catch(() => null),
    ]).then(([prods, custDir, settings]) => {
      if (!isMounted) return;
      setCatalogProducts(prods || []);
      setExistingCustomers(custDir?.customers || []);

      if (settings && settings.delivery_inside_dhaka) {
        setDeliveryCharge(settings.delivery_inside_dhaka);
      }
      setIsLoadingDependencies(false);
    });

    if (initialCustomer) {
      setSelectedCustomer(initialCustomer);
      setCustName(initialCustomer.name);
      setCustPhone(initialCustomer.phone);
      setCustAltPhone(initialCustomer.alt_phone || '');
      setCustEmail(initialCustomer.email || '');
      setCustAddress(initialCustomer.address);
      setCustArea(initialCustomer.area);
      setCustomerMode('existing');
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialCustomer]);

  // Product Selection changes draft item inputs
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const prod = catalogProducts.find((p) => p.id === productId);
    if (!prod) return;

    setItemCategory(prod.category as 'dress' | 'cake');
    setItemName(prod.name);
    setItemPrice(Number(prod.price) || 0);

    if (prod.category === 'dress') {
      const sizes = prod.dress_details?.available_sizes || [];
      if (sizes.length > 0) {
        setItemSize(sizes[0]);
      } else {
        setItemSize(COMMON_DRESS_SIZES[0]);
      }
    } else if (prod.category === 'cake') {
      const flavors = prod.cake_details?.flavor_options || [];
      if (flavors.length > 0) {
        setItemFlavor(flavors[0]);
      }
      setItemWeight(COMMON_CAKE_WEIGHTS[1]); // 1.0 lb default
    }
  };

  // Add Item to Order List
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!itemName.trim()) {
      setErrorMessage('Please select or specify a product item name.');
      return;
    }
    if (itemPrice < 0) {
      setErrorMessage('Item price must be non-negative.');
      return;
    }
    if (itemQty < 1) {
      setErrorMessage('Quantity must be at least 1.');
      return;
    }

    const newItem: ManualOrderItemInput = {
      product_id: selectedProductId || undefined,
      product_name: itemName.trim(),
      category: itemCategory,
      quantity: itemQty,
      unit_price: itemPrice,
      subtotal: itemPrice * itemQty,
      selected_size: itemCategory === 'dress' ? itemSize : undefined,
      cake_weight: itemCategory === 'cake' ? itemWeight : undefined,
      cake_flavor: itemCategory === 'cake' ? itemFlavor : undefined,
      cake_message: itemCategory === 'cake' && itemCakeMsg.trim() ? itemCakeMsg.trim() : undefined,
      special_instructions: itemSpecialNotes.trim() || undefined,
    };

    setItems((prev) => [...prev, newItem]);

    // Reset draft fields
    setSelectedProductId('');
    setItemName('');
    setItemCakeMsg('');
    setItemSpecialNotes('');
    setItemQty(1);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Financial Computations
  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + it.subtotal, 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return subtotal + Number(deliveryCharge || 0);
  }, [subtotal, deliveryCharge]);

  const cashDue = useMemo(() => {
    return Math.max(0, totalAmount - Number(advanceAmount || 0));
  }, [totalAmount, advanceAmount]);

  // Handle Delivery Rate Switch
  const handleDeliveryRateType = (type: 'dhaka' | 'outside' | 'cake_van' | 'pickup' | 'custom') => {
    setDeliveryRateType(type);
    if (type === 'dhaka') setDeliveryCharge(80);
    else if (type === 'outside') setDeliveryCharge(150);
    else if (type === 'cake_van') setDeliveryCharge(250);
    else if (type === 'pickup') setDeliveryCharge(0);
  };

  // Filtered Existing Customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return existingCustomers.slice(0, 10);
    const q = customerSearch.toLowerCase().trim();
    return existingCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q)
    );
  }, [existingCustomers, customerSearch]);

  // Select an existing customer
  const handleSelectCustomer = (cust: CustomerDirectoryEntry) => {
    setSelectedCustomer(cust);
    setCustName(cust.name);
    setCustPhone(cust.phone);
    setCustAltPhone(cust.alt_phone || '');
    setCustEmail(cust.email || '');
    setCustAddress(cust.address);
    setCustArea(cust.area);
    setCustomerSearch('');
  };

  // Form Submission
  const handleSubmitOrder = async () => {
    setErrorMessage(null);

    // Validation
    const name = custName.trim();
    const phone = custPhone.trim();
    const address = custAddress.trim();
    const area = custArea.trim();

    if (!name) {
      setErrorMessage('Customer full name is required.');
      return;
    }
    if (!phone) {
      setErrorMessage('Customer contact phone number is required.');
      return;
    }
    if (!address) {
      setErrorMessage('Full delivery address is required.');
      return;
    }
    if (!area) {
      setErrorMessage('Delivery area is required.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Please add at least one product item to the order docket.');
      return;
    }
    if (!deliveryDate) {
      setErrorMessage('Please select a scheduled delivery date.');
      return;
    }
    if (advanceAmount > totalAmount) {
      setErrorMessage(`Advance amount (৳ ${advanceAmount}) cannot exceed total order amount (৳ ${totalAmount}).`);
      return;
    }

    if (advanceAmount > 0 && paymentMethod === 'bkash') {
      if (!trxId.trim()) {
        setErrorMessage('bKash Transaction ID (TrxID) is required when recording a bKash advance.');
        return;
      }
      if (!senderLast4.trim() || senderLast4.trim().length < 4) {
        setErrorMessage('Please enter the last 4 digits of the bKash sender number.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: CreateManualOrderPayload = {
        customer: {
          id: customerMode === 'existing' && selectedCustomer ? selectedCustomer.id : undefined,
          name,
          phone,
          alt_phone: custAltPhone.trim() || undefined,
          email: custEmail.trim() || undefined,
          address,
          area,
          notes: custNotes.trim() || undefined,
        },
        order: {
          delivery_date: deliveryDate,
          delivery_time: deliveryTime,
          delivery_address: address,
          delivery_charge: deliveryCharge,
          subtotal,
          total_amount: totalAmount,
          advance_amount: advanceAmount,
          special_instructions: specialInstructions.trim() || undefined,
          advance_verified: advanceAmount > 0 ? advanceVerified : false,
        },
        items,
        payment:
          advanceAmount > 0
            ? {
                method: paymentMethod,
                amount: advanceAmount,
                trx_id: trxId.trim() ? trxId.trim().toUpperCase() : 'MANUAL_CASH',
                sender_last4: senderLast4.trim() || '0000',
                reference_name: referenceName.trim() || name,
                status: advanceVerified ? 'matched' : 'pending_match',
              }
            : undefined,
      };

      const result = await ordersService.createManualOrder(payload);

      // 🚀 Asynchronously trigger Telegram notification for manual order (non-blocking)
      telegramNotificationService.notifyNewManualOrder(result, payload).catch((tgErr) => {
        console.warn('[ManualOrder] Background Telegram notification error:', tgErr);
      });

      setCreatedOrderSuccess(result);
      if (onOrderCreated) {
        onOrderCreated(result);
      }
    } catch (err: any) {
      console.error('Manual order creation error:', err);
      setErrorMessage(err.message || 'Failed to create manual order. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.backdrop}>
      <div style={styles.modalCard}>
        {/* Modal Top Header */}
        <header style={styles.modalHeader}>
          <div style={styles.headerTitleGroup}>
            <span style={styles.headerIcon}>edit_note</span>
            <div>
              <div style={styles.headerBadgeRow}>
                <h2 style={styles.headerTitle}>Create Manual Order</h2>
                <span style={styles.atelierPill}>Admin Docket</span>
              </div>
              <p style={styles.headerSubtitle}>
                Telephone orders, walk-in inquiries, and direct custom bookings.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={styles.closeBtn}
            title="Close Manual Order Dialog"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        {/* Success Confirmation State */}
        {createdOrderSuccess ? (
          <div style={styles.successContainer}>
            <div style={styles.successIconCircle}>✓</div>
            <h3 style={styles.successHeading}>Order Successfully Created!</h3>
            <div style={styles.successInvoicePill}>
              Invoice: <strong>{createdOrderSuccess.invoice_number}</strong>
            </div>

            <div style={styles.successDetailsGrid}>
              <div style={styles.successCell}>
                <span style={styles.successLabel}>Client Name</span>
                <span style={styles.successVal}>{createdOrderSuccess.customer_name}</span>
              </div>
              <div style={styles.successCell}>
                <span style={styles.successLabel}>Total Order Amount</span>
                <span style={styles.successVal}>৳ {createdOrderSuccess.total_amount.toLocaleString()}</span>
              </div>
              <div style={styles.successCell}>
                <span style={styles.successLabel}>Advance Recorded</span>
                <span style={{ ...styles.successVal, color: '#065f46' }}>
                  ৳ {createdOrderSuccess.advance_amount.toLocaleString()} ({createdOrderSuccess.advance_status})
                </span>
              </div>
              <div style={styles.successCell}>
                <span style={styles.successLabel}>Remaining Cash Due</span>
                <span style={styles.successVal}>৳ {createdOrderSuccess.cash_due.toLocaleString()} COD</span>
              </div>
            </div>

            <p style={styles.successNote}>
              This order has been linked to the customer record and is now active in Admin Orders and Customer Tracking.
            </p>

            <div style={styles.successActionsRow}>
              <button
                onClick={() => {
                  setCreatedOrderSuccess(null);
                  setItems([]);
                  onClose();
                }}
                style={styles.doneBtn}
              >
                Close & Return to Admin
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.scrollableContent}>
            {/* Error Alert Box */}
            {errorMessage && (
              <div style={styles.errorAlert}>
                <span style={styles.errorIcon}>warning</span>
                <span style={styles.errorText}>{errorMessage}</span>
              </div>
            )}

            {/* SECTION 1: CUSTOMER SELECTION / DETAILS */}
            <section style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionNum}>1</span>
                <h3 style={styles.sectionTitle}>Client Information</h3>
                <div style={styles.modeToggleGroup}>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode('existing');
                      setErrorMessage(null);
                    }}
                    style={{
                      ...styles.modeToggleBtn,
                      ...(customerMode === 'existing' ? styles.modeToggleActive : {}),
                    }}
                  >
                    Existing Client
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode('new');
                      setSelectedCustomer(null);
                      setCustName('');
                      setCustPhone('');
                      setCustAltPhone('');
                      setCustEmail('');
                      setCustAddress('');
                      setErrorMessage(null);
                    }}
                    style={{
                      ...styles.modeToggleBtn,
                      ...(customerMode === 'new' ? styles.modeToggleActive : {}),
                    }}
                  >
                    + New Client
                  </button>
                </div>
              </div>

              {customerMode === 'existing' && (
                <div style={styles.existingCustomerSearchBox}>
                  {selectedCustomer ? (
                    <div style={styles.selectedCustomerCard}>
                      <div>
                        <div style={styles.selectedCustNameRow}>
                          <span style={styles.selectedCustName}>{selectedCustomer.name}</span>
                          <span style={styles.selectedCustType}>{selectedCustomer.customer_type || 'Regular'}</span>
                        </div>
                        <p style={styles.selectedCustMeta}>
                          {selectedCustomer.phone} {selectedCustomer.alt_phone ? `• ${selectedCustomer.alt_phone}` : ''} • {selectedCustomer.area}
                        </p>
                        <p style={styles.selectedCustAddr}>{selectedCustomer.address}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        style={styles.changeCustBtn}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={styles.searchWrapper}>
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          placeholder="Search existing customer by name, phone, or area..."
                          style={styles.inputField}
                        />
                      </div>
                      <div style={styles.customerDropdownList}>
                        {filteredCustomers.length === 0 ? (
                          <div style={styles.emptyCustMsg}>
                            No client found matching "{customerSearch}". You can switch to "+ New Client" above.
                          </div>
                        ) : (
                          filteredCustomers.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => handleSelectCustomer(c)}
                              style={styles.custDropdownRow}
                            >
                              <div>
                                <span style={styles.dropCustName}>{c.name}</span>
                                <span style={styles.dropCustPhone}>({c.phone})</span>
                              </div>
                              <span style={styles.dropCustArea}>{c.area}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Client Fields Form (For new customer or editing existing) */}
              <div style={styles.fieldsGrid2}>
                <div>
                  <label style={styles.fieldLabel}>Client Full Name *</label>
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Ayesha Rahman"
                    style={styles.inputField}
                  />
                </div>
                <div>
                  <label style={styles.fieldLabel}>Primary Phone *</label>
                  <input
                    type="text"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="01712-345678"
                    style={styles.inputField}
                  />
                </div>
                <div>
                  <label style={styles.fieldLabel}>Alternative Phone (Optional)</label>
                  <input
                    type="text"
                    value={custAltPhone}
                    onChange={(e) => setCustAltPhone(e.target.value)}
                    placeholder="e.g. spouse or guardian phone"
                    style={styles.inputField}
                  />
                </div>
                <div>
                  <label style={styles.fieldLabel}>Email Address (Optional)</label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="ayesha.rahman@gmail.com"
                    style={styles.inputField}
                  />
                </div>
                <div>
                  <label style={styles.fieldLabel}>Delivery Area *</label>
                  <input
                    type="text"
                    value={custArea}
                    onChange={(e) => setCustArea(e.target.value)}
                    placeholder="e.g. Sector 3, Uttara, Dhaka"
                    style={styles.inputField}
                  />
                </div>
                <div>
                  <label style={styles.fieldLabel}>Full Handover Address *</label>
                  <input
                    type="text"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    placeholder="House 14, Road 7, Sector 3, Uttara"
                    style={styles.inputField}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={styles.fieldLabel}>Client Special Sizing / Operational Notes</label>
                  <input
                    type="text"
                    value={custNotes}
                    onChange={(e) => setCustNotes(e.target.value)}
                    placeholder="e.g. Baby sizing preferences, delicate fabric sensitivities"
                    style={styles.inputField}
                  />
                </div>
              </div>
            </section>

            {/* SECTION 2: PRODUCT ITEMS SELECTION */}
            <section style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionNum}>2</span>
                <h3 style={styles.sectionTitle}>Order Items & Specifications</h3>
                <span style={styles.itemCountBadge}>{items.length} item(s) in docket</span>
              </div>

              {/* Items Table */}
              {items.length > 0 && (
                <div style={styles.itemsTableWrapper}>
                  <table style={styles.itemsTable}>
                    <thead>
                      <tr style={styles.tableHeaderRow}>
                        <th style={styles.th}>Product Item</th>
                        <th style={styles.th}>Custom Details</th>
                        <th style={styles.th}>Unit Price</th>
                        <th style={styles.th}>Qty</th>
                        <th style={styles.th}>Subtotal</th>
                        <th style={styles.th}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={idx} style={styles.tableRow}>
                          <td style={styles.tdBold}>{it.product_name}</td>
                          <td style={styles.td}>
                            {it.category === 'dress' && it.selected_size && (
                              <span style={styles.tagPill}>Size: {it.selected_size}</span>
                            )}
                            {it.category === 'cake' && (
                              <div style={styles.cakeSpecBlock}>
                                {it.cake_weight && <span style={styles.tagPill}>{it.cake_weight}</span>}
                                {it.cake_flavor && <span style={styles.flavorText}>{it.cake_flavor}</span>}
                                {it.cake_message && (
                                  <span style={styles.cakeMsgText}>Msg: "{it.cake_message}"</span>
                                )}
                              </div>
                            )}
                            {it.special_instructions && (
                              <span style={styles.noteText}>Note: {it.special_instructions}</span>
                            )}
                          </td>
                          <td style={styles.td}>৳ {it.unit_price.toLocaleString()}</td>
                          <td style={styles.td}>{it.quantity}</td>
                          <td style={styles.tdBold}>৳ {it.subtotal.toLocaleString()}</td>
                          <td style={styles.td}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              style={styles.removeItemBtn}
                              title="Remove item"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add New Line Item Box */}
              <div style={styles.addItemBox}>
                <h4 style={styles.addItemTitle}>+ Add Product Line Item</h4>

                {/* Preset Catalog Dropdown */}
                {catalogProducts.length > 0 && (
                  <div style={styles.catalogSelectRow}>
                    <label style={styles.fieldLabel}>Select From Catalog Preset:</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      style={styles.selectField}
                    >
                      <option value="">-- Choose existing dress or cake --</option>
                      {catalogProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.category.toUpperCase()}] {p.name} - ৳ {Number(p.price).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={styles.fieldsGrid3}>
                  <div>
                    <label style={styles.fieldLabel}>Category *</label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value as 'dress' | 'cake')}
                      style={styles.selectField}
                    >
                      <option value="dress">Handmade Dress</option>
                      <option value="cake">Celebration Cake</option>
                    </select>
                  </div>

                  <div>
                    <label style={styles.fieldLabel}>Product / Item Title *</label>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g. Aurelia Floral Smocked Dress"
                      style={styles.inputField}
                    />
                  </div>

                  <div>
                    <label style={styles.fieldLabel}>Unit Price (৳) *</label>
                    <input
                      type="number"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(Number(e.target.value))}
                      style={styles.inputField}
                    />
                  </div>
                </div>

                {/* Category-Specific Option Inputs */}
                {itemCategory === 'dress' ? (
                  <div style={styles.fieldsGrid2}>
                    <div>
                      <label style={styles.fieldLabel}>Dress Sizing *</label>
                      <select
                        value={itemSize}
                        onChange={(e) => setItemSize(e.target.value)}
                        style={styles.selectField}
                      >
                        {COMMON_DRESS_SIZES.map((sz) => (
                          <option key={sz} value={sz}>
                            {sz}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={styles.fieldLabel}>Special Tailoring / Smocking Instructions</label>
                      <input
                        type="text"
                        value={itemSpecialNotes}
                        onChange={(e) => setItemSpecialNotes(e.target.value)}
                        placeholder="e.g. French lace trims, extra 1 inch hem"
                        style={styles.inputField}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={styles.fieldsGrid3}>
                    <div>
                      <label style={styles.fieldLabel}>Cake Weight *</label>
                      <select
                        value={itemWeight}
                        onChange={(e) => setItemWeight(e.target.value)}
                        style={styles.selectField}
                      >
                        {COMMON_CAKE_WEIGHTS.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={styles.fieldLabel}>Flavor Profile</label>
                      <select
                        value={itemFlavor}
                        onChange={(e) => setItemFlavor(e.target.value)}
                        style={styles.selectField}
                      >
                        {COMMON_CAKE_FLAVORS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={styles.fieldLabel}>Custom Calligraphy / Message</label>
                      <input
                        type="text"
                        value={itemCakeMsg}
                        onChange={(e) => setItemCakeMsg(e.target.value)}
                        placeholder="e.g. Happy 1st Birthday Zaara!"
                        style={styles.inputField}
                      />
                    </div>
                  </div>
                )}

                <div style={styles.addItemFooter}>
                  <div style={styles.qtyRow}>
                    <label style={styles.fieldLabel}>Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                      style={styles.qtyInput}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    style={styles.addToListBtn}
                  >
                    + Add Item to Docket
                  </button>
                </div>
              </div>
            </section>

            {/* SECTION 3: DELIVERY & SCHEDULING */}
            <section style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionNum}>3</span>
                <h3 style={styles.sectionTitle}>Delivery & Handover Logistics</h3>
              </div>

              <div style={styles.fieldsGrid3}>
                <div>
                  <label style={styles.fieldLabel}>Scheduled Delivery Date *</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    style={styles.inputField}
                  />
                </div>
                <div>
                  <label style={styles.fieldLabel}>Delivery Time Slot</label>
                  <select
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    style={styles.selectField}
                  >
                    <option value="Morning Slot (10 AM - 1 PM)">Morning Slot (10 AM - 1 PM)</option>
                    <option value="Afternoon Slot (2 PM - 6 PM)">Afternoon Slot (2 PM - 6 PM)</option>
                    <option value="Evening Slot (6 PM - 9 PM)">Evening Slot (6 PM - 9 PM)</option>
                    <option value="Specific Studio Pickup (11 AM - 7 PM)">Specific Studio Pickup</option>
                  </select>
                </div>
                <div>
                  <label style={styles.fieldLabel}>Delivery Logistics Rate *</label>
                  <select
                    value={deliveryRateType}
                    onChange={(e) => handleDeliveryRateType(e.target.value as any)}
                    style={styles.selectField}
                  >
                    <option value="dhaka">Inside Dhaka Standard (৳ 80)</option>
                    <option value="outside">Outside Dhaka Courier (৳ 150)</option>
                    <option value="cake_van">Fresh Cake Chilled Van (৳ 250)</option>
                    <option value="pickup">Studio Self-Pickup (৳ 0)</option>
                    <option value="custom">Custom Rate</option>
                  </select>
                </div>
              </div>

              {deliveryRateType === 'custom' && (
                <div style={{ marginTop: '10px', maxWidth: '240px' }}>
                  <label style={styles.fieldLabel}>Custom Delivery Charge (৳)</label>
                  <input
                    type="number"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(Math.max(0, Number(e.target.value)))}
                    style={styles.inputField}
                  />
                </div>
              )}

              <div style={{ marginTop: '12px' }}>
                <label style={styles.fieldLabel}>Special Logistics / Packaging Notes</label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Handle with care, fragile sugar floral decor, call 10 mins before arrival"
                  style={styles.inputField}
                />
              </div>
            </section>

            {/* SECTION 4: FINANCIALS & BKASH ADVANCE */}
            <section style={styles.formSection}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionNum}>4</span>
                <h3 style={styles.sectionTitle}>Financials & bKash Advance</h3>
              </div>

              {/* Live Tally Cards */}
              <div style={styles.tallyGrid}>
                <div style={styles.tallyCard}>
                  <span style={styles.tallyLabel}>Items Subtotal</span>
                  <span style={styles.tallyVal}>৳ {subtotal.toLocaleString()}</span>
                </div>
                <div style={styles.tallyCard}>
                  <span style={styles.tallyLabel}>Delivery Charge</span>
                  <span style={styles.tallyVal}>৳ {deliveryCharge.toLocaleString()}</span>
                </div>
                <div style={{ ...styles.tallyCard, borderColor: '#5c3e36' }}>
                  <span style={styles.tallyLabel}>Total Order Amount</span>
                  <span style={{ ...styles.tallyVal, color: '#432821', fontWeight: 'bold' }}>
                    ৳ {totalAmount.toLocaleString()}
                  </span>
                </div>
                <div style={{ ...styles.tallyCard, backgroundColor: '#f5f3ef' }}>
                  <span style={styles.tallyLabel}>Remaining Cash Due (COD)</span>
                  <span style={{ ...styles.tallyVal, color: '#7e544f', fontWeight: 'bold' }}>
                    ৳ {cashDue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Advance Amount and Payment Record Fields */}
              <div style={styles.advanceConfigBox}>
                <div style={styles.fieldsGrid2}>
                  <div>
                    <label style={styles.fieldLabel}>Advance Amount (৳)</label>
                    <input
                      type="number"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(Math.max(0, Number(e.target.value)))}
                      style={styles.inputField}
                    />
                    <span style={styles.hintText}>Standard minimum advance deposit is ৳ 500.</span>
                  </div>

                  <div>
                    <label style={styles.fieldLabel}>Payment Channel</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      style={styles.selectField}
                    >
                      <option value="bkash">bKash Mobile Deposit</option>
                      <option value="cash_on_delivery">Full Cash on Delivery (COD)</option>
                      <option value="manual_adjustment">Direct Studio Handover / Bank</option>
                    </select>
                  </div>
                </div>

                {advanceAmount > 0 && paymentMethod === 'bkash' && (
                  <div style={styles.bkashInputGrid}>
                    <div>
                      <label style={styles.fieldLabel}>bKash TrxID *</label>
                      <input
                        type="text"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                        placeholder="e.g. 9K28FD4A"
                        style={styles.inputField}
                      />
                    </div>
                    <div>
                      <label style={styles.fieldLabel}>Sender Last 4 Digits *</label>
                      <input
                        type="text"
                        value={senderLast4}
                        onChange={(e) => setSenderLast4(e.target.value)}
                        placeholder="e.g. 5678"
                        maxLength={4}
                        style={styles.inputField}
                      />
                    </div>
                    <div>
                      <label style={styles.fieldLabel}>Payment Reference Name</label>
                      <input
                        type="text"
                        value={referenceName}
                        onChange={(e) => setReferenceName(e.target.value)}
                        placeholder="e.g. Client Name or Order Note"
                        style={styles.inputField}
                      />
                    </div>
                  </div>
                )}

                {advanceAmount > 0 && (
                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={advanceVerified}
                      onChange={(e) => setAdvanceVerified(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={styles.checkboxLabel}>
                      <strong>Mark Advance Verified immediately</strong> (Advance is confirmed deposited in studio account; sets initial status to "Advance Verified")
                    </span>
                  </label>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Modal Bottom Actions Footer */}
        {!createdOrderSuccess && (
          <footer style={styles.modalFooter}>
            <div style={styles.footerSummary}>
              <span>Total: <strong>৳ {totalAmount.toLocaleString()}</strong></span>
              <span>Advance: <strong>৳ {advanceAmount.toLocaleString()}</strong></span>
              <span>COD Due: <strong style={{ color: '#7e544f' }}>৳ {cashDue.toLocaleString()}</strong></span>
            </div>

            <div style={styles.footerBtns}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting || items.length === 0}
                style={{
                  ...styles.submitBtn,
                  opacity: isSubmitting || items.length === 0 ? 0.6 : 1,
                  cursor: isSubmitting || items.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Generating Order Docket...' : 'Confirm & Place Manual Order'}
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(43, 24, 19, 0.65)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 20px 40px rgba(67, 40, 33, 0.25)',
    maxWidth: '920px',
    width: '100%',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid #d4c3bf',
  },
  modalHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #eae8e4',
    backgroundColor: '#fbf9f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerIcon: {
    fontFamily: 'Material Symbols Outlined',
    fontSize: '26px',
    color: '#432821',
    backgroundColor: '#ffdbd1',
    padding: '6px',
    borderRadius: '6px',
  },
  headerBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#432821',
    fontFamily: 'Bodoni Moda, serif',
    margin: 0,
  },
  atelierPill: {
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#ffdbd1',
    color: '#2d150f',
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: '12px',
    color: '#827470',
    margin: '2px 0 0 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#827470',
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: '4px',
  },
  scrollableContent: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  errorAlert: {
    backgroundColor: '#ffdad6',
    border: '1px solid #ba1a1a',
    borderRadius: '6px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#93000a',
    fontSize: '13px',
    fontWeight: '500',
  },
  errorIcon: {
    fontFamily: 'Material Symbols Outlined',
    fontSize: '20px',
  },
  errorText: {
    flex: 1,
  },
  formSection: {
    border: '1px solid #eae8e4',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    padding: '16px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '14px',
    borderBottom: '1px solid #f5f3ef',
    paddingBottom: '10px',
  },
  sectionNum: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: '#432821',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#432821',
    margin: 0,
    flex: 1,
  },
  modeToggleGroup: {
    display: 'flex',
    backgroundColor: '#f5f3ef',
    padding: '2px',
    borderRadius: '4px',
    gap: '2px',
  },
  modeToggleBtn: {
    border: 'none',
    background: 'none',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#827470',
    borderRadius: '3px',
    cursor: 'pointer',
  },
  modeToggleActive: {
    backgroundColor: '#ffffff',
    color: '#432821',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  itemCountBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#7e544f',
    backgroundColor: '#ffdad6',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  existingCustomerSearchBox: {
    marginBottom: '14px',
  },
  selectedCustomerCard: {
    backgroundColor: '#f5f3ef',
    border: '1px solid #d4c3bf',
    borderRadius: '6px',
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  selectedCustNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  selectedCustName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#432821',
  },
  selectedCustType: {
    fontSize: '10px',
    backgroundColor: '#ffdbd1',
    color: '#2d150f',
    padding: '1px 6px',
    borderRadius: '3px',
    fontWeight: '600',
  },
  selectedCustMeta: {
    fontSize: '12px',
    color: '#504441',
    margin: '3px 0 0 0',
  },
  selectedCustAddr: {
    fontSize: '11px',
    color: '#827470',
    margin: '3px 0 0 0',
  },
  changeCustBtn: {
    border: '1px solid #d4c3bf',
    backgroundColor: '#ffffff',
    color: '#432821',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '600',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  searchWrapper: {
    marginBottom: '6px',
  },
  customerDropdownList: {
    maxHeight: '130px',
    overflowY: 'auto',
    border: '1px solid #d4c3bf',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
  },
  custDropdownRow: {
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    borderBottom: '1px solid #f5f3ef',
    fontSize: '12px',
  },
  dropCustName: {
    fontWeight: '600',
    color: '#432821',
    marginRight: '6px',
  },
  dropCustPhone: {
    color: '#827470',
  },
  dropCustArea: {
    fontSize: '11px',
    color: '#7e544f',
  },
  emptyCustMsg: {
    padding: '12px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#827470',
  },
  fieldsGrid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  fieldsGrid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: '#504441',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginBottom: '4px',
  },
  inputField: {
    width: '100%',
    padding: '8px 10px',
    fontSize: '13px',
    border: '1px solid #d4c3bf',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    color: '#1b1c1a',
    boxSizing: 'border-box',
    outline: 'none',
  },
  selectField: {
    width: '100%',
    padding: '8px 10px',
    fontSize: '13px',
    border: '1px solid #d4c3bf',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    color: '#1b1c1a',
    boxSizing: 'border-box',
    outline: 'none',
  },
  itemsTableWrapper: {
    marginBottom: '16px',
    overflowX: 'auto',
  },
  itemsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  },
  tableHeaderRow: {
    backgroundColor: '#f5f3ef',
    borderBottom: '1px solid #d4c3bf',
  },
  th: {
    padding: '8px 10px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#504441',
  },
  tableRow: {
    borderBottom: '1px solid #eae8e4',
  },
  td: {
    padding: '8px 10px',
    verticalAlign: 'top',
    color: '#1b1c1a',
  },
  tdBold: {
    padding: '8px 10px',
    fontWeight: '600',
    color: '#432821',
    verticalAlign: 'top',
  },
  tagPill: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: '600',
    backgroundColor: '#ffdbd1',
    color: '#2d150f',
    padding: '1px 5px',
    borderRadius: '3px',
    marginRight: '4px',
  },
  cakeSpecBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  flavorText: {
    fontSize: '11px',
    color: '#504441',
  },
  cakeMsgText: {
    fontSize: '11px',
    fontStyle: 'italic',
    color: '#7e544f',
  },
  noteText: {
    display: 'block',
    fontSize: '11px',
    color: '#827470',
    marginTop: '2px',
  },
  removeItemBtn: {
    border: 'none',
    background: 'none',
    color: '#ba1a1a',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: '4px 6px',
  },
  addItemBox: {
    backgroundColor: '#fbf9f5',
    border: '1px dashed #d4c3bf',
    borderRadius: '6px',
    padding: '14px',
  },
  addItemTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#432821',
    margin: '0 0 10px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  catalogSelectRow: {
    marginBottom: '12px',
  },
  addItemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    paddingTop: '10px',
    borderTop: '1px solid #eae8e4',
  },
  qtyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  qtyInput: {
    width: '60px',
    padding: '6px',
    fontSize: '13px',
    border: '1px solid #d4c3bf',
    borderRadius: '4px',
  },
  addToListBtn: {
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  tallyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px',
    marginBottom: '16px',
  },
  tallyCard: {
    border: '1px solid #eae8e4',
    borderRadius: '6px',
    padding: '10px',
    backgroundColor: '#ffffff',
  },
  tallyLabel: {
    display: 'block',
    fontSize: '10px',
    fontWeight: '600',
    color: '#827470',
    textTransform: 'uppercase',
  },
  tallyVal: {
    fontSize: '15px',
    color: '#1b1c1a',
    marginTop: '2px',
    display: 'block',
  },
  advanceConfigBox: {
    backgroundColor: '#fbf9f5',
    border: '1px solid #eae8e4',
    borderRadius: '6px',
    padding: '14px',
  },
  bkashInputGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #eae8e4',
  },
  hintText: {
    display: 'block',
    fontSize: '10px',
    color: '#827470',
    marginTop: '3px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '14px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '12px',
    color: '#432821',
  },
  modalFooter: {
    padding: '14px 20px',
    backgroundColor: '#fbf9f5',
    borderTop: '1px solid #eae8e4',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  footerSummary: {
    display: 'flex',
    gap: '14px',
    fontSize: '12px',
    color: '#504441',
  },
  footerBtns: {
    display: 'flex',
    gap: '10px',
  },
  cancelBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #d4c3bf',
    color: '#504441',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  submitBtn: {
    backgroundColor: '#432821',
    color: '#ffffff',
    border: 'none',
    padding: '8px 20px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '4px',
  },
  successContainer: {
    padding: '30px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  successIconCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#065f46',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  successHeading: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#432821',
    fontFamily: 'Bodoni Moda, serif',
    margin: 0,
  },
  successInvoicePill: {
    backgroundColor: '#ffdbd1',
    color: '#2d150f',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '13px',
  },
  successDetailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    maxWidth: '460px',
    width: '100%',
    margin: '10px auto',
    textAlign: 'left',
  },
  successCell: {
    backgroundColor: '#f5f3ef',
    padding: '10px 12px',
    borderRadius: '4px',
  },
  successLabel: {
    display: 'block',
    fontSize: '10px',
    color: '#827470',
    textTransform: 'uppercase',
  },
  successVal: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#432821',
    marginTop: '2px',
  },
  successNote: {
    fontSize: '12px',
    color: '#827470',
    maxWidth: '460px',
  },
  successActionsRow: {
    marginTop: '10px',
  },
  doneBtn: {
    backgroundColor: '#432821',
    color: '#ffffff',
    border: 'none',
    padding: '10px 24px',
    fontSize: '13px',
    fontWeight: '700',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
