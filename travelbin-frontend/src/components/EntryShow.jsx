import React, { useEffect, useState, useRef, useCallback} from "react";
import '../styles/Table.css'
import EntryDelete from "./EntryDelete";
//import {draggable,dropTargetForElements,monitorForElements} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useAuth } from "../components/AuthContext";
import API_BASE_URL, { apiClient } from "../config/api";

const EntryShow = ({urlID, refresh, onRefresh, hasPermissions = false, extraControls = null}) => {
    const {user} = useAuth();
    const id = urlID // Get the ID from the URL parameters
    const [data, setData] = useState([]);
    const [originalData, setOriginalData] = useState([]);

    const [searchName, setSearchName] = useState("");
    const [searchType, setSearchType] = useState("");
    const [searchLocation, setSearchLocation] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [searchNotes, setSearchNotes] = useState("");
    const [searchContributor, setSearchContributor] = useState("");

    const [newEntry, setNewEntry] = useState({ name: '', type: '', location: '', date: '', notes: '' });

    // Auto-size a textarea to its content
    const resizeTextarea = (el) => {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    const handleResize = (e) => resizeTextarea(e.target);
    const [nameError, setNameError] = useState(false);
    const [creating, setCreating] = useState(false);

    const [selectedItems, setSelectedItems] = useState([]);
    const [savingStatus, setSavingStatus] = useState({});
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const saveTimeouts = useRef({});
    const pollInterval = useRef(null);

    const fetchEntries = useCallback((isInitial = false) => {
        apiClient.get(`/travel/d/${id}/`)
            .then((response) => {
                const fresh = response.data;
                if (isInitial) {
                    setData(fresh);
                    setOriginalData(fresh);
                } else {
                    // Merge: skip items that have a pending debounced save to avoid
                    // overwriting what the user is currently typing
                    setData(prev => {
                        const prevMap = Object.fromEntries(prev.map(p => [p.id, p]));
                        return fresh.map(freshItem => {
                            const hasPending = Object.keys(saveTimeouts.current)
                                .some(key => key.startsWith(`${freshItem.id}-`));
                            return hasPending ? (prevMap[freshItem.id] ?? freshItem) : freshItem;
                        });
                    });
                    setOriginalData(fresh);
                }
            })
            .catch((error) => console.error("Error fetching entries:", error));
    }, [id]);

    // Initial load + polling every 10s (paused when tab is hidden)
    useEffect(() => {
        fetchEntries(true);

        pollInterval.current = setInterval(() => {
            if (!document.hidden) fetchEntries(false);
        }, 10000);

        return () => {
            clearInterval(pollInterval.current);
            Object.values(saveTimeouts.current).forEach(clearTimeout);
        };
    }, [id, refresh, fetchEntries]);
    
    // Resize every textarea in the table after data changes
    useEffect(() => {
        document.querySelectorAll('td textarea.table-edit-fields').forEach(resizeTextarea);
    }, [data]);

    const filteredData = data.filter((item) => {
        const nameMatch = !searchName || item.name?.toLowerCase().includes(searchName.toLowerCase());
        const typeMatch = !searchType || item.type?.toLowerCase().includes(searchType.toLowerCase());
        const locationMatch = !searchLocation || item.location?.toLowerCase().includes(searchLocation.toLowerCase());
        const dateMatch = !searchDate || item.date?.toString().toLowerCase().includes(searchDate.toLowerCase());
        const notesMatch = !searchNotes || item.notes?.toLowerCase().includes(searchNotes.toLowerCase());
        const contributorMatch = !searchContributor || item.contributor?.toLowerCase().includes(searchContributor.toLowerCase());

    return nameMatch && typeMatch && locationMatch && dateMatch && notesMatch && contributorMatch;
    });
    
    const reset = () => {
        setSearchName("");
        setSearchType("");
        setSearchLocation("");
        setSearchDate("");
        setSearchNotes("");
        setSearchContributor("");
    };
    
    const handleCheckboxChange = (item) => {
        setSelectedItems((prev) => {
            const exists = prev.some((i) => i.id === item.id);
            return exists
                ? prev.filter((i) => i.id !== item.id)
                : [...prev, item];
        });
    };

    const handleDeleteClick = (itemId) => {
        setConfirmDeleteId(itemId);
    };

    const handleConfirmDelete = async (itemId) => {
        setDeletingId(itemId);
        try {
            await apiClient.delete(`/travel/${itemId}/delete/`);
        } catch (error) {
            console.error("Error deleting entry:", error);
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
            onRefresh();
        }
    };

    const handleCancelDelete = () => {
        setConfirmDeleteId(null);
    };

    // Auto-save function with debouncing
    const autoSave = useCallback(async (itemId, field, value) => {
        if (!user) return;

        setSavingStatus(prev => ({ ...prev, [itemId]: "saving" }));

        try {
            const item = data.find(i => i.id === itemId);
            const updatedItem = { ...item, [field]: value };
            
            await apiClient.patch(`/travel/${itemId}/update/`, updatedItem);

            // Update original data to reflect saved state
            setOriginalData(prev => 
                prev.map(i => i.id === itemId ? updatedItem : i)
            );

            setSavingStatus(prev => ({ ...prev, [itemId]: "saved" }));
            
            // Clear saved status after 1.5 seconds (faster feedback)
            setTimeout(() => {
                setSavingStatus(prev => {
                    const newStatus = { ...prev };
                    delete newStatus[itemId];
                    return newStatus;
                });
            }, 1500);
        } catch (error) {
            console.error("Error auto-saving entry:", error);
            setSavingStatus(prev => ({ ...prev, [itemId]: "error" }));
            
            // Clear error status after 3 seconds
            setTimeout(() => {
                setSavingStatus(prev => {
                    const newStatus = { ...prev };
                    delete newStatus[itemId];
                    return newStatus;
                });
            }, 3000);
        }
    }, [data]);

    const handleChange = (id, field, value) => {
        const updated = data.map((item) =>
            item.id === id ? { ...item, [field]: value } : item
        );
        setData(updated);
    
        if (field !== "contributor" && user) {
            // Clear existing timeout for this field
            const timeoutKey = `${id}-${field}`;
            if (saveTimeouts.current[timeoutKey]) {
                clearTimeout(saveTimeouts.current[timeoutKey]);
            }

            // Set new timeout for auto-save (600ms debounce for faster response)
            saveTimeouts.current[timeoutKey] = setTimeout(() => {
                autoSave(id, field, value);
                delete saveTimeouts.current[timeoutKey];
            }, 600);
        }
    };

    const handleCreate = async () => {
        if (!newEntry.name.trim()) {
            setNameError(true);
            return;
        }
        setCreating(true);
        try {
            await apiClient.post(`/travel/d/${id}/create_entry/`, {
                ...newEntry,
                type: newEntry.type || 'Other',
                date: newEntry.date || null,
                contributor: user.username,
                destination: id,
            });
            setNewEntry({ name: '', type: '', location: '', date: '', notes: '' });
            onRefresh();
        } catch (error) {
            console.error('Error creating entry:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleNewEntryKeyDown = (e) => {
        if (e.key === 'Enter') handleCreate();
    };

    const loggedInCanEdit = (
        <>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn-secondary reset-filters-btn" onClick={reset}>Reset filters</button>
                {extraControls}
            </div>
            {Object.keys(savingStatus).length > 0 && (
                <div className="save-status">
                    {Object.entries(savingStatus).map(([itemId, status]) => {
                        const item = data.find(i => i.id === parseInt(itemId));
                        if (!item) return null;
                        return (
                            <span key={itemId} className={`save-indicator save-${status}`}>
                                {status === "saving" && `Saving...`}
                                {status === "saved" && `Saved`}
                                {status === "error" && `Error saving`}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
            
            <table className="responsive-table entry-table">
                <thead>
                    <tr>
                        <th colSpan="1" className="action-buttons-cell">
                            <EntryDelete
                                items={selectedItems}
                                onEntryDeleted={() => {
                                    setSelectedItems([]);
                                    onRefresh();
                                }}
                            />
                        </th>
                        <th colSpan="1" className="col-name">
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                            />
                        </th>
                        <th colSpan="1">
                            <input
                                type="text"
                                placeholder="Search by type..."
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value)}
                            />
                        </th>
                        <th colSpan="1" className="col-location">
                            <input
                                type="text"
                                placeholder="Search by location..."
                                value={searchLocation}
                                onChange={(e) => setSearchLocation(e.target.value)}
                            />
                        </th>
                        <th colSpan="1">
                            <input
                                type="date"
                                placeholder="Search by date..."
                                value={searchDate}
                                onChange={(e) => setSearchDate(e.target.value)}
                            />
                        </th> 
                        <th colSpan="1">
                            <input
                                type="text"
                                placeholder="Search by notes..."
                                value={searchNotes}
                                onChange={(e) => setSearchNotes(e.target.value)}
                            />
                        </th> 
                        <th colSpan="1">
                            <input
                                type="text"
                                placeholder="Search by contributor..."
                                value={searchContributor}
                                onChange={(e) => setSearchContributor(e.target.value)}
                            />
                        </th>
                    </tr>
                    <tr>
                        <th className="select-all-header">
                            <div className="select-all-wrapper">
                                <input
                                    id="select-all-checkbox"
                                    type="checkbox"
                                    className="select-all-checkbox"
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedItems(filteredData);
                                        } else {
                                            setSelectedItems([]);
                                        }
                                    }}
                                    checked={
                                        filteredData.length > 0 &&
                                        filteredData.every((item) =>
                                            selectedItems.some((i) => i.id === item.id)
                                        )
                                    }
                                />
                                <label htmlFor="select-all-checkbox">All</label>
                            </div>
                        </th>
                        <th className="col-name">Name</th>
                        <th>Type</th>
                        <th className="col-location">Location</th>
                        <th>Date</th>
                        <th>Notes</th>
                        <th>Contributor</th>
                        <th className="actions-header">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="new-entry-row">
                        <td className="checkbox-cell" data-label=""></td>
                        <td className="col-name" data-label="Name">
                            <textarea
                                className={`table-edit-fields${nameError ? ' new-entry-name-error' : ''}`}
                                placeholder="Add entry name…"
                                value={newEntry.name}
                                rows="1"
                                onInput={handleResize}
                                onChange={(e) => { setNameError(false); setNewEntry(p => ({ ...p, name: e.target.value })); }}
                            />
                        </td>
                        <td data-label="Type">
                            <select
                                className="table-edit-fields"
                                value={newEntry.type}
                                onChange={(e) => setNewEntry(p => ({ ...p, type: e.target.value }))}
                            >
                                <option value="">Type</option>
                                <option value="Food & Drink">Food &amp; Drink</option>
                                <option value="Shopping">Shopping</option>
                                <option value="Activity">Activity</option>
                                <option value="Sightseeing">Sightseeing</option>
                                <option value="Other">Other</option>
                            </select>
                        </td>
                        <td className="col-location" data-label="Location">
                            <textarea
                                className="table-edit-fields"
                                placeholder="Location"
                                value={newEntry.location}
                                rows="1"
                                onInput={handleResize}
                                onChange={(e) => setNewEntry(p => ({ ...p, location: e.target.value }))}
                            />
                        </td>
                        <td data-label="Date">
                            <input
                                className="table-edit-fields"
                                type="date"
                                value={newEntry.date}
                                onChange={(e) => setNewEntry(p => ({ ...p, date: e.target.value }))}
                            />
                        </td>
                        <td data-label="Notes">
                            <textarea
                                className="table-edit-fields"
                                placeholder="Notes"
                                value={newEntry.notes}
                                rows="1"
                                onInput={handleResize}
                                onChange={(e) => setNewEntry(p => ({ ...p, notes: e.target.value }))}
                            />
                        </td>
                        <td data-label="Contributor">{user?.username}</td>
                        <td className="actions-cell new-entry-actions" data-label="Actions">
                            <button
                                type="button"
                                className="add-entry-btn"
                                onClick={handleCreate}
                                disabled={creating}
                                title="Add entry (or press Enter)"
                            >
                                {creating ? '…' : '+'}
                            </button>
                        </td>
                    </tr>
                    {filteredData.map((item)=> (
                        <tr key={item.id}>
                            <td className="checkbox-cell" data-label="">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.some((i) => i.id === item.id)}
                                    onChange={() => handleCheckboxChange(item)}
                                />
                            </td>
                            <td className="col-name" data-label="Name">
                                <div className="cell-wrapper">
                                    <textarea
                                        className="table-edit-fields"
                                        value={item.name}
                                        rows="1"
                                        onInput={handleResize}
                                        onChange={(e) => handleChange(item.id, "name", e.target.value)}
                                    />
                                    {savingStatus[item.id] && (
                                        <span className={`cell-status cell-${savingStatus[item.id]}`} title={
                                            savingStatus[item.id] === "saving" ? "Saving..." :
                                            savingStatus[item.id] === "saved" ? "Saved" :
                                            "Error saving"
                                        }>
                                            {savingStatus[item.id] === "saving" && "⏳"}
                                            {savingStatus[item.id] === "saved" && "✓"}
                                            {savingStatus[item.id] === "error" && "✗"}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td data-label="Type">
                                <select 
                                    className="table-edit-fields"
                                    value={item.type} 
                                    onChange={(e) => handleChange(item.id, "type", e.target.value)}
                                >
                                    <option value="Food & Drink">Food & Drink</option>
                                    <option value="Shopping">Shopping</option>
                                    <option value="Activity">Activity</option>
                                    <option value="Sightseeing">Sightseeing</option>
                                    <option value="Other">Other</option>
                                </select>
                            </td>
                            <td className="col-location" data-label="Location">
                                <textarea
                                    className="table-edit-fields"
                                    value={item.location ?? ""}
                                    rows="1"
                                    onInput={handleResize}
                                    onChange={(e) => handleChange(item.id, "location", e.target.value)}
                                />
                            </td>
                            <td data-label="Date">
                                <input
                                    className="table-edit-fields"
                                    type="date"
                                    value={item.date ?? ""}
                                    onChange={(e) => {
                                        handleChange(item.id, "date", e.target.value)
                                    }}
                                />
                            </td>
                            <td data-label="Notes">
                                <textarea
                                    className="table-edit-fields"
                                    value={item.notes ?? ""}
                                    rows="1"
                                    onInput={handleResize}
                                    onChange={(e) => handleChange(item.id, "notes", e.target.value)}
                                />
                            </td>
                            <td data-label="Contributor">{item.contributor}</td>
                            <td className="actions-cell" data-label="Actions">
                                {confirmDeleteId === item.id ? (
                                    <div className="delete-confirm-buttons">
                                        <button
                                            type="button"
                                            className="icon-button confirm-delete-button"
                                            onClick={() => handleConfirmDelete(item.id)}
                                            disabled={deletingId === item.id}
                                            title="Confirm delete"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            type="button"
                                            className="icon-button cancel-delete-button"
                                            onClick={handleCancelDelete}
                                            disabled={deletingId === item.id}
                                            title="Cancel"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="trash-button"
                                        title="Delete this entry"
                                        onClick={() => handleDeleteClick(item.id)}
                                    >
                                        🗑️
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
        )

    const cannotEdit = (
        <>
        <div style={{ marginBottom: '1rem' }}>
            <button type="button" className="btn-secondary reset-filters-btn" onClick={reset}>Reset filters</button>
        </div>
        <div>
            <table className="responsive-table entry-table">
                <thead>
                    <tr>
                        <th colSpan="1">
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                            />
                        </th>
                        <th colSpan="1">
                            <input
                                type="text"
                                placeholder="Search by type..."
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value)}
                            />
                        </th> 
                        <th colSpan="1">
                            <input
                                type="text"
                                placeholder="Search by location..."
                                value={searchLocation}
                                onChange={(e) => setSearchLocation(e.target.value)}
                            />
                        </th> 
                        <th colSpan="1">
                            <input
                                type="date"
                                placeholder="Search by date..."
                                value={searchDate}
                                onChange={(e) => setSearchDate(e.target.value)}
                            />
                        </th> 
                        <th colSpan="1">
                            <input
                                type="text"
                                placeholder="Search by notes..."
                                value={searchNotes}
                                onChange={(e) => setSearchNotes(e.target.value)}
                            />
                        </th> 
                        <th colSpan="1">
                            <input
                                type="text"
                                placeholder="Search by contributor..."
                                value={searchContributor}
                                onChange={(e) => setSearchContributor(e.target.value)}
                            />
                        </th>
                    </tr>
                    <tr>
                        <th className="col-name">Name</th>
                        <th>Type</th>
                        <th className="col-location">Location</th>
                        <th>Date</th>
                        <th>Notes</th>
                        <th>Contributor</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((item)=> (
                        <tr key={item.id}>
                            <td className="col-name" data-label="Name">{item.name}</td>
                            <td data-label="Type">{item.type}</td>
                            <td className="col-location" data-label="Location">{item.location}</td>
                            <td data-label="Date">{item.date}</td>
                            <td data-label="Notes">{item.notes}</td>
                            <td data-label="Contributor">{item.contributor}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        </>
    )
    // Show edit view only if user is logged in AND has permissions
    return (
        <>
            {user && hasPermissions ? loggedInCanEdit : cannotEdit}
        </>
    )
};

export default EntryShow;