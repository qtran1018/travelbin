import React from "react";
import { useAuth } from "../components/AuthContext";
import { apiClient } from "../config/api";

const DestinationDelete = ({items, onDestinationDeleted}) => {
    const {user} = useAuth();

    const handleDelete = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this destination(s)?");
        if (!confirmDelete) return;
        let hasFails = false;
        for (let item of items) {
            try { 
                await apiClient.delete(`/travel/d/${item.id}/delete/`)    
            }
            catch (error) {
                console.log("Error deleting Destination: " + error);
                hasFails = true;
            }
        }
        onDestinationDeleted();
        if (hasFails === false){
            alert("Destination(s) deleted.");
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
                    title={items.length === 0 ? "Select items to delete" : `Delete ${items.length} selected item(s)`}
                >
                    🗑️
                </button>
            ) : <></>}
        </>
    )
}

export default DestinationDelete;
