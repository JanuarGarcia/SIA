import React, { useState, useEffect } from 'react';
import '../styles/ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, inputLabel, inputPlaceholder, isRequired = false, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  const [inputValue, setInputValue] = useState('');

  // Reset input when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isRequired && !inputValue.trim()) {
      return; // Don't allow confirmation if required field is empty
    }
    onConfirm(inputValue.trim());
    setInputValue('');
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="confirmation-modal-overlay" onClick={handleBackdropClick}>
      <div className="confirmation-modal-container">
        <div className="confirmation-modal-header">
          <h3 className="confirmation-modal-title">{title}</h3>
          <button className="confirmation-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        
        <div className="confirmation-modal-body">
          {message && <p className="confirmation-modal-message">{message}</p>}
          
          {(inputLabel || inputPlaceholder) && (
            <div className="confirmation-modal-input-group">
              <label htmlFor="confirmation-input" className="confirmation-modal-label">
                {inputLabel || ''}
                {isRequired && <span className="required-asterisk"> *</span>}
              </label>
              <textarea
                id="confirmation-input"
                className="confirmation-modal-textarea"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={inputPlaceholder || ''}
                rows={4}
                autoFocus
                required={isRequired}
              />
            </div>
          )}
        </div>

        <div className="confirmation-modal-footer">
          <button
            className="confirmation-modal-btn confirmation-modal-btn-cancel"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            className="confirmation-modal-btn confirmation-modal-btn-confirm"
            onClick={handleConfirm}
            disabled={isRequired && !inputValue.trim()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

