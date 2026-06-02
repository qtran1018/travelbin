import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { apiClient } from "../config/api";
import "../styles/InviteJoin.css";

const InviteJoin = () => {
    const { token } = useParams();
    const { user, authLoading, login, register } = useAuth();
    const navigate = useNavigate();
    const [inviteInfo, setInviteInfo] = useState(null);
    const [status, setStatus] = useState("loading");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        apiClient.get(`/travel/invite/${token}/`)
            .then((res) => {
                setInviteInfo(res.data);
                setStatus("ready");
            })
            .catch(() => {
                setStatus("error");
                setErrorMsg("This invite link is invalid or has expired.");
            });
    }, [token]);

    useEffect(() => {
        if (authLoading || !user || !inviteInfo || status !== "ready") return;
        setStatus("joining");
        apiClient.post(`/travel/invite/${token}/join/`)
            .then((res) => {
                navigate(`/d/${res.data.destination_id}`);
            })
            .catch((err) => {
                if (err.response?.data?.destination_id) {
                    navigate(`/d/${err.response.data.destination_id}`);
                } else {
                    setStatus("error");
                    setErrorMsg("Failed to join. You may not have permission.");
                }
            });
    }, [user, authLoading, inviteInfo, status]);

    const handleLogin = () => {
        sessionStorage.setItem("pendingInviteToken", token);
        login();
    };

    const handleRegister = () => {
        sessionStorage.setItem("pendingInviteToken", token);
        register();
    };

    if (status === "loading") {
        return (
            <div className="invite-page">
                <div className="invite-card">
                    <div className="invite-icon">✈️</div>
                    <p className="invite-loading">Loading invite details...</p>
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="invite-page">
                <div className="invite-card invite-card--error">
                    <div className="invite-icon">🔗</div>
                    <h2 className="invite-title">Invalid Invite</h2>
                    <p className="invite-subtitle invite-subtitle--error">{errorMsg}</p>
                    <button className="invite-btn invite-btn--secondary" onClick={() => navigate("/")}>
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    if (status === "joining") {
        return (
            <div className="invite-page">
                <div className="invite-card">
                    <div className="invite-icon invite-icon--spin">✈️</div>
                    <h2 className="invite-title">Joining...</h2>
                    <p className="invite-subtitle">
                        Adding you to <strong>{inviteInfo?.destination_name}</strong>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="invite-page">
            <div className="invite-card">
                <div className="invite-icon">🌍</div>
                <h2 className="invite-title">You&apos;ve been invited!</h2>
                <p className="invite-subtitle">
                    <strong>{inviteInfo?.created_by_username}</strong> has invited you to join
                </p>
                <p className="invite-destination">{inviteInfo?.destination_name}</p>

                {user ? (
                    <p className="invite-subtitle">Joining automatically...</p>
                ) : (
                    <div className="invite-actions">
                        <button className="invite-btn invite-btn--primary" onClick={handleLogin}>
                            Log In to Join
                        </button>
                        <button className="invite-btn invite-btn--secondary" onClick={handleRegister}>
                            Create Account
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InviteJoin;
