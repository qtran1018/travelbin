import React from "react";
import { useAuth } from "../components/AuthContext";
import { apiClient } from "../config/api";

const EntryDelete = ({items, onEntryDeleted}) => {
    const {user} = useAuth();

    const handleDelete = async () => {
        let hasFails = false;
        for (let item of items) {
            try { 
                await apiClient.delete(`/travel/${item.id}/delete/`)    
            }
            catch (error) {
                console.log("Error deleting entry: " + error);
                hasFails = true;
            }
        }
        onEntryDeleted();
        if (hasFails === false){
            alert("Entry(s) deleted.");
        }
        else {
            alert("Some entries could not be deleted.");
        }
    }
    
    return(
        <>
            {user ? (
                <button
                    onClick={handleDelete}
                    disabled={items.length === 0}
                    className="trash-button"
                    title={items.length === 0 ? "Select entries to delete" : `Delete ${items.length} selected entry(ies)`}
                >
                    🗑️
                </button>
            ) : <></>}
        </>
    )
}

export default EntryDelete;
