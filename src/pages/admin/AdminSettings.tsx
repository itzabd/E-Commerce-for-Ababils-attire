/**
 * Ababil’s Attire by Sanjida Bethi
 * Phase 10: Admin Settings Page
 * Mirrors Stitch Screen c30fe545bc6841fbbf2cb1469c712003
 *
 * Implements:
 * - Store Information (Name, phone, WhatsApp, workshop address, description, hours, socials)
 * - Payment & bKash Advance Settings (bKash number, ৳500 minimum advance, required fields, instructions)
 * - Delivery & Courier Settings (Inside Dhaka ৳80, Outside ৳150, Chilled Van ৳250, days, time slots, studio pickup)
 * - Order Rules & Lead Times (Invoice prefix AB-, cancellation policy, cake notice, dress lead time)
 * - Product Defaults & Sizing (Dress sizes, cake weights, category presets, default status)
 * - Admin Account & Security (Admin profile, change password dialog, sign out)
 * - Unsaved changes detection, sticky bottom save bar, and rollback/discard controls
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { settingsService } from '../../services/settings.service';
import { storageService } from '../../services/storage.service';
import { reviewsService, type CustomerReview } from '../../services/reviews.service';
import type { StoreSettings } from '../../types';
import { convertToCSV, downloadFile } from '../../lib/csv';
import { ImageCropper } from '../../components/admin/ImageCropper';

export const AdminSettings: React.FC = () => {
  const { admin, user, signOut } = useAuth();
  const navigate = useNavigate();

  // Settings State
  const [initialSettings, setInitialSettings] = useState<StoreSettings | null>(null);
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active section scroll indicator
  const [activeSection, setActiveSection] = useState<string>('store-info');

  // Customer Reviews State (Screenshots from Facebook / WhatsApp)
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    customer_name: '',
    customer_area: '',
    platform: 'whatsapp' as 'whatsapp' | 'facebook' | 'instagram',
    screenshot_url: '',
    caption: '',
    product_name: '',
    rating: 5,
    is_featured: true,
  });

  // Preset screenshot recommendations for quick one-click preview testing
  const PRESET_SCREENSHOTS = [
    {
      label: 'Baby Smocked Dress (WhatsApp)',
      url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80',
      product: 'Aurelia Floral Smocked Dress',
      platform: 'whatsapp' as const,
      quote: '“Everyone praised Inaya’s dress at the dawat! Fabric was so soft and gentle!”',
    },
    {
      label: 'Vintage Lambeth Cake (Facebook)',
      url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=900&q=80',
      product: 'Vintage Lambeth Celebration Cake',
      platform: 'facebook' as const,
      quote: '“Cake was heavenly, arrived safely in chilled van right on time!”',
    },
    {
      label: 'Eyelet Romper (WhatsApp)',
      url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=900&q=80',
      product: 'Zoya Dusty Rose Eyelet Romper',
      platform: 'whatsapp' as const,
      quote: '“Mother-of-pearl buttons and neat French seams. Perfect 1st birthday shoot!”',
    },
    {
      label: 'Daisy Bento Cake Bundle (Facebook)',
      url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80',
      product: 'Pastel Daisy Bento Cake & Romper Bundle',
      platform: 'facebook' as const,
      quote: '“Personal phone call from Sanjida to confirm measurements. Best boutique in Dhaka!”',
    },
  ];

  // New size / weight addition inputs
  const [newSizeInput, setNewSizeInput] = useState('');
  const [showAddSize, setShowAddSize] = useState(false);
  const [newWeightInput, setNewWeightInput] = useState('');
  const [showAddWeight, setShowAddWeight] = useState(false);

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Handle Logo Upload from Local Device
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const uploadedUrl = await storageService.uploadLogoImage(file);
      setForm((prev) => (prev ? { ...prev, logo_url: uploadedUrl } : prev));
      // Save immediately so it applies across the whole website right now!
      await settingsService.updateSettings({ logo_url: uploadedUrl });
      showToast('Brand logo uploaded and applied immediately across the storefront!');
    } catch (err: any) {
      console.error('Logo upload error:', err);
      showToast(err.message || 'Failed to upload logo image.');
    } finally {
      setIsUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  // Revert back to default AB Monogram Crest
  const handleRemoveLogo = async () => {
    if (window.confirm('Remove custom logo and revert to the signature "AB" monogram crest?')) {
      setForm((prev) => (prev ? { ...prev, logo_url: null } : prev));
      await settingsService.updateSettings({ logo_url: null });
      showToast('Custom logo removed. Default signature crest restored.');
    }
  };

  // Load Settings from service
  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getSettings();
      setInitialSettings(data);
      setForm(JSON.parse(JSON.stringify(data)));
    } catch (err) {
      console.error('Failed to load settings:', err);
      showToast('Could not load settings from server. Using local defaults.');
    } finally {
      setLoading(false);
    }
  };

  // Image Upload States
  const [uploadingBannerField, setUploadingBannerField] = useState<string | null>(null);
  const [croppingField, setCroppingField] = useState<{ field: keyof StoreSettings, file: File, aspect: number } | null>(null);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof StoreSettings, aspect: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (JPG, PNG, WEBP).');
        return;
      }
      setCroppingField({ field, file, aspect });
    }
    // Clear input so re-selecting same image triggers onChange
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleCroppedImage = async (croppedBlob: Blob | File) => {
    if (!croppingField || !form) return;
    const { field, file } = croppingField;
    setCroppingField(null);
    setUploadingBannerField(field);

    try {
      const croppedFile = croppedBlob instanceof File 
        ? croppedBlob 
        : new File([croppedBlob], `banner_${field}_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const publicUrl = await storageService.uploadGeneralImage(croppedFile, 'banners');
      
      // Auto-save immediately to store settings so it's live across the storefront right away
      const updated = await settingsService.updateSettings({ [field]: publicUrl });
      setInitialSettings(updated);
      setForm(JSON.parse(JSON.stringify(updated)));
      showToast(`${field.replace(/_/g, ' ')} uploaded and published live!`);
    } catch (err: any) {
      console.error('Banner upload error:', err);
      showToast(`Upload failed: ${err.message || 'Error uploading banner'}`);
    } finally {
      setUploadingBannerField(null);
    }
  };

  // Load Customer Screenshot Reviews
  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const data = await reviewsService.getReviews();
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadReviews();
  }, []);

  // Compute Unsaved Changes
  const unsavedCount = useMemo(() => {
    if (!initialSettings || !form) return 0;
    let count = 0;
    const keys = Object.keys(form) as (keyof StoreSettings)[];
    for (const key of keys) {
      if (key === 'updated_at' || key === 'id' || key === 'created_at') continue;
      const initialVal = JSON.stringify(initialSettings[key]);
      const currentVal = JSON.stringify(form[key]);
      if (initialVal !== currentVal) {
        count++;
      }
    }
    return count;
  }, [initialSettings, form]);

  const hasUnsavedChanges = unsavedCount > 0;

  // Save Settings
  const handleSave = async () => {
    if (!form) return;
    setIsSaving(true);
    try {
      const updated = await settingsService.updateSettings(form);
      setInitialSettings(updated);
      setForm(JSON.parse(JSON.stringify(updated)));
      showToast('Store settings successfully updated and deployed.');
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      showToast(err.message || 'Error saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Discard Changes
  const handleDiscard = () => {
    if (window.confirm('Discard all unsaved boutique settings changes? Unsaved edits will be reverted.')) {
      if (initialSettings) {
        setForm(JSON.parse(JSON.stringify(initialSettings)));
      }
      showToast('Unsaved changes discarded.');
    }
  };

  // Reset Delivery Rates
  const handleResetDeliveryRates = async () => {
    if (
      window.confirm(
        'Reset all delivery rates back to default Dhaka studio rates (৳80 Inside Dhaka, ৳150 Outside Dhaka, ৳250 Cake Van)?'
      )
    ) {
      if (form) {
        setForm({
          ...form,
          delivery_inside_dhaka: 80,
          delivery_outside_dhaka: 150,
          delivery_cake_van: 250,
        });
        showToast('Delivery rates reset to defaults. Click Save to persist.');
      }
    }
  };

  // Toggle delivery day
  const handleToggleDeliveryDay = (day: string) => {
    if (!form) return;
    const currentDays = form.available_delivery_days || [];
    const exists = currentDays.includes(day);
    const updated = exists ? currentDays.filter((d) => d !== day) : [...currentDays, day];
    setForm({ ...form, available_delivery_days: updated });
  };

  const handleExportData = async (type: 'customers' | 'orders' | 'products' | 'settings') => {
    try {
      let data: any[] = [];
      let filename = '';
      
      switch (type) {
        case 'customers': {
          const m = await import('../../services/admin.service');
          const resp = await m.adminService.getCustomersDirectory();
          data = resp.customers;
          filename = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        }
        case 'orders': {
          const m = await import('../../services/orders.service');
          data = await m.ordersService.getOrdersAdmin();
          filename = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        }
        case 'products': {
          const m = await import('../../services/products.service');
          data = await m.productsService.getAllProductsAdmin();
          filename = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        }
        case 'settings': {
          data = [await settingsService.getSettings()];
          filename = `store_settings_export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        }
      }
      
      const csvStr = convertToCSV(data);
      downloadFile(csvStr, filename);
      
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully!`);
    } catch (err: any) {
      console.error(`Failed to export ${type}:`, err);
      showToast(`Export failed: ${err.message}`);
    }
  };

  // Add custom dress size
  const handleAddSize = () => {
    if (!newSizeInput.trim() || !form) return;
    const val = newSizeInput.trim();
    if (!form.preconfigured_sizes.includes(val)) {
      setForm({ ...form, preconfigured_sizes: [...form.preconfigured_sizes, val] });
    }
    setNewSizeInput('');
    setShowAddSize(false);
  };

  // Remove dress size
  const handleRemoveSize = (sizeToRemove: string) => {
    if (!form) return;
    setForm({
      ...form,
      preconfigured_sizes: form.preconfigured_sizes.filter((s) => s !== sizeToRemove),
    });
  };

  // Add custom cake weight
  const handleAddWeight = () => {
    if (!newWeightInput.trim() || !form) return;
    const val = newWeightInput.trim();
    if (!form.preconfigured_cake_weights.includes(val)) {
      setForm({ ...form, preconfigured_cake_weights: [...form.preconfigured_cake_weights, val] });
    }
    setNewWeightInput('');
    setShowAddWeight(false);
  };

  // Remove cake weight
  const handleRemoveWeight = (weightToRemove: string) => {
    if (!form) return;
    setForm({
      ...form,
      preconfigured_cake_weights: form.preconfigured_cake_weights.filter((w) => w !== weightToRemove),
    });
  };

  // Add Customer Screenshot Review
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.customer_name.trim() || !reviewForm.screenshot_url.trim() || !reviewForm.caption.trim()) {
      showToast('Please fill in customer name, screenshot image URL, and customer feedback quote.');
      return;
    }

    try {
      await reviewsService.addReview({
        customer_name: reviewForm.customer_name.trim(),
        customer_area: reviewForm.customer_area.trim() || 'Dhaka, Bangladesh',
        platform: reviewForm.platform,
        screenshot_url: reviewForm.screenshot_url.trim(),
        caption: reviewForm.caption.trim(),
        product_name: reviewForm.product_name.trim() || 'Boutique Creation',
        rating: Number(reviewForm.rating) || 5,
        date: 'Just now',
        is_featured: reviewForm.is_featured,
      });
      showToast('Customer screenshot review published successfully to storefront!');
      setShowAddReviewModal(false);
      setReviewForm({
        customer_name: '',
        customer_area: '',
        platform: 'whatsapp',
        screenshot_url: '',
        caption: '',
        product_name: '',
        rating: 5,
        is_featured: true,
      });
      await loadReviews();
    } catch (err: any) {
      showToast(err.message || 'Failed to save review.');
    }
  };

  // Delete Customer Screenshot Review
  const handleDeleteReview = async (id: string, name: string) => {
    if (window.confirm(`Delete review screenshot from "${name}"? This will remove it from the public storefront.`)) {
      try {
        await reviewsService.deleteReview(id);
        showToast('Review screenshot deleted.');
        await loadReviews();
      } catch (err: any) {
        console.error('Delete review error:', err);
        showToast('Failed to delete review.');
      }
    }
  };

  // Handle Password Update
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-enter.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await settingsService.updateAdminPassword(newPassword);
      if (res.success) {
        showToast('Admin password changed successfully.');
        setShowPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Password update failed.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out of the Ababil Admin Suite?')) {
      await signOut();
      navigate('/admin/login', { replace: true });
    }
  };

  if (loading || !form) {
    return (
      <div style={styles.loadingContainer}>
        <span className="material-symbols-outlined spin" style={{ fontSize: '36px', color: '#5c3e36' }}>
          progress_activity
        </span>
        <p style={{ marginTop: '12px', color: '#827470', fontSize: '14px' }}>Loading store configuration...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Toast Notification */}
      {toastMessage && <div style={styles.toast}>{toastMessage}</div>}

      {/* Page Header & Unsaved Alert Banner */}
      <section style={styles.topSection}>
        <div style={styles.headerFlex}>
          <div>
            <div style={styles.headerTitleRow}>
              <h1 style={styles.pageTitle}>Store Settings</h1>
              <span style={styles.atelierBadge}>Dhaka Studio</span>
            </div>
            <p style={styles.pageSubtitle}>
              Manage boutique info, bKash advances, Dhaka delivery, lead times & account.
            </p>
          </div>

          <div style={styles.headerActions}>
            {hasUnsavedChanges && (
              <div style={styles.unsavedPill}>
                <span style={styles.pulseDot}></span>
                <span>
                  Unsaved changes: <strong>{unsavedCount} modification(s)</strong>
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              style={{
                ...styles.headerSaveBtn,
                opacity: !hasUnsavedChanges || isSaving ? 0.6 : 1,
                cursor: !hasUnsavedChanges || isSaving ? 'default' : 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                done_all
              </span>
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        {/* Quick Settings Sub-Tab Strip */}
        <div style={styles.tabStrip}>
          <a
            href="#section-store-info"
            onClick={() => setActiveSection('store-info')}
            style={{
              ...styles.tabLink,
              ...(activeSection === 'store-info' ? styles.tabLinkActive : {}),
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              storefront
            </span>
            <span>Store Info</span>
          </a>
          <a
            href="#section-bkash"
            onClick={() => setActiveSection('bkash')}
            style={{
              ...styles.tabLink,
              ...(activeSection === 'bkash' ? styles.tabLinkActive : {}),
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              payments
            </span>
            <span>Payment & bKash</span>
          </a>
          <a
            href="#section-delivery"
            onClick={() => setActiveSection('delivery')}
            style={{
              ...styles.tabLink,
              ...(activeSection === 'delivery' ? styles.tabLinkActive : {}),
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              local_shipping
            </span>
            <span>Delivery</span>
          </a>
          <a
            href="#section-rules"
            onClick={() => setActiveSection('rules')}
            style={{
              ...styles.tabLink,
              ...(activeSection === 'rules' ? styles.tabLinkActive : {}),
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              event_note
            </span>
            <span>Order Rules</span>
          </a>
          <a
            href="#section-defaults"
            onClick={() => setActiveSection('defaults')}
            style={{
              ...styles.tabLink,
              ...(activeSection === 'defaults' ? styles.tabLinkActive : {}),
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              tune
            </span>
            <span>Product Defaults</span>
          </a>
          <a
            href="#section-reviews"
            onClick={() => setActiveSection('reviews')}
            style={{
              ...styles.tabLink,
              ...(activeSection === 'reviews' ? styles.tabLinkActive : {}),
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              rate_review
            </span>
            <span>Customer Reviews</span>
          </a>
          <a
            href="#section-account"
            onClick={() => setActiveSection('account')}
            style={{
              ...styles.tabLink,
              ...(activeSection === 'account' ? styles.tabLinkActive : {}),
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              shield_person
            </span>
            <span>Admin Account</span>
          </a>
        </div>
      </section>

      {/* Main Settings Sections */}
      <main style={styles.mainContent}>
        {/* =================================================================== */}
        {/* SECTION 1: STORE INFORMATION                                        */}
        {/* =================================================================== */}
        <section id="section-store-info" style={styles.sectionCard}>
          <div style={styles.sectionCardHeader}>
            <div style={styles.sectionHeaderLeft}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>
                storefront
              </span>
              <h2 style={styles.sectionCardTitle}>Store Information</h2>
            </div>
            <span style={styles.publicProfileTag}>Public Store Profile</span>
          </div>

          <div style={styles.sectionBody}>
            {/* Brand Crest & Logo Card */}
            <div style={styles.crestCard}>
              <div style={styles.crestBox}>
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt="Brand Logo Preview"
                    style={{
                      maxWidth: '90%',
                      maxHeight: '90%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <span style={styles.crestMonogram}>AB</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <h3 style={styles.crestTitle}>Website Brand Crest &amp; Logo</h3>
                  {form.logo_url ? (
                    <span style={styles.crestActiveBadge}>Custom Logo Active</span>
                  ) : (
                    <span style={{ ...styles.crestActiveBadge, backgroundColor: '#f5f3ef', color: '#6f6764', border: '1px solid #dfd8ce' }}>
                      Default Monogram Active
                    </span>
                  )}
                </div>
                <p style={styles.crestDesc}>
                  Propagates across customer storefront header, admin suite navigation, digital order invoices, and WhatsApp confirmations.
                </p>

                {/* Upload Action Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoFileChange}
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    style={styles.uploadLogoBtn}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {isUploadingLogo ? 'hourglass_top' : 'cloud_upload'}
                    </span>
                    <span>{isUploadingLogo ? 'Uploading Logo...' : form.logo_url ? 'Upload New Logo' : 'Upload Website Logo'}</span>
                  </button>

                  {form.logo_url && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      style={styles.removeLogoBtn}
                      title="Revert to default signature AB monogram"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        restart_alt
                      </span>
                      <span>Reset to Monogram</span>
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#827470' }}>
                    Formats: PNG, JPG, WEBP, or SVG (max 5 MB). Transparent background recommended.
                  </span>
                </div>
              </div>
            </div>

            {/* Store Name & Business Email */}
            <div style={styles.formGrid2}>
              <div>
                <label style={styles.label}>Store Name *</label>
                <input
                  type="text"
                  value={form.store_name}
                  onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Business Email *</label>
                <input
                  type="email"
                  value={form.business_email}
                  onChange={(e) => setForm({ ...form, business_email: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>

            {/* WhatsApp Direct Line & Phone Number */}
            <div style={styles.formGrid2}>
              <div>
                <div style={styles.labelWithSubRow}>
                  <label style={styles.label}>WhatsApp Direct Line *</label>
                  <span style={styles.labelSub}>(primary client inquiry channel)</span>
                </div>
                <div style={styles.inputWithIconWrapper}>
                  <span className="material-symbols-outlined" style={styles.inputIcon}>
                    chat
                  </span>
                  <input
                    type="tel"
                    value={form.whatsapp_number}
                    onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                    style={styles.inputWithPadding}
                  />
                </div>
              </div>
              <div>
                <label style={styles.label}>Contact Phone Number *</label>
                <div style={styles.inputWithIconWrapper}>
                  <span className="material-symbols-outlined" style={styles.inputIcon}>
                    call
                  </span>
                  <input
                    type="tel"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    style={styles.inputWithPadding}
                  />
                </div>
              </div>
            </div>

            {/* Workshop & Kitchen Studio Address */}
            <div>
              <label style={styles.label}>Workshop & Kitchen Studio Address *</label>
              <input
                type="text"
                value={form.workshop_address}
                onChange={(e) => setForm({ ...form, workshop_address: e.target.value })}
                style={styles.input}
              />
              <span style={styles.inputHint}>
                Used for customer studio self-pickup and delivery rider dispatches.
              </span>
            </div>

            {/* Store Description */}
            <div>
              <label style={styles.label}>Store Description</label>
              <textarea
                rows={2}
                value={form.store_description}
                onChange={(e) => setForm({ ...form, store_description: e.target.value })}
                style={styles.textarea}
              />
            </div>

            {/* Studio Working Hours */}
            <div>
              <label style={styles.label}>Studio Working Hours</label>
              <input
                type="text"
                value={form.studio_hours}
                onChange={(e) => setForm({ ...form, studio_hours: e.target.value })}
                style={styles.input}
              />
            </div>

            {/* Social Links */}
            <div style={styles.formGrid2}>
              <div>
                <label style={styles.label}>Instagram Handle</label>
                <div style={styles.inputWithIconWrapper}>
                  <span style={styles.prefixAt}>@</span>
                  <input
                    type="text"
                    value={form.instagram_handle}
                    onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })}
                    style={styles.inputWithPadding}
                  />
                </div>
              </div>
              <div>
                <label style={styles.label}>Facebook Page URL</label>
                <input
                  type="text"
                  value={form.facebook_url}
                  onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* SECTION 1.5: HOME PAGE BANNERS                                      */}
        {/* =================================================================== */}
        <section id="section-banners" style={styles.sectionCard}>
          <div style={styles.sectionCardHeader}>
            <div style={styles.sectionHeaderLeft}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>
                image
              </span>
              <h2 style={styles.sectionCardTitle}>Home Page Banners</h2>
            </div>
          </div>
          
          <div style={styles.sectionBody}>
            <p style={{ ...styles.secDesc, marginBottom: '16px' }}>Upload and crop images directly for your storefront banners. Images are automatically cropped to the perfect size.</p>
            
            <div style={styles.formGrid2}>
              {(() => {
                const renderBannerUpload = (
                  field: keyof StoreSettings,
                  label: string,
                  aspectRatio: number,
                  imageUrl?: string | null,
                ) => {
                  const isUploading = uploadingBannerField === field;
                  return (
                    <div>
                      <label style={styles.label}>{label}</label>
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: `${aspectRatio}`,
                        borderRadius: '8px',
                        border: '2px dashed #d9cbbf',
                        backgroundColor: '#faf7f3',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                      }}>
                        {isUploading ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#8a6552' }}>
                            <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>Processing...</span>
                          </div>
                        ) : (
                          <>
                            {imageUrl ? (
                              <img src={imageUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#a68a7c' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>add_photo_alternate</span>
                                <span style={{ fontSize: '13px', fontWeight: 500 }}>Click to Upload</span>
                              </div>
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleBannerFileChange(e, field, aspectRatio)} 
                              style={{
                                position: 'absolute',
                                top: 0, left: 0, width: '100%', height: '100%',
                                opacity: 0, cursor: 'pointer',
                                zIndex: 10
                              }}
                              title={imageUrl ? "Change Image" : "Upload Image"}
                            />
                            {imageUrl && (
                              <div style={{
                                position: 'absolute',
                                bottom: 0, left: 0, width: '100%',
                                padding: '12px 8px 8px',
                                background: 'linear-gradient(transparent, rgba(67, 40, 33, 0.7))',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                pointerEvents: 'none',
                                zIndex: 5
                              }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                                Click to Change Image
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                };

                return (
                  <>
                    {renderBannerUpload('hero_banner_url', 'Top Hero Banner (3:2 Ratio)', 3/2, form.hero_banner_url)}
                    {renderBannerUpload('dresses_collection_url', 'Dresses Collection Card (1:1 Ratio)', 1/1, form.dresses_collection_url)}
                    {renderBannerUpload('cakes_collection_url', 'Cakes Collection Card (1:1 Ratio)', 1/1, form.cakes_collection_url)}
                  </>
                );
              })()}
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* SECTION 2: PAYMENT & BKASH ADVANCE SETTINGS                         */}
        {/* =================================================================== */}
        <section id="section-bkash" style={styles.sectionCard}>
          <div style={styles.sectionCardHeader}>
            <div style={styles.sectionHeaderLeft}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>
                account_balance_wallet
              </span>
              <h2 style={styles.sectionCardTitle}>Payment & bKash Advance Settings</h2>
            </div>
            <span style={styles.activeBdBadge}>Active BD Gateway</span>
          </div>

          <div style={styles.sectionBody}>
            {/* Operational Info Banner */}
            <div style={styles.infoBanner}>
              <span className="material-symbols-outlined" style={styles.infoIcon}>
                info
              </span>
              <div>
                <h4 style={styles.infoTitle}>Customer Advance & Cash on Delivery (COD) Model</h4>
                <p style={styles.infoDesc}>
                  Customers pay a minimum advance via bKash to confirm dress cutting or cake baking; remainder collected upon delivery.
                </p>
              </div>
            </div>

            {/* bKash Number & Advance Amount */}
            <div style={styles.formGrid2}>
              <div>
                <div style={styles.labelWithSubRow}>
                  <label style={styles.label}>bKash Personal / Merchant Number *</label>
                  <span style={styles.bkashTag}>Personal (Send Money)</span>
                </div>
                <div style={styles.inputWithIconWrapper}>
                  <span style={styles.bkashPrefix}>bKash</span>
                  <input
                    type="text"
                    value={form.bkash_number}
                    onChange={(e) => setForm({ ...form, bkash_number: e.target.value })}
                    style={{ ...styles.inputWithPadding, paddingLeft: '56px', fontWeight: '600' }}
                  />
                </div>
                <span style={styles.inputHint}>Client bKash payment line displayed on /checkout.</span>
              </div>

              <div>
                <label style={styles.label}>Minimum Advance Required (৳) *</label>
                <div style={styles.inputWithIconWrapper}>
                  <span style={styles.currencyPrefix}>৳</span>
                  <input
                    type="number"
                    value={form.minimum_advance_amount}
                    onChange={(e) => setForm({ ...form, minimum_advance_amount: Math.max(0, Number(e.target.value)) })}
                    style={{ ...styles.inputWithPadding, paddingLeft: '32px', fontWeight: '600' }}
                  />
                </div>
                <span style={styles.inputHint}>Locks the custom fabric tailoring or oven baking slot.</span>
              </div>
            </div>

            {/* Required Customer Verification Fields */}
            <div style={styles.verificationCard}>
              <h4 style={styles.verificationTitle}>Required Customer Verification Fields</h4>
              <div style={styles.checkboxGrid}>
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={form.require_trx_id}
                    onChange={(e) => setForm({ ...form, require_trx_id: e.target.checked })}
                    style={styles.checkbox}
                  />
                  <span>
                    Transaction ID (TrxID) <strong style={{ color: '#7e544f' }}>[Required]</strong>
                  </span>
                </label>
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={form.require_sender_last4}
                    onChange={(e) => setForm({ ...form, require_sender_last4: e.target.checked })}
                    style={styles.checkbox}
                  />
                  <span>
                    Last 4 digits of sender <strong style={{ color: '#7e544f' }}>[Required]</strong>
                  </span>
                </label>
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={form.require_reference_name}
                    onChange={(e) => setForm({ ...form, require_reference_name: e.target.checked })}
                    style={styles.checkbox}
                  />
                  <span>
                    Sender Name / Note <strong style={{ color: '#7e544f' }}>[Required]</strong>
                  </span>
                </label>
              </div>
            </div>

            {/* Customer Checkout Instructions Note */}
            <div>
              <label style={styles.label}>Customer Checkout Instructions Note</label>
              <textarea
                rows={2}
                value={form.payment_instructions}
                onChange={(e) => setForm({ ...form, payment_instructions: e.target.value })}
                style={styles.textarea}
              />
            </div>

            {/* Remaining Balance Policy */}
            <div>
              <label style={styles.label}>Remaining Balance Collection Policy</label>
              <input
                type="text"
                value={form.remaining_balance_policy}
                onChange={(e) => setForm({ ...form, remaining_balance_policy: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* SECTION 3: DELIVERY & COURIER SETTINGS                              */}
        {/* =================================================================== */}
        <section id="section-delivery" style={styles.sectionCard}>
          <div style={styles.sectionCardHeader}>
            <div style={styles.sectionHeaderLeft}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>
                local_shipping
              </span>
              <h2 style={styles.sectionCardTitle}>Delivery & Courier Settings</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleResetDeliveryRates}
                style={styles.resetRatesBtn}
                title="Reset delivery rates to Dhaka studio defaults"
              >
                Reset Rates
              </button>
              <span style={styles.subtextHiddenMobile}>Dhaka & National Logistics</span>
            </div>
          </div>

          <div style={styles.sectionBody}>
            {/* Delivery Rates Grid */}
            <div style={styles.deliveryRatesGrid}>
              <div style={styles.rateBox}>
                <div style={styles.rateHeader}>
                  <span style={styles.rateTitle}>Inside Dhaka</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7e544f' }}>
                    location_city
                  </span>
                </div>
                <p style={styles.rateSub}>Standard Dress Parcels</p>
                <div style={styles.inputWithIconWrapper}>
                  <span style={styles.currencyPrefix}>৳</span>
                  <input
                    type="number"
                    value={form.delivery_inside_dhaka}
                    onChange={(e) =>
                      setForm({ ...form, delivery_inside_dhaka: Math.max(0, Number(e.target.value)) })
                    }
                    style={{ ...styles.inputWithPadding, paddingLeft: '28px', fontWeight: 'bold' }}
                  />
                </div>
              </div>

              <div style={styles.rateBox}>
                <div style={styles.rateHeader}>
                  <span style={styles.rateTitle}>Outside Dhaka</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7e544f' }}>
                    explore
                  </span>
                </div>
                <p style={styles.rateSub}>Steadfast / Paperfly Courier</p>
                <div style={styles.inputWithIconWrapper}>
                  <span style={styles.currencyPrefix}>৳</span>
                  <input
                    type="number"
                    value={form.delivery_outside_dhaka}
                    onChange={(e) =>
                      setForm({ ...form, delivery_outside_dhaka: Math.max(0, Number(e.target.value)) })
                    }
                    style={{ ...styles.inputWithPadding, paddingLeft: '28px', fontWeight: 'bold' }}
                  />
                </div>
              </div>

              <div style={styles.rateBox}>
                <div style={styles.rateHeader}>
                  <span style={styles.rateTitle}>Fresh Cake Chilled Van</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#7e544f' }}>
                    ac_unit
                  </span>
                </div>
                <p style={{ ...styles.rateSub, color: '#7e544f', fontWeight: '500' }}>Dhaka Metro Area Only</p>
                <div style={styles.inputWithIconWrapper}>
                  <span style={styles.currencyPrefix}>৳</span>
                  <input
                    type="number"
                    value={form.delivery_cake_van}
                    onChange={(e) =>
                      setForm({ ...form, delivery_cake_van: Math.max(0, Number(e.target.value)) })
                    }
                    style={{ ...styles.inputWithPadding, paddingLeft: '28px', fontWeight: 'bold' }}
                  />
                </div>
              </div>
            </div>

            {/* Cake Delivery Restrictions Callout */}
            <div style={styles.restrictionCallout}>
              <span className="material-symbols-outlined" style={{ color: '#7e544f', fontSize: '20px' }}>
                cake
              </span>
              <p style={styles.restrictionText}>
                <strong>Important Restriction:</strong> Fresh celebration cakes are strictly delivered inside Dhaka
                via temperature-controlled vans to prevent melting or decorative damage.
              </p>
            </div>

            {/* Available Delivery Days */}
            <div>
              <label style={styles.label}>Available Delivery Days</label>
              <div style={styles.daysRow}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const isSelected = form.available_delivery_days?.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleDeliveryDay(day)}
                      style={{
                        ...styles.dayBtn,
                        ...(isSelected ? styles.dayBtnActive : styles.dayBtnInactive),
                      }}
                    >
                      {day} {isSelected ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Delivery Time Slots */}
            <div>
              <label style={styles.label}>Delivery Time Slots</label>
              <div style={styles.timeSlotsGrid}>
                <div style={styles.timeSlotPill}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#7e544f' }}>
                    wb_twilight
                  </span>
                  <span>Morning Slot (10 AM - 1 PM)</span>
                </div>
                <div style={styles.timeSlotPill}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#7e544f' }}>
                    sunny
                  </span>
                  <span>Afternoon Slot (2 PM - 6 PM)</span>
                </div>
                <div style={styles.timeSlotPill}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#7e544f' }}>
                    bedtime
                  </span>
                  <span>Evening Slot (6 PM - 9 PM)</span>
                </div>
              </div>
            </div>

            {/* Studio Self-Pickup Toggle */}
            <div style={styles.pickupCard}>
              <div>
                <p style={styles.pickupTitle}>Studio Self-Pickup Option</p>
                <p style={styles.pickupSubtitle}>Uttara Studio Collection available 11 AM - 7 PM</p>
              </div>
              <label style={styles.switchWrapper}>
                <input
                  type="checkbox"
                  checked={form.pickup_enabled}
                  onChange={(e) => setForm({ ...form, pickup_enabled: e.target.checked })}
                  style={styles.switchInput}
                />
                <span
                  style={{
                    ...styles.switchTrack,
                    backgroundColor: form.pickup_enabled ? '#432821' : '#e4e2de',
                  }}
                >
                  <span
                    style={{
                      ...styles.switchThumb,
                      transform: form.pickup_enabled ? 'translateX(20px)' : 'translateX(0)',
                    }}
                  />
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* SECTION 4: ORDER RULES & LEAD TIMES                                 */}
        {/* =================================================================== */}
        <section id="section-rules" style={styles.sectionCard}>
          <div style={styles.sectionCardHeader}>
            <div style={styles.sectionHeaderLeft}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>
                event_repeat
              </span>
              <h2 style={styles.sectionCardTitle}>Order Rules & Lead Times</h2>
            </div>
            <span style={styles.publicProfileTag}>Boutique Production Rules</span>
          </div>

          <div style={styles.sectionBody}>
            {/* Invoice Format Prefix & Default Order Status */}
            <div style={styles.formGrid2}>
              <div>
                <label style={styles.label}>Invoice Format Prefix</label>
                <input
                  type="text"
                  value={form.invoice_prefix}
                  onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value.toUpperCase() })}
                  style={{ ...styles.input, fontWeight: 'bold' }}
                />
                <span style={styles.inputHint}>
                  Live Format Example: <strong>{form.invoice_prefix || 'AB-'}260925-1042</strong>
                </span>
              </div>

              <div>
                <label style={styles.label}>Default New Order Status</label>
                <select
                  value={form.default_order_status}
                  onChange={(e) => setForm({ ...form, default_order_status: e.target.value as any })}
                  style={styles.select}
                >
                  <option value="review_required">Review Required (Awaiting bKash Check)</option>
                  <option value="advance_verified">Confirmed & In Production</option>
                  <option value="in_production">Tailoring / Baking In Craft</option>
                </select>
              </div>
            </div>

            {/* Minimum Cake Notice Period & Dress Made-to-Order Lead Time */}
            <div style={styles.formGrid2}>
              <div>
                <label style={styles.label}>Minimum Cake Notice Period</label>
                <input
                  type="text"
                  value={form.cake_minimum_notice}
                  onChange={(e) => setForm({ ...form, cake_minimum_notice: e.target.value })}
                  style={styles.input}
                />
                <span style={styles.inputHint}>Minimum hours needed for fresh sponge baking & chilling.</span>
              </div>

              <div>
                <label style={styles.label}>Dress Made-to-Order Lead Time</label>
                <input
                  type="text"
                  value={form.dress_lead_time}
                  onChange={(e) => setForm({ ...form, dress_lead_time: e.target.value })}
                  style={styles.input}
                />
                <span style={styles.inputHint}>Tailoring, hand-smocking &amp; embroidery turnaround.</span>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div>
              <label style={styles.label}>Order Cancellation & Refund Policy</label>
              <input
                type="text"
                value={form.cancellation_policy}
                onChange={(e) => setForm({ ...form, cancellation_policy: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* SECTION 5: PRODUCT DEFAULTS & SIZING                                */}
        {/* =================================================================== */}
        <section id="section-defaults" style={styles.sectionCard}>
          <div style={styles.sectionCardHeader}>
            <div style={styles.sectionHeaderLeft}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>
                straighten
              </span>
              <h2 style={styles.sectionCardTitle}>Product Defaults & Sizing</h2>
            </div>
            <span style={styles.publicProfileTag}>Preset Catalog Matrix</span>
          </div>

          <div style={styles.sectionBody}>
            {/* Pre-configured Dress Sizes */}
            <div>
              <div style={styles.tagHeaderRow}>
                <label style={styles.label}>Pre-configured Dress Sizes</label>
                {!showAddSize ? (
                  <button
                    type="button"
                    onClick={() => setShowAddSize(true)}
                    style={styles.addTagToggleBtn}
                  >
                    + Add Custom Size
                  </button>
                ) : (
                  <div style={styles.inlineAddGroup}>
                    <input
                      type="text"
                      value={newSizeInput}
                      onChange={(e) => setNewSizeInput(e.target.value)}
                      placeholder="e.g. 5-6Y"
                      style={styles.smallInput}
                    />
                    <button type="button" onClick={handleAddSize} style={styles.smallAddBtn}>
                      Add
                    </button>
                    <button type="button" onClick={() => setShowAddSize(false)} style={styles.smallCancelBtn}>
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div style={styles.tagsFlex}>
                {form.preconfigured_sizes.map((sz) => (
                  <span key={sz} style={styles.tagChip}>
                    <span>{sz}</span>
                    <span
                      onClick={() => handleRemoveSize(sz)}
                      style={styles.removeTagCross}
                      title="Remove size preset"
                    >
                      ×
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Pre-configured Cake Weights */}
            <div>
              <div style={styles.tagHeaderRow}>
                <label style={styles.label}>Pre-configured Cake Weights</label>
                {!showAddWeight ? (
                  <button
                    type="button"
                    onClick={() => setShowAddWeight(true)}
                    style={styles.addTagToggleBtn}
                  >
                    + Add Weight
                  </button>
                ) : (
                  <div style={styles.inlineAddGroup}>
                    <input
                      type="text"
                      value={newWeightInput}
                      onChange={(e) => setNewWeightInput(e.target.value)}
                      placeholder="e.g. 4.0 lb"
                      style={styles.smallInput}
                    />
                    <button type="button" onClick={handleAddWeight} style={styles.smallAddBtn}>
                      Add
                    </button>
                    <button type="button" onClick={() => setShowAddWeight(false)} style={styles.smallCancelBtn}>
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div style={styles.tagsFlex}>
                {form.preconfigured_cake_weights.map((w) => (
                  <span key={w} style={styles.tagChip}>
                    <span>{w}</span>
                    <span
                      onClick={() => handleRemoveWeight(w)}
                      style={styles.removeTagCross}
                      title="Remove weight preset"
                    >
                      ×
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Product Categories & Default Status */}
            <div style={styles.formGrid2}>
              <div>
                <label style={styles.label}>Primary Product Categories</label>
                <input
                  type="text"
                  value={form.product_categories.join(', ')}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      product_categories: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Default Status for Newly Created Products</label>
                <select
                  value={form.default_product_status}
                  onChange={(e) => setForm({ ...form, default_product_status: e.target.value })}
                  style={styles.select}
                >
                  <option value="draft">Draft / Available on Request</option>
                  <option value="published">Active in Catalog Immediately</option>
                  <option value="made_to_order">Made to Order Booking</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* SECTION 7: CUSTOMER REVIEWS & SCREENSHOTS (SOCIAL PROOF)           */}
        {/* =================================================================== */}
        <section id="section-reviews" style={styles.sectionCard}>
          <div style={styles.sectionCardHeader}>
            <div style={styles.sectionHeaderLeft}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>
                rate_review
              </span>
              <div>
                <h2 style={styles.sectionCardTitle}>Customer Reviews & Screenshots</h2>
                <span style={styles.publicProfileTag}>
                  Social proof screenshots from WhatsApp & Facebook displayed on the storefront
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddReviewModal(true)}
              style={styles.addReviewBtn}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                add_photo_alternate
              </span>
              <span>Add Screenshot Review</span>
            </button>
          </div>

          <div style={styles.sectionBody}>
            {reviewsLoading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#827470' }}>
                <span className="material-symbols-outlined spin" style={{ fontSize: '24px' }}>
                  progress_activity
                </span>
                <p style={{ marginTop: '8px', fontSize: '13px' }}>Loading screenshot reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', border: '1px dashed #d1cac4', borderRadius: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#bfae9e' }}>
                  chat_bubble
                </span>
                <p style={{ marginTop: '6px', fontSize: '14px', color: '#5c3e36', fontWeight: 600 }}>
                  No customer reviews yet
                </p>
                <p style={{ fontSize: '12px', color: '#827470', marginBottom: '14px' }}>
                  Add real message screenshots from happy customers on WhatsApp and Facebook.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddReviewModal(true)}
                  style={styles.addReviewBtn}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    add
                  </span>
                  <span>Add First Review Screenshot</span>
                </button>
              </div>
            ) : (
              <div style={styles.reviewGrid}>
                {reviews.map((rev) => (
                  <div key={rev.id} style={styles.reviewCard}>
                    <div style={styles.reviewImgWrap}>
                      <img
                        src={rev.screenshot_url}
                        alt={`Screenshot review from ${rev.customer_name}`}
                        style={styles.reviewImg}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div style={styles.platformBadgeOverlay}>
                        <span
                          style={{
                            ...styles.platformPill,
                            backgroundColor: rev.platform === 'whatsapp' ? '#25d366' : '#1877f2',
                            color: '#ffffff',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                            {rev.platform === 'whatsapp' ? 'chat' : 'public'}
                          </span>
                          <span style={{ textTransform: 'capitalize' }}>{rev.platform}</span>
                        </span>
                      </div>
                    </div>

                    <div style={styles.reviewCardContent}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={styles.reviewCustomerName}>{rev.customer_name}</h4>
                          <p style={styles.reviewCustomerArea}>{rev.customer_area || 'Dhaka, Bangladesh'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '2px', color: '#d97706', fontSize: '13px' }}>
                          {'★'.repeat(rev.rating || 5)}
                        </div>
                      </div>

                      {rev.product_name && (
                        <div style={styles.reviewProductPill}>
                          <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#5c3e36' }}>
                            shopping_bag
                          </span>
                          <span>{rev.product_name}</span>
                        </div>
                      )}

                      <p style={styles.reviewQuoteText}>{rev.caption}</p>

                      <div style={styles.reviewCardFooter}>
                        <span style={styles.reviewDateText}>{rev.date}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id, rev.customer_name)}
                          style={styles.deleteReviewBtn}
                          title="Delete review screenshot"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                            delete
                          </span>
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =================================================================== */}
        {/* SECTION 6: ADMIN ACCOUNT & SECURITY                                 */}
        {/* =================================================================== */}
        <section id="section-account" style={styles.sectionCard}>
          <div style={styles.sectionCardHeader}>
            <div style={styles.sectionHeaderLeft}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>
                admin_panel_settings
              </span>
              <h2 style={styles.sectionCardTitle}>Admin Account & Security</h2>
            </div>
            <span style={styles.ownerBadge}>Owner Access</span>
          </div>

          <div style={styles.sectionBody}>
            {/* Profile Card */}
            <div style={styles.profileCard}>
              <div style={styles.profileLeft}>
                <div style={styles.profileAvatar}>
                  {admin?.full_name ? admin.full_name.slice(0, 2).toUpperCase() : 'SB'}
                </div>
                <div>
                  <h3 style={styles.profileName}>{admin?.full_name || 'Sanjida Bethi'}</h3>
                  <p style={styles.profileRole}>
                    Master Artisan & Store Owner • {user?.email || admin?.email || 'sanjida@ababilsattire.com'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                style={styles.changePasswordBtn}
              >
                Change Password
              </button>
            </div>

            {/* Security Status Cards */}
            <div style={styles.formGrid2}>
              <div style={styles.securityBox}>
                <div style={styles.secRow}>
                  <span style={styles.secTitle}>Password Security</span>
                  <span style={styles.secSubBadge}>System Managed</span>
                </div>
                <p style={styles.secDesc}>Protected with secure Supabase Auth and PBKDF2 / Argon2 hashing.</p>
              </div>

              <div style={styles.securityBox}>
                <div style={styles.secRow}>
                  <span style={styles.secTitle}>Role-Based Access Control</span>
                  <span style={styles.secRoleBadge}>{admin?.role?.toUpperCase() || 'SUPERADMIN'}</span>
                </div>
                <p style={styles.secDesc}>Required to edit bKash numbers, critical delivery rules and manual dockets.</p>
              </div>
            </div>

            {/* Sign Out Action */}
            <div style={styles.signOutRow}>
              <span style={styles.sessionText}>
                Active authenticated session linked to Admin Suite
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                style={styles.signOutBtn}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  logout
                </span>
                <span>Sign Out of Admin Suite</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* =================================================================== */}
      {/* SECTION 7: DATA EXPORT & BACKUP                                     */}
      {/* =================================================================== */}
      <section id="section-export" style={styles.sectionCard}>
        <div style={styles.sectionCardHeader}>
          <div style={styles.sectionHeaderLeft}>
            <span className="material-symbols-outlined" style={styles.sectionIcon}>
              download
            </span>
            <h2 style={styles.sectionCardTitle}>Data Export & Backup</h2>
          </div>
          <span style={styles.ownerBadge}>Excel / CSV Format</span>
        </div>

        <div style={styles.sectionBody}>
          <p style={{ ...styles.secDesc, marginBottom: '16px' }}>
            Download complete records of your store's data in CSV format, natively compatible with Microsoft Excel and Google Sheets.
          </p>
          <div style={styles.formGrid2}>
            <button
              type="button"
              onClick={() => handleExportData('orders')}
              style={styles.changePasswordBtn}
            >
              Export Orders
            </button>
            <button
              type="button"
              onClick={() => handleExportData('products')}
              style={styles.changePasswordBtn}
            >
              Export Products
            </button>
            <button
              type="button"
              onClick={() => handleExportData('customers')}
              style={styles.changePasswordBtn}
            >
              Export Customers
            </button>
            <button
              type="button"
              onClick={() => handleExportData('settings')}
              style={styles.changePasswordBtn}
            >
              Export Settings
            </button>
          </div>
        </div>
      </section>

      {/* Sticky Bottom Save Bar (Visible when there are unsaved changes) */}
      {hasUnsavedChanges && (
        <aside style={styles.stickyBar}>
          <div style={styles.stickyBarInner}>
            <div style={styles.stickyAlert}>
              <span style={styles.pulseDot}></span>
              <span>
                You have unsaved changes in <strong style={{ color: '#432821' }}>Store Settings ({unsavedCount} edits)</strong>
              </span>
            </div>

            <div style={styles.stickyActions}>
              <button
                type="button"
                onClick={handleDiscard}
                disabled={isSaving}
                style={styles.discardBtn}
              >
                Discard Changes
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                style={styles.saveChangesBtn}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  check_circle
                </span>
                <span>{isSaving ? 'Deploying Changes...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Change Admin Password</h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                style={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} style={styles.modalForm}>
              {passwordError && (
                <div style={styles.modalError}>
                  {passwordError}
                </div>
              )}

              <div style={styles.modalFieldGroup}>
                <label style={styles.label}>New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.modalFieldGroup}>
                <label style={styles.label}>Confirm New Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  style={styles.modalSubmitBtn}
                >
                  {passwordLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD CUSTOMER SCREENSHOT REVIEW                               */}
      {/* =================================================================== */}
      {showAddReviewModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalBox, maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Add Customer Review Screenshot</h3>
                <p style={{ fontSize: '11px', color: '#827470', margin: '2px 0 0 0' }}>
                  Upload or link authentic customer praise from WhatsApp or Facebook.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddReviewModal(false)}
                style={styles.modalCloseBtn}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReview} style={styles.modalForm}>
              {/* Presets Toolbar */}
              <div style={{ backgroundColor: '#faf7f3', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ebd8ce' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#5c3e36', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Quick Preset Recommendations:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {PRESET_SCREENSHOTS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setReviewForm((prev) => ({
                          ...prev,
                          screenshot_url: preset.url,
                          product_name: preset.product,
                          platform: preset.platform,
                          caption: preset.quote,
                        }));
                      }}
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #d9cbbf',
                        borderRadius: '4px',
                        color: '#432821',
                        cursor: 'pointer',
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.formGrid2}>
                <div style={styles.modalFieldGroup}>
                  <label style={styles.label}>Customer Name *</label>
                  <input
                    type="text"
                    value={reviewForm.customer_name}
                    onChange={(e) => setReviewForm({ ...reviewForm, customer_name: e.target.value })}
                    placeholder="e.g. Dr. Nusrat Jahan"
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.modalFieldGroup}>
                  <label style={styles.label}>Customer Area / City</label>
                  <input
                    type="text"
                    value={reviewForm.customer_area}
                    onChange={(e) => setReviewForm({ ...reviewForm, customer_area: e.target.value })}
                    placeholder="e.g. Gulshan 2, Dhaka"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGrid2}>
                <div style={styles.modalFieldGroup}>
                  <label style={styles.label}>Platform *</label>
                  <select
                    value={reviewForm.platform}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        platform: e.target.value as 'whatsapp' | 'facebook' | 'instagram',
                      })
                    }
                    style={styles.select}
                  >
                    <option value="whatsapp">WhatsApp Message</option>
                    <option value="facebook">Facebook Review / Inbox</option>
                    <option value="instagram">Instagram DM</option>
                  </select>
                </div>

                <div style={styles.modalFieldGroup}>
                  <label style={styles.label}>Product Referenced</label>
                  <input
                    type="text"
                    value={reviewForm.product_name}
                    onChange={(e) => setReviewForm({ ...reviewForm, product_name: e.target.value })}
                    placeholder="e.g. Aurelia Floral Smocked Dress"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.modalFieldGroup}>
                <label style={styles.label}>Screenshot Image URL *</label>
                <input
                  type="url"
                  value={reviewForm.screenshot_url}
                  onChange={(e) => setReviewForm({ ...reviewForm, screenshot_url: e.target.value })}
                  placeholder="https://... screenshot image url"
                  required
                  style={styles.input}
                />
                {reviewForm.screenshot_url && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src={reviewForm.screenshot_url}
                      alt="Preview"
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #d4c3bf' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span style={{ fontSize: '11px', color: '#065f46' }}>✓ Screenshot preview linked</span>
                  </div>
                )}
              </div>

              <div style={styles.modalFieldGroup}>
                <label style={styles.label}>Customer Feedback Quote / Message Excerpt *</label>
                <textarea
                  value={reviewForm.caption}
                  onChange={(e) => setReviewForm({ ...reviewForm, caption: e.target.value })}
                  placeholder="“Everyone at the dawat was asking where we made Inaya’s dress! Fabric was so gentle...”"
                  rows={3}
                  required
                  style={{ ...styles.input, resize: 'vertical' }}
                />
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowAddReviewModal(false)}
                  style={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.modalSubmitBtn}
                >
                  Publish to Storefront
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Cropper Modal */}
      {croppingField && (
        <ImageCropper
          imageFile={croppingField.file}
          aspectRatio={croppingField.aspect}
          onCrop={handleCroppedImage}
          onCancel={() => setCroppingField(null)}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1040px',
    margin: '0 auto',
    padding: '20px 16px 80px 16px',
    fontFamily: 'Hanken Grotesk, sans-serif',
    color: '#1b1c1a',
  },
  loadingContainer: {
    padding: '80px 20px',
    textAlign: 'center',
  },
  toast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#432821',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    zIndex: 9999,
  },
  topSection: {
    backgroundColor: '#ffffff',
    border: '1px solid #eae8e4',
    borderRadius: '8px',
    padding: '20px 24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(92, 62, 54, 0.04)',
  },
  headerFlex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#432821',
    fontFamily: 'Bodoni Moda, serif',
    margin: 0,
  },
  atelierBadge: {
    backgroundColor: '#ffdad6',
    color: '#633d38',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  pageSubtitle: {
    fontSize: '13px',
    color: '#827470',
    margin: '4px 0 0 0',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  unsavedPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f5f3ef',
    border: '1px solid #d4c3bf',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#7e544f',
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ba1a1a',
  },
  headerSaveBtn: {
    backgroundColor: '#432821',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  tabStrip: {
    display: 'flex',
    gap: '8px',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #eae8e4',
    overflowX: 'auto',
  },
  tabLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#504441',
    backgroundColor: '#efeeea',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  tabLinkActive: {
    backgroundColor: '#432821',
    color: '#ffffff',
    fontWeight: '600',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #eae8e4',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(92, 62, 54, 0.03)',
  },
  sectionCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eae8e4',
    paddingBottom: '14px',
    marginBottom: '20px',
  },
  sectionHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sectionIcon: {
    fontSize: '22px',
    color: '#432821',
  },
  sectionCardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#432821',
    fontFamily: 'Bodoni Moda, serif',
    margin: 0,
  },
  publicProfileTag: {
    fontSize: '11px',
    color: '#827470',
    fontWeight: '500',
  },
  activeBdBadge: {
    backgroundColor: '#ffdad6',
    color: '#301310',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  ownerBadge: {
    backgroundColor: '#efeeea',
    color: '#827470',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  subtextHiddenMobile: {
    fontSize: '12px',
    color: '#827470',
  },
  sectionBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  crestCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#f5f3ef',
    border: '1px solid #eae8e4',
    borderRadius: '6px',
    padding: '16px',
  },
  crestBox: {
    width: '56px',
    height: '56px',
    borderRadius: '6px',
    border: '1px solid #d4c3bf',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#432821',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
  },
  crestMonogram: {
    fontFamily: 'Bodoni Moda, serif',
    fontSize: '22px',
    fontWeight: 'bold',
  },
  crestTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#432821',
    margin: 0,
  },
  crestDesc: {
    fontSize: '12px',
    color: '#827470',
    margin: '3px 0 0 0',
  },
  crestActiveBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#065f46',
    backgroundColor: '#d1fae5',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  uploadLogoBtn: {
    backgroundColor: '#432821',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 1px 3px rgba(67, 40, 33, 0.15)',
    transition: 'all 0.15s ease',
  },
  removeLogoBtn: {
    backgroundColor: '#ffffff',
    color: '#827470',
    border: '1px solid #d4c3bf',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease',
  },
  formGrid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    color: '#504441',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginBottom: '5px',
  },
  labelWithSubRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  labelSub: {
    fontSize: '10px',
    color: '#7e544f',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    border: '1px solid #d4c3bf',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    color: '#1b1c1a',
    boxSizing: 'border-box',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    border: '1px solid #d4c3bf',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    color: '#1b1c1a',
    boxSizing: 'border-box',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    border: '1px solid #d4c3bf',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    color: '#1b1c1a',
    boxSizing: 'border-box',
    outline: 'none',
  },
  inputHint: {
    display: 'block',
    fontSize: '11px',
    color: '#827470',
    marginTop: '4px',
  },
  inputWithIconWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '10px',
    color: '#827470',
    fontSize: '18px',
    pointerEvents: 'none',
  },
  prefixAt: {
    position: 'absolute',
    left: '12px',
    color: '#827470',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  inputWithPadding: {
    width: '100%',
    padding: '8px 12px 8px 36px',
    fontSize: '13px',
    border: '1px solid #d4c3bf',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    color: '#1b1c1a',
    boxSizing: 'border-box',
    outline: 'none',
  },
  bkashPrefix: {
    position: 'absolute',
    left: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#e2136e',
    pointerEvents: 'none',
  },
  bkashTag: {
    fontSize: '10px',
    fontWeight: 'bold',
    backgroundColor: '#ffdbd1',
    color: '#2d150f',
    padding: '1px 6px',
    borderRadius: '3px',
  },
  currencyPrefix: {
    position: 'absolute',
    left: '10px',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#432821',
    pointerEvents: 'none',
  },
  infoBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    backgroundColor: '#f5f3ef',
    border: '1px solid #eae8e4',
    borderRadius: '6px',
    padding: '14px',
  },
  infoIcon: {
    fontSize: '20px',
    color: '#7e544f',
    marginTop: '1px',
  },
  infoTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#432821',
    margin: 0,
  },
  infoDesc: {
    fontSize: '12px',
    color: '#504441',
    margin: '3px 0 0 0',
    lineHeight: '1.4',
  },
  verificationCard: {
    backgroundColor: '#f5f3ef',
    border: '1px solid #eae8e4',
    borderRadius: '6px',
    padding: '14px',
  },
  verificationTitle: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    color: '#432821',
    margin: '0 0 10px 0',
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#1b1c1a',
    cursor: 'pointer',
  },
  checkbox: {
    cursor: 'pointer',
  },
  resetRatesBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #d4c3bf',
    color: '#827470',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  deliveryRatesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
  },
  rateBox: {
    border: '1px solid #eae8e4',
    borderRadius: '6px',
    padding: '14px',
    backgroundColor: '#ffffff',
  },
  rateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateTitle: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#504441',
  },
  rateSub: {
    fontSize: '11px',
    color: '#827470',
    margin: '2px 0 10px 0',
  },
  restrictionCallout: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: '#f5f3ef',
    border: '1px solid #ffdad6',
    borderRadius: '6px',
    padding: '12px 14px',
  },
  restrictionText: {
    fontSize: '12px',
    color: '#504441',
    margin: 0,
    lineHeight: '1.4',
  },
  daysRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  dayBtn: {
    border: '1px solid',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  dayBtnActive: {
    backgroundColor: '#432821',
    borderColor: '#432821',
    color: '#ffffff',
  },
  dayBtnInactive: {
    backgroundColor: '#efeeea',
    borderColor: '#d4c3bf',
    color: '#827470',
  },
  timeSlotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
  },
  timeSlotPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #eae8e4',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '12px',
    color: '#1b1c1a',
    backgroundColor: '#ffffff',
  },
  pickupCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #eae8e4',
    borderRadius: '6px',
    padding: '14px 16px',
    backgroundColor: '#ffffff',
  },
  pickupTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#432821',
    margin: 0,
  },
  pickupSubtitle: {
    fontSize: '11px',
    color: '#827470',
    margin: '2px 0 0 0',
  },
  switchWrapper: {
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '24px',
    cursor: 'pointer',
  },
  switchInput: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  switchTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '24px',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    padding: '2px',
  },
  switchThumb: {
    width: '20px',
    height: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s ease',
  },
  tagHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  addTagToggleBtn: {
    background: 'none',
    border: 'none',
    color: '#7e544f',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  inlineAddGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  smallInput: {
    padding: '4px 8px',
    fontSize: '11px',
    border: '1px solid #d4c3bf',
    borderRadius: '3px',
    width: '90px',
  },
  smallAddBtn: {
    backgroundColor: '#432821',
    color: '#ffffff',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  smallCancelBtn: {
    background: 'none',
    border: 'none',
    color: '#827470',
    cursor: 'pointer',
    fontSize: '12px',
  },
  tagsFlex: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tagChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#f5f3ef',
    border: '1px solid #d4c3bf',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '12px',
    color: '#1b1c1a',
  },
  removeTagCross: {
    cursor: 'pointer',
    color: '#827470',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  profileCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f3ef',
    border: '1px solid #eae8e4',
    borderRadius: '6px',
    padding: '16px',
    flexWrap: 'wrap',
    gap: '14px',
  },
  profileLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  profileAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#432821',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#432821',
    margin: 0,
  },
  profileRole: {
    fontSize: '12px',
    color: '#827470',
    margin: '3px 0 0 0',
  },
  changePasswordBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #d4c3bf',
    color: '#7e544f',
    padding: '6px 14px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  securityBox: {
    border: '1px solid #eae8e4',
    borderRadius: '6px',
    padding: '14px',
    backgroundColor: '#ffffff',
  },
  secRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#432821',
  },
  secSubBadge: {
    fontSize: '10px',
    color: '#827470',
    backgroundColor: '#efeeea',
    padding: '1px 6px',
    borderRadius: '3px',
  },
  secRoleBadge: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#2d150f',
    backgroundColor: '#ffdbd1',
    padding: '1px 6px',
    borderRadius: '3px',
  },
  secDesc: {
    fontSize: '11px',
    color: '#827470',
    margin: '6px 0 0 0',
  },
  signOutRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #eae8e4',
    paddingTop: '16px',
    marginTop: '6px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  sessionText: {
    fontSize: '12px',
    color: '#827470',
  },
  signOutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ffffff',
    border: '1px solid #ffdad6',
    color: '#ba1a1a',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  stickyBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    backdropFilter: 'blur(8px)',
    borderTop: '1px solid #d4c3bf',
    padding: '12px 20px',
    boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
    zIndex: 900,
  },
  stickyBarInner: {
    maxWidth: '1040px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  stickyAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#7e544f',
  },
  stickyActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  discardBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #d4c3bf',
    color: '#ba1a1a',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  saveChangesBtn: {
    backgroundColor: '#432821',
    color: '#ffffff',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(67, 40, 33, 0.2)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(43, 24, 19, 0.6)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '16px',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    maxWidth: '440px',
    width: '100%',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    border: '1px solid #d4c3bf',
  },
  modalHeader: {
    padding: '14px 18px',
    borderBottom: '1px solid #eae8e4',
    backgroundColor: '#fbf9f5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#432821',
    fontFamily: 'Bodoni Moda, serif',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: '#827470',
    cursor: 'pointer',
  },
  modalForm: {
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  modalError: {
    backgroundColor: '#ffdad6',
    border: '1px solid #ba1a1a',
    color: '#93000a',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  modalFieldGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '6px',
    paddingTop: '12px',
    borderTop: '1px solid #eae8e4',
  },
  modalCancelBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #d4c3bf',
    color: '#504441',
    padding: '6px 14px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalSubmitBtn: {
    backgroundColor: '#432821',
    color: '#ffffff',
    border: 'none',
    padding: '6px 18px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  addReviewBtn: {
    backgroundColor: '#432821',
    color: '#ffffff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    letterSpacing: '0.3px',
  },
  reviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  reviewCard: {
    backgroundColor: '#fbf9f5',
    border: '1px solid #eae8e4',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
  },
  reviewImgWrap: {
    position: 'relative',
    height: '140px',
    backgroundColor: '#ece8e1',
    overflow: 'hidden',
  },
  reviewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  platformBadgeOverlay: {
    position: 'absolute',
    top: '8px',
    left: '8px',
  },
  platformPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '9999px',
    fontSize: '10px',
    fontWeight: '700',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },
  reviewCardContent: {
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  reviewCustomerName: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#432821',
    margin: 0,
  },
  reviewCustomerArea: {
    fontSize: '11px',
    color: '#827470',
    margin: '1px 0 0 0',
  },
  reviewProductPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#5c3e36',
    backgroundColor: '#f5ede9',
    padding: '3px 8px',
    borderRadius: '4px',
    margin: '8px 0',
    width: 'fit-content',
  },
  reviewQuoteText: {
    fontSize: '12px',
    color: '#504441',
    fontStyle: 'italic',
    lineHeight: 1.4,
    margin: '4px 0 12px 0',
    flex: 1,
  },
  reviewCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #ece8e1',
    paddingTop: '10px',
    marginTop: 'auto',
  },
  reviewDateText: {
    fontSize: '10px',
    color: '#827470',
  },
  deleteReviewBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: '#ba1a1a',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '2px 4px',
    borderRadius: '3px',
  },
};
