import React, { useState } from "react";
import {useNavigate} from 'react-router-dom';
import iconEmail from "../assets/mail.png";
import iconUser from "../assets/user.png";
import iconPassword from "../assets/password.png";
// import greenCheck from "../assets/green-check.svg";
// import redX from "../assets/red-x.svg"
import '../styles/Registration.css'
import { useAuth } from "../components/AuthContext";
import axios from "axios";
import {Link} from 'react-router-dom';
import GoogleLoginButton from "../components/GoogleLogin";
import API_BASE_URL from "../config/api";
import { Navbar } from "../components/Navbar";

const Registration = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // const [passwordMatch, setPasswordMatch] = useState(true); //TODO: pick either the check and X or show button.
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!email || !username || !password || !confirmPassword) {
            setError("All fields are required.");
            return;
        }
        if (password !== confirmPassword){
            setError("Passwords do not match.");
            return;
        }
        const response = await fetch(`${API_BASE_URL}/travel/create_user/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password }),
        });

        if (response.ok) {
            alert("User created successfully.");
            const res = await axios.post(`${API_BASE_URL}/travel/api/token/`, {email,password,});
            const access = res.data.access;
            const refresh = res.data.refresh;
            
            localStorage.setItem("access", access);
            localStorage.setItem("refresh", refresh);
            login(access);

            setTimeout(() => {
                navigate(`/u/${username}`);
              }, 0);
        }
        else  {
            const errorData = await response.json();
            setError(errorData.message || "Error creating user.");
        }
      };

    // const handleConfirmPasswordChange = (e) => {
    //     const value = e.target.value;
    //     setConfirmPassword(value);
    //     setPasswordMatch(value === password);
    // };
    
    return (
        <>
            <Navbar />
            <div className="container">
                <div className="form-box">
                    <form onSubmit={handleSubmit}>
                        <div>
                            <div className="header">
                                <div className="text">Sign Up</div>
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
                                    value={email.trim().toLowerCase()}
                                    onChange = {(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="input">
                                    <img src={iconUser} alt="username icon"/>
                                    <input 
                                        type="text" 
                                        placeholder="Username"
                                        value={username.trim().toLowerCase()}
                                        onChange = {(e) => setUsername(e.target.value)}
                                        />
                                </div>

                                <div className="input">
                                    <img src={iconPassword} alt="password icon"/>
                                    <input 
                                        type={showPassword ? 'text':'password'} 
                                        value = {password}
                                        onChange = {(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                    />
                                    <button 
                                        className ="password-vis-btn" 
                                        type="button" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>

                                </div>

                                <div className="input">
                                    <img src={iconPassword} alt="password icon"/>
                                    <input 
                                        type={showConfirmPassword ? 'text':'password'} 
                                        value = {confirmPassword}
                                        onChange = {(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm Password"
                                    />
                                    {/* {passwordMatch && <img src={greenCheck} alt="green_check"/>}
                                    {!passwordMatch && <img src={redX} alt="red_x"/>} */}

                                    <button 
                                    className ="password-vis-btn" type="button" 
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? 'Hide' : 'Show'}
                                    </button>

                                </div>
                            </div>

                            <div className="register-container">
                                <Link to="/">Back to Home</Link>
                                <button type="submit" className="register-button">Register</button>
                            </div>
                            <div className="register-container">
                                <GoogleLoginButton />
                            </div>
                            <div>
                                <Link to="/login">Already have an account?</Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

export default Registration;