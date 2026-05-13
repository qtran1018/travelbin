import React, { useEffect, useState, useRef, useCallback} from "react";
import { useParams } from "react-router-dom";
import {Link} from 'react-router-dom';
import API_BASE_URL, { apiClient } from "../config/api";

import { useAuth } from "../components/AuthContext";
import DestinationDelete from "./DestinationDelete";
import '../styles/Table.css'

const DestinationShow = ({refresh, onRefresh}) => {
    const {user} = useAuth();
    const { id } = useParams(); // Get the ID from the URL parameters
    const [data, setData] = useState([]);
    const [originalData, setOriginalData] = useState([]);

    const [searchName, setSearchName] = useState("");

    const [selectedItems, setSelectedItems] = useState([]);
    const [savingStatus, setSavingStatus] = useState({});
    const saveTimeouts = useRef({});
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);



    useEffect(() => {
        // Fetch data from the Django REST API
        apiClient.get(`/travel/u/${id}/`)
            .then((response) => {
                setData(response.data);
                setOriginalData(response.data);
            })
            .catch((error) => {
                console.error("Error fetching data:", error)
            });
    }, [id, refresh]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            Object.values(saveTimeouts.current).forEach(timeout => clearTimeout(timeout));
        };
    }, []);
    
    const filteredData = data.filter((item) => {
        const query = (searchName || "").toLowerCase();
        if (!query) return true;

        const nameMatch = item.name?.toLowerCase().includes(query);
        const idMatch = item.id?.toString().toLowerCase().includes(query);

        return nameMatch || idMatch;
    });

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
            await apiClient.delete(`/travel/d/${itemId}/delete/`);
            setData(prev => prev.filter(item => item.id !== itemId));
            onRefresh();
        } catch (error) {
            console.error("Error deleting destination:", error);
            alert("Error: " + (error.response?.data?.message || "Failed to delete destination"));
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const handleCancelDelete = () => {
        setConfirmDeleteId(null);
    };

    // Auto-save function with debouncing
    const autoSave = useCallback(async (itemId, field, value) => {
        const token = localStorage.getItem("access");
        if (!token) return;

        setSavingStatus(prev => ({ ...prev, [itemId]: "saving" }));

        try {
            const item = data.find(i => i.id === itemId);
            const updatedItem = { ...item, [field]: value };
            
            await apiClient.patch(`/travel/d/${itemId}/update/`,
                updatedItem,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

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
            console.error("Error auto-saving destination:", error);
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

    const handleChange = (handledID, field, value) => {
        const updated = data.map((item) =>
            item.id === handledID ? { ...item, [field]: value } : item
        );
        setData(updated);
    
        if (field !== "id" && user) {
            // Clear existing timeout for this field
            const timeoutKey = `${handledID}-${field}`;
            if (saveTimeouts.current[timeoutKey]) {
                clearTimeout(saveTimeouts.current[timeoutKey]);
            }

            // Set new timeout for auto-save (600ms debounce for faster response)
            saveTimeouts.current[timeoutKey] = setTimeout(() => {
                autoSave(handledID, field, value);
                delete saveTimeouts.current[timeoutKey];
            }, 600);
        }
    };

    // Variables storing each type of table depending on the user's logged in status
    // and whether they can edit or not.
    const loggedInCanEdit = (
        <>
        <div>
            {Object.keys(savingStatus).length > 0 && (
                <div className="save-status" style={{ marginBottom: '0.5rem' }}>
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
            <table className="destinations-table">
                <thead>
                    <tr>
                        <th></th>
                        <th colSpan="1">
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                            />
                        </th>
                    </tr>
                    <tr>
                        <th className="delete-button-header">
                            <DestinationDelete 
                                items={selectedItems} 
                                onDestinationDeleted={() => {
                                    setSelectedItems([])
                                    onRefresh();
                                }}
                            />
                        </th> 
                        <th>Destination</th>
                        <th className="actions-header"></th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((item)=> (
                        <tr key={item.id}>
                            <td data-label="">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.some((i) => i.id === item.id)}
                                    onChange={() => handleCheckboxChange(item)}
                                />
                            </td>
                            <td data-label="Destination">
                                <Link to={`/d/${item.id}`}>
                                    {item.name}
                                </Link>
                            </td>
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
                                        title="Delete this destination"
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
            </div>
        </>
    );

    const cannotEdit = (
        <>
            <table className="readonly-destinations-table">
                <thead>
                    <tr>
                        <th colSpan="1">
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                            />
                        </th>
                    </tr>
                    <tr>
                        <th>Destination</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((item)=> (
                        <tr key={item.id}>
                            <td data-label="Destination">
                                <Link to={`/d/${item.id}`}>
                                    {item.name}
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );

    return (
        <div>
            
            {user && user.username === id ? loggedInCanEdit : cannotEdit}
        </div>
    )
};

export default DestinationShow;