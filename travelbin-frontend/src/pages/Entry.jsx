import React, {useState, useEffect} from "react";
import { useParams } from "react-router-dom";
import '../styles/Table.css'
import EntryShow from "../components/EntryShow";
import MembersModal from "../components/MembersModal";
import { useAuth } from "../components/AuthContext";
import { apiClient } from "../config/api";

const FRONTEND_ORIGIN = window.location.origin;

const Entry = () => {
    const { id } = useParams();
    const { user, authLoading } = useAuth();
    const [refresh, setRefresh] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [hasPermissions, setHasPermissions] = useState(false);
    const [loadingPermissions, setLoadingPermissions] = useState(true);
    const [copyLabel, setCopyLabel] = useState("Copy Invite Link");
    const [destinationName, setDestinationName] = useState('');

    // Fetch destination name regardless of auth state
    useEffect(() => {
        apiClient.get(`/travel/d/${id}/detail/`)
            .then(res => setDestinationName(res.data.name || ''))
            .catch(() => {});
    }, [id]);

    useEffect(() => {
        if (authLoading) return; // wait until Keycloak check-sso resolves
        if (user) {
            apiClient.get(`/travel/permissions/get_by_destination/${id}`)
                .then((response) => {
                    const userId = String(user.id);
                    const permissions = response.data || [];
                    setHasPermissions(permissions.some(perm => String(perm.user_id) === userId));
                })
                .catch(() => setHasPermissions(false))
                .finally(() => setLoadingPermissions(false));
        } else {
            setHasPermissions(false);
            setLoadingPermissions(false);
        }
    }, [id, user, authLoading]);

    const handleEntryCreated = () => setRefresh(prev => !prev);

    const handleCopyInviteLink = () => {
        apiClient.post('/travel/invite/create/', { destination_id: id })
            .then((res) => {
                const link = `${FRONTEND_ORIGIN}/#/invite/${res.data.token}`;
                navigator.clipboard.writeText(link).then(() => {
                    setCopyLabel("Copied!");
                    setTimeout(() => setCopyLabel("Copy Invite Link"), 2500);
                });
            })
            .catch(() => {
                setCopyLabel("Error");
                setTimeout(() => setCopyLabel("Copy Invite Link"), 2500);
            });
    };

    const handleModalClose = () => {
        setModalOpen(false);
        handleEntryCreated();
        if (user) {
            apiClient.get(`/travel/permissions/get_by_destination/${id}`)
                .then((response) => {
                    const userId = String(user.id);
                    const permissions = response.data || [];
                    setHasPermissions(permissions.some(perm => String(perm.user_id) === userId));
                })
                .catch(() => setHasPermissions(false));
        }
    };

    if (loadingPermissions) {
        return <div className="entry-page"><h1>{destinationName || 'Loading...'}</h1><p>Loading...</p></div>;
    }

    const ownerControls = user && hasPermissions ? (
        <>
            <button className="entry-action-btn" onClick={() => setModalOpen(true)}>Members</button>
            <button className={`entry-action-btn${copyLabel !== "Copy Invite Link" ? " entry-action-btn--copied" : ""}`} onClick={handleCopyInviteLink}>{copyLabel}</button>
            <MembersModal
                isOpen={modalOpen}
                onClose={handleModalClose}
                destinationId={id}
                currentUserId={user?.id}
            />
        </>
    ) : null;

    return (
        <div className="entry-page">
            <h1>{destinationName || 'Travel Entries'}</h1>
            <EntryShow
                urlID={id}
                refresh={refresh}
                onRefresh={handleEntryCreated}
                hasPermissions={hasPermissions}
                extraControls={ownerControls}
            />
        </div>
    );
};

export default Entry;
