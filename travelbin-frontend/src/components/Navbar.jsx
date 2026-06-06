import { NavLink, Link } from 'react-router-dom';
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
                    <Link to="/" className="navbar-brand-section">
                        <img src={logo} alt="Logo" className="logo-main" />
                        <span className="navbar-title">TravelBin</span>
                    </Link>

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
                        <a
                            href="https://splitpush.quangntran.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="navbar-link navbar-link--external"
                            onClick={closeMenu}
                        >
                            Splitpush ↗
                        </a>
                        <a
                            href="https://agent.quangntran.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="navbar-link navbar-link--external"
                            onClick={closeMenu}
                        >
                            Itinerary ↗
                        </a>
                        <span className="navbar-divider" aria-hidden="true"></span>

                        {user && (
                            <NavLink
                                to={`/u/${user.username}`}
                                className={({ isActive }) => 'navbar-link' + (isActive ? ' navbar-link--active' : '')}
                                onClick={closeMenu}
                            >
                                Profile
                            </NavLink>
                        )}

                        {!user && (
                            <button className="navbar-btn navbar-btn--ghost" type="button" onClick={() => { closeMenu(); register(); }}>
                                Register
                            </button>
                        )}

                        {user ? (
                            <button className="navbar-btn navbar-btn--ghost" type="button" onClick={() => { logout(); closeMenu(); }}>
                                Logout
                            </button>
                        ) : (
                            <button className="navbar-btn navbar-btn--primary" type="button" onClick={() => { login(); closeMenu(); }}>
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