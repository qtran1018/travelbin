import { Link } from 'react-router-dom';
import { useAuth } from "./AuthContext";
import logo from "../assets/logo.png";
import '../styles/Navbar.css'
import ThemeToggleButton from './ThemeToggleButton';
import { useState, useEffect, useRef } from 'react';

export function Navbar() {
    const { user, login, register, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const hamburgerRef = useRef(null);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMenuOpen && 
                menuRef.current && 
                !menuRef.current.contains(event.target) &&
                hamburgerRef.current &&
                !hamburgerRef.current.contains(event.target)) {
                closeMenu();
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    return (
        <>
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <div className="container-fluid">
                    <div className="navbar-brand-section">
                        <img src={logo} alt="Logo" className="logo-main" />
                        <span className="navbar-title">TravelBin</span>
                    </div>

                    <button 
                        ref={hamburgerRef}
                        className="hamburger-menu" 
                        onClick={toggleMenu} 
                        aria-label="Toggle menu"
                    >
                        <span className={isMenuOpen ? 'hamburger-icon open' : 'hamburger-icon'}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </button>

                    <div ref={menuRef} className={`navbar-actions ${isMenuOpen ? 'open' : ''}`}>
                        <Link className="navbar-brand" to="/" onClick={closeMenu}>
                            <button className="navbar-button" type="button">Home</button>
                        </Link>

                        {!user && (
                            <button className="navbar-button" type="button" onClick={() => { closeMenu(); register(); }}>
                                Register
                            </button>
                        )}

                        {user && (
                            <Link className="navbar-brand" to={`/u/${user.username}`} onClick={closeMenu}>
                                <button className="navbar-button" type="button">Profile</button>
                            </Link>
                        )}

                        {user ? (
                            <button className="navbar-button" type="button" onClick={() => { logout(); closeMenu(); }}>
                                Logout
                            </button>
                        ) : (
                            <button className="navbar-button" type="button" onClick={() => { login(); closeMenu(); }}>
                                Log In
                            </button>
                        )}

                        <div className="navbar-theme-toggle" onClick={closeMenu}>
                            <ThemeToggleButton />
                        </div>
                    </div>
                </div>
            </nav>
            <hr />
        </>
    );
}