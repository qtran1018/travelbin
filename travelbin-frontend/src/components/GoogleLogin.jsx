import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from "../components/AuthContext";
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from "../config/api";
import "../styles/GoogleLoginButton.css";

function GoogleLoginButton() {
    const { login } = useAuth();
    const navigate = useNavigate();
    return (
        <div className="google-login-wrapper">
            <GoogleLogin
                shape="pill"
                text="signin"
                logo_alignment="center"
                onSuccess={ async (credentialResponse) => {
                    const googleJwt = credentialResponse.credential;
                    try {
                        const res = await axios.post(`${API_BASE_URL}/travel/api/google-login/`, { token: googleJwt });
                        const access = res.data.access;
                        const refresh = res.data.refresh;
                        localStorage.setItem("access", access);
                        localStorage.setItem("refresh", refresh);
                        login(access);
                        setTimeout(() => {
                            navigate("/");
                        }, 0);
                    } catch (error) {
                        console.log("Error logging in with Google: " + error);
                        alert("Error logging in with Google: " + error);
                    }
                }}
                onError={() => {
                    console.log("Login Failed");
                }}
            />
        </div>
    );
}

export default GoogleLoginButton;