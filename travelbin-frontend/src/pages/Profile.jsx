import React, { useState } from "react";
import { useParams } from "react-router-dom";
import DestinationShow from "../components/DestinationShow";
import { useAuth } from "../components/AuthContext";
import '../styles/Profile.css';

const Profile = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const [refresh, setRefresh] = useState(false);

    const isOwner = user && user.username === id;
    const displayName = id.charAt(0).toUpperCase() + id.slice(1);

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="profile-avatar">{id.charAt(0).toUpperCase()}</div>
                <div className="profile-meta">
                    <h1 className="profile-username">{displayName}</h1>
                    {isOwner && <span className="profile-badge">Your profile</span>}
                </div>
            </div>
            <DestinationShow
                urlID={id}
                refresh={refresh}
                onRefresh={() => setRefresh(p => !p)}
                canCreate={isOwner}
            />
        </div>
    );
};

export default Profile;
