import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import iconEmail from "../assets/mail.png";
import iconPassword from "../assets/password.png";
import { useAuth } from "../components/AuthContext";
import '../styles/Login.css';
import { Link }  from 'react-router-dom';
import GoogleLoginButton from "../components/GoogleLogin";
import API_BASE_URL from "../config/api";
import { Navbar } from "../components/Navbar";

const Login = () => {

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await axios.post(`${API_BASE_URL}/travel/api/token/`, {email,password,});
            const access = res.data.access;
            const refresh = res.data.refresh;
            
            localStorage.setItem("access", access);
            localStorage.setItem("refresh", refresh);
            login(access);

            setTimeout(() => {
                navigate("/");
              }, 0);
        }

        catch (err) {
            console.error("Login failed", err);
            const message = err.response?.data?.detail || "Invalid credentials";
            setError(message);
        }
    };

    return (
        <>
            <Navbar />
            <div className="container">
                <div className="form-box">
                    <form onSubmit={handleSubmit}>
                        <div>
                            <div className="header">
                                <div className="text">Log In</div>
                                <div className="underline"></div>
                            </div>

                            {error && (
                                <p className="form-error">
                                    {error}
                                </p>
                            )}

                            <div className="inputs">
                                <div className="input">
                                    <img src={iconEmail} alt="email icon"/>
                                    <input 
                                        type="email" 
                                        placeholder="Email" 
                                        value = {email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                
                                <div className="input">
                                    <img src={iconPassword} alt="password icon"/>
                                    <input 
                                        type={showPassword ? 'text':'password'} 
                                        placeholder="Password"
                                        value = {password}
                                        onChange = {(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button className ="password-vis-btn" type="button" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <div className="register-container">
                                <button className="register-button" type="submit">Log in</button>
                                <GoogleLoginButton />
                            </div>
                            <div>
                                <Link to="/register">Don't have an account?</Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

export default Login;