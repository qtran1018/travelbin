import React, { useEffect } from "react";
import "../styles/AddEntryModal.css";

const AddEntryModal = ({ newEntry, setNewEntry, onCreate, creating, nameError, setNameError, onCancel }) => {
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") onCancel(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onCancel]);

    return (
        <div className="aem-overlay" onClick={onCancel}>
            <div className="aem-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className="aem-header">
                    <span className="aem-title">New Entry</span>
                    <button className="aem-close" onClick={onCancel} aria-label="Close">✕</button>
                </div>

                <div className="aem-body">
                    <label className="aem-label">
                        Name <span className="aem-required">*</span>
                        <input
                            className={`aem-input${nameError ? " aem-input--error" : ""}`}
                            type="text"
                            placeholder="e.g. Senso-ji Temple"
                            value={newEntry.name}
                            onChange={e => { setNameError(false); setNewEntry(p => ({ ...p, name: e.target.value })); }}
                            autoFocus
                        />
                        {nameError && <span className="aem-error-msg">Name is required</span>}
                    </label>

                    <label className="aem-label">
                        Type
                        <select className="aem-input" value={newEntry.type} onChange={e => setNewEntry(p => ({ ...p, type: e.target.value }))}>
                            <option value="">Select type…</option>
                            <option value="Food & Drink">Food &amp; Drink</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Activity">Activity</option>
                            <option value="Sightseeing">Sightseeing</option>
                            <option value="Other">Other</option>
                        </select>
                    </label>

                    <label className="aem-label">
                        Location
                        <input
                            className="aem-input"
                            type="text"
                            placeholder="e.g. Asakusa, Tokyo"
                            value={newEntry.location}
                            onChange={e => setNewEntry(p => ({ ...p, location: e.target.value }))}
                        />
                    </label>

                    <label className="aem-label">
                        Date
                        <input
                            className="aem-input"
                            type="date"
                            value={newEntry.date}
                            onChange={e => setNewEntry(p => ({ ...p, date: e.target.value }))}
                        />
                    </label>

                    <label className="aem-label">
                        Notes
                        <textarea
                            className="aem-input aem-textarea"
                            placeholder="Tips, highlights…"
                            value={newEntry.notes}
                            rows={3}
                            onChange={e => setNewEntry(p => ({ ...p, notes: e.target.value }))}
                        />
                    </label>
                </div>

                <div className="aem-footer">
                    <button className="aem-btn aem-btn--cancel" onClick={onCancel}>Cancel</button>
                    <button className="aem-btn aem-btn--save" onClick={onCreate} disabled={creating}>
                        {creating ? "Saving…" : "Save Entry"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddEntryModal;
