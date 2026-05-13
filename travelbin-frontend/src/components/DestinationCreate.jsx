import React, {useState} from "react";
import {useAuth} from "../components/AuthContext";
import '../styles/Table.css'
import { apiClient } from "../config/api";

const DestinationCreate = ({onDestinationCreated}) => {
    const [inputName, setInputName] = useState("");
    const {user} = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();

        const addDestination = {
            name: inputName,
        };
        if (inputName === ''){
            return alert("Name is required.");
        };

        apiClient.post(`/travel/d/add_travel/`, addDestination)
            .then((response) => {
                // Reset form on success
                setInputName("");
                // Trigger refresh
                onDestinationCreated();
                // Show success message (could be replaced with toast notification)
                console.log("Destination created:", response?.data?.name);
            })
            .catch((error) => {
                console.error("Error creating destination:", error);
                alert("Error: " + (error.response?.data?.message || "Failed to create destination"));
            });
    }

    return (
        <>
            {user ? (
            <div className="create-container">
                <h3>Create New Destination</h3>
                <form onSubmit={handleSubmit} className="destination-create-form">
                    <div className="destination-create-mobile">
                        <label htmlFor="destination-input" style={{ display: "none" }}>
                            Destination Name
                        </label>
                        <input
                            id="destination-input"
                            type="text"
                            placeholder="Destination name *"
                            value={inputName}
                            onChange={(e) => setInputName(e.target.value)}
                            required
                            className="destination-input-field"
                        />
                        <button type="submit" className="destination-save-button">Save Destination</button>
                    </div>
                    <table className="table-create-destination">
                        <thead>
                            <tr>
                                <th>
                                    <label htmlFor="destination-input-desktop" style={{ display: "none" }}>
                                        Destination Name
                                    </label>
                                    <input
                                        id="destination-input-desktop"
                                        type="text"
                                        placeholder="Destination name *"
                                        value={inputName}
                                        onChange={(e) => setInputName(e.target.value)}
                                        required
                                        className="table-edit-fields"
                                    />
                                </th>
                                <th>
                                    <button type="submit">Save Destination</button>
                                </th>
                            </tr>
                        </thead>
                    </table>
                </form>
            </div>
                ) : <></> }
        </>
    );
};

    
export default DestinationCreate;