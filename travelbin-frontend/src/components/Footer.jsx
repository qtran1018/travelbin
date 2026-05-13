import {Link} from 'react-router-dom';
import '../styles/Footer.css';

export function Footer() {
    return (
        <>
        <hr></hr>
        <footer className="site-footer">
            <div className="footer-content">
                <p>&copy; TravelBin. All rights reserved.</p>
                    <div className="footer-links">
                        <Link to="/">About</Link>
                        <Link to="/">Contact</Link>
                        <Link to="/">Privacy</Link>
                    </div>
                </div>
        </footer>
        </>
    )
}