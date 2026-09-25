import React, { useState, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';

export interface Point {
  x: number;
  y: number;
}

export interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface ImageCropperProps {
  imageFile?: File | null;
  imageSrc?: string | null;
  aspectRatio?: number;
  onCrop?: (croppedFile: File) => void | Promise<void>;
  onCropCompleteAction?: (croppedFile: File) => void | Promise<void>;
  onCancel: () => void;
  title?: string;
}

/**
 * Creates an HTML Image element from a source string.
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    // Only set crossOrigin for remote URLs; local blob/data URLs can be tainted or fail
    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      image.setAttribute('crossOrigin', 'anonymous');
    }
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Accurately crop and rotate an image using HTML5 Canvas,
 * with resolution capping to keep processing fast, memory-safe, and under 5MB.
 */
const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<File> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the rotated bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas center to image center and rotate
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Cropped canvas 2D context is not available');
  }

  // Cap maximum export dimension to 1920px to prevent memory overflow and guarantee instant upload
  let targetWidth = Math.round(pixelCrop.width);
  let targetHeight = Math.round(pixelCrop.height);
  const MAX_DIM = 1920;

  if (targetWidth > MAX_DIM || targetHeight > MAX_DIM) {
    const scale = Math.min(MAX_DIM / targetWidth, MAX_DIM / targetHeight);
    targetWidth = Math.round(targetWidth * scale);
    targetHeight = Math.round(targetHeight * scale);
  }

  croppedCanvas.width = targetWidth;
  croppedCanvas.height = targetHeight;

  // Draw the cropped region from the rotated canvas onto the target canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate image from canvas'));
          return;
        }
        const file = new File([blob], `banner_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(file);
      },
      'image/jpeg',
      0.9
    );
  });
};

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageFile,
  imageSrc: initialImageSrc,
  aspectRatio = 3 / 2,
  onCrop,
  onCropCompleteAction,
  onCancel,
  title = 'Adjust & Crop Banner',
}) => {
  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Convert imageFile to ObjectURL or use initialImageSrc
  useEffect(() => {
    setLoadError(null);
    setIsLoadingMedia(true);

    if (imageFile) {
      try {
        const objectUrl = URL.createObjectURL(imageFile);
        setActiveSrc(objectUrl);
        setIsLoadingMedia(false);
        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      } catch {
        setLoadError('Failed to read image file. Please try another image.');
        setIsLoadingMedia(false);
      }
    } else if (initialImageSrc) {
      setActiveSrc(initialImageSrc);
      setIsLoadingMedia(false);
    } else {
      setLoadError('No image provided to adjust.');
      setIsLoadingMedia(false);
    }
  }, [imageFile, initialImageSrc]);

  // Handle ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing, onCancel]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!activeSrc || !croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const croppedFile = await getCroppedImg(activeSrc, croppedAreaPixels, rotation);
      if (onCrop) {
        await onCrop(croppedFile);
      } else if (onCropCompleteAction) {
        await onCropCompleteAction(croppedFile);
      }
    } catch (e: any) {
      console.error('Image crop failed:', e);
      alert(e?.message || 'Failed to crop image. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  // Human-readable aspect ratio label
  const ratioLabel = Math.abs(aspectRatio - 1) < 0.05
    ? '1:1 Square'
    : Math.abs(aspectRatio - 1.5) < 0.05
    ? '3:2 Landscape'
    : `${aspectRatio.toFixed(2)}:1`;

  return (
    <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget && !isProcessing) onCancel(); }}>
      <div style={styles.modal} role="dialog" aria-modal="true">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span className="material-symbols-outlined" style={styles.headerIcon}>crop</span>
            <div>
              <h3 style={styles.title}>{title}</h3>
              <span style={styles.subtitle}>Aspect: {ratioLabel}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            style={styles.closeBtn}
            title="Cancel and close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Cropper Viewport */}
        <div style={styles.cropperContainer}>
          {isLoadingMedia && (
            <div style={styles.centerFeedback}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px', animation: 'spin 1s linear infinite' }}>
                progress_activity
              </span>
              <p style={{ margin: '8px 0 0', fontSize: '13px' }}>Loading image...</p>
            </div>
          )}

          {loadError && (
            <div style={{ ...styles.centerFeedback, color: '#f87171' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>error</span>
              <p style={{ margin: '8px 0 0', fontSize: '13px' }}>{loadError}</p>
            </div>
          )}

          {activeSrc && !loadError && (
            <Cropper
              image={activeSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              showGrid={true}
              style={{
                containerStyle: {
                  borderRadius: '10px',
                  backgroundColor: '#1b1c1a',
                },
              }}
            />
          )}
        </div>

        {/* Interactive Controls */}
        <div style={styles.controls}>
          {/* Zoom Slider */}
          <div style={styles.zoomRow}>
            <span style={styles.controlLabel}>Zoom</span>
            <button
              type="button"
              style={styles.miniBtn}
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
              disabled={isProcessing || zoom <= 1}
              title="Zoom Out"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>remove</span>
            </button>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={styles.rangeInput}
              disabled={isProcessing}
            />
            <button
              type="button"
              style={styles.miniBtn}
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
              disabled={isProcessing || zoom >= 3}
              title="Zoom In"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            </button>
            <span style={styles.zoomValue}>{zoom.toFixed(1)}x</span>
          </div>

          {/* Quick Utility Tools */}
          <div style={styles.toolRow}>
            <span style={styles.hintText}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>
                touch_app
              </span>
              Drag to reposition • Scroll to zoom
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                style={styles.toolBtn}
                onClick={handleRotate}
                disabled={isProcessing}
                title="Rotate 90 degrees clockwise"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>rotate_right</span>
                Rotate 90°
              </button>
              <button
                type="button"
                style={styles.toolBtn}
                onClick={handleReset}
                disabled={isProcessing}
                title="Reset zoom and rotation"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>restart_alt</span>
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            style={styles.cancelBtn}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={styles.saveBtn}
            disabled={isProcessing || !activeSrc || !!loadError}
          >
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>
                  sync
                </span>
                Optimizing & Applying...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
                Apply & Save Banner
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(27, 28, 26, 0.72)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '16px',
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '560px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    boxShadow: '0 24px 48px -12px rgba(67, 40, 33, 0.25)',
    border: '1px solid #ebdcd5',
    maxHeight: '92vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    borderBottom: '1px solid #f1ebe6',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerIcon: {
    color: '#8a6552',
    fontSize: '24px',
    padding: '8px',
    backgroundColor: '#fbf7f4',
    borderRadius: '10px',
    border: '1px solid #e8ded8',
  },
  title: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    color: '#432821',
    letterSpacing: '-0.2px',
  },
  subtitle: {
    fontSize: '12px',
    color: '#8a6552',
    fontWeight: 500,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#7e726b',
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropperContainer: {
    position: 'relative',
    width: '100%',
    height: '340px',
    backgroundColor: '#1b1c1a',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
  },
  centerFeedback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ebdcd5',
    zIndex: 5,
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#faf6f3',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid #ede4de',
  },
  zoomRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  controlLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#432821',
    minWidth: '40px',
  },
  rangeInput: {
    flex: 1,
    accentColor: '#8a6552',
    cursor: 'pointer',
  },
  miniBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: '1px solid #d9cbbf',
    backgroundColor: '#ffffff',
    color: '#432821',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  zoomValue: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#8a6552',
    minWidth: '32px',
    textAlign: 'right',
  },
  toolRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '6px',
    borderTop: '1px dashed #e5d9d1',
  },
  hintText: {
    fontSize: '12px',
    color: '#7e726b',
    fontWeight: 500,
  },
  toolBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#5c3e36',
    backgroundColor: '#ffffff',
    border: '1px solid #d9cbbf',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '4px',
  },
  cancelBtn: {
    padding: '10px 18px',
    backgroundColor: 'transparent',
    border: '1px solid #d9cbbf',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#6f6764',
    fontSize: '14px',
    fontWeight: 600,
  },
  saveBtn: {
    padding: '10px 22px',
    backgroundColor: '#432821',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(67, 40, 33, 0.25)',
  },
};
