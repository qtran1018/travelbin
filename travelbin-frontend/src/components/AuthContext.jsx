import { createContext, useContext, useEffect, useRef, useState } from "react";
import keycloak from "../keycloak";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        keycloak
            .init({
                onLoad: "check-sso",
                checkLoginIframe: false,
                responseMode: "query",
                pkceMethod: "S256",
                silentCheckSsoRedirectUri: window.location.origin + "/silent-check.html",
            })
            .then(async (authenticated) => {
                if (authenticated) {
                    let localId = null;
                    try {
                        const res = await fetch(
                            `${import.meta.env.VITE_API_URL}/travel/me/`,
                            { headers: { Authorization: `Bearer ${keycloak.token}` } }
                        );
                        if (res.ok) {
                            const data = await res.json();
                            localId = data.id;
                        }
                    } catch { /* use null id if backend unreachable */ }
                    setUser({
                        id: localId,
                        username: keycloak.tokenParsed?.preferred_username,
                        email: keycloak.tokenParsed?.email,
                        sub: keycloak.tokenParsed?.sub,
                    });
                }
                setAuthLoading(false);
            })
            .catch(() => { setAuthLoading(false); });

        keycloak.onTokenExpired = () => {
            keycloak.updateToken(60).catch(() => setUser(null));
        };
    }, []);

    const login = (redirectUri = window.location.origin) => keycloak.login({ redirectUri });

    const register = (redirectUri = window.location.origin) => keycloak.register({ redirectUri });

    const logout = () =>
        keycloak.logout({ redirectUri: window.location.href });

    return (
        <AuthContext.Provider value={{ user, authLoading, login, register, logout, keycloak }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
