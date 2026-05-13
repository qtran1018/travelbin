import React from "react";
import { useAuth } from "../components/AuthContext";
import { apiClient } from "../config/api";

const EntryEdit = ({items, onEntryEdit}) => {
    const {user} = useAuth();

    const handleEdit = async () => {
        let hasFails = false;
        // Should only be one item selected.
        for (let item of items) {
            try {
                await apiClient.patch(`/travel/${item.id}/update/`, item)
            }
            catch (error) {
                console.log("Error editing entry: " + error.response?.data?.message);
                hasFails = true;
            }
        }
        onEntryEdit();
        if (hasFails === false){
            alert("Entry(s) updated.");
        }
        else {
            alert("Entry could not be updated.");
        }
    }
    
    return(
        <>
            {user ? (<button onClick={handleEdit} disabled={items.length == 0}>Edit selected</button>) : <></>}
        </>
    )
}

export default EntryEdit;
