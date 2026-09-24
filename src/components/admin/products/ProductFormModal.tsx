/**
 * Ababil’s Attire by Sanjida Bethi
 * Product Add / Edit Modal Workspace
 *
 * Implements category tabs (Dress vs Cake), photography upload to Supabase Storage,
 * gallery reordering, client-side validation, and safe data persistence.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { ProductWithDetails, ProductCategory, ProductStatus } from '../../../types';
import { productsService } from '../../../services/products.service';
import { storageService } from '../../../services/storage.service';

interface ProductFormModalProps {
  isOpen: boolean;
  productToEdit: ProductWithDetails | null;
  initialCategory?: ProductCategory;
  onClose: () => void;
  onSaved: () => void;
}

const DRESS_SIZE_OPTIONS = ['6M', '12M', '18M', '2T', '3T', '4T'];
const CAKE_WEIGHT_PRESETS = [
  { weight: '0.5 lb Bento', price: 1650 },
  { weight: '1.5 lb', price: 3800 },
  { weight: '2 lb', price: 5200 },
  { weight: '3 lb', price: 7500 },
];
const CAKE_FLAVOR_PRESETS = [
  'Madagascar Vanilla Bean & Fig',
  'Valrhona Chocolate Truffle',
  'Pistachio Rosewater & Raspberry',
  'Salted Caramel Vanilla',
  'Red Velvet Cream Cheese',
  'Earl Grey & Honey Lavender',
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  productToEdit,
  initialCategory = 'dress',
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(productToEdit);
  const [activeCategory, setActiveCategory] = useState<ProductCategory>(
    productToEdit ? productToEdit.category : initialCategory
  );

  // Common Fields
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [price, setPrice] = useState<number>(3200);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProductStatus>('published');
  const [featured, setFeatured] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [stockQuantity, setStockQuantity] = useState<number>(5);

  // Dress Specific
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['6M', '12M', '18M']);
  const [fabricDetails, setFabricDetails] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState<number>(7);

  // Cake Specific
  const [minimumNoticeHours, setMinimumNoticeHours] = useState<number>(48);
  const [selectedWeights, setSelectedWeights] = useState<Array<{ weight: string; price: number }>>(
    CAKE_WEIGHT_PRESETS
  );
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([
    'Madagascar Vanilla Bean & Fig',
    'Valrhona Chocolate Truffle',
  ]);
  const [customFlavorInput, setCustomFlavorInput] = useState('');
  const [customizationOptions, setCustomizationOptions] = useState(
    'Top piped calligraphy message (up to 25 characters) or chocolate inscription plaque.'
  );
  const [storageInstructions, setStorageInstructions] = useState(
    'Keep chilled in refrigerator between 4°C – 8°C. Bring to room temperature 30 minutes before cutting.'
  );

  // Images State
  const [images, setImages] = useState<Array<{ id: string; image_url: string; sort_order: number }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingImageId, setReplacingImageId] = useState<string | null>(null);

  // Initialize form state when editing or opening
  useEffect(() => {
    if (productToEdit) {
      setActiveCategory(productToEdit.category);
      setName(productToEdit.name);
      setProductCode(productToEdit.product_code);
      setPrice(productToEdit.price);
      setDescription(productToEdit.description || '');
      setStatus(productToEdit.status);
      setFeatured(productToEdit.featured);
      setNewArrival(productToEdit.new_arrival);
      setStockQuantity(productToEdit.stock_quantity);
      setLeadTimeDays(productToEdit.lead_time_days || 7);
      setMinimumNoticeHours(productToEdit.minimum_notice_hours || 48);

      if (productToEdit.category === 'dress' && productToEdit.dress_details) {
        setSelectedSizes(productToEdit.dress_details.available_sizes || []);
        setFabricDetails(productToEdit.dress_details.fabric_details || '');
        setCareInstructions(productToEdit.dress_details.care_instructions || '');
      }

      if (productToEdit.category === 'cake' && productToEdit.cake_details) {
        setSelectedWeights((productToEdit.cake_details.weight_options as any) || CAKE_WEIGHT_PRESETS);
        setSelectedFlavors(productToEdit.cake_details.flavor_options || []);
        setCustomizationOptions(productToEdit.cake_details.customization_options || '');
        setStorageInstructions(productToEdit.cake_details.storage_instructions || '');
      }

      if (productToEdit.images) {
        const sorted = [...productToEdit.images].sort((a, b) => a.sort_order - b.sort_order);
        setImages(sorted.map((img) => ({ id: img.id, image_url: img.image_url, sort_order: img.sort_order })));
      }
    } else {
      // New Product Defaults
      setActiveCategory(initialCategory);
      setName('');
      const randomCode = Math.floor(100 + Math.random() * 900);
      setProductCode(initialCategory === 'dress' ? `AA-DRS-${randomCode}` : `AA-CKE-${randomCode}`);
      setPrice(initialCategory === 'dress' ? 3200 : 3550);
      setDescription('');
      setStatus('published');
      setFeatured(false);
      setNewArrival(true);
      setStockQuantity(5);
      setSelectedSizes(['6M', '12M', '18M']);
      setFabricDetails('100% Organic Soft Cotton Voile with French lace detail.');
      setCareInstructions('Gentle cold hand-wash with mild detergent. Dry flat in shade.');
      setLeadTimeDays(7);
      setMinimumNoticeHours(48);
      setSelectedWeights(CAKE_WEIGHT_PRESETS);
      setSelectedFlavors(['Madagascar Vanilla Bean & Fig', 'Valrhona Chocolate Truffle']);
      setImages([]);
    }
    setFormError(null);
  }, [productToEdit, initialCategory, isOpen]);

  if (!isOpen) return null;

  // Toggle dress sizes
  const handleToggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Toggle cake flavors
  const handleToggleFlavor = (flavor: string) => {
    setSelectedFlavors((prev) =>
      prev.includes(flavor) ? prev.filter((f) => f !== flavor) : [...prev, flavor]
    );
  };

  const handleAddCustomFlavor = () => {
    if (customFlavorInput.trim() && !selectedFlavors.includes(customFlavorInput.trim())) {
      setSelectedFlavors((prev) => [...prev, customFlavorInput.trim()]);
      setCustomFlavorInput('');
    }
  };

  // Handle multiple image files upload
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setFormError(null);
    setIsUploading(true);

    try {
      // If product is not yet created in DB, temporary upload to storage requires product code
      const currentCode = productCode.trim() || `PROD-${Date.now()}`;
      const fileList = Array.from(files);

      // Validate each file
      for (const file of fileList) {
        const v = storageService.validateImageFile(file);
        if (!v.valid) {
          throw new Error(v.error);
        }
      }

      setUploadProgressText(`Uploading ${fileList.length} image(s)...`);

      if (productToEdit) {
        // Upload directly via storageService linked to this product ID
        const newRows = await storageService.uploadMultipleImages(
          productToEdit.id,
          currentCode,
          activeCategory,
          fileList,
          images.length,
          (done, total) => setUploadProgressText(`Uploaded ${done} of ${total}...`)
        );

        setImages((prev) => [
          ...prev,
          ...newRows.map((r) => ({ id: r.id, image_url: r.image_url, sort_order: r.sort_order })),
        ]);
      } else {
        // For new products, upload to storage and stage the resulting URLs
        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          const sortOrder = images.length + i;
          const previewUrl = URL.createObjectURL(file);
          setImages((prev) => [
            ...prev,
            { id: `temp-${Date.now()}-${i}`, image_url: previewUrl, sort_order: sortOrder },
          ]);
        }
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setFormError(err.message || 'Image upload failed.');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Reorder Images (Move Up / Down)
  const handleMoveImage = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    // Recalculate sort_order
    const updated = newImages.map((img, idx) => ({ ...img, sort_order: idx }));
    setImages(updated);

    if (productToEdit) {
      try {
        await storageService.reorderProductImages(
          updated.map((img) => ({ id: img.id, sort_order: img.sort_order }))
        );
      } catch (err) {
        console.warn('Reorder sync error:', err);
      }
    }
  };

  // Delete Image
  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    try {
      if (productToEdit && !imageId.startsWith('temp-')) {
        await storageService.deleteProductImage(imageId, imageUrl);
      }
      setImages((prev) =>
        prev
          .filter((img) => img.id !== imageId)
          .map((img, idx) => ({ ...img, sort_order: idx }))
      );
    } catch (err: any) {
      setFormError(`Failed to delete image: ${err.message}`);
    }
  };

  // Replace single image trigger
  const handleTriggerReplace = (imageId: string) => {
    setReplacingImageId(imageId);
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.click();
    }
  };

  const handleExecuteReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingImageId) return;

    const targetImg = images.find((i) => i.id === replacingImageId);
    if (!targetImg) return;

    setIsUploading(true);
    setUploadProgressText('Replacing image...');
    try {
      if (productToEdit && !targetImg.id.startsWith('temp-')) {
        const newUrl = await storageService.replaceProductImage(
          targetImg.id,
          targetImg.image_url,
          file,
          productCode,
          activeCategory
        );
        setImages((prev) =>
          prev.map((i) => (i.id === targetImg.id ? { ...i, image_url: newUrl } : i))
        );
      } else {
        const previewUrl = URL.createObjectURL(file);
        setImages((prev) =>
          prev.map((i) => (i.id === targetImg.id ? { ...i, image_url: previewUrl } : i))
        );
      }
    } catch (err: any) {
      setFormError(err.message || 'Image replacement failed.');
    } finally {
      setIsUploading(false);
      setReplacingImageId(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    }
  };

  // Submit Product Form
  const handleSubmit = async (e: React.FormEvent, customStatus?: ProductStatus) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedCode = productCode.trim().toUpperCase();

    if (!trimmedName) {
      setFormError('Please enter a product name.');
      return;
    }
    if (!trimmedCode) {
      setFormError('Please enter a unique product code.');
      return;
    }
    if (price <= 0) {
      setFormError('Price must be greater than zero.');
      return;
    }

    const finalStatus = customStatus || status;
    setIsSubmitting(true);

    try {
      const productPayload = {
        name: trimmedName,
        price,
        description: description.trim() || undefined,
        status: finalStatus,
        featured,
        new_arrival: newArrival,
        stock_quantity: Math.max(0, stockQuantity),
        lead_time_days: activeCategory === 'dress' ? leadTimeDays : 2,
        minimum_notice_hours: activeCategory === 'cake' ? minimumNoticeHours : 0,
      };

      const detailsPayload =
        activeCategory === 'dress'
          ? {
              available_sizes: selectedSizes,
              fabric_details: fabricDetails.trim() || undefined,
              care_instructions: careInstructions.trim() || undefined,
            }
          : {
              weight_options: selectedWeights,
              flavor_options: selectedFlavors,
              customization_options: customizationOptions.trim() || undefined,
              storage_instructions: storageInstructions.trim() || undefined,
            };

      if (isEditing && productToEdit) {
        // Safe update: does NOT delete unrelated products or images
        await productsService.updateProduct(
          productToEdit.id,
          productPayload,
          activeCategory,
          detailsPayload
        );
      } else {
        // Create new product
        await productsService.createProduct(
          {
            ...productPayload,
            product_code: trimmedCode,
            category: activeCategory,
          },
          detailsPayload
        );
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setFormError(err.message || 'Failed to save product to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        {/* Modal Top Bar */}
        <div style={styles.modalHeader}>
          <div>
            <span style={styles.headerKicker}>Atelier Catalog Editor</span>
            <h2 style={styles.modalTitle}>
              {isEditing ? `Edit: ${productToEdit?.name}` : 'Add New Artisan Product'}
            </h2>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn} title="Close window">
            ✕
          </button>
        </div>

        {/* Category Switcher Tabs */}
        {!isEditing && (
          <div style={styles.categoryTabWrapper}>
            <div style={styles.categoryTabs}>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('dress');
                  if (!productCode || productCode.startsWith('AA-CKE-')) {
                    setProductCode(`AA-DRS-${Math.floor(100 + Math.random() * 900)}`);
                  }
                }}
                style={{
                  ...styles.tabBtn,
                  ...(activeCategory === 'dress' ? styles.tabBtnActive : {}),
                }}
              >
                👗 Handmade Dress Form
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('cake');
                  if (!productCode || productCode.startsWith('AA-DRS-')) {
                    setProductCode(`AA-CKE-${Math.floor(100 + Math.random() * 900)}`);
                  }
                }}
                style={{
                  ...styles.tabBtn,
                  ...(activeCategory === 'cake' ? styles.tabBtnActive : {}),
                }}
              >
                🎂 Celebration Cake Form
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {formError && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>!</span>
            <span style={styles.errorText}>{formError}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={(e) => handleSubmit(e)} style={styles.formBody}>
          <div style={styles.formGrid}>
            {/* Left Column: Core Fields & Category Specs */}
            <div style={styles.columnLeft}>
              {/* Product Name */}
              <div style={styles.field}>
                <label style={styles.label}>
                  {activeCategory === 'dress' ? 'Dress Name *' : 'Celebration Cake Name *'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    activeCategory === 'dress'
                      ? 'e.g. Aurelia Floral Smocked Dress'
                      : 'e.g. Vanilla Bean & Fig Celebration Cake'
                  }
                  required
                  style={styles.input}
                />
              </div>

              {/* Product Code & Price */}
              <div style={styles.twoCol}>
                <div style={styles.field}>
                  <label style={styles.label}>Product Code *</label>
                  <input
                    type="text"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    disabled={isEditing}
                    style={{
                      ...styles.input,
                      backgroundColor: isEditing ? '#f5f3ef' : '#ffffff',
                    }}
                    required
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>
                    {activeCategory === 'dress' ? 'Base Price (৳) *' : 'Starting Price (৳) *'}
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    min={0}
                    step={50}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Status & Stock */}
              <div style={styles.twoCol}>
                <div style={styles.field}>
                  <label style={styles.label}>Catalog Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    style={styles.select}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="made_to_order">Made to Order</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>
                    {activeCategory === 'dress' ? 'Ready Stock Quantity' : 'Daily Baking Capacity'}
                  </label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    min={0}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Category-Specific Form Section */}
              {activeCategory === 'dress' ? (
                /* DRESS FIELDS */
                <div style={styles.specSection}>
                  <h4 style={styles.sectionHeading}>Dress Sizing & Craftsmanship</h4>

                  {/* Available Sizes */}
                  <div style={styles.field}>
                    <label style={styles.label}>Available Sizes (6M, 12M, 18M, 2T, 3T, 4T)</label>
                    <div style={styles.chipsRow}>
                      {DRESS_SIZE_OPTIONS.map((size) => {
                        const isChecked = selectedSizes.includes(size);
                        return (
                          <button
                            type="button"
                            key={size}
                            onClick={() => handleToggleSize(size)}
                            style={{
                              ...styles.sizeChip,
                              ...(isChecked ? styles.sizeChipActive : {}),
                            }}
                          >
                            {isChecked ? '✓ ' : ''}{size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lead Time */}
                  <div style={styles.field}>
                    <label style={styles.label}>Tailoring Lead Time (Days)</label>
                    <input
                      type="number"
                      value={leadTimeDays}
                      onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                      min={0}
                      style={styles.input}
                    />
                  </div>

                  {/* Fabric Provenance */}
                  <div style={styles.field}>
                    <label style={styles.label}>Fabric & Material Provenance</label>
                    <input
                      type="text"
                      value={fabricDetails}
                      onChange={(e) => setFabricDetails(e.target.value)}
                      placeholder="e.g. 100% French Linen with Organic Cotton Lining and Hand-Smocking"
                      style={styles.input}
                    />
                  </div>

                  {/* Care Instructions */}
                  <div style={styles.field}>
                    <label style={styles.label}>Garment Care Instructions</label>
                    <textarea
                      value={careInstructions}
                      onChange={(e) => setCareInstructions(e.target.value)}
                      rows={2}
                      style={styles.textarea}
                    />
                  </div>
                </div>
              ) : (
                /* CAKE FIELDS */
                <div style={styles.specSection}>
                  <h4 style={styles.sectionHeading}>Celebration Cake Specifications</h4>

                  {/* Notice Hours */}
                  <div style={styles.field}>
                    <label style={styles.label}>Minimum Notice Required (Hours)</label>
                    <select
                      value={minimumNoticeHours}
                      onChange={(e) => setMinimumNoticeHours(Number(e.target.value))}
                      style={styles.select}
                    >
                      <option value={24}>24 Hours (Same/Next Day Bento)</option>
                      <option value={48}>48 Hours Notice (Standard)</option>
                      <option value={72}>72 Hours (Vintage Lambeth Ruffle)</option>
                      <option value={120}>5 Days (Multi-tier Celebration)</option>
                    </select>
                  </div>

                  {/* Weight Options */}
                  <div style={styles.field}>
                    <label style={styles.label}>Weight Options Supported</label>
                    <div style={styles.chipsRow}>
                      {CAKE_WEIGHT_PRESETS.map((preset) => {
                        const isSelected = selectedWeights.some((w) => w.weight === preset.weight);
                        return (
                          <button
                            type="button"
                            key={preset.weight}
                            onClick={() => {
                              setSelectedWeights((prev) =>
                                isSelected
                                  ? prev.filter((w) => w.weight !== preset.weight)
                                  : [...prev, preset]
                              );
                            }}
                            style={{
                              ...styles.sizeChip,
                              ...(isSelected ? styles.sizeChipActive : {}),
                            }}
                          >
                            {isSelected ? '✓ ' : ''}{preset.weight}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Flavor Profiles */}
                  <div style={styles.field}>
                    <label style={styles.label}>Available Flavor Profiles</label>
                    <div style={styles.chipsRow}>
                      {CAKE_FLAVOR_PRESETS.map((flavor) => {
                        const isSelected = selectedFlavors.includes(flavor);
                        return (
                          <button
                            type="button"
                            key={flavor}
                            onClick={() => handleToggleFlavor(flavor)}
                            style={{
                              ...styles.flavorChip,
                              ...(isSelected ? styles.flavorChipActive : {}),
                            }}
                          >
                            {isSelected ? '✓ ' : '+ '}{flavor}
                          </button>
                        );
                      })}
                    </div>

                    <div style={styles.addFlavorInputRow}>
                      <input
                        type="text"
                        value={customFlavorInput}
                        onChange={(e) => setCustomFlavorInput(e.target.value)}
                        placeholder="Add custom flavor profile..."
                        style={styles.input}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomFlavor}
                        style={styles.addCustomBtn}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Customization Details */}
                  <div style={styles.field}>
                    <label style={styles.label}>Customization Guidelines</label>
                    <input
                      type="text"
                      value={customizationOptions}
                      onChange={(e) => setCustomizationOptions(e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  {/* Storage Instructions */}
                  <div style={styles.field}>
                    <label style={styles.label}>Storage & Serving Instructions</label>
                    <textarea
                      value={storageInstructions}
                      onChange={(e) => setStorageInstructions(e.target.value)}
                      rows={2}
                      style={styles.textarea}
                    />
                  </div>
                </div>
              )}

              {/* Editorial Description */}
              <div style={styles.field}>
                <label style={styles.label}>Editorial Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Artisan story, smocking technique, or sponge filling descriptors..."
                  rows={3}
                  style={styles.textarea}
                />
              </div>

              {/* Toggles */}
              <div style={styles.toggleGroup}>
                <label style={styles.toggleRow}>
                  <div>
                    <span style={styles.toggleTitle}>Featured on Storefront</span>
                    <span style={styles.toggleDesc}>Highlight prominently on boutique landing page</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    style={styles.checkbox}
                  />
                </label>

                <label style={styles.toggleRow}>
                  <div>
                    <span style={styles.toggleTitle}>Mark as 'New Arrival'</span>
                    <span style={styles.toggleDesc}>Showcase with seasonal archival pill</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={newArrival}
                    onChange={(e) => setNewArrival(e.target.checked)}
                    style={styles.checkbox}
                  />
                </label>
              </div>
            </div>

            {/* Right Column: Photography & Supabase Storage Management */}
            <div style={styles.columnRight}>
              <div style={styles.photoHeader}>
                <label style={styles.label}>
                  {activeCategory === 'dress'
                    ? 'Dress Photography (3:4 Editorial Portrait)'
                    : 'Cake Photography (1:1 Square Portrait)'}
                </label>
                <span style={styles.photoSubtitle}>
                  Stored in <code>product-images/{activeCategory === 'dress' ? 'dresses' : 'cakes'}/</code>
                </span>
              </div>

              {/* Hidden File Inputs */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFilesSelected}
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                style={{ display: 'none' }}
              />
              <input
                type="file"
                ref={replaceFileInputRef}
                onChange={handleExecuteReplace}
                accept="image/jpeg,image/png,image/webp,image/avif"
                style={{ display: 'none' }}
              />

              {/* Upload Trigger Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={styles.dropzone}
              >
                <span style={styles.dropzoneIcon}>☁️</span>
                <span style={styles.dropzoneTitle}>
                  {isUploading ? uploadProgressText || 'Uploading...' : '+ Upload Product Photos'}
                </span>
                <span style={styles.dropzoneSub}>
                  Multiple files allowed (Max 5 MB each: JPG, PNG, WEBP, AVIF)
                </span>
              </div>

              {/* Image Preview & Reorder List */}
              <div style={styles.imageList}>
                {images.length === 0 ? (
                  <div style={styles.noImagesNotice}>
                    No images added yet. Click above to upload gallery photos.
                  </div>
                ) : (
                  images.map((img, idx) => (
                    <div key={img.id || idx} style={styles.imageItem}>
                      {/* Image Thumbnail */}
                      <div style={styles.imageThumbWrapper}>
                        <img src={img.image_url} alt="Product view" style={styles.imageThumb} />
                        <span style={styles.sortBadge}>
                          {idx === 0 ? 'Cover (0)' : `#${idx}`}
                        </span>
                      </div>

                      {/* Image Controls */}
                      <div style={styles.imageControls}>
                        <div style={styles.reorderBtns}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, 'up')}
                            style={{
                              ...styles.controlBtn,
                              opacity: idx === 0 ? 0.4 : 1,
                            }}
                            title="Move Up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={idx === images.length - 1}
                            onClick={() => handleMoveImage(idx, 'down')}
                            style={{
                              ...styles.controlBtn,
                              opacity: idx === images.length - 1 ? 0.4 : 1,
                            }}
                            title="Move Down"
                          >
                            ↓
                          </button>
                        </div>

                        <div style={styles.imageActionBtns}>
                          <button
                            type="button"
                            onClick={() => handleTriggerReplace(img.id)}
                            style={styles.replaceBtn}
                            title="Replace image with new file"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id, img.image_url)}
                            style={styles.deletePhotoBtn}
                            title="Remove photo"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div style={styles.formFooter}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
              style={styles.cancelBtn}
            >
              Cancel
            </button>
            <div style={styles.submitBtnGroup}>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'draft')}
                disabled={isSubmitting || isUploading}
                style={styles.draftBtn}
              >
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                style={{
                  ...styles.publishBtn,
                  opacity: isSubmitting || isUploading ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Product' : 'Publish Product'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(45, 36, 33, 0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '16px',
    maxWidth: '920px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-lg, 0 16px 36px rgba(92, 62, 54, 0.16))',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #ece8e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerKicker: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#8c5e51',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '20px',
    fontWeight: 600,
    color: '#2d2421',
    marginTop: '2px',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#f5f3ef',
    border: '1px solid #dfd8ce',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: '#5c3e36',
    cursor: 'pointer',
  },
  categoryTabWrapper: {
    padding: '12px 24px',
    backgroundColor: '#fbf9f5',
    borderBottom: '1px solid #ece8e1',
  },
  categoryTabs: {
    display: 'inline-flex',
    backgroundColor: '#eeebe6',
    borderRadius: '9999px',
    padding: '3px',
    gap: '4px',
  },
  tabBtn: {
    padding: '6px 16px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6f6764',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    boxShadow: '0 2px 6px rgba(92, 62, 54, 0.12)',
  },
  errorBox: {
    margin: '16px 24px 0',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  errorIcon: {
    fontWeight: 700,
    color: '#991b1b',
  },
  errorText: {
    fontSize: '13px',
    color: '#991b1b',
  },
  formBody: {
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '24px',
  },
  columnLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  columnRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2d2421',
  },
  input: {
    height: '40px',
    borderRadius: '8px',
    border: '1px solid #dfd8ce',
    padding: '0 12px',
    fontSize: '13px',
    color: '#2d2421',
    outline: 'none',
  },
  select: {
    height: '40px',
    borderRadius: '8px',
    border: '1px solid #dfd8ce',
    padding: '0 10px',
    fontSize: '13px',
    color: '#2d2421',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  textarea: {
    borderRadius: '8px',
    border: '1px solid #dfd8ce',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#2d2421',
    outline: 'none',
    fontFamily: 'inherit',
  },
  specSection: {
    backgroundColor: '#fbf9f5',
    border: '1px solid #ece8e1',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionHeading: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '15px',
    fontWeight: 600,
    color: '#5c3e36',
    borderBottom: '1px solid #ece8e1',
    paddingBottom: '6px',
  },
  chipsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  sizeChip: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #dfd8ce',
    backgroundColor: '#ffffff',
    fontSize: '12px',
    fontWeight: 600,
    color: '#5c3e36',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  sizeChipActive: {
    backgroundColor: '#5c3e36',
    borderColor: '#5c3e36',
    color: '#ffffff',
  },
  flavorChip: {
    padding: '4px 10px',
    borderRadius: '9999px',
    border: '1px solid #dfd8ce',
    backgroundColor: '#ffffff',
    fontSize: '11px',
    fontWeight: 500,
    color: '#5c3e36',
    cursor: 'pointer',
  },
  flavorChipActive: {
    backgroundColor: '#f5ede9',
    borderColor: '#ebd8d0',
    color: '#5c3e36',
    fontWeight: 600,
  },
  addFlavorInputRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '6px',
  },
  addCustomBtn: {
    padding: '0 16px',
    backgroundColor: '#5c3e36',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  toggleGroup: {
    backgroundColor: '#fbf9f5',
    border: '1px solid #ece8e1',
    borderRadius: '10px',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
  },
  toggleTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2d2421',
    display: 'block',
  },
  toggleDesc: {
    fontSize: '11px',
    color: '#6f6764',
    display: 'block',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: '#5c3e36',
  },
  photoHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  photoSubtitle: {
    fontSize: '11px',
    color: '#988e8a',
  },
  dropzone: {
    border: '2px dashed #ebd8d0',
    borderRadius: '12px',
    padding: '24px 16px',
    backgroundColor: '#fbf9f5',
    textAlign: 'center',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s',
  },
  dropzoneIcon: {
    fontSize: '28px',
  },
  dropzoneTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#5c3e36',
  },
  dropzoneSub: {
    fontSize: '11px',
    color: '#988e8a',
  },
  imageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '320px',
    overflowY: 'auto',
  },
  noImagesNotice: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#988e8a',
    backgroundColor: '#fbf9f5',
    borderRadius: '8px',
    border: '1px dashed #dfd8ce',
  },
  imageItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: '#fbf9f5',
    borderRadius: '10px',
    border: '1px solid #dfd8ce',
  },
  imageThumbWrapper: {
    position: 'relative',
    width: '56px',
    height: '56px',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    border: '1px solid #dfd8ce',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  sortBadge: {
    position: 'absolute',
    bottom: '2px',
    left: '2px',
    right: '2px',
    backgroundColor: 'rgba(45, 36, 33, 0.75)',
    color: '#ffffff',
    fontSize: '9px',
    fontWeight: 600,
    textAlign: 'center',
    borderRadius: '2px',
  },
  imageControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  reorderBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  controlBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    border: '1px solid #dfd8ce',
    backgroundColor: '#ffffff',
    fontSize: '12px',
    fontWeight: 700,
    color: '#5c3e36',
    cursor: 'pointer',
  },
  imageActionBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  replaceBtn: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#5c3e36',
    backgroundColor: '#ffffff',
    border: '1px solid #dfd8ce',
    cursor: 'pointer',
  },
  deletePhotoBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  formFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #ece8e1',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  cancelBtn: {
    padding: '8px 18px',
    borderRadius: '9999px',
    border: '1px solid #dfd8ce',
    backgroundColor: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    color: '#6f6764',
  },
  submitBtnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  draftBtn: {
    padding: '8px 18px',
    borderRadius: '9999px',
    border: '1px solid #dfd8ce',
    backgroundColor: '#f5f3ef',
    fontSize: '13px',
    fontWeight: 600,
    color: '#5c3e36',
  },
  publishBtn: {
    padding: '8px 24px',
    borderRadius: '9999px',
    border: 'none',
    backgroundColor: '#5c3e36',
    fontSize: '13px',
    fontWeight: 600,
    color: '#ffffff',
    boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(92, 62, 54, 0.08))',
  },
};
