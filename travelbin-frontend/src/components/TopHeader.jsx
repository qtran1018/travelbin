import react from "react";
import '../styles/TopHeader.css';

const TopHeader = () => {
    return (
        <header className="top-header">
            <div className="logo">Navia</div>
            <nav>
                <ul className="nav-links">
                    <li><a href="/">Home</a></li>
                    <li><a href="/about">About</a></li>
                    <li><a href="/contact">Contact</a></li>
                </ul>
            </nav>
        </header>
    )
}

export default TopHeader;