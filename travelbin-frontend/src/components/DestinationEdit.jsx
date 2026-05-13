import React from "react";
import { useAuth } from "../components/AuthContext";
import { apiClient } from "../config/api";

const DestinationEdit = ({items, onDestinationEdit}) => {
    const {user} = useAuth();

    const handleEdit = async () => {
        let hasFails = false;
        // Should only be one item selected.
        for (let item of items) {
            try {
                await apiClient.patch(`/travel/d/${item.id}/update/`, item)
            }
            catch (error) {
                console.log("Error editing destination: " + error.response?.data?.message);
                hasFails = true;
            }
        }
        onDestinationEdit();
        if (hasFails === false){
            alert("Destination updated.");
        }
        else {
            alert("Destination could not be updated.");
        }
    }
    
    return(
        <>
            {user ? (<button onClick={handleEdit} disabled={items.length == 0}>Edit selected</button>) : <></>}
        </>
    )
}

export default DestinationEdit;
