// Modal.js
import React, { useState, useEffect } from "react";
import { apiClient } from "../config/api";

const PermissionModal = ({ isOpen, onClose, onConfirm, title, message, destinationId }) => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (isOpen) setInputValue(""); // Reset input when opening
  }, [isOpen]);

  const handleAddConfirm = (e) => {
    e.preventDefault();
    if (inputValue === ''){
        return alert("Email is required.");
    }
    const addPermission = {
        email: inputValue,
        destination_id: destinationId,
    }
    apiClient.post(`/travel/permissions/add/`, addPermission)
        .then(() => {
            alert(`Success: ${inputValue} added.`);
            onConfirm(inputValue)
        })
        .catch(() => {
            alert(`Error: ${inputValue} doesn't have an account or is already added.`);
        });
  };
  const handleDeleteConfirm = (e) => {
    e.preventDefault();
    if (inputValue === ''){
        return alert("Email is required.");
    }
    const encodedEmail = encodeURIComponent(inputValue);
    apiClient.delete(`/travel/permissions/delete/${destinationId}/${encodedEmail}/`)
        .then(() => {
            alert(`Success: ${inputValue} deleted.`);
            onConfirm(inputValue)
        })
        .catch(() => {
            alert(`Error: ${inputValue} doesn't exist.`);
        });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <input
          className="modal-input"
          type="email"
          placeholder="Enter email"
          value={inputValue.trim().toLowerCase()}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <div className="modal-buttons">
            <button onClick={handleDeleteConfirm} className="modal-button-confirm">Remove</button>
          <button onClick={onClose} className="modal-button-cancel">Cancel</button>
          <button onClick={handleAddConfirm} className="modal-button-confirm">Add</button>
        </div>
      </div>
    </div>
  );
};

export default PermissionModal;
