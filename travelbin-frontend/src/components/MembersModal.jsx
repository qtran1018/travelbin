import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "../config/api";
import "../styles/MembersModal.css";

const MembersModal = ({ isOpen, onClose, destinationId, currentUserId }) => {
  const [members, setMembers] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [addStatus, setAddStatus] = useState(null);
  const [addMessage, setAddMessage] = useState("");
  const [removingEmail, setRemovingEmail] = useState(null);

  const fetchMembers = useCallback(() => {
    setLoading(true);
    apiClient.get(`/travel/permissions/get_by_destination/${destinationId}`)
      .then(res => setMembers(res.data || []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [destinationId]);

  useEffect(() => {
    if (isOpen) {
      setEmailInput("");
      setAddStatus(null);
      fetchMembers();
    }
  }, [isOpen, fetchMembers]);

  const handleAdd = (e) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    apiClient.post("/travel/permissions/add/", { email, destination_id: destinationId })
      .then(() => {
        setAddStatus("success");
        setAddMessage(`${email} added.`);
        setEmailInput("");
        fetchMembers();
      })
      .catch(() => {
        setAddStatus("error");
        setAddMessage(`Couldn't add ${email}. They may not have an account or are already a member.`);
      });
  };

  const handleRemove = (email) => {
    setRemovingEmail(email);
    const encoded = encodeURIComponent(email);
    apiClient.delete(`/travel/permissions/delete/${destinationId}/${encoded}/`)
      .then(() => setMembers(prev => prev.filter(m => m.email !== email)))
      .catch(console.error)
      .finally(() => setRemovingEmail(null));
  };

  if (!isOpen) return null;

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-panel" onClick={e => e.stopPropagation()}>
        <div className="mm-header">
          <h3 className="mm-title">Members</h3>
          <button className="mm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="mm-add-form" onSubmit={handleAdd}>
          <input
            className="mm-email-input"
            type="email"
            placeholder="Add member by email…"
            value={emailInput}
            onChange={e => { setEmailInput(e.target.value); setAddStatus(null); }}
          />
          <button type="submit" className="mm-add-btn">Add</button>
        </form>

        {addStatus && (
          <p className={`mm-status mm-status--${addStatus}`}>{addMessage}</p>
        )}

        <div className="mm-list">
          {loading ? (
            <p className="mm-empty">Loading…</p>
          ) : members.length === 0 ? (
            <p className="mm-empty">No members yet.</p>
          ) : (
            members.map(member => (
              <div key={member.user_id} className="mm-row">
                <div className="mm-user-info">
                  <span className="mm-username">{member.username}</span>
                  <span className="mm-email">{member.email}</span>
                </div>
                <button
                  className="mm-remove-btn"
                  onClick={() => handleRemove(member.email)}
                  disabled={removingEmail === member.email || String(member.user_id) === String(currentUserId)}
                  title={String(member.user_id) === String(currentUserId) ? "Can't remove yourself" : "Remove member"}
                  aria-label={`Remove ${member.username}`}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersModal;
