import React, {useState, useEffect} from "react";
import { useParams } from "react-router-dom";
import '../styles/Table.css'
import '../components/EntryCreate'
import EntryCreate from "../components/EntryCreate";
import EntryShow from "../components/EntryShow";
import PermissionModal from "../components/PermissionModal";
import { useAuth } from "../components/AuthContext";
import { apiClient } from "../config/api";

const Entry = () => {
    const { id } = useParams(); // Get the ID from the URL parameters
    const {user} = useAuth();
    const [refresh, setRefresh] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [hasPermissions, setHasPermissions] = useState(false);
    const [loadingPermissions, setLoadingPermissions] = useState(true);
    
    useEffect(() => {
        // Check if user has permissions for this destination
        if (user) {
            // Remove trailing slash to match backend URL pattern
            apiClient.get(`/travel/permissions/get_by_destination/${id}`)
            .then((response) => {
                // Check if current user's ID is in the permissions list
                // JWT token from simplejwt typically has user_id field
                // Note: user field in permissions is stored as CharField, so we need to compare as strings
                const userId = String(user.id);
                const permissions = response.data || [];
                const userHasPermission = permissions.some(perm => String(perm.user) === userId);
                setHasPermissions(userHasPermission);
                setLoadingPermissions(false);
            })
            .catch((error) => {
                // If 404, no permissions exist for this destination (user doesn't have access)
                // If other error, also treat as no permissions
                if (error.response?.status === 404) {
                    console.log("No permissions found for destination");
                } else {
                    console.error("Error checking permissions:", error);
                }
                setHasPermissions(false);
                setLoadingPermissions(false);
            });
        } else {
            setHasPermissions(false);
            setLoadingPermissions(false);
        }
    }, [id, user]);
    
    const handleEntryCreated = () => {
        setRefresh(prevState => !prevState);
    }

    const handleModalConfirm = () => {
        setModalOpen(false);
        handleEntryCreated(); // Refresh entries when permissions change
        // Re-check permissions after modal closes
        if (user) {
            // Remove trailing slash to match backend URL pattern
            apiClient.get(`/travel/permissions/get_by_destination/${id}`)
            .then((response) => {
                const userId = String(user.id);
                const permissions = response.data || [];
                const userHasPermission = permissions.some(perm => String(perm.user) === userId);
                setHasPermissions(userHasPermission);
            })
            .catch((error) => {
                setHasPermissions(false);
            });
        }
    }

    if (loadingPermissions) {
        return <div className="entry-page"><h1>Travel Entries</h1><p>Loading...</p></div>;
    }

    return (
        <div className="entry-page">
            <h1>Travel Entries</h1>
            
            {user && hasPermissions && (
                <div className="user-permissions-section" style={{ marginBottom: '1.5rem' }}>
                    <button className="btn-secondary" onClick={() => setModalOpen(true)}>
                        Add/Remove Users
                    </button>
                    <PermissionModal
                        isOpen={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onConfirm={handleModalConfirm}
                        message="Add/remove a user below:"
                        destinationId={id}
                    />
                </div>
            )}
            
            {user && hasPermissions && <EntryCreate urlID={id} onEntryCreated={handleEntryCreated}/>}
            <EntryShow urlID={id} refresh={refresh} onRefresh={handleEntryCreated} hasPermissions={hasPermissions}/>
        </div>
    )
};

export default Entry;