/**
 * Ababil’s Attire by Sanjida Bethi
 * Product Deletion Confirmation Modal
 */

import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  productName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  productName,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.iconCircle}>
          <span style={styles.icon}>!</span>
        </div>
        <h3 style={styles.title}>Delete Product Record</h3>
        <p style={styles.description}>
          Are you sure you want to permanently delete <strong>"{productName}"</strong>?
          This will remove all associated photography, sizing specifications, and catalog entries.
        </p>
        <div style={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            style={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              ...styles.deleteButton,
              opacity: isDeleting ? 0.7 : 1,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(45, 36, 33, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#ffffff',
    border: '1px solid var(--color-border-default, #dfd8ce)',
    borderRadius: '16px',
    padding: '32px 24px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(92, 62, 54, 0.16))',
  },
  iconCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  icon: {
    fontSize: '20px',
    fontWeight: 700,
  },
  title: {
    fontFamily: "var(--font-serif, 'Bodoni Moda', serif)",
    fontSize: '20px',
    fontWeight: 600,
    color: '#2d2421',
    marginBottom: '8px',
  },
  description: {
    fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
    fontSize: '13px',
    color: '#6f6764',
    lineHeight: 1.5,
    marginBottom: '24px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  cancelButton: {
    flex: 1,
    height: '42px',
    borderRadius: '9999px',
    border: '1px solid #dfd8ce',
    backgroundColor: '#f5f3ef',
    color: '#2d2421',
    fontSize: '13px',
    fontWeight: 600,
  },
  deleteButton: {
    flex: 1,
    height: '42px',
    borderRadius: '9999px',
    border: 'none',
    backgroundColor: '#ba1a1a',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
  },
};
