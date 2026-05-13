import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const token = localStorage.getItem("access");

        if (token) {
            try {
                const decoded = jwtDecode(token);
                const now = Date.now()/1000
                if (decoded.exp > now) {
                    setUser(decoded);
                }
                else {
                    setUser(null);
                }
            }
            catch {
                setUser(null);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    }, []);

    const login = (accessToken) => {
        const decoded = jwtDecode(accessToken);
        setUser(decoded);
    };

    const logout = () => {
        localStorage.removeItem("access")
        localStorage.removeItem("refresh");
        setUser(null);
    };

    if (loading) {
        return <div>Loading...</div>; // Return a loading message or spinner while the user is being set
    }

    return (
        <AuthContext.Provider value={{user, login, logout}}>
            {children}
        </AuthContext.Provider>
    )
};

export const useAuth = () => useContext(AuthContext);