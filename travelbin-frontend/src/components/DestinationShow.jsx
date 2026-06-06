import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { apiClient } from "../config/api";
import '../styles/Profile.css';

const DestinationShow = ({ refresh, onRefresh, canCreate = false }) => {
    const { id } = useParams();
    const [data, setData] = useState([]);
    // Create state
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const createInputRef = useRef(null);

    // Rename state
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [savingId, setSavingId] = useState(null);
    const editInputRef = useRef(null);

    // Delete state
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        apiClient.get(`/travel/u/${id}/`)
            .then(res => setData(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error("Error fetching destinations:", err));
    }, [id, refresh]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setCreating(true);
        try {
            await apiClient.post('/travel/d/add_travel/', { name: newName.trim() });
            setNewName("");
            onRefresh();
        } catch (err) {
            console.error("Error creating destination:", err);
            alert("Failed to create destination.");
        } finally {
            setCreating(false);
        }
    };

    // Auto-focus rename input when it opens
    useEffect(() => {
        if (editingId && editInputRef.current) editInputRef.current.focus();
    }, [editingId]);

    const handleRenameClick = (item) => {
        setEditingId(item.id);
        setEditName(item.name);
        setConfirmDeleteId(null);
    };

    const handleRenameSave = async (itemId) => {
        const trimmed = editName.trim();
        if (!trimmed) return;
        setSavingId(itemId);
        try {
            await apiClient.patch(`/travel/d/${itemId}/update/`, { name: trimmed });
            setData(prev => prev.map(i => i.id === itemId ? { ...i, name: trimmed } : i));
            setEditingId(null);
        } catch (err) {
            console.error("Error renaming destination:", err);
            alert("Failed to rename destination.");
        } finally {
            setSavingId(null);
        }
    };

    const handleRenameCancel = () => {
        setEditingId(null);
        setEditName("");
    };

    const handleRenameKey = (e, itemId) => {
        if (e.key === "Enter") handleRenameSave(itemId);
        if (e.key === "Escape") handleRenameCancel();
    };

    const handleDeleteClick = (itemId) => setConfirmDeleteId(itemId);
    const handleCancelDelete = () => setConfirmDeleteId(null);

    const handleConfirmDelete = async (itemId) => {
        setDeletingId(itemId);
        try {
            await apiClient.delete(`/travel/d/${itemId}/delete/`);
            setData(prev => prev.filter(i => i.id !== itemId));
            onRefresh();
        } catch (err) {
            console.error("Error deleting destination:", err);
            alert("Failed to delete destination.");
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    return (
        <div className="destinations-section">

            {/* Header */}
            <div className="destinations-header">
                <div className="destinations-header-left">
                    <span className="destinations-title">Destinations</span>
                    {data.length > 0 && (
                        <span className="destinations-count">{data.length}</span>
                    )}
                </div>
                {canCreate && (
                    <form className="destinations-header-right" onSubmit={handleCreate}>
                        <input
                            ref={createInputRef}
                            type="text"
                            className="destinations-search"
                            placeholder="New destination…"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            maxLength={100}
                        />
                        <button
                            type="submit"
                            className="dest-new-btn"
                            disabled={creating || !newName.trim()}
                        >
                            {creating ? "…" : "+ New"}
                        </button>
                    </form>
                )}
            </div>

            {/* List */}
            <div className="destinations-list">
                {data.length === 0 ? (
                    <div className="destinations-empty">
                        {canCreate
                            ? "No destinations yet. Type a name above and hit + New."
                            : "No destinations yet."}
                    </div>
                ) : (
                    data.map(item => (
                        <div key={item.id} className="destination-row">
                            {editingId === item.id ? (
                                <div className="dest-rename-form">
                                    <input
                                        ref={editInputRef}
                                        className="dest-rename-input"
                                        value={editName}
                                        maxLength={100}
                                        onChange={e => setEditName(e.target.value)}
                                        onKeyDown={e => handleRenameKey(e, item.id)}
                                    />
                                    <button
                                        className="dest-action-btn dest-confirm-btn"
                                        onClick={() => handleRenameSave(item.id)}
                                        disabled={savingId === item.id || !editName.trim()}
                                        title="Save name"
                                    >{savingId === item.id ? "…" : "✓"}</button>
                                    <button
                                        className="dest-action-btn dest-cancel-btn"
                                        onClick={handleRenameCancel}
                                        title="Cancel"
                                    >✕</button>
                                </div>
                            ) : (
                                <Link to={`/d/${item.id}`} className="destination-link">
                                    <span className="destination-name">{item.name}</span>
                                    <span className="destination-arrow">→</span>
                                </Link>
                            )}
                            {canCreate && editingId !== item.id && (
                                <div className="destination-actions">
                                    {confirmDeleteId === item.id ? (
                                        <>
                                            <button
                                                className="dest-action-btn dest-confirm-btn"
                                                onClick={() => handleConfirmDelete(item.id)}
                                                disabled={deletingId === item.id}
                                                title="Confirm delete"
                                            >✓</button>
                                            <button
                                                className="dest-action-btn dest-cancel-btn"
                                                onClick={handleCancelDelete}
                                                title="Cancel"
                                            >✕</button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="dest-action-btn dest-rename-btn"
                                                onClick={() => handleRenameClick(item)}
                                                title="Rename destination"
                                            >✏️</button>
                                            <button
                                                className="dest-action-btn dest-delete-btn"
                                                onClick={() => handleDeleteClick(item.id)}
                                                title="Delete destination"
                                            >🗑️</button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DestinationShow;
