import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import '../styles/Table.css';
import EntryDelete from "./EntryDelete";
import AddEntryModal from "./AddEntryModal";
import { draggable, dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useAuth } from "./AuthContext";
import { apiClient } from "../config/api";

// ---- Helpers ----

function formatDayLabel(dateKey) {
    if (dateKey === 'unscheduled') return 'Unscheduled';
    const d = new Date(dateKey + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function groupByDate(entries) {
    const groups = new Map();
    for (const entry of entries) {
        const key = entry.date || 'unscheduled';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(entry);
    }
    return [...groups.entries()].sort(([a], [b]) => {
        if (a === 'unscheduled') return 1;
        if (b === 'unscheduled') return -1;
        return a.localeCompare(b);
    });
}

// ---- EntryRow: one draggable/droppable editable table row ----

const EntryRow = ({
    item, dateKey,
    savingStatus, confirmDeleteId, deletingId, selectedItems,
    onCheckboxChange, onHandleChange, onHandleResize,
    onDeleteClick, onConfirmDelete, onCancelDelete,
}) => {
    const rowRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    useEffect(() => {
        const el = rowRef.current;
        if (!el) return;
        const cleanDrag = draggable({
            element: el,
            getInitialData: () => ({ type: 'entry', id: item.id, dateKey }),
            onDragStart: () => setIsDragging(true),
            onDrop: () => setIsDragging(false),
        });
        const cleanDrop = dropTargetForElements({
            element: el,
            getData: () => ({ type: 'entry', id: item.id, dateKey }),
            canDrop: ({ source }) =>
                source.data.type === 'entry' &&
                source.data.id !== item.id,
            onDragEnter: () => setIsDragOver(true),
            onDragLeave: () => setIsDragOver(false),
            onDrop: () => setIsDragOver(false),
        });
        return () => { cleanDrag(); cleanDrop(); };
    }, [item.id, dateKey]);

    return (
        <tr
            ref={rowRef}
            className={`entry-row${isDragging ? ' entry-row--dragging' : ''}${isDragOver ? ' entry-row--drag-over' : ''}`}
        >
            <td className="drag-handle-cell" title="Drag to reorder">⠿</td>
            <td className="checkbox-cell">
                <input
                    type="checkbox"
                    checked={selectedItems.some(i => i.id === item.id)}
                    onChange={() => onCheckboxChange(item)}
                />
            </td>
            <td className="col-name" data-label="Name">
                <div className="cell-wrapper">
                    <textarea
                        className="table-edit-fields"
                        value={item.name}
                        rows="1"
                        onInput={onHandleResize}
                        onChange={e => onHandleChange(item.id, "name", e.target.value)}
                    />
                    {savingStatus[item.id] && (
                        <span className={`cell-status cell-${savingStatus[item.id]}`}>
                            {savingStatus[item.id] === "saving" && "⏳"}
                            {savingStatus[item.id] === "saved" && "✓"}
                            {savingStatus[item.id] === "error" && "✗"}
                        </span>
                    )}
                </div>
            </td>
            <td data-label="Type">
                <select className="table-edit-fields" value={item.type} onChange={e => onHandleChange(item.id, "type", e.target.value)}>
                    <option value="Food & Drink">Food &amp; Drink</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Activity">Activity</option>
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Other">Other</option>
                </select>
            </td>
            <td className="col-location" data-label="Location">
                <textarea className="table-edit-fields" value={item.location ?? ""} rows="1"
                    onInput={onHandleResize} onChange={e => onHandleChange(item.id, "location", e.target.value)} />
            </td>
            <td data-label="Date">
                <input className="table-edit-fields" type="date" value={item.date ?? ""}
                    onChange={e => onHandleChange(item.id, "date", e.target.value)} />
            </td>
            <td data-label="Notes">
                <textarea className="table-edit-fields" value={item.notes ?? ""} rows="1"
                    onInput={onHandleResize} onChange={e => onHandleChange(item.id, "notes", e.target.value)} />
            </td>
            <td data-label="Contributor">{item.contributor}</td>
            <td className="actions-cell" data-label="Actions">
                {confirmDeleteId === item.id ? (
                    <div className="delete-confirm-buttons">
                        <button type="button" className="icon-button confirm-delete-button"
                            onClick={() => onConfirmDelete(item.id)} disabled={deletingId === item.id}>✓</button>
                        <button type="button" className="icon-button cancel-delete-button"
                            onClick={onCancelDelete} disabled={deletingId === item.id}>✕</button>
                    </div>
                ) : (
                    <button type="button" className="trash-button" onClick={() => onDeleteClick(item.id)}>🗑️</button>
                )}
            </td>
        </tr>
    );
};

// ---- EntryShow ----

const EntryShow = ({ urlID, refresh, onRefresh, hasPermissions = false, extraControls = null }) => {
    const { user } = useAuth();
    const id = urlID;
    const [data, setData] = useState([]);
    const [originalData, setOriginalData] = useState([]);

    const [searchName, setSearchName] = useState("");
    const [searchType, setSearchType] = useState("");
    const [searchLocation, setSearchLocation] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [searchNotes, setSearchNotes] = useState("");
    const [searchContributor, setSearchContributor] = useState("");

    const [newEntry, setNewEntry] = useState({ name: '', type: '', location: '', date: '', notes: '' });
    const [nameError, setNameError] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const [selectedItems, setSelectedItems] = useState([]);
    const [savingStatus, setSavingStatus] = useState({});
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const saveTimeouts = useRef({});
    const pollInterval = useRef(null);

    const resizeTextarea = (el) => { if (!el) return; el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; };
    const handleResize = (e) => resizeTextarea(e.target);

    const fetchEntries = useCallback((isInitial = false) => {
        apiClient.get(`/travel/d/${id}/`)
            .then(response => {
                const fresh = response.data;
                if (isInitial) {
                    setData(fresh);
                    setOriginalData(fresh);
                } else {
                    setData(prev => {
                        const prevMap = Object.fromEntries(prev.map(p => [p.id, p]));
                        return fresh.map(freshItem => {
                            const hasPending = Object.keys(saveTimeouts.current).some(key => key.startsWith(`${freshItem.id}-`));
                            return hasPending ? (prevMap[freshItem.id] ?? freshItem) : freshItem;
                        });
                    });
                    setOriginalData(fresh);
                }
            })
            .catch(error => console.error("Error fetching entries:", error));
    }, [id]);

    useEffect(() => {
        fetchEntries(true);
        pollInterval.current = setInterval(() => { if (!document.hidden) fetchEntries(false); }, 10000);
        return () => {
            clearInterval(pollInterval.current);
            Object.values(saveTimeouts.current).forEach(clearTimeout);
        };
    }, [id, refresh, fetchEntries]);

    useEffect(() => {
        document.querySelectorAll('td textarea.table-edit-fields').forEach(resizeTextarea);
    }, [data]);

    // Filter then group
    const filteredData = useMemo(() => data.filter(item => {
        const q = (v, s) => !s || (v ?? '').toLowerCase().includes(s.toLowerCase());
        return q(item.name, searchName) && q(item.type, searchType) &&
            q(item.location, searchLocation) && q(item.date, searchDate) &&
            q(item.notes, searchNotes) && q(item.contributor, searchContributor);
    }), [data, searchName, searchType, searchLocation, searchDate, searchNotes, searchContributor]);

    const groupedDays = useMemo(() => groupByDate(filteredData), [filteredData]);

    const reset = () => {
        setSearchName(""); setSearchType(""); setSearchLocation("");
        setSearchDate(""); setSearchNotes(""); setSearchContributor("");
    };

    // DnD: global drop monitor — handles both within-group reorder and cross-group date assignment
    useEffect(() => {
        if (!hasPermissions) return;
        return monitorForElements({
            onDrop({ source, location }) {
                const target = location.current.dropTargets[0];
                if (!target) return;
                const { id: sourceId, dateKey: sourceDateKey } = source.data;
                const { id: targetId, dateKey: targetDateKey } = target.data;
                if (sourceId === targetId) return;

                const isCrossGroup = sourceDateKey !== targetDateKey;
                const newDate = isCrossGroup
                    ? (targetDateKey === 'unscheduled' ? null : targetDateKey)
                    : undefined;

                setData(prev => {
                    const sourceEntry = prev.find(i => i.id === sourceId);
                    if (!sourceEntry) return prev;

                    const movedEntry = isCrossGroup
                        ? { ...sourceEntry, date: newDate }
                        : { ...sourceEntry };

                    // Build ordered group map from data minus the dragged entry
                    const withoutSource = prev.filter(i => i.id !== sourceId);
                    const groupOrder = [];
                    const groupMap = new Map();
                    for (const item of withoutSource) {
                        const key = item.date || 'unscheduled';
                        if (!groupMap.has(key)) { groupMap.set(key, []); groupOrder.push(key); }
                        groupMap.get(key).push(item);
                    }

                    // Insert movedEntry at the target row's position within the target group
                    if (!groupMap.has(targetDateKey)) { groupMap.set(targetDateKey, []); groupOrder.push(targetDateKey); }
                    const targetGroup = groupMap.get(targetDateKey);
                    const targetIdx = targetGroup.findIndex(i => i.id === targetId);
                    targetGroup.splice(targetIdx === -1 ? targetGroup.length : targetIdx, 0, movedEntry);

                    // Assign sequential sort_order to the updated target group
                    const updatedTargetGroup = targetGroup.map((item, idx) => ({ ...item, sort_order: idx }));
                    groupMap.set(targetDateKey, updatedTargetGroup);

                    // Persist: PATCH the date if cross-group, then reorder target group
                    if (isCrossGroup) {
                        apiClient.patch(`/travel/${sourceId}/update/`, { date: newDate })
                            .catch(err => console.error("Cross-group date update failed:", err));
                    }
                    apiClient.post(`/travel/d/${id}/reorder/`,
                        updatedTargetGroup.map(e => ({ id: e.id, sort_order: e.sort_order }))
                    ).catch(err => console.error("Reorder failed:", err));

                    // Flatten all groups back preserving their original relative order
                    return groupOrder.flatMap(key => groupMap.get(key));
                });
            }
        });
    }, [id, hasPermissions]);

    // Checkbox
    const handleCheckboxChange = (item) => {
        setSelectedItems(prev => prev.some(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [...prev, item]);
    };

    // Delete
    const handleDeleteClick = (itemId) => setConfirmDeleteId(itemId);
    const handleCancelDelete = () => setConfirmDeleteId(null);
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

    // Auto-save
    const autoSave = useCallback(async (itemId, field, value) => {
        if (!user) return;
        setSavingStatus(prev => ({ ...prev, [itemId]: "saving" }));
        try {
            const item = data.find(i => i.id === itemId);
            const updatedItem = { ...item, [field]: value };
            await apiClient.patch(`/travel/${itemId}/update/`, updatedItem);
            setOriginalData(prev => prev.map(i => i.id === itemId ? updatedItem : i));
            setSavingStatus(prev => ({ ...prev, [itemId]: "saved" }));
            setTimeout(() => setSavingStatus(prev => { const n = { ...prev }; delete n[itemId]; return n; }), 1500);
        } catch (error) {
            console.error("Error auto-saving entry:", error);
            setSavingStatus(prev => ({ ...prev, [itemId]: "error" }));
            setTimeout(() => setSavingStatus(prev => { const n = { ...prev }; delete n[itemId]; return n; }), 3000);
        }
    }, [data]);

    const handleChange = (itemId, field, value) => {
        setData(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
        if (field !== "contributor" && user) {
            const timeoutKey = `${itemId}-${field}`;
            if (saveTimeouts.current[timeoutKey]) clearTimeout(saveTimeouts.current[timeoutKey]);
            saveTimeouts.current[timeoutKey] = setTimeout(() => {
                autoSave(itemId, field, value);
                delete saveTimeouts.current[timeoutKey];
            }, 600);
        }
    };

    // Create
    const handleCreate = async () => {
        if (!newEntry.name.trim()) { setNameError(true); return; }
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
            setShowAddModal(false);
            onRefresh();
        } catch (error) {
            console.error('Error creating entry:', error);
        } finally {
            setCreating(false);
        }
    };

    // Shared row handler props
    const rowHandlers = {
        savingStatus, confirmDeleteId, deletingId, selectedItems,
        onCheckboxChange: handleCheckboxChange,
        onHandleChange: handleChange,
        onHandleResize: handleResize,
        onDeleteClick: handleDeleteClick,
        onConfirmDelete: handleConfirmDelete,
        onCancelDelete: handleCancelDelete,
    };

    // Column headers (editable view)
    const editThead = (
        <thead>
            <tr>
                <th className="drag-handle-header"></th>
                <th className="checkbox-header"></th>
                <th className="col-name">Name</th>
                <th>Type</th>
                <th className="col-location">Location</th>
                <th>Date</th>
                <th>Notes</th>
                <th>Contributor</th>
                <th className="actions-header">Actions</th>
            </tr>
        </thead>
    );

    // ---- EDITABLE VIEW ----
    if (user && hasPermissions) {
        return (
            <>
                {/* Toolbar */}
                <div className="entry-toolbar">
                    <div className="entry-toolbar-left">
                        <button type="button" className="entry-action-btn entry-action-btn--ghost reset-filters-btn" onClick={reset}>
                            Reset filters
                        </button>
                        {extraControls}
                    </div>
                    {Object.keys(savingStatus).length > 0 && (
                        <div className="save-status">
                            {Object.entries(savingStatus).map(([itemId, status]) => {
                                if (!data.find(i => i.id === parseInt(itemId))) return null;
                                return (
                                    <span key={itemId} className={`save-indicator save-${status}`}>
                                        {status === "saving" && "Saving..."}
                                        {status === "saved" && "Saved"}
                                        {status === "error" && "Error saving"}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Filter bar */}
                <div className="entry-filter-bar">
                    <input type="text" placeholder="Name…" value={searchName} onChange={e => setSearchName(e.target.value)} />
                    <input type="text" placeholder="Type…" value={searchType} onChange={e => setSearchType(e.target.value)} />
                    <input type="text" placeholder="Location…" value={searchLocation} onChange={e => setSearchLocation(e.target.value)} />
                    <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} title="Filter by date" />
                    <input type="text" placeholder="Notes…" value={searchNotes} onChange={e => setSearchNotes(e.target.value)} />
                    <input type="text" placeholder="Contributor…" value={searchContributor} onChange={e => setSearchContributor(e.target.value)} />
                    <div className="filter-bar-actions">
                        <label className="filter-bar-select-all">
                            <input
                                type="checkbox"
                                onChange={e => setSelectedItems(e.target.checked ? filteredData : [])}
                                checked={filteredData.length > 0 && filteredData.every(item => selectedItems.some(i => i.id === item.id))}
                            />
                            All
                        </label>
                        <EntryDelete items={selectedItems} onEntryDeleted={() => { setSelectedItems([]); onRefresh(); }} />
                    </div>
                </div>

                {/* New entry row */}
                <table className="entry-table new-entry-table">
                    {editThead}
                    <tbody>
                        <tr className="new-entry-row">
                            <td className="drag-handle-cell"></td>
                            <td className="checkbox-cell"></td>
                            <td className="col-name" data-label="Name">
                                <textarea
                                    className={`table-edit-fields${nameError ? ' new-entry-name-error' : ''}`}
                                    placeholder="Add entry name…"
                                    value={newEntry.name}
                                    rows="1"
                                    onInput={handleResize}
                                    onChange={e => { setNameError(false); setNewEntry(p => ({ ...p, name: e.target.value })); }}
                                />
                            </td>
                            <td data-label="Type">
                                <select className="table-edit-fields" value={newEntry.type} onChange={e => setNewEntry(p => ({ ...p, type: e.target.value }))}>
                                    <option value="">Type</option>
                                    <option value="Food & Drink">Food &amp; Drink</option>
                                    <option value="Shopping">Shopping</option>
                                    <option value="Activity">Activity</option>
                                    <option value="Sightseeing">Sightseeing</option>
                                    <option value="Other">Other</option>
                                </select>
                            </td>
                            <td className="col-location" data-label="Location">
                                <textarea className="table-edit-fields" placeholder="Location" value={newEntry.location} rows="1"
                                    onInput={handleResize} onChange={e => setNewEntry(p => ({ ...p, location: e.target.value }))} />
                            </td>
                            <td data-label="Date">
                                <input className="table-edit-fields" type="date" value={newEntry.date}
                                    onChange={e => setNewEntry(p => ({ ...p, date: e.target.value }))} />
                            </td>
                            <td data-label="Notes">
                                <textarea className="table-edit-fields" placeholder="Notes" value={newEntry.notes} rows="1"
                                    onInput={handleResize} onChange={e => setNewEntry(p => ({ ...p, notes: e.target.value }))} />
                            </td>
                            <td>{user?.username}</td>
                            <td className="actions-cell new-entry-actions">
                                <button type="button" className="add-entry-btn" onClick={handleCreate} disabled={creating}>
                                    {creating ? '…' : '+'}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Mobile add-entry trigger (hidden on desktop via CSS) */}
                {hasPermissions && (
                    <button className="add-entry-mobile-btn" onClick={() => setShowAddModal(true)}>
                        + Add Entry
                    </button>
                )}

                {/* Day groups */}
                {groupedDays.length === 0 ? (
                    <div className="entries-empty">No entries yet. Add one above.</div>
                ) : (
                    groupedDays.map(([dateKey, items]) => (
                        <section key={dateKey} className="day-group">
                            <div className="day-group-header">
                                <span className="day-group-label">{formatDayLabel(dateKey)}</span>
                                <span className="day-group-count">{items.length}</span>
                            </div>
                            <table className="responsive-table entry-table">
                                {editThead}
                                <tbody>
                                    {items.map(item => (
                                        <EntryRow key={item.id} item={item} dateKey={dateKey} {...rowHandlers} />
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    ))
                )}

                {showAddModal && (
                    <AddEntryModal
                        newEntry={newEntry}
                        setNewEntry={setNewEntry}
                        onCreate={handleCreate}
                        creating={creating}
                        nameError={nameError}
                        setNameError={setNameError}
                        onCancel={() => { setShowAddModal(false); setNameError(false); }}
                    />
                )}
            </>
        );
    }

    // ---- READ-ONLY VIEW ----
    return (
        <>
            <div className="entry-toolbar">
                <div className="entry-toolbar-left">
                    <button type="button" className="entry-action-btn entry-action-btn--ghost reset-filters-btn" onClick={reset}>
                        Reset filters
                    </button>
                </div>
            </div>

            <div className="entry-filter-bar">
                <input type="text" placeholder="Name…" value={searchName} onChange={e => setSearchName(e.target.value)} />
                <input type="text" placeholder="Type…" value={searchType} onChange={e => setSearchType(e.target.value)} />
                <input type="text" placeholder="Location…" value={searchLocation} onChange={e => setSearchLocation(e.target.value)} />
                <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} title="Filter by date" />
                <input type="text" placeholder="Notes…" value={searchNotes} onChange={e => setSearchNotes(e.target.value)} />
                <input type="text" placeholder="Contributor…" value={searchContributor} onChange={e => setSearchContributor(e.target.value)} />
            </div>

            {groupedDays.length === 0 ? (
                <div className="entries-empty">No entries yet.</div>
            ) : (
                groupedDays.map(([dateKey, items]) => (
                    <section key={dateKey} className="day-group">
                        <div className="day-group-header">
                            <span className="day-group-label">{formatDayLabel(dateKey)}</span>
                            <span className="day-group-count">{items.length}</span>
                        </div>
                        <table className="responsive-table entry-table">
                            <thead>
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
                                {items.map(item => (
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
                    </section>
                ))
            )}
        </>
    );
};

export default EntryShow;
