import React from 'react';
import {Link, Navigate} from 'react-router-dom';
import '../styles/Home.css'
import { useAuth } from "../components/AuthContext";

const Home = () => {

    // const [isLoggedIn, setIsLoggedIn] = useState(false);
    const { user, authLoading } = useAuth();

    if (authLoading) return null;

    if (user) {
        return <Navigate to={`/u/${user.username}`} replace />;
    }

    return <LoggedOutHome />;
};

const LoggedInHome = ({ user }) => (
    <div className="home-container">
        <div className="home-content">
            <h1>Welcome back, {user.username.charAt(0).toUpperCase() + user.username.slice(1)}!</h1>
            <p className="home-subtitle">Click on the profile button in the navigation bar to see your destinations.</p>
            <div className='dog'>
                <p>This is Basil</p>
                <div className="dog-images">
                    <img
                        src="../../basil1.jpg"
                        alt="Basil 1 dog"
                    />
                    <img
                        src="../../basil2.jpg"
                        alt="Basil 2 dog"
                    />
                    <img
                        src="../../basil3.jpg"
                        alt="Basil 3 dog"
                    />
                </div>
            </div>
        </div>
    </div>
);

const LoggedOutHome = () => (
    <div className="home-container">
        <div className="home-content">
            <h1>Welcome to TravelBin</h1>
            <p className="home-subtitle">Plan and organize your travel experiences</p>
            <div className="home-actions">
                <Link to="/register">
                    <button className="register-button">Register</button>
                </Link>
                <Link to="/login">
                    <button className="register-button">Log in</button>
                </Link>
            </div>
            <div className='dog'>
                <p>This is Basil</p>
                <div className="dog-images">
                    <img
                        src="../../basil1.jpg"
                        alt="Basil 1 dog"
                    />
                    <img
                        src="../../basil2.jpg"
                        alt="Basil 2 dog"
                    />
                    <img
                        src="../../basil3.jpg"
                        alt="Basil 3 dog"
                    />
                </div>
            </div>
        </div>
    </div>    
);

export default Home;