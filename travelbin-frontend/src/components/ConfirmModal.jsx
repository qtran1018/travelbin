import React, { useEffect } from "react";
import "../styles/ConfirmModal.css";

const ConfirmModal = ({ title, message, confirmLabel = "Delete", onConfirm, onCancel }) => {
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onCancel(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onCancel]);

    return (
        <div className="cm-overlay" onClick={onCancel}>
            <div className="cm-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <h3 className="cm-title">{title}</h3>
                {message && <p className="cm-message">{message}</p>}
                <div className="cm-actions">
                    <button className="cm-btn cm-btn--cancel" onClick={onCancel}>Cancel</button>
                    <button className="cm-btn cm-btn--confirm" onClick={onConfirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
