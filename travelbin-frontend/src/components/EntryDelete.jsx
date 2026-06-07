import React, { useState } from "react";
import { useAuth } from "../components/AuthContext";
import { apiClient } from "../config/api";
import ConfirmModal from "./ConfirmModal";

const EntryDelete = ({ items, onEntryDeleted }) => {
    const { user } = useAuth();
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleConfirm = async () => {
        setDeleting(true);
        for (const item of items) {
            try {
                await apiClient.delete(`/travel/${item.id}/delete/`);
            } catch (error) {
                console.error("Error deleting entry:", error);
            }
        }
        setDeleting(false);
        setShowConfirm(false);
        onEntryDeleted();
    };

    if (!user) return null;

    const count = items.length;

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={count === 0}
                className="trash-button"
                title={count === 0 ? "Select entries to delete" : `Delete ${count} selected entr${count === 1 ? "y" : "ies"}`}
            >
                🗑️
            </button>

            {showConfirm && (
                <ConfirmModal
                    title={`Delete ${count} entr${count === 1 ? "y" : "ies"}?`}
                    message="This cannot be undone."
                    confirmLabel={deleting ? "Deleting…" : "Delete"}
                    onConfirm={handleConfirm}
                    onCancel={() => !deleting && setShowConfirm(false)}
                />
            )}
        </>
    );
};

export default EntryDelete;
