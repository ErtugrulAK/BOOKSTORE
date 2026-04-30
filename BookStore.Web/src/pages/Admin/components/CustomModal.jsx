import React from 'react';
import './CustomModal.css';

const CustomModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'confirm' }) => {
    if (!isOpen) return null;

    return (
        <div className="custom-modal-overlay">
            <div className="custom-modal-content">
                <div className="custom-modal-header">
                    <h3>{title}</h3>
                </div>
                <div className="custom-modal-body">
                    <p>{message}</p>
                </div>
                <div className="custom-modal-footer">
                    {(type === 'confirm' || type === 'danger') && (
                        <button className="modal-btn secondary" onClick={onCancel}>İptal</button>
                    )}
                    <button className={`modal-btn primary ${type === 'danger' ? 'danger' : ''}`} onClick={onConfirm}>
                        {type === 'alert' ? 'Tamam' : 'Evet, Onaylıyorum'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomModal;
