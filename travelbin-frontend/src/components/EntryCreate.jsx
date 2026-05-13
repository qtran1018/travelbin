import React, {useState} from "react";
import { useAuth } from "../components/AuthContext";
import '../styles/Table.css'
import { apiClient } from "../config/api";


const EntryCreate = ({urlID, onEntryCreated}) => {
    const id = urlID; // Get the ID from the URL parameters
    const {user} = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const [inputName, setInputName] = useState("");
    const [inputType, setInputType] = useState("");
    const [inputLocation, setInputLocation] = useState("");
    const [inputDate, setInputDate] = useState("");
    const [inputNotes, setInputNotes] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputName === ''){
            return alert("Name is required.");
        }
        
        const addEntry = {
            name: inputName,
            type: inputType,
            location: inputLocation,
            date: inputDate,
            notes: inputNotes,
            contributor: user.username,
            destination: id
        };
        
        if(inputDate === '') {
            addEntry.date = null;
        }
        if(inputType === '') {
            addEntry.type = "Other";
        }

        apiClient.post(`/travel/d/${id}/create_entry/`, addEntry)
            .then((response) => {
                // Reset form on success
                reset();
                // Trigger refresh
                onEntryCreated();
                // Show success message (could be replaced with toast notification)
                console.log("Entry created:", response?.data?.name);
                setIsOpen(false);
            })
            .catch((error) => {
                console.error("Error creating entry:", error);
                alert("Error: " + (error.response?.data?.message || "Failed to create entry"));
            });
    }

    const reset = () => {
        setInputName("");
        setInputType("");
        setInputLocation("");
        setInputDate("");
        setInputNotes("");
    }

    return (
        <>
            {user ? (
            <>
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsOpen(true)}
                >
                    Create New Entry
                </button>

                {isOpen && (
                    <div className="create-modal-overlay">
                        <div className="create-modal">
                <h3>Create New Entry</h3>
                <form onSubmit={handleSubmit}>
                                <div className="create-modal-field">
                                    <label>Name *</label>
                                    <input
                                        type="text"
                                        placeholder="Name *"
                                        value={inputName}
                                        onChange={(e) => setInputName(e.target.value)}
                                        required
                                        className="table-edit-fields"
                                    />
                                </div>
                                <div className="create-modal-field">
                                    <label>Type</label>
                                    <select 
                                        value={inputType} 
                                        onChange={(e) => setInputType(e.target.value)}
                                        className="table-edit-fields"
                                    >
                                        <option value="">Type</option>
                                        <option value="Food & Drink">Food & Drink</option>
                                        <option value="Shopping">Shopping</option>
                                        <option value="Activity">Activity</option>
                                        <option value="Sightseeing">Sightseeing</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="create-modal-field">
                                    <label>Location</label>
                                    <input
                                        type="text"
                                        placeholder="Location"
                                        value={inputLocation}
                                        onChange={(e) => setInputLocation(e.target.value)}
                                        className="table-edit-fields"
                                    />
                                </div>
                                <div className="create-modal-field">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        placeholder="Date"
                                        value={inputDate}
                                        onChange={(e) => setInputDate(e.target.value)}
                                        className="table-edit-fields"
                                    />
                                </div>
                                <div className="create-modal-field">
                                    <label>Notes</label>
                                    <textarea
                                        placeholder="Notes"
                                        value={inputNotes}
                                        onChange={(e) => setInputNotes(e.target.value)}
                                        className="table-edit-fields"
                                        rows="2"
                                    />
                                </div>
                                <div className="create-modal-field">
                                    <label>Contributor</label>
                                    <input
                                        type="text"
                                        placeholder="Contributor"
                                        value={user.username}
                                        disabled
                                        className="input-disabled"
                                    />
                                </div>
                                <div className="create-modal-actions">
                                    <button type="submit">Save</button>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => {
                                            reset();
                                            setIsOpen(false);
                                        }}
                                    >
                                        Cancel
                                    </button>
                    </div>
                </form>
            </div>
                    </div>
                )}
            </>
                ) : (
                <div className="create-container">
                    <p>You must be logged in to create an entry.</p>
                </div>
            )}
        </>
    )
};

export default EntryCreate;